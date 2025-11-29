import express from 'express';
import crypto from 'crypto';
import { dbAll, dbGet, dbRun } from '../database/db.js';
import { triggerWebhooks, WEBHOOK_EVENTS } from '../services/webhookService.js';

const router = express.Router();

// Temperature mapping
const TEMPERATURE_MAP = {
  cool: 18,
  normal: 21,
  warm: 24
};

/**
 * Generate a unique access token for the preferences form
 */
const generateAccessToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Create preferences entry for a booking (called when booking is created)
 */
export const createPreferencesForBooking = async (bookingId) => {
  const token = generateAccessToken();
  
  await dbRun(
    `INSERT INTO guest_preferences (booking_id, access_token) VALUES (?, ?)`,
    [bookingId, token]
  );
  
  // Update booking with token
  await dbRun(
    `UPDATE bookings SET preferences_token = ? WHERE id = ?`,
    [token, bookingId]
  );
  
  return token;
};

/**
 * Get preferences form by token (public - no auth needed)
 */
router.get('/form/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const preferences = await dbGet(`
      SELECT gp.*, b.guest_name, b.check_in, b.check_out, b.guests,
             r.name as room_name, ru.label as room_unit_label
      FROM guest_preferences gp
      JOIN bookings b ON b.id = gp.booking_id
      JOIN rooms r ON r.id = b.room_id
      LEFT JOIN room_units ru ON ru.id = b.room_unit_id
      WHERE gp.access_token = ?
    `, [token]);
    
    if (!preferences) {
      return res.status(404).json({ error: 'Form not found or expired' });
    }
    
    // Don't expose the token in the response
    const { access_token, ...safePreferences } = preferences;
    
    res.json({
      ...safePreferences,
      already_submitted: !!preferences.submitted_at
    });
  } catch (error) {
    console.error('Error fetching preferences form:', error);
    res.status(500).json({ error: 'Failed to fetch preferences form' });
  }
});

/**
 * Submit preferences (public - uses token for auth)
 */
router.post('/form/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const data = req.body;
    
    // Verify token exists
    const existing = await dbGet(`
      SELECT gp.*, b.id as booking_id, b.room_id, b.check_in, b.guest_name,
             r.name as room_name, ru.label as room_unit_label, ru.ttlock_lock_id
      FROM guest_preferences gp
      JOIN bookings b ON b.id = gp.booking_id
      JOIN rooms r ON r.id = b.room_id
      LEFT JOIN room_units ru ON ru.id = b.room_unit_id
      WHERE gp.access_token = ?
    `, [token]);
    
    if (!existing) {
      return res.status(404).json({ error: 'Form not found or expired' });
    }
    
    // Update preferences
    await dbRun(`
      UPDATE guest_preferences SET
        extra_pillows = ?,
        extra_blankets = ?,
        pillow_type = ?,
        room_temperature = ?,
        floor_heating = ?,
        blackout_curtains = ?,
        has_allergies = ?,
        allergies_details = ?,
        has_dietary_requirements = ?,
        dietary_requirements = ?,
        dietary_details = ?,
        breakfast_in_room = ?,
        breakfast_time = ?,
        is_special_occasion = ?,
        occasion_type = ?,
        occasion_details = ?,
        wants_flowers = ?,
        wants_champagne = ?,
        wants_chocolate = ?,
        other_requests = ?,
        estimated_arrival_time = ?,
        needs_early_checkin = ?,
        needs_late_checkout = ?,
        needs_parking = ?,
        preferred_contact = ?,
        do_not_disturb_until = ?,
        submitted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE access_token = ?
    `, [
      data.extra_pillows ? 1 : 0,
      data.extra_blankets ? 1 : 0,
      data.pillow_type || null,
      data.room_temperature || 'normal',
      data.floor_heating ? 1 : 0,
      data.blackout_curtains ? 1 : 0,
      data.has_allergies ? 1 : 0,
      data.allergies_details || null,
      data.has_dietary_requirements ? 1 : 0,
      Array.isArray(data.dietary_requirements) ? data.dietary_requirements.join(',') : data.dietary_requirements || null,
      data.dietary_details || null,
      data.breakfast_in_room ? 1 : 0,
      data.breakfast_time || null,
      data.is_special_occasion ? 1 : 0,
      data.occasion_type || null,
      data.occasion_details || null,
      data.wants_flowers ? 1 : 0,
      data.wants_champagne ? 1 : 0,
      data.wants_chocolate ? 1 : 0,
      data.other_requests || null,
      data.estimated_arrival_time || null,
      data.needs_early_checkin ? 1 : 0,
      data.needs_late_checkout ? 1 : 0,
      data.needs_parking ? 1 : 0,
      data.preferred_contact || 'email',
      data.do_not_disturb_until || null,
      token
    ]);
    
    // Update booking
    await dbRun(
      `UPDATE bookings SET preferences_submitted = 1 WHERE id = ?`,
      [existing.booking_id]
    );
    
    // 🌡️ TRIGGER HVAC WEBHOOK if temperature preference is set
    if (data.room_temperature) {
      const targetTemp = TEMPERATURE_MAP[data.room_temperature] || 21;
      
      const hvacPayload = {
        action: 'set_temperature',
        booking_id: existing.booking_id,
        room_id: existing.room_id,
        room_name: existing.room_name,
        room_unit_label: existing.room_unit_label,
        guest_name: existing.guest_name,
        check_in: existing.check_in,
        // HVAC specific
        hvac: {
          target_temperature: targetTemp,
          floor_heating: data.floor_heating ? true : false,
          mode: 'scheduled', // Will be activated on check-in day
          schedule_for: existing.check_in,
          arrival_time: data.estimated_arrival_time || '15:00'
        },
        // Guest preferences summary
        preferences: {
          temperature_preference: data.room_temperature,
          floor_heating_requested: data.floor_heating ? true : false,
          estimated_arrival: data.estimated_arrival_time
        }
      };
      
      console.log(`🌡️ Guest ${existing.guest_name} requested ${data.room_temperature} (${targetTemp}°C), floor heating: ${data.floor_heating ? 'yes' : 'no'}`);
      
      // Trigger webhook for HVAC systems
      triggerWebhooks(WEBHOOK_EVENTS.ROOM_OCCUPIED, hvacPayload)
        .then(result => {
          if (result.triggered > 0) {
            console.log(`✅ HVAC webhook triggered for booking #${existing.booking_id}`);
          }
        })
        .catch(err => console.error('HVAC webhook error:', err));
    }
    
    // Log special occasions for staff attention
    if (data.is_special_occasion) {
      console.log(`🎉 Special occasion for booking #${existing.booking_id}: ${data.occasion_type} - ${data.occasion_details || 'No details'}`);
    }
    
    res.json({ 
      success: true, 
      message: 'Preferences saved successfully',
      temperature_set: data.room_temperature ? TEMPERATURE_MAP[data.room_temperature] : null
    });
  } catch (error) {
    console.error('Error saving preferences:', error);
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

/**
 * Get preferences for a booking (admin)
 */
router.get('/booking/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const preferences = await dbGet(`
      SELECT * FROM guest_preferences WHERE booking_id = ?
    `, [bookingId]);
    
    if (!preferences) {
      return res.status(404).json({ error: 'No preferences found for this booking' });
    }
    
    res.json(preferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

/**
 * Get all bookings with pending preferences (admin)
 */
router.get('/pending', async (req, res) => {
  try {
    const pending = await dbAll(`
      SELECT b.id, b.guest_name, b.check_in, b.check_out, b.preferences_token,
             r.name as room_name, gp.submitted_at
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
      LEFT JOIN guest_preferences gp ON gp.booking_id = b.id
      WHERE b.check_in > date('now')
        AND b.status IN ('pending', 'confirmed')
        AND (gp.submitted_at IS NULL OR gp.id IS NULL)
      ORDER BY b.check_in ASC
    `);
    
    res.json(pending);
  } catch (error) {
    console.error('Error fetching pending preferences:', error);
    res.status(500).json({ error: 'Failed to fetch pending preferences' });
  }
});

/**
 * Resend preferences request (admin)
 */
router.post('/resend/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await dbGet(`
      SELECT b.*, r.name as room_name, ru.label as room_unit_label, gp.access_token
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
      LEFT JOIN room_units ru ON ru.id = b.room_unit_id
      LEFT JOIN guest_preferences gp ON gp.booking_id = b.id
      WHERE b.id = ?
    `, [bookingId]);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Create preferences entry if it doesn't exist
    let token = booking.access_token;
    if (!token) {
      token = await createPreferencesForBooking(bookingId);
    }
    
    const preferencesUrl = `${process.env.FRONTEND_URL || 'http://localhost:5175'}/preferences/${token}`;
    
    // Send email and/or SMS
    const notifications = { email: null, sms: null };
    
    // Send Email
    if (booking.guest_email && process.env.SENDGRID_API_KEY) {
      try {
        const sgMail = (await import('@sendgrid/mail')).default;
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
        const formatDate = (d) => new Date(d).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });
        
        const experienceGuideUrl = `${process.env.FRONTEND_URL || 'http://localhost:5175'}/oplevelser`;
        
        await sgMail.send({
          to: booking.guest_email,
          from: process.env.SENDGRID_FROM_EMAIL || 'booking@xn--liv-zna.com',
          subject: 'Gør dit ophold hos ØLIV personligt 🌿',
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1f1f; max-width: 600px; margin: 0 auto;">
              <h2>Hej ${booking.guest_name}</h2>
              <p>Vi glæder os til at byde dig velkommen på <strong>${booking.room_name}${booking.room_unit_label ? ` (${booking.room_unit_label})` : ''}</strong> den <strong>${formatDate(booking.check_in)}</strong>!</p>
              
              <p>For at gøre dit ophold så behageligt som muligt, vil vi gerne høre lidt om dine præferencer.</p>
              
              <p style="text-align:center;margin:32px 0;">
                <a href="${preferencesUrl}" style="background:#4a5d23;color:white;padding:16px 32px;border-radius:30px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">✨ Fortæl os om dine ønsker</a>
              </p>
              
              <div style="background:#f7f4ef;border-radius:12px;padding:20px;margin:24px 0;">
                <p style="margin:0 0 12px 0;font-weight:bold;color:#4a5d23;">Du kan bl.a. vælge:</p>
                <ul style="margin:0;padding-left:20px;color:#555;">
                  <li>🌡️ Din foretrukne temperatur (vi tænder varmen inden ankomst!)</li>
                  <li>🛏️ Ekstra puder eller tæpper</li>
                  <li>🍽️ Diætønsker til morgenmad</li>
                  <li>🎉 Særlige anledninger (fødselsdag, jubilæum...)</li>
                </ul>
              </div>
              
              <div style="background:linear-gradient(135deg, #2d5041 0%, #3d6b57 100%);border-radius:16px;padding:24px;margin:24px 0;text-align:center;">
                <p style="margin:0;font-size:24px;">✨</p>
                <p style="margin:12px 0 8px 0;font-size:18px;color:white;font-weight:bold;">Udforsk området</p>
                <p style="margin:0 0 16px 0;font-size:14px;color:rgba(255,255,255,0.9);">
                  Opdager de bedste oplevelser, restauranter og aktiviteter i nærheden
                </p>
                <a href="${experienceGuideUrl}" style="display:inline-block;background:white;color:#2d5041;padding:12px 28px;border-radius:30px;text-decoration:none;font-weight:bold;font-size:14px;">Se oplevelsesguide →</a>
              </div>
              
              <p>Det tager kun 2 minutter, og hjælper os med at gøre dit ophold helt perfekt! ✨</p>
              
              <p style="margin-top:24px;">Varme hilsner<br/>ØLIV Teamet</p>
            </div>
          `
        });
        notifications.email = { sent: true };
        console.log(`✅ Preferences email sent to ${booking.guest_email}`);
      } catch (emailErr) {
        console.error('Email error:', emailErr);
        notifications.email = { sent: false, error: emailErr.message };
      }
    }
    
    // Send SMS
    if (booking.guest_phone && process.env.TWILIO_ACCOUNT_SID) {
      try {
        const twilio = (await import('twilio')).default;
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        
        const formatDate = (d) => new Date(d).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' });
        
        await client.messages.create({
          body: `Hej ${booking.guest_name}! 🌿 Vi glæder os til at se dig ${formatDate(booking.check_in)}. Fortæl os om dine ønsker til opholdet: ${preferencesUrl} /ØLIV`,
          from: process.env.TWILIO_FROM_NUMBER,
          to: booking.guest_phone
        });
        notifications.sms = { sent: true };
        console.log(`✅ Preferences SMS sent to ${booking.guest_phone}`);
      } catch (smsErr) {
        console.error('SMS error:', smsErr);
        notifications.sms = { sent: false, error: smsErr.message };
      }
    }
    
    res.json({ 
      success: true, 
      preferences_url: preferencesUrl,
      token,
      notifications
    });
  } catch (error) {
    console.error('Error resending preferences request:', error);
    res.status(500).json({ error: 'Failed to resend preferences request' });
  }
});

export default router;

