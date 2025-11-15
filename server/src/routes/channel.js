import express from 'express';
import { dbRun } from '../database/db.js';

const router = express.Router();

// Channel Manager: Sync availability
router.post('/sync', async (req, res, next) => {
  try {
    const { channel, availability } = req.body;
    
    // This would integrate with actual channel manager APIs
    // For now, we'll log the sync request
    const result = await dbRun(`
      INSERT INTO channel_sync (channel, action, data, status)
      VALUES (?, 'sync', ?, 'pending')
    `, [channel, JSON.stringify(availability)]);
    
    res.json({ success: true, sync_id: result.lastID });
  } catch (error) {
    next(error);
  }
});

// Channel Manager: Receive booking from external channel
router.post('/booking', async (req, res, next) => {
  try {
    const { channel, booking_data } = req.body;
    
    // Process booking from external channel (booking.com, Airbnb, etc.)
    let booking = null;
    
    if (channel === 'booking_com') {
      booking = {
        room_id: booking_data.room_id || null,
        check_in: booking_data.check_in,
        check_out: booking_data.check_out,
        guests: booking_data.guests || 2,
        guest_name: booking_data.guest_name,
        guest_email: booking_data.guest_email,
        guest_phone: booking_data.guest_phone || null,
        total_price: booking_data.total_price || 0,
        notes: `Booking from ${channel}: ${booking_data.booking_id || ''}`,
        source: channel
      };
    } else if (channel === 'airbnb') {
      booking = {
        room_id: booking_data.room_id || null,
        check_in: booking_data.check_in,
        check_out: booking_data.check_out,
        guests: booking_data.guests || 2,
        guest_name: booking_data.guest_name,
        guest_email: booking_data.guest_email,
        guest_phone: booking_data.guest_phone || null,
        total_price: booking_data.total_price || 0,
        notes: `Booking from ${channel}: ${booking_data.reservation_id || ''}`,
        source: channel
      };
    } else {
      booking = {
        room_id: booking_data.room_id || null,
        check_in: booking_data.check_in,
        check_out: booking_data.check_out,
        guests: booking_data.guests || 2,
        guest_name: booking_data.guest_name,
        guest_email: booking_data.guest_email,
        guest_phone: booking_data.guest_phone || null,
        total_price: booking_data.total_price || 0,
        notes: `Booking from ${channel}`,
        source: channel
      };
    }
    
    // Create booking in database
    const result = await dbRun(`
      INSERT INTO bookings 
      (room_id, check_in, check_out, guests, guest_name, guest_email, guest_phone, total_price, notes, source, status, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'paid')
    `, [
      booking.room_id,
      booking.check_in,
      booking.check_out,
      booking.guests,
      booking.guest_name,
      booking.guest_email,
      booking.guest_phone,
      booking.total_price,
      booking.notes,
      booking.source
    ]);
    
    // Log sync
    await dbRun(`
      INSERT INTO channel_sync (channel, action, booking_id, data, status)
      VALUES (?, 'booking_received', ?, ?, 'completed')
    `, [channel, result.lastID, JSON.stringify(booking_data)]);
    
    res.json({ 
      success: true, 
      booking_id: result.lastID,
      message: `Booking received from ${channel}` 
    });
  } catch (error) {
    next(error);
  }
});

export default router;

