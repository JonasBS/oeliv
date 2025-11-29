import { dbRun, dbGet, dbAll } from '../database/db.js';
import crypto from 'crypto';

// Event types
export const WEBHOOK_EVENTS = {
  BOOKING_CREATED: 'booking.created',
  BOOKING_CONFIRMED: 'booking.confirmed',
  BOOKING_CANCELLED: 'booking.cancelled',
  BOOKING_CHECKIN: 'booking.checkin',
  BOOKING_CHECKOUT: 'booking.checkout',
  ROOM_OCCUPIED: 'room.occupied',
  ROOM_VACANT: 'room.vacant',
  // Sauna events
  SAUNA_PREHEAT: 'sauna.preheat',
  SAUNA_OFF: 'sauna.off',
  // Floor heating events (Ditra Heat)
  FLOOR_HEAT_ON: 'floor.heat_on',
  FLOOR_HEAT_OFF: 'floor.heat_off',
  FLOOR_HEAT_ECO: 'floor.eco'
};

/**
 * Get all active webhooks that listen for a specific event
 */
export const getWebhooksForEvent = async (eventType) => {
  const webhooks = await dbAll(
    `SELECT * FROM webhooks WHERE active = 1`
  );
  
  return webhooks.filter(webhook => {
    const events = webhook.events.split(',').map(e => e.trim());
    return events.includes('all') || events.includes(eventType);
  });
};

/**
 * Generate HMAC signature for webhook payload
 */
const generateSignature = (payload, secret) => {
  if (!secret) return null;
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
};

/**
 * Send webhook to a single endpoint
 */
const sendWebhook = async (webhook, eventType, payload) => {
  const startTime = Date.now();
  let attempts = 0;
  let lastError = null;
  let response = null;

  const fullPayload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    data: payload
  };

  const headers = {
    'Content-Type': 'application/json',
    'X-Webhook-Event': eventType,
    'X-Webhook-Timestamp': fullPayload.timestamp
  };

  // Add signature if secret is configured
  const signature = generateSignature(fullPayload, webhook.secret);
  if (signature) {
    headers['X-Webhook-Signature'] = `sha256=${signature}`;
  }

  // Add custom headers if configured
  if (webhook.headers) {
    try {
      const customHeaders = JSON.parse(webhook.headers);
      Object.assign(headers, customHeaders);
    } catch (e) {
      console.warn('Invalid webhook headers JSON:', e.message);
    }
  }

  // Retry loop
  while (attempts < webhook.retry_count) {
    attempts++;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), webhook.timeout_ms);

      response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(fullPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseBody = await response.text();

      // Log the delivery
      await dbRun(
        `INSERT INTO webhook_logs (webhook_id, event_type, payload, response_status, response_body, success, attempts)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          webhook.id,
          eventType,
          JSON.stringify(fullPayload),
          response.status,
          responseBody.substring(0, 1000), // Limit response body size
          response.ok ? 1 : 0,
          attempts
        ]
      );

      if (response.ok) {
        console.log(`✅ Webhook delivered: ${webhook.name} (${eventType})`);
        return { success: true, status: response.status, attempts };
      }

      lastError = `HTTP ${response.status}: ${responseBody.substring(0, 200)}`;
      console.warn(`⚠️ Webhook failed (attempt ${attempts}/${webhook.retry_count}): ${webhook.name} - ${lastError}`);

    } catch (error) {
      lastError = error.name === 'AbortError' ? 'Timeout' : error.message;
      console.warn(`⚠️ Webhook error (attempt ${attempts}/${webhook.retry_count}): ${webhook.name} - ${lastError}`);
    }

    // Wait before retry (exponential backoff)
    if (attempts < webhook.retry_count) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
    }
  }

  // Log final failure
  await dbRun(
    `INSERT INTO webhook_logs (webhook_id, event_type, payload, success, attempts, error_message)
     VALUES (?, ?, ?, 0, ?, ?)`,
    [webhook.id, eventType, JSON.stringify(fullPayload), attempts, lastError]
  );

  console.error(`❌ Webhook failed after ${attempts} attempts: ${webhook.name}`);
  return { success: false, error: lastError, attempts };
};

/**
 * Trigger webhooks for an event
 */
export const triggerWebhooks = async (eventType, payload) => {
  try {
    const webhooks = await getWebhooksForEvent(eventType);
    
    if (webhooks.length === 0) {
      return { triggered: 0, results: [] };
    }

    console.log(`🔔 Triggering ${webhooks.length} webhook(s) for ${eventType}`);

    // Send webhooks in parallel
    const results = await Promise.all(
      webhooks.map(webhook => sendWebhook(webhook, eventType, payload))
    );

    return {
      triggered: webhooks.length,
      results: results.map((result, i) => ({
        webhook: webhooks[i].name,
        ...result
      }))
    };
  } catch (error) {
    console.error('❌ Error triggering webhooks:', error);
    return { triggered: 0, error: error.message };
  }
};

/**
 * Build payload for booking events
 */
export const buildBookingPayload = (booking, room = null) => {
  return {
    booking_id: booking.id,
    room_id: booking.room_id,
    room_name: room?.name || booking.room_name,
    room_unit_id: booking.room_unit_id,
    check_in: booking.check_in,
    check_out: booking.check_out,
    guests: booking.guests,
    guest_name: booking.guest_name,
    status: booking.status,
    // For Home Assistant / smart home integration
    action: null, // Will be set based on event
    temperature_target: null // Can be configured per room
  };
};

/**
 * Build payload for room status events (for HVAC control)
 */
export const buildRoomStatusPayload = (room, status, booking = null) => {
  const checkInTime = '15:00';
  const checkOutTime = '11:00';
  
  return {
    room_id: room.id,
    room_name: room.name,
    room_unit_id: booking?.room_unit_id || null,
    status: status, // 'occupied', 'vacant', 'pre_arrival', 'checkout_today'
    // Smart home specific fields
    hvac: {
      action: status === 'vacant' ? 'eco' : 'comfort',
      target_temperature: status === 'vacant' ? 15 : 21,
      mode: status === 'vacant' ? 'off' : 'heat' // or 'cool' based on season
    },
    // Timing info
    check_in_time: status === 'pre_arrival' ? checkInTime : null,
    check_out_time: status === 'checkout_today' ? checkOutTime : null,
    // Booking reference
    booking_id: booking?.id || null,
    guest_name: booking?.guest_name || null
  };
};

/**
 * Build payload for sauna events
 */
export const buildSaunaPayload = (action, booking = null, options = {}) => {
  return {
    action: action, // 'preheat', 'off'
    sauna: {
      power: action === 'preheat' ? 'on' : 'off',
      target_temperature: action === 'preheat' ? (options.temperature || 80) : 0,
      preheat_minutes: options.preheat_minutes || 45
    },
    // Booking reference
    booking_id: booking?.id || null,
    room_id: booking?.room_id || null,
    room_name: booking?.room_name || null,
    guest_name: booking?.guest_name || null,
    check_in: booking?.check_in || null,
    // Scheduling
    scheduled_time: options.scheduled_time || null
  };
};

/**
 * Build payload for floor heating events (Ditra Heat)
 */
export const buildFloorHeatPayload = (action, booking = null, options = {}) => {
  // Default temperatures for Ditra Heat
  const temperatures = {
    heat_on: options.temperature || 25,  // Comfort temperature
    eco: options.temperature || 18,       // Eco/away temperature
    heat_off: 15                          // Frost protection only
  };

  return {
    action: action, // 'heat_on', 'eco', 'heat_off'
    floor_heating: {
      power: action !== 'heat_off' ? 'on' : 'off',
      mode: action === 'eco' ? 'eco' : (action === 'heat_on' ? 'comfort' : 'off'),
      target_temperature: temperatures[action] || 20,
      // Ditra Heat specific
      schedule_override: action === 'heat_on', // Override any schedule when guest arrives
      frost_protection: true // Always keep frost protection on
    },
    // Room info
    room_id: booking?.room_id || options.room_id || null,
    room_name: booking?.room_name || options.room_name || null,
    room_unit_id: booking?.room_unit_id || null,
    // Booking reference
    booking_id: booking?.id || null,
    guest_name: booking?.guest_name || null,
    check_in: booking?.check_in || null,
    check_out: booking?.check_out || null
  };
};

// CRUD operations for webhooks
export const createWebhook = async (data) => {
  const result = await dbRun(
    `INSERT INTO webhooks (name, url, secret, events, headers, active, retry_count, timeout_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.url,
      data.secret || null,
      data.events || 'all',
      data.headers ? JSON.stringify(data.headers) : null,
      data.active !== false ? 1 : 0,
      data.retry_count || 3,
      data.timeout_ms || 5000
    ]
  );
  return { id: result.lastID, ...data };
};

