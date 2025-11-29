import express from 'express';
import { dbAll, dbGet, dbRun } from '../database/db.js';
import { getFeaturedExperiences } from '../services/recommendationService.js';
import { sendExperienceBookingNotification, sendExperienceBookingConfirmation } from '../services/experienceNotificationService.js';

const router = express.Router();

/**
 * Get all experience bookings (admin)
 */
router.get('/', async (req, res) => {
  try {
    const { status, date, experience_id } = req.query;
    
    let sql = `
      SELECT eb.*, b.check_in, b.check_out
      FROM experience_bookings eb
      LEFT JOIN bookings b ON b.id = eb.booking_id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      sql += ` AND eb.status = ?`;
      params.push(status);
    }
    
    if (date) {
      sql += ` AND eb.booking_date = ?`;
      params.push(date);
    }
    
    if (experience_id) {
      sql += ` AND eb.experience_id = ?`;
      params.push(experience_id);
    }
    
    sql += ` ORDER BY eb.booking_date DESC, eb.time_slot ASC`;
    
    const bookings = await dbAll(sql, params);
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching experience bookings:', error);
    res.status(500).json({ error: 'Failed to fetch experience bookings' });
  }
});

/**
 * Get bookings for a specific date (for availability checking)
 */
router.get('/availability/:experienceId/:date', async (req, res) => {
  try {
    const { experienceId, date } = req.params;
    
    // Get all bookings for this experience on this date
    const bookings = await dbAll(`
      SELECT time_slot, guests, status
      FROM experience_bookings
      WHERE experience_id = ? AND booking_date = ? AND status != 'cancelled'
    `, [experienceId, date]);
    
    // Get experience details for available slots
    const featured = getFeaturedExperiences();
    const experience = featured.find(e => e.id === experienceId);
    
    if (!experience) {
      return res.status(404).json({ error: 'Experience not found' });
    }
    
    // Calculate available slots
    const bookedSlots = bookings.map(b => b.time_slot);
    const availableSlots = (experience.availableSlots || []).filter(
      slot => !bookedSlots.includes(slot)
    );
    
    res.json({
      experienceId,
      date,
      bookedSlots,
      availableSlots,
      totalSlots: experience.availableSlots || []
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

/**
 * Create a new experience booking (public - from guest)
 */
router.post('/', async (req, res) => {
  try {
    const {
      experience_id,
      booking_id, // Optional - link to room booking
      guest_name,
      guest_email,
      guest_phone,
      room_name,
      booking_date,
      time_slot,
      guests = 1,
      notes
    } = req.body;
    
    // Validate required fields
    if (!experience_id || !guest_name || !booking_date) {
      return res.status(400).json({ 
        error: 'Missing required fields: experience_id, guest_name, booking_date' 
      });
    }
    
    // Get experience details
    const featured = getFeaturedExperiences();
    const experience = featured.find(e => e.id === experience_id);
    
    if (!experience) {
      return res.status(404).json({ error: 'Experience not found' });
    }
    
    // Check if slot is available (if time slots are required)
    if (experience.availableSlots && time_slot) {
      const existing = await dbGet(`
        SELECT id FROM experience_bookings
        WHERE experience_id = ? AND booking_date = ? AND time_slot = ? AND status != 'cancelled'
      `, [experience_id, booking_date, time_slot]);
      
      if (existing) {
        return res.status(409).json({ error: 'This time slot is already booked' });
      }
    }
    
    // Calculate price
    const priceMatch = experience.price?.match(/(\d+)/);
    const pricePerUnit = priceMatch ? parseFloat(priceMatch[1]) : 0;
    const totalPrice = pricePerUnit * guests;
    
    // Create booking
    const result = await dbRun(`
      INSERT INTO experience_bookings (
        experience_id, experience_name, booking_id,
        guest_name, guest_email, guest_phone, room_name,
        booking_date, time_slot, duration, guests,
        price_per_unit, quantity, total_price,
        notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      experience_id,
      experience.title,
      booking_id || null,
      guest_name,
      guest_email || null,
      guest_phone || null,
      room_name || null,
      booking_date,
      time_slot || null,
      experience.duration || null,
      guests,
      pricePerUnit,
      guests,
      totalPrice,
      notes || null
    ]);
    
    const newBooking = await dbGet(`
      SELECT * FROM experience_bookings WHERE id = ?
    `, [result.lastID]);
    
    console.log(`📅 New experience booking: ${experience.title} for ${guest_name} on ${booking_date}`);
    
    // Send notifications
    const notificationResult = await sendExperienceBookingNotification({
      ...newBooking,
      experience
    });
    
    res.status(201).json({
      success: true,
      booking: newBooking,
      message: `Din booking af "${experience.title}" er modtaget. Vi bekræfter snarest.`,
      notifications: notificationResult
    });
  } catch (error) {
    console.error('Error creating experience booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

/**
 * Create booking linked to a room booking (from preferences or guide)
 */
router.post('/from-booking/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { experience_id, booking_date, time_slot, guests = 1, notes } = req.body;
    
    // Get room booking details
    const roomBooking = await dbGet(`
      SELECT b.*, r.name as room_name
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
      WHERE b.id = ?
    `, [bookingId]);
    
    if (!roomBooking) {
      return res.status(404).json({ error: 'Room booking not found' });
    }
    
    // Get experience details
    const featured = getFeaturedExperiences();
    const experience = featured.find(e => e.id === experience_id);
    
    if (!experience) {
      return res.status(404).json({ error: 'Experience not found' });
    }
    
    // Calculate price
    const priceMatch = experience.price?.match(/(\d+)/);
    const pricePerUnit = priceMatch ? parseFloat(priceMatch[1]) : 0;
    const totalPrice = pricePerUnit * guests;
    
    // Create booking
    const result = await dbRun(`
      INSERT INTO experience_bookings (
        experience_id, experience_name, booking_id,
        guest_name, guest_email, guest_phone, room_name,
        booking_date, time_slot, duration, guests,
        price_per_unit, quantity, total_price,
        notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      experience_id,
      experience.title,
      bookingId,
      roomBooking.guest_name,
      roomBooking.guest_email,
      roomBooking.guest_phone,
      roomBooking.room_name,
      booking_date || roomBooking.check_in,
      time_slot || null,
      experience.duration || null,
      guests,
      pricePerUnit,
      guests,
      totalPrice,
      notes || null
    ]);
    
    const newBooking = await dbGet(`
      SELECT * FROM experience_bookings WHERE id = ?
    `, [result.lastID]);
    
    console.log(`📅 Experience booking linked to room booking #${bookingId}: ${experience.title}`);
    
    res.status(201).json({
      success: true,
      booking: newBooking
    });
  } catch (error) {
    console.error('Error creating linked experience booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

/**
 * Get experience bookings for a room booking
 */
router.get('/for-booking/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const bookings = await dbAll(`
      SELECT * FROM experience_bookings
      WHERE booking_id = ?
      ORDER BY booking_date, time_slot
    `, [bookingId]);
    
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching experience bookings for booking:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

/**
 * Update experience booking status (admin)
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, confirmed_by } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    let sql = `UPDATE experience_bookings SET status = ?, updated_at = CURRENT_TIMESTAMP`;
    const params = [status];
    
    if (status === 'confirmed' && confirmed_by) {
      sql += `, confirmed_by = ?, confirmed_at = CURRENT_TIMESTAMP`;
      params.push(confirmed_by);
    }
    
    sql += ` WHERE id = ?`;
    params.push(id);
    
    await dbRun(sql, params);
    
    const updated = await dbGet(`SELECT * FROM experience_bookings WHERE id = ?`, [id]);
    
    if (!updated) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    console.log(`📅 Experience booking #${id} status updated to: ${status}`);
    
    // Send confirmation notification when status changes to confirmed
    let notificationResult = null;
    if (status === 'confirmed') {
      const featured = getFeaturedExperiences();
      const experience = featured.find(e => e.id === updated.experience_id);
      
      notificationResult = await sendExperienceBookingConfirmation({
        ...updated,
        experience
      });
    }
    
    res.json({
      ...updated,
      notifications: notificationResult
    });
  } catch (error) {
    console.error('Error updating experience booking status:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

/**
 * Update experience booking (admin)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      booking_date,
      time_slot,
      guests,
      notes,
      total_price
    } = req.body;
    
    await dbRun(`
      UPDATE experience_bookings SET
        booking_date = COALESCE(?, booking_date),
        time_slot = COALESCE(?, time_slot),
        guests = COALESCE(?, guests),
        notes = COALESCE(?, notes),
        total_price = COALESCE(?, total_price),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [booking_date, time_slot, guests, notes, total_price, id]);
    
    const updated = await dbGet(`SELECT * FROM experience_bookings WHERE id = ?`, [id]);
    
    if (!updated) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating experience booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

/**
 * Delete experience booking (admin)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await dbGet(`SELECT * FROM experience_bookings WHERE id = ?`, [id]);
    
    if (!existing) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    await dbRun(`DELETE FROM experience_bookings WHERE id = ?`, [id]);
    
    res.json({ success: true, message: 'Booking deleted' });
  } catch (error) {
    console.error('Error deleting experience booking:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

/**
 * Get upcoming experience bookings (for dashboard)
 */
router.get('/upcoming', async (req, res) => {
  try {
    const bookings = await dbAll(`
      SELECT eb.*, b.check_in, b.check_out
      FROM experience_bookings eb
      LEFT JOIN bookings b ON b.id = eb.booking_id
      WHERE eb.booking_date >= date('now')
        AND eb.status IN ('pending', 'confirmed')
      ORDER BY eb.booking_date ASC, eb.time_slot ASC
      LIMIT 20
    `);
    
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching upcoming experience bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

/**
 * Get experience booking stats (for dashboard)
 */
router.get('/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const stats = await dbGet(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN booking_date = ? THEN 1 ELSE 0 END) as today,
        SUM(CASE WHEN booking_date >= ? AND status IN ('pending', 'confirmed') THEN total_price ELSE 0 END) as upcoming_revenue
      FROM experience_bookings
    `, [today, today]);
    
    // Get popular experiences
    const popular = await dbAll(`
      SELECT experience_id, experience_name, COUNT(*) as count
      FROM experience_bookings
      WHERE status != 'cancelled'
      GROUP BY experience_id
      ORDER BY count DESC
      LIMIT 5
    `);
    
    res.json({
      ...stats,
      popular
    });
  } catch (error) {
    console.error('Error fetching experience booking stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * Sync with external booking system (placeholder for future integration)
 */
router.post('/sync', async (req, res) => {
  try {
    const { external_system, bookings } = req.body;
    
    // This is a placeholder for future integration
    // When you connect your other booking system, implement the sync logic here
    
    console.log(`🔄 Sync request from ${external_system} with ${bookings?.length || 0} bookings`);
    
    res.json({
      success: true,
      message: 'Sync endpoint ready for integration',
      external_system,
      received: bookings?.length || 0
    });
  } catch (error) {
    console.error('Error in sync:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

export default router;

