import express from 'express';
import {
  createWebhook,
  updateWebhook,
  deleteWebhook,
  getWebhook,
  getAllWebhooks,
  getWebhookLogs,
  testWebhook,
  triggerWebhooks,
  buildSaunaPayload,
  WEBHOOK_EVENTS
} from '../services/webhookService.js';

const router = express.Router();

// List all webhook events
router.get('/events', (req, res) => {
  res.json({
    events: Object.values(WEBHOOK_EVENTS),
    descriptions: {
      [WEBHOOK_EVENTS.BOOKING_CREATED]: 'When a new booking is created',
      [WEBHOOK_EVENTS.BOOKING_CONFIRMED]: 'When a booking is confirmed',
      [WEBHOOK_EVENTS.BOOKING_CANCELLED]: 'When a booking is cancelled',
      [WEBHOOK_EVENTS.BOOKING_CHECKIN]: 'When guest checks in (day of arrival)',
      [WEBHOOK_EVENTS.BOOKING_CHECKOUT]: 'When guest checks out (day of departure)',
      [WEBHOOK_EVENTS.ROOM_OCCUPIED]: 'When a room becomes occupied',
      [WEBHOOK_EVENTS.ROOM_VACANT]: 'When a room becomes vacant',
      [WEBHOOK_EVENTS.SAUNA_PREHEAT]: 'Preheat sauna before guest arrival',
      [WEBHOOK_EVENTS.SAUNA_OFF]: 'Turn off sauna after checkout'
    },
    categories: {
      booking: ['booking.created', 'booking.confirmed', 'booking.cancelled', 'booking.checkin', 'booking.checkout'],
      room: ['room.occupied', 'room.vacant'],
      sauna: ['sauna.preheat', 'sauna.off']
    }
  });
});

// List all webhooks
router.get('/', async (req, res) => {
  try {
    const webhooks = await getAllWebhooks();
    res.json(webhooks);
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
});

// Get single webhook
router.get('/:id', async (req, res) => {
  try {
    const webhook = await getWebhook(req.params.id);
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    res.json(webhook);
  } catch (error) {
    console.error('Error fetching webhook:', error);
    res.status(500).json({ error: 'Failed to fetch webhook' });
  }
});

// Get webhook logs
router.get('/:id/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await getWebhookLogs(req.params.id, limit);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching webhook logs:', error);
    res.status(500).json({ error: 'Failed to fetch webhook logs' });
  }
});

// Create webhook
router.post('/', async (req, res) => {
  try {
    const { name, url, secret, events, headers, active, retry_count, timeout_ms } = req.body;

    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required' });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const webhook = await createWebhook({
      name,
      url,
      secret,
      events,
      headers,
      active,
      retry_count,
      timeout_ms
    });

    res.status(201).json(webhook);
  } catch (error) {
    console.error('Error creating webhook:', error);
    res.status(500).json({ error: 'Failed to create webhook' });
  }
});

// Update webhook
router.put('/:id', async (req, res) => {
  try {
    const webhook = await updateWebhook(req.params.id, req.body);
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    res.json(webhook);
  } catch (error) {
    console.error('Error updating webhook:', error);
    res.status(500).json({ error: 'Failed to update webhook' });
  }
});

// Delete webhook
router.delete('/:id', async (req, res) => {
  try {
    await deleteWebhook(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

// Test webhook
router.post('/:id/test', async (req, res) => {
  try {
    const result = await testWebhook(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error testing webhook:', error);
    res.status(500).json({ error: error.message || 'Failed to test webhook' });
  }
});

// Manual sauna control endpoint
router.post('/sauna/:action', async (req, res) => {
  try {
    const { action } = req.params;
    const { booking_id, room_id, temperature, preheat_minutes } = req.body;

    if (!['preheat', 'off'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Use "preheat" or "off"' });
    }

    const eventType = action === 'preheat' ? WEBHOOK_EVENTS.SAUNA_PREHEAT : WEBHOOK_EVENTS.SAUNA_OFF;
    const payload = buildSaunaPayload(action, { id: booking_id, room_id }, { 
      temperature: temperature || 80,
      preheat_minutes: preheat_minutes || 45
    });

    const result = await triggerWebhooks(eventType, payload);
    
    res.json({
      success: true,
      action,
      webhooks_triggered: result.triggered,
      results: result.results
    });
  } catch (error) {
    console.error('Error triggering sauna webhook:', error);
    res.status(500).json({ error: 'Failed to trigger sauna webhook' });
  }
});

export default router;

