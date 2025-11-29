import express from 'express';
import { dbAll, dbGet, dbRun } from '../database/db.js';
import { notifyGuestOfConfirmation } from '../services/notificationService.js';
import { getBookingCountMap, buildAvailabilityMap, computeRemainingUnits, generateDateStrings } from '../services/inventoryService.js';
import { recordGuestFromBooking } from '../services/guestService.js';
import { provisionLockCodeForBooking, revokeLockCodeForBooking } from '../services/ttlockService.js';
import { triggerWebhooks, buildBookingPayload, buildRoomStatusPayload, buildSaunaPayload, WEBHOOK_EVENTS } from '../services/webhookService.js';
import { getBookingCommunications } from '../services/communicationLogService.js';

const router = express.Router();

const normalizePhoneNumber = (phone) => {
  if (!phone) return null;
  let value = phone.trim();
  if (!value) return null;

  value = value.replace(/[\s()-]/g, '');

  if (value.startsWith('+')) {
    return value;
  }

  value = value.replace(/^0+/, '');

  if (/^\d{8}$/.test(value)) {
    return `+45${value}`;
  }

  if (!value.startsWith('+')) {
    return `+${value}`;
  }

  return value;
};

const BOOKING_UNIT_STATUSES = ['pending', 'confirmed'];

const findAvailableRoomUnit = async (roomId, checkIn, checkOut) => {
  const units = await dbAll(
    `SELECT id, room_id, label, ttlock_lock_id
     FROM room_units
     WHERE room_id = ? AND active = 1
     ORDER BY label ASC`,
    [roomId]
  );

  if (units.length === 0) {
    return { unitsDefined: false, unit: null };
  }

  for (const unit of units) {
    const overlap = await dbGet(
      `
        SELECT COUNT(*) as count
        FROM bookings
        WHERE room_unit_id = ?
          AND status IN (${BOOKING_UNIT_STATUSES.map(() => '?').join(', ')})
          AND check_in < ?
          AND check_out > ?
      `,
      [unit.id, ...BOOKING_UNIT_STATUSES, checkOut, checkIn]
    );

    if ((overlap?.count || 0) === 0) {
      return { unitsDefined: true, unit };
    }
  }

  return { unitsDefined: true, unit: null };
};

