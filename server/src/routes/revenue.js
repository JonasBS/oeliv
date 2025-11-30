import express from 'express';
import PriceOptimizer from '../services/price-optimizer.js';

export default (db) => {
  const router = express.Router();
  const optimizer = new PriceOptimizer(db);

  // Get all competitor prices (latest)
  router.get('/competitors/prices', async (req, res) => {
    try {
      const prices = await new Promise((resolve, reject) => {
        db.all(`SELECT * FROM competitor_prices ORDER BY scraped_at DESC LIMIT 50`, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
      res.json(prices);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get historical competitor data
  router.get('/competitors/history', async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 30;
      const history = await new Promise((resolve, reject) => {
        db.all(`SELECT * FROM competitor_prices WHERE scraped_at >= datetime('now', '-${days} days') ORDER BY scraped_at DESC`, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Trigger competitor scraping (disabled - puppeteer not available on server)
  router.post('/competitors/scrape', async (req, res) => {
    res.json({ 
      success: false, 
      message: 'Competitor scraping is disabled on this server. Use manual price entry instead.'
    });
  });

  // Get competitor prices with date ranges (for calendar view)
  router.get('/competitors/prices-with-dates', (req, res) => {
    db.all(`
      SELECT 
        cp.id,
        cp.source,
        cp.url,
        cp.price,
        cp.availability,
        cp.room_type,
        cp.scraped_at,
        cp.search_checkin,
        cp.search_checkout
      FROM competitor_prices cp
      ORDER BY cp.scraped_at DESC, cp.search_checkin ASC
      LIMIT 200
    `, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows || []);
    });
  });

  // Get competitor configurations
  router.get('/competitors/config', (req, res) => {
    db.all('SELECT * FROM competitor_config', (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows || []);
    });
  });

  // Add competitor configuration
  router.post('/competitors/config', (req, res) => {
    const { name, url, room_type, active } = req.body;

    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required' });
    }

    db.run(`
      INSERT INTO competitor_config (source, url, room_mapping, active)
      VALUES (?, ?, ?, ?)
    `, [name, url, room_type || 'standard', active ? 1 : 0], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, success: true });
    });
  });

  // Update competitor configuration
  router.patch('/competitors/config/:id', (req, res) => {
    const { id } = req.params;
    const { name, url, room_type, active } = req.body;

    const updates = [];
    const values = [];

    if (name) { updates.push('source = ?'); values.push(name); }
    if (url) { updates.push('url = ?'); values.push(url); }
    if (room_type) { updates.push('room_mapping = ?'); values.push(room_type); }
    if (active !== undefined) { updates.push('active = ?'); values.push(active ? 1 : 0); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

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
      
      // Get our rooms
      const rooms = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM rooms WHERE active = 1', (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });

      // Get recent competitor prices (last 24 hours)
      const competitorPrices = await new Promise((resolve, reject) => {
        db.all(`
          SELECT * FROM competitor_prices 
          WHERE DATE(scraped_at) >= DATE('now', '-1 day')
          ORDER BY scraped_at DESC
        `, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });

      console.log(`📊 Generating market insights for ${days} days...`);
      console.log(`   Found ${rooms.length} rooms and ${competitorPrices.length} competitor prices`);

      // Generate insights for next N days
      for (let i = 0; i < days; i++) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + i);
        const dateStr = targetDate.toISOString().split('T')[0];

        // Calculate average competitor price
        let avgCompetitorPrice = 0;
        if (competitorPrices.length > 0) {
          const total = competitorPrices.reduce((sum, comp) => sum + (comp.price || 0), 0);
          avgCompetitorPrice = Math.round(total / competitorPrices.length);
        }

        // Use first room or average room price
        const ourPrice = rooms.length > 0 ? rooms[0].base_price : 1200;

        // Calculate occupancy rate (mock for now, could be based on bookings)
        // Higher occupancy on weekends and in summer
        const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;
        const month = targetDate.getMonth();
        const isSummer = month >= 5 && month <= 8; // June-September
        
        let occupancy_rate = 50; // Base
        if (isWeekend) occupancy_rate += 15;
        if (isSummer) occupancy_rate += 20;
        occupancy_rate = Math.min(95, occupancy_rate); // Cap at 95%

        // Determine demand level based on occupancy and day of week
        let demand_level = 'medium';
        if (occupancy_rate >= 80) demand_level = 'very_high';
        else if (occupancy_rate >= 65) demand_level = 'high';
        else if (occupancy_rate < 40) demand_level = 'low';

        // Calculate recommended price based on competitor prices and demand
        let recommended_price = ourPrice;
        if (competitorPrices.length > 0) {
          // Base recommendation on competitor average
          recommended_price = avgCompetitorPrice;
          
          // Adjust based on demand
          if (demand_level === 'very_high') {
            recommended_price = Math.round(avgCompetitorPrice * 1.1); // +10%
          } else if (demand_level === 'high') {
            recommended_price = Math.round(avgCompetitorPrice * 1.05); // +5%
          } else if (demand_level === 'low') {
            recommended_price = Math.round(avgCompetitorPrice * 0.95); // -5%
          }

          // Don't go too far from our current price
          const maxIncrease = ourPrice * 1.3; // Max 30% increase
          const maxDecrease = ourPrice * 0.8; // Max 20% decrease
          recommended_price = Math.max(maxDecrease, Math.min(maxIncrease, recommended_price));
        } else {
          // No competitor data, slight adjustment based on demand
          if (demand_level === 'very_high') recommended_price = Math.round(ourPrice * 1.15);
          else if (demand_level === 'high') recommended_price = Math.round(ourPrice * 1.1);
          else if (demand_level === 'low') recommended_price = Math.round(ourPrice * 0.95);
        }

        insights.push({
          date: dateStr,
          our_price: ourPrice,
          avg_competitor_price: avgCompetitorPrice || ourPrice * 1.2,
          occupancy_rate,
          demand_level,
          recommended_price
        });
      }

      console.log(`✅ Generated ${insights.length} market insights`);
      res.json(insights);
    } catch (error) {
      console.error('Market insights error:', error);
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

