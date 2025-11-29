import express from 'express';
import { dbRun } from '../database/db.js';
import {
  listChannelConfigs,
  getChannelConfig,
  updateChannelConfig,
  listChannelRules,
  createChannelRule,
  updateChannelRule,
  deleteChannelRule
} from '../services/channelConfigService.js';
import { runChannelAutomation } from '../services/channelAutomation.js';

const router = express.Router();

const normalizeBoolean = (value) => {
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return value ? 1 : 0;
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase()) ? 1 : 0;
  }
  return value;
};

// Channel configuration endpoints
router.get('/config', async (req, res, next) => {
  try {
    const configs = await listChannelConfigs();
    res.json(configs);
  } catch (error) {
    next(error);
  }
});

router.patch('/config/:channel', async (req, res, next) => {
  try {
    const channel = req.params.channel;
    const existing = await getChannelConfig(channel);

    if (!existing) {
      return res.status(404).json({ error: `Channel ${channel} not found` });
    }

    const payload = { ...req.body };
    if (payload.enabled !== undefined) {
      payload.enabled = normalizeBoolean(payload.enabled);
    }
  if (payload.settings && typeof payload.settings !== 'string') {
    payload.settings = JSON.stringify(payload.settings);
  }

    const updated = await updateChannelConfig(channel, payload);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Automation rules
router.get('/rules', async (req, res, next) => {
  try {
    const rules = await listChannelRules();
    res.json(rules);
  } catch (error) {
    next(error);
  }
});

router.post('/rules', async (req, res, next) => {
  try {
    const { rule_type, action } = req.body;
    if (!rule_type || !action) {
      return res.status(400).json({ error: 'rule_type and action are required' });
    }

    const newRule = await createChannelRule({
      channel: req.body.channel || 'all',
      rule_type,
      threshold: req.body.threshold ?? null,
      lead_time_days: req.body.lead_time_days ?? null,
      action,
      active: normalizeBoolean(req.body.active ?? 1),
      description: req.body.description || null,
      settings: req.body.settings ? JSON.stringify(req.body.settings) : null
    });

    res.status(201).json(newRule);
  } catch (error) {
    next(error);
  }
});

router.patch('/rules/:id', async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (payload.active !== undefined) {
      payload.active = normalizeBoolean(payload.active);
    }
    if (payload.settings && typeof payload.settings !== 'string') {
      payload.settings = JSON.stringify(payload.settings);
    }

    const updated = await updateChannelRule(Number(req.params.id), payload);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/rules/:id', async (req, res, next) => {
  try {
    await deleteChannelRule(Number(req.params.id));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post('/automation/run', async (req, res, next) => {
  try {
    const summary = await runChannelAutomation();
    const configs = await listChannelConfigs();
    res.json({ summary, configs });
  } catch (error) {
    next(error);
  }
});

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