// Get all bookings (admin) - lock codes are hidden, use separate endpoint
router.get('/', async (req, res, next) => {
  try {
    const { status, start_date, end_date } = req.query;
    
    let query = `
      SELECT b.*, r.name as room_name, r.type as room_type,
             ru.label as room_unit_label,
             CASE WHEN blc.id IS NOT NULL THEN 1 ELSE 0 END as has_lock_code,
             blc.status as lock_code_status
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      LEFT JOIN room_units ru ON b.room_unit_id = ru.id
      LEFT JOIN booking_lock_codes blc ON blc.booking_id = b.id
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

// Calendar bookings range
router.get('/range/calendar', async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date are required' });
    }

    const rows = await dbAll(
      `
        SELECT room_id, check_in, check_out, guest_name, status
        FROM bookings
        WHERE status IN ('confirmed', 'pending')
          AND check_in < ?
          AND check_out > ?
      `,
      [end_date, start_date]
    );

    res.json(rows || []);
  } catch (error) {
    next(error);
  }
});

// Get booking by ID (basic)
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

// Get detailed booking info (for admin modal)
router.get('/:id/details', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get booking with all related info
    const booking = await dbGet(`
      SELECT b.*, 
             r.name as room_name, 
             r.type as room_type,
             r.base_price as room_base_price,
             ru.label as room_unit_label,
             ru.ttlock_lock_id as unit_ttlock_id,
             g.id as crm_guest_id,
             g.total_stays,
             g.total_nights,
             g.lifetime_value as total_revenue
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      LEFT JOIN room_units ru ON ru.id = b.room_unit_id
      LEFT JOIN guests g ON g.email = b.guest_email
      WHERE b.id = ?
    `, [id]);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Get lock code info (without actual code) - safely
    let lockCode = null;
    try {
      lockCode = await dbGet(`
        SELECT id, status, created_at, 
               valid_from, valid_to, last_error as error_message
        FROM booking_lock_codes
        WHERE booking_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `, [id]);
    } catch (e) {
      console.log('Lock code table not available');
    }
    
    // Get preferences - safely
    let preferences = null;
    try {
      preferences = await dbGet(`
        SELECT *
        FROM guest_preferences
        WHERE booking_id = ?
      `, [id]);
    } catch (e) {
      console.log('Preferences table not available');
    }
    
    // Get communication history - safely
    let communications = [];
    try {
      communications = await getBookingCommunications(id);
    } catch (e) {
      console.log('Communication log not available');
    }
    
    // Get cleaning requests - safely
    let cleaningRequests = [];
    try {
      cleaningRequests = await dbAll(`
        SELECT *
        FROM cleaning_requests
        WHERE booking_id = ?
        ORDER BY created_at DESC
      `, [id]);
    } catch (e) {
      console.log('Cleaning requests table not available');
    }
    
    // Get feedback if exists - safely
    let feedback = null;
    try {
      feedback = await dbGet(`
        SELECT *
        FROM feedback_responses
        WHERE booking_id = ?
      `, [id]);
    } catch (e) {
      console.log('Feedback table not available');
    }
    
    // Get other bookings from same guest
    const guestHistory = await dbAll(`
      SELECT id, room_id, check_in, check_out, status, total_price, created_at,
             (SELECT name FROM rooms WHERE id = b.room_id) as room_name
      FROM bookings b
      WHERE guest_email = ? AND id != ?
      ORDER BY check_in DESC
      LIMIT 10
    `, [booking.guest_email, id]);
    
    // Calculate nights
    const checkIn = new Date(booking.check_in);
    const checkOut = new Date(booking.check_out);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    res.json({
      booking: {
        ...booking,
        nights
      },
      lockCode: lockCode || null,
      preferences: preferences || null,
      communications: communications || [],
      cleaningRequests: cleaningRequests || [],
      feedback: feedback || null,
      guestHistory: guestHistory || []
    });
  } catch (error) {
    console.error('Error fetching booking details:', error);
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

    const room = await dbGet('SELECT id, unit_count, name, ttlock_lock_id FROM rooms WHERE id = ?', [room_id]);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const dateStrings = generateDateStrings(check_in, check_out);
    if (dateStrings.length === 0) {
      return res.status(400).json({ error: 'Invalid date range' });
    }

    const bookingCountMap = await getBookingCountMap(check_in, check_out, [room_id]);
    const availabilityRows = await dbAll(
      `
        SELECT room_id, date, available, open_units
        FROM availability
        WHERE room_id = ? AND date >= ? AND date < ?
      `,
      [room_id, check_in, check_out]
    );
    const availabilityMap = buildAvailabilityMap(availabilityRows);

    for (const dateStr of dateStrings) {
      const availabilityRow = (availabilityMap[room_id] && availabilityMap[room_id][dateStr]) || {
        available: 1,
        open_units: null,
      };
      const { remaining } = computeRemainingUnits({
        roomId: room_id,
        dateStr,
        roomUnitCount: room.unit_count || 1,
        availabilityRow,
        bookingCountMap,
      });
      if (remaining <= 0) {
        return res.status(400).json({ error: 'Room not available for selected dates' });
      }
    }
    
    // Calculate price using date-specific pricing if available
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
    let total_price = 0;
    
    // Check each night for date-specific pricing
    for (let i = 0; i < nights; i++) {
      const currentDate = new Date(checkInDate);
      currentDate.setDate(checkInDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // First, try to get date-specific price
      const dateSpecificPrice = await dbGet(`
        SELECT price FROM room_prices 
        WHERE room_id = ? AND price_date = ?
      `, [room_id, dateStr]);
      
      if (dateSpecificPrice) {
        total_price += dateSpecificPrice.price;
      } else {
        // Fall back to availability table price or base price
        const availabilityPrice = await dbGet(`
          SELECT price FROM availability 
          WHERE room_id = ? AND date = ?
        `, [room_id, dateStr]);
        
        if (availabilityPrice && availabilityPrice.price) {
          total_price += availabilityPrice.price;
        } else {
          // Last resort: use base price from room
          const basePrice = await dbGet(`
            SELECT base_price FROM rooms WHERE id = ?
          `, [room_id]);
          
          total_price += basePrice?.base_price || 0;
        }
      }
    }
    
    const normalizedPhone = normalizePhoneNumber(guest_phone);

    const { unit: assignedUnit, unitsDefined } = await findAvailableRoomUnit(room_id, check_in, check_out);
    if (unitsDefined && !assignedUnit) {
      return res.status(400).json({ error: 'Der er ikke flere ledige fysiske værelser af denne type' });
    }

    // Create booking
    const result = await dbRun(`
      INSERT INTO bookings 
      (room_id, check_in, check_out, guests, guest_name, guest_email, guest_phone, total_price, notes, source, room_unit_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [room_id, check_in, check_out, guests, guest_name, guest_email, normalizedPhone || null, total_price, notes || null, source || 'website', assignedUnit?.id || null]);

    await recordGuestFromBooking({
      id: result.lastID,
      room_id,
      guest_name,
      guest_email,
      guest_phone: normalizedPhone,
      check_in,
      check_out,
      total_price
    });
    
    // First, provision TTLock code (so we can include it in notifications)
    const lockContext = {
      roomId: room.id,
      roomName: room.name,
      roomUnitId: assignedUnit?.id || null,
      roomUnitLabel: assignedUnit?.label || null,
      ttlock_lock_id: assignedUnit?.ttlock_lock_id || room.ttlock_lock_id || null
    };

    const ttlock = await provisionLockCodeForBooking({
      bookingId: result.lastID,
      lockContext,
      checkIn: check_in,
      checkOut: check_out
    });

    // Send confirmation notifications (including lock code if available)
    let notifications = null;
    try {
      notifications = await notifyGuestOfConfirmation({
        id: result.lastID,
        room_id,
        room_name: room.name || 'Room',
        room_unit_label: assignedUnit?.label || null,
        check_in,
        check_out,
        guests,
        guest_name,
        guest_email,
        guest_phone: normalizedPhone || null,
        total_price,
        status: 'pending',
        lockCode: ttlock.status === 'active' ? ttlock.passcode : null
      });
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
      notifications = { 
        email: { sent: false, error: notificationError.message },
        sms: { sent: false, error: notificationError.message }
      };
    }

    // Trigger webhooks for new booking (async, don't wait)
    triggerWebhooks(WEBHOOK_EVENTS.BOOKING_CREATED, buildBookingPayload({
      id: result.lastID,
      room_id,
      room_name: room.name,
      room_unit_id: assignedUnit?.id || null,
      check_in,
      check_out,
      guests,
      guest_name,
      status: 'pending'
    }, room)).catch(err => console.error('Webhook error:', err));

    // Also trigger room occupied event for smart home
    triggerWebhooks(WEBHOOK_EVENTS.ROOM_OCCUPIED, buildRoomStatusPayload(room, 'pre_arrival', {
      id: result.lastID,
      room_unit_id: assignedUnit?.id || null,
      check_in,
      check_out,
      guest_name
    })).catch(err => console.error('Webhook error:', err));

    // Trigger sauna preheat (can be scheduled by Home Assistant based on check_in time)
    triggerWebhooks(WEBHOOK_EVENTS.SAUNA_PREHEAT, buildSaunaPayload('preheat', {
      id: result.lastID,
      room_id,
      room_name: room.name,
      guest_name,
      check_in
    }, {
      temperature: 80,
      preheat_minutes: 45
    })).catch(err => console.error('Webhook error:', err));

    res.json({ 
      booking_id: result.lastID,
      total_price: total_price,
      status: 'pending',
      notifications,
      ttlock
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

    const booking = await dbGet(`
      SELECT b.*, r.name as room_name
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE b.id = ?
    `, [id]);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
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

    let notifications = null;
    const normalizedPhone = normalizePhoneNumber(booking.guest_phone);
    let ttlock = null;

    if (status === 'confirmed' && booking.status !== 'confirmed') {
      try {
        notifications = await notifyGuestOfConfirmation({
          ...booking,
          guest_phone: normalizedPhone,
          status: 'confirmed'
        });
      } catch (notificationError) {
        console.error('Notification error:', notificationError);
        notifications = { error: notificationError.message };
      }
    }

    if (status && ['cancelled', 'checked_out'].includes(status)) {
      ttlock = await revokeLockCodeForBooking({ bookingId: booking.id });

      // Trigger webhook for room becoming vacant
      const room = await dbGet('SELECT * FROM rooms WHERE id = ?', [booking.room_id]);
      if (room) {
        triggerWebhooks(WEBHOOK_EVENTS.ROOM_VACANT, buildRoomStatusPayload(room, 'vacant', booking))
          .catch(err => console.error('Webhook error:', err));
        
        // Turn off sauna when room becomes vacant
        triggerWebhooks(WEBHOOK_EVENTS.SAUNA_OFF, buildSaunaPayload('off', booking))
          .catch(err => console.error('Webhook error:', err));
      }

      if (status === 'cancelled') {
        triggerWebhooks(WEBHOOK_EVENTS.BOOKING_CANCELLED, buildBookingPayload(booking, room))
          .catch(err => console.error('Webhook error:', err));
      } else if (status === 'checked_out') {
        triggerWebhooks(WEBHOOK_EVENTS.BOOKING_CHECKOUT, buildBookingPayload(booking, room))
          .catch(err => console.error('Webhook error:', err));
      }
    }

    if (status === 'confirmed' && booking.status !== 'confirmed') {
      triggerWebhooks(WEBHOOK_EVENTS.BOOKING_CONFIRMED, buildBookingPayload(booking))
        .catch(err => console.error('Webhook error:', err));
    }
    
    res.json({ success: true, changes: result.changes, notifications, ttlock });
  } catch (error) {
    next(error);
  }
});

// Admin PIN for accessing lock codes (can be set in .env)
const ADMIN_PIN = process.env.ADMIN_PIN || '1234';

// Get lock code for a booking (requires admin PIN)
router.post('/:id/lock-code', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { pin } = req.body;

    if (!pin || pin !== ADMIN_PIN) {
      return res.status(401).json({ error: 'Forkert adgangskode' });
    }

    const lockCode = await dbGet(`
      SELECT blc.*, ru.label as room_unit_label
      FROM booking_lock_codes blc
      LEFT JOIN room_units ru ON ru.id = blc.room_unit_id
      WHERE blc.booking_id = ?
      ORDER BY blc.id DESC
      LIMIT 1
    `, [id]);

    if (!lockCode) {
      return res.status(404).json({ error: 'Ingen låsekode fundet for denne booking' });
    }

    res.json({
      success: true,
      lock_code: lockCode.passcode,
      status: lockCode.status,
      room_unit_label: lockCode.room_unit_label,
      valid_from: lockCode.valid_from,
      valid_to: lockCode.valid_to
    });
  } catch (error) {
    next(error);
  }
});

