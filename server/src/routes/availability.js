import express from 'express';
import { dbAll, dbRun } from '../database/db.js';
import { eachDayOfInterval, format } from 'date-fns';

const router = express.Router();

// Get availability for date range
router.get('/availability', async (req, res, next) => {
  try {
    const { start_date, end_date, room_id } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date are required' });
    }

    let query = `
      SELECT 
        a.date,
        a.room_id,
        a.available,
        a.price,
        a.min_stay,
        r.name as room_name,
        r.type as room_type,
        r.max_guests
      FROM availability a
      JOIN rooms r ON a.room_id = r.id
      WHERE a.date >= ? AND a.date < ?
    `;
    
    const params = [start_date, end_date];
    
    if (room_id) {
      query += ' AND a.room_id = ?';
      params.push(room_id);
    }
    
    query += ' ORDER BY a.date, a.room_id';
    
    const rows = await dbAll(query, params);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// Check availability for specific dates
router.post('/check-availability', async (req, res, next) => {
  try {
    const { check_in, check_out, guests, room_id } = req.body;
    
    if (!check_in || !check_out) {
      return res.status(400).json({ error: 'check_in and check_out are required' });
    }

    let query = `
      SELECT 
        a.room_id,
        r.name,
        r.type,
        r.max_guests,
        MIN(a.available) as is_available,
        SUM(a.price) as total_price,
        MIN(a.min_stay) as min_stay
      FROM availability a
      JOIN rooms r ON a.room_id = r.id
      WHERE a.date >= ? AND a.date < ?
    `;
    
    const params = [check_in, check_out];
    
    if (room_id) {
      query += ' AND a.room_id = ?';
      params.push(room_id);
    }
    
    if (guests) {
      query += ' AND r.max_guests >= ?';
      params.push(guests);
    }
    
    query += ' GROUP BY a.room_id';
    
    const rows = await dbAll(query, params);
    
    // Also check for existing bookings
    const bookingQuery = `
      SELECT room_id FROM bookings 
      WHERE status IN ('confirmed', 'pending')
      AND check_in < ? AND check_out > ?
    `;
    
    const bookings = await dbAll(bookingQuery, [check_out, check_in]);
    const bookedRoomIds = new Set(bookings.map(b => b.room_id));
    
    const availableRooms = rows.filter(r => 
      r.is_available === 1 && !bookedRoomIds.has(r.room_id)
    );
    
    res.json({ available: availableRooms });
  } catch (error) {
    next(error);
  }
});

// Initialize availability for date range (admin)
router.post('/admin/availability', async (req, res, next) => {
  try {
    const { room_id, start_date, end_date, price, min_stay, available } = req.body;
    
    if (!room_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'room_id, start_date, and end_date are required' });
    }
    
    // Generate dates between start and end
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const dates = eachDayOfInterval({ start: startDate, end: endDate })
      .map(date => format(date, 'yyyy-MM-dd'));
    
    // Use provided available status or default to 1 (available)
    const isAvailable = available !== undefined ? parseInt(available) : 1;
    
    // Insert/update availability
    for (const date of dates) {
      await dbRun(`
        INSERT OR REPLACE INTO availability (room_id, date, available, price, min_stay, source)
        VALUES (?, ?, ?, ?, ?, 'manual')
      `, [room_id, date, isAvailable, price || null, min_stay || 1]);
    }
    
    res.json({ success: true, dates_updated: dates.length });
  } catch (error) {
    next(error);
  }
});

export default router;

