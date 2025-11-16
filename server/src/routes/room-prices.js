import express from 'express';

/**
 * Room Prices Routes - Date-specific pricing
 */
export default function createRoomPricesRouter(db) {
  const router = express.Router();

  // Get price for specific room and date
  router.get('/:roomId/:date', async (req, res) => {
    try {
      const { roomId, date } = req.params;
      
      // First check for date-specific price
      const dateSpecificPrice = await new Promise((resolve, reject) => {
        db.get(
          'SELECT price FROM room_prices WHERE room_id = ? AND price_date = ?',
          [roomId, date],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (dateSpecificPrice) {
        return res.json({ price: dateSpecificPrice.price, source: 'date_specific' });
      }

      // Fall back to base price
      const basePrice = await new Promise((resolve, reject) => {
        db.get(
          'SELECT base_price FROM rooms WHERE id = ?',
          [roomId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (basePrice) {
        return res.json({ price: basePrice.base_price, source: 'base_price' });
      }

      res.status(404).json({ error: 'Room not found' });
    } catch (error) {
      console.error('Error getting room price:', error);
      res.status(500).json({ error: 'Failed to get room price' });
    }
  });

  // Get all prices for a room (for calendar view)
  router.get('/:roomId', async (req, res) => {
    try {
      const { roomId } = req.params;
      const { startDate, endDate } = req.query;

      let query = 'SELECT * FROM room_prices WHERE room_id = ?';
      const params = [roomId];

      if (startDate && endDate) {
        query += ' AND price_date BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }

      query += ' ORDER BY price_date ASC';

      const prices = await new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });

      res.json(prices);
    } catch (error) {
      console.error('Error getting room prices:', error);
      res.status(500).json({ error: 'Failed to get room prices' });
    }
  });

  // Set price for specific date
  router.put('/:roomId/:date', async (req, res) => {
    try {
      const { roomId, date } = req.params;
      const { price } = req.body;

      if (!price || price < 0) {
        return res.status(400).json({ error: 'Valid price required' });
      }

      // Upsert (insert or update)
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO room_prices (room_id, price_date, price)
           VALUES (?, ?, ?)
           ON CONFLICT(room_id, price_date) 
           DO UPDATE SET price = ?, updated_at = CURRENT_TIMESTAMP`,
          [roomId, date, price, price],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      res.json({ 
        success: true, 
        message: 'Price updated',
        roomId,
        date,
        price
      });
    } catch (error) {
      console.error('Error setting room price:', error);
      res.status(500).json({ error: 'Failed to set room price' });
    }
  });

  // Bulk set prices (for applying strategy to date range)
  router.post('/bulk', async (req, res) => {
    try {
      const { prices } = req.body; // Array of { roomId, date, price }

      if (!Array.isArray(prices) || prices.length === 0) {
        return res.status(400).json({ error: 'Prices array required' });
      }

      const results = [];
      
      for (const priceData of prices) {
        const { roomId, date, price } = priceData;
        
        try {
          await new Promise((resolve, reject) => {
            db.run(
              `INSERT INTO room_prices (room_id, price_date, price)
               VALUES (?, ?, ?)
               ON CONFLICT(room_id, price_date) 
               DO UPDATE SET price = ?, updated_at = CURRENT_TIMESTAMP`,
              [roomId, date, price, price],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
          results.push({ roomId, date, price, success: true });
        } catch (error) {
          console.error(`Error setting price for room ${roomId} on ${date}:`, error);
          results.push({ roomId, date, price, success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      
      res.json({ 
        success: true,
        message: `${successCount}/${prices.length} prices updated`,
        results
      });
    } catch (error) {
      console.error('Error bulk setting prices:', error);
      res.status(500).json({ error: 'Failed to bulk set prices' });
    }
  });

  // Delete price for specific date (revert to base price)
  router.delete('/:roomId/:date', async (req, res) => {
    try {
      const { roomId, date } = req.params;

      await new Promise((resolve, reject) => {
        db.run(
          'DELETE FROM room_prices WHERE room_id = ? AND price_date = ?',
          [roomId, date],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      res.json({ 
        success: true, 
        message: 'Date-specific price removed, will use base price',
        roomId,
        date
      });
    } catch (error) {
      console.error('Error deleting room price:', error);
      res.status(500).json({ error: 'Failed to delete room price' });
    }
  });

  return router;
}