// Resend lock code to guest (requires admin PIN)
router.post('/:id/resend-lock-code', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { pin, channel } = req.body; // channel: 'sms' or 'email' or 'both'

    if (!pin || pin !== ADMIN_PIN) {
      return res.status(401).json({ error: 'Forkert adgangskode' });
    }

    const booking = await dbGet(`
      SELECT b.*, r.name as room_name
      FROM bookings b
      LEFT JOIN rooms r ON r.id = b.room_id
      WHERE b.id = ?
    `, [id]);

    if (!booking) {
      return res.status(404).json({ error: 'Booking ikke fundet' });
    }

    const lockCode = await dbGet(`
      SELECT blc.passcode, blc.status, ru.label as room_unit_label
      FROM booking_lock_codes blc
      LEFT JOIN room_units ru ON ru.id = blc.room_unit_id
      WHERE blc.booking_id = ?
      ORDER BY blc.id DESC
      LIMIT 1
    `, [id]);

    if (!lockCode || lockCode.status !== 'active') {
      return res.status(400).json({ error: 'Ingen aktiv låsekode for denne booking' });
    }

    // Import notification service
    const { notifyGuestOfConfirmation } = await import('../services/notificationService.js');

    const result = await notifyGuestOfConfirmation({
      ...booking,
      room_unit_label: lockCode.room_unit_label,
      lockCode: lockCode.passcode
    });

    res.json({
      success: true,
      message: 'Låsekode gensendt',
      notifications: result
    });
  } catch (error) {
    next(error);
  }
});

