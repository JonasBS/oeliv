import express from 'express';
import { dbAll, dbGet, dbRun } from '../database/db.js';

const router = express.Router();

// Get all bookings (admin)
router.get('/', async (req, res, next) => {
  try {
    const { status, start_date, end_date } = req.query;
    
    let query = `
      SELECT b.*, r.name as room_name, r.type as room_type
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      query += ' AND b.status = ?';
      params.push(status);
    }
    if (start_date) {
      query += ' AND b.check_in >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND b.check_out <= ?';
      params.push(end_date);
    }
    
    query += ' ORDER BY b.created_at DESC, b.id DESC';
    
    const rows = await dbAll(query, params);
    res.json(rows || []);
  } catch (error) {
    next(error);
  }
});

// Get booking by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const row = await dbGet(`
      SELECT b.*, r.name as room_name, r.type as room_type
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE b.id = ?
    `, [id]);
    
    if (!row) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json(row);
  } catch (error) {
    next(error);
  }
});

// Create booking
router.post('/', async (req, res, next) => {
  try {
    const { room_id, check_in, check_out, guests, guest_name, guest_email, guest_phone, notes, source } = req.body;
    
    if (!room_id || !check_in || !check_out || !guests || !guest_name || !guest_email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check availability
    const availability = await dbAll(`
      SELECT available FROM availability 
      WHERE room_id = ? AND date >= ? AND date < ?
    `, [room_id, check_in, check_out]);
    
    if (availability.some(a => a.available === 0)) {
      return res.status(400).json({ error: 'Room not available for selected dates' });
    }
    
    // Check for existing bookings
    const existingBookings = await dbAll(`
      SELECT id FROM bookings 
      WHERE room_id = ? 
      AND status IN ('confirmed', 'pending')
      AND check_in < ? AND check_out > ?
    `, [room_id, check_out, check_in]);
    
    if (existingBookings.length > 0) {
      return res.status(400).json({ error: 'Room already booked for selected dates' });
    }
    
    // Calculate price
    const priceResult = await dbGet(`
      SELECT SUM(price) as total FROM availability 
      WHERE room_id = ? AND date >= ? AND date < ?
    `, [room_id, check_in, check_out]);
    
    const total_price = priceResult?.total || 0;
    
    // Create booking
    const result = await dbRun(`
      INSERT INTO bookings 
      (room_id, check_in, check_out, guests, guest_name, guest_email, guest_phone, total_price, notes, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [room_id, check_in, check_out, guests, guest_name, guest_email, guest_phone || null, total_price, notes || null, source || 'website']);
    
    res.json({ 
      booking_id: result.lastID,
      total_price: total_price,
      status: 'pending'
    });
  } catch (error) {
    next(error);
  }
});

// Update booking status
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, payment_status, payment_intent_id } = req.body;
    
    const updates = [];
    const params = [];
    
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (payment_status) {
      updates.push('payment_status = ?');
      params.push(payment_status);
    }
    if (payment_intent_id) {
      updates.push('payment_intent_id = ?');
      params.push(payment_intent_id);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(id);
    
    const result = await dbRun(`
      UPDATE bookings 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, params);
    
    res.json({ success: true, changes: result.changes });
  } catch (error) {
    next(error);
  }
});

export default router;

