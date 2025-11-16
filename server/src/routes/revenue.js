const express = require('express');
const CompetitorScraper = require('../services/competitor-scraper');
const PriceOptimizer = require('../services/price-optimizer');

module.exports = (db) => {
  const router = express.Router();
  const scraper = new CompetitorScraper(db);
  const optimizer = new PriceOptimizer(db);

  // Get all competitor prices (latest)
  router.get('/competitors/prices', async (req, res) => {
    try {
      const prices = await scraper.getLatestPrices();
      res.json(prices);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get historical competitor data
  router.get('/competitors/history', async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 30;
      const history = await scraper.getHistoricalData(days);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Trigger competitor scraping
  router.post('/competitors/scrape', async (req, res) => {
    try {
      const { competitors } = req.body;
      
      if (!competitors || competitors.length === 0) {
        return res.status(400).json({ error: 'No competitors provided' });
      }

      const results = await scraper.scrapeAll(competitors);
      res.json({ 
        success: true, 
        scraped: results.length,
        results 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get competitor configurations
  router.get('/competitors/config', (req, res) => {
    db.all('SELECT * FROM competitor_config WHERE active = 1', (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows || []);
    });
  });

  // Add competitor configuration
  router.post('/competitors/config', (req, res) => {
    const { source, url, room_mapping, scraping_interval } = req.body;

    db.run(`
      INSERT INTO competitor_config (source, url, room_mapping, scraping_interval, active)
      VALUES (?, ?, ?, ?, 1)
    `, [source, url, room_mapping, scraping_interval], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, success: true });
    });
  });

  // Update competitor configuration
  router.patch('/competitors/config/:id', (req, res) => {
    const { id } = req.params;
    const { source, url, room_mapping, scraping_interval, active } = req.body;

    const updates = [];
    const values = [];

    if (source) { updates.push('source = ?'); values.push(source); }
    if (url) { updates.push('url = ?'); values.push(url); }
    if (room_mapping) { updates.push('room_mapping = ?'); values.push(room_mapping); }
    if (scraping_interval) { updates.push('scraping_interval = ?'); values.push(scraping_interval); }
    if (active !== undefined) { updates.push('active = ?'); values.push(active ? 1 : 0); }

    values.push(id);

    db.run(`
      UPDATE competitor_config 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, values, function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, changes: this.changes });
    });
  });

  // Delete competitor configuration
  router.delete('/competitors/config/:id', (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM competitor_config WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, changes: this.changes });
    });
  });

  // Get price recommendations
  router.get('/pricing/recommendations', async (req, res) => {
    try {
      const daysAhead = parseInt(req.query.days) || 7;
      const recommendations = await optimizer.generateRecommendationsForAllRooms(daysAhead);
      
      // Group by room
      const grouped = recommendations.reduce((acc, rec) => {
        if (!acc[rec.room_id]) {
          acc[rec.room_id] = [];
        }
        acc[rec.room_id].push(rec);
        return acc;
      }, {});

      res.json(grouped);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single room recommendation
  router.get('/pricing/recommendations/:roomId', async (req, res) => {
    try {
      const { roomId } = req.params;
      const targetDate = req.query.date || new Date().toISOString().split('T')[0];
      
      const recommendation = await optimizer.generateRecommendation(parseInt(roomId), targetDate);
      res.json(recommendation);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Apply recommended price
  router.post('/pricing/apply', (req, res) => {
    const { room_id, target_date, new_price, recommendation_id } = req.body;

    // Log the price change
    db.run(`
      INSERT INTO price_changes (room_id, target_date, old_price, new_price, reason, applied_by)
      VALUES (?, ?, (SELECT base_price FROM rooms WHERE id = ?), ?, 'AI Recommendation', 'system')
    `, [room_id, target_date, room_id, new_price], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Update the price (in production, this would update the pricing rules table)
      db.run(`
        INSERT INTO dynamic_pricing (room_id, date, price, source)
        VALUES (?, ?, ?, 'ai_recommendation')
        ON CONFLICT(room_id, date) DO UPDATE SET price = ?, updated_at = CURRENT_TIMESTAMP
      `, [room_id, target_date, new_price, new_price], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, applied: true });
      });
    });
  });

  // Get market insights
  router.get('/market/insights', async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 7;
      const insights = [];

      for (let i = 0; i < days; i++) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + i);
        const dateStr = targetDate.toISOString().split('T')[0];

        // Get our price and competitor average
        const [ourPrice, competitorData] = await Promise.all([
          optimizer.getCurrentPrice(1), // Default room
          scraper.getCompetitorAveragePrices(dateStr)
        ]);

        const occupancy = await optimizer.getHistoricalOccupancy(1, dateStr);
        const demandLevel = await optimizer.calculateDemandLevel(1, dateStr);
        const recommendation = await optimizer.generateRecommendation(1, dateStr);

        insights.push({
          date: dateStr,
          our_price: ourPrice,
          avg_competitor_price: competitorData.average || ourPrice * 1.2,
          occupancy_rate: Math.round(occupancy * 100),
          demand_level: demandLevel,
          recommended_price: recommendation.recommended_price
        });
      }

      res.json(insights);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get pricing settings
  router.get('/pricing/settings', (req, res) => {
    db.get('SELECT * FROM pricing_settings WHERE id = 1', (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(row || {
        auto_apply_enabled: false,
        min_price_percentage: 80,
        max_price_percentage: 150,
        notification_email: null
      });
    });
  });

  // Update pricing settings
  router.patch('/pricing/settings', (req, res) => {
    const { auto_apply_enabled, min_price_percentage, max_price_percentage, notification_email } = req.body;

    db.run(`
      INSERT INTO pricing_settings (id, auto_apply_enabled, min_price_percentage, max_price_percentage, notification_email)
      VALUES (1, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        auto_apply_enabled = ?,
        min_price_percentage = ?,
        max_price_percentage = ?,
        notification_email = ?,
        updated_at = CURRENT_TIMESTAMP
    `, [
      auto_apply_enabled ? 1 : 0,
      min_price_percentage,
      max_price_percentage,
      notification_email,
      auto_apply_enabled ? 1 : 0,
      min_price_percentage,
      max_price_percentage,
      notification_email
    ], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    });
  });

  return router;
};