export const updateWebhook = async (id, data) => {
  const fields = [];
  const values = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.url !== undefined) { fields.push('url = ?'); values.push(data.url); }
  if (data.secret !== undefined) { fields.push('secret = ?'); values.push(data.secret); }
  if (data.events !== undefined) { fields.push('events = ?'); values.push(data.events); }
  if (data.headers !== undefined) { fields.push('headers = ?'); values.push(JSON.stringify(data.headers)); }
  if (data.active !== undefined) { fields.push('active = ?'); values.push(data.active ? 1 : 0); }
  if (data.retry_count !== undefined) { fields.push('retry_count = ?'); values.push(data.retry_count); }
  if (data.timeout_ms !== undefined) { fields.push('timeout_ms = ?'); values.push(data.timeout_ms); }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  await dbRun(`UPDATE webhooks SET ${fields.join(', ')} WHERE id = ?`, values);
  return getWebhook(id);
};

export const deleteWebhook = async (id) => {
  await dbRun('DELETE FROM webhooks WHERE id = ?', [id]);
  return { deleted: true };
};

export const getWebhook = async (id) => {
  return dbGet('SELECT * FROM webhooks WHERE id = ?', [id]);
};

export const getAllWebhooks = async () => {
  return dbAll('SELECT * FROM webhooks ORDER BY created_at DESC');
};

export const getWebhookLogs = async (webhookId, limit = 50) => {
  return dbAll(
    `SELECT * FROM webhook_logs WHERE webhook_id = ? ORDER BY created_at DESC LIMIT ?`,
    [webhookId, limit]
  );
};

export const testWebhook = async (id) => {
  const webhook = await getWebhook(id);
  if (!webhook) {
    throw new Error('Webhook not found');
  }

  const testPayload = {
    test: true,
    message: 'This is a test webhook from ØLIV Booking System',
    timestamp: new Date().toISOString()
  };

  return sendWebhook(webhook, 'test', testPayload);
};