// Resend booking confirmation
router.post('/:id/resend-confirmation', async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await dbGet(`
      SELECT b.*, r.name as room_name, ru.label as room_unit_label,
             blc.passcode as lock_code
      FROM bookings b
      LEFT JOIN rooms r ON r.id = b.room_id
      LEFT JOIN room_units ru ON ru.id = b.room_unit_id
      LEFT JOIN booking_lock_codes blc ON blc.booking_id = b.id AND blc.status = 'active'
      WHERE b.id = ?
    `, [id]);

    if (!booking) {
      return res.status(404).json({ error: 'Booking ikke fundet' });
    }

    // Import notification service
    const { notifyGuestOfConfirmation } = await import('../services/notificationService.js');

    const result = await notifyGuestOfConfirmation({
      ...booking,
      lockCode: booking.lock_code
    });

    res.json({
      success: true,
      message: 'Bekræftelse gensendt',
      notifications: result
    });
  } catch (error) {
    next(error);
  }
});

// ============ CLEANING REQUESTS ============

// Register a cleaning request for a booking
router.post('/:id/cleaning-request', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { channel = 'sms', message, scheduled_date, notes } = req.body;

    const booking = await dbGet('SELECT * FROM bookings WHERE id = ?', [id]);
    if (!booking) {
      return res.status(404).json({ error: 'Booking ikke fundet' });
    }

    // Update booking with cleaning request
    await dbRun(
      `UPDATE bookings SET cleaning_requested = 1, cleaning_requested_at = CURRENT_TIMESTAMP, cleaning_notes = ? WHERE id = ?`,
      [notes || message || null, id]
    );

    // Create detailed cleaning request record
    const result = await dbRun(
      `INSERT INTO cleaning_requests (booking_id, guest_id, request_channel, request_message, scheduled_date, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, booking.guest_id || null, channel, message || null, scheduled_date || null, notes || null]
    );

    res.json({
      success: true,
      message: 'Rengøringsforespørgsel registreret',
      cleaning_request_id: result.lastID
    });
  } catch (error) {
    next(error);
  }
});

// Get cleaning requests for a booking
router.get('/:id/cleaning-requests', async (req, res, next) => {
  try {
    const { id } = req.params;

    const requests = await dbAll(
      `SELECT * FROM cleaning_requests WHERE booking_id = ? ORDER BY created_at DESC`,
      [id]
    );

    res.json(requests);
  } catch (error) {
    next(error);
  }
});

// Update cleaning request status
router.patch('/cleaning-requests/:requestId', async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { status, scheduled_date, notes } = req.body;

    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
      if (status === 'completed') {
        updates.push('completed_at = CURRENT_TIMESTAMP');
      }
    }
    if (scheduled_date !== undefined) {
      updates.push('scheduled_date = ?');
      params.push(scheduled_date);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Ingen opdateringer angivet' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(requestId);

    await dbRun(
      `UPDATE cleaning_requests SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const updated = await dbGet('SELECT * FROM cleaning_requests WHERE id = ?', [requestId]);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Get all pending cleaning requests (for admin dashboard)
router.get('/cleaning-requests/pending', async (req, res, next) => {
  try {
    const requests = await dbAll(`
      SELECT 
        cr.*,
        b.guest_name,
        b.guest_phone,
        b.check_in,
        b.check_out,
        r.name as room_name,
        ru.label as room_unit_label
      FROM cleaning_requests cr
      JOIN bookings b ON b.id = cr.booking_id
      LEFT JOIN rooms r ON r.id = b.room_id
      LEFT JOIN room_units ru ON ru.id = b.room_unit_id
      WHERE cr.status IN ('pending', 'scheduled')
      ORDER BY COALESCE(cr.scheduled_date, b.check_in) ASC
    `);

    res.json(requests);
  } catch (error) {
    next(error);
  }
});

export default router;

