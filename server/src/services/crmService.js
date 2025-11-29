import { formatISO, isBefore, subDays, addDays, differenceInCalendarDays } from 'date-fns';
import { dbAll, dbGet, dbRun } from '../database/db.js';
import { syncGuestsFromBookings } from './guestService.js';
import { sendCrmMessage, sendCheckInReminderSms } from './notificationService.js';
import { runFeedbackRequests, getGuestFeedback } from './feedbackService.js';
import { getLockCodesForBooking } from './ttlockService.js';

const mapGuestRow = (row) => ({
  id: row.id,
  first_name: row.first_name,
  last_name: row.last_name,
  email: row.email,
  phone: row.phone,
  city: row.city,
  country: row.country,
  marketing_opt_in: row.marketing_opt_in,
  total_stays: row.total_stays,
  total_nights: row.total_nights,
  lifetime_value: row.lifetime_value,
  last_check_out: row.last_check_out,
  next_follow_up: row.next_follow_up,
  open_tasks: row.open_tasks,
  upcoming_check_in: row.upcoming_check_in,
  upcoming_check_out: row.upcoming_check_out,
  upcoming_room: row.upcoming_room,
});

export const listGuests = async ({ search = '', tag, limit = 50, upcoming = false }) => {
  const params = [];
  let query = `
    SELECT
      g.*,
      COALESCE(open_tasks.next_follow_up, '') AS next_follow_up,
      COALESCE(open_tasks.open_tasks, 0) AS open_tasks,
      upcoming.next_check_in AS upcoming_check_in,
      upcoming.next_check_out AS upcoming_check_out,
      upcoming.room_id AS upcoming_room
    FROM guests g
    LEFT JOIN (
      SELECT guest_id, MIN(follow_up_date) AS next_follow_up, COUNT(*) AS open_tasks
      FROM guest_interactions
      WHERE status = 'open'
      GROUP BY guest_id
    ) open_tasks ON open_tasks.guest_id = g.id
    LEFT JOIN (
      SELECT nb.guest_id,
             nb.check_in AS next_check_in,
             nb.check_out AS next_check_out,
             nb.room_id AS room_id
      FROM bookings nb
      JOIN (
        SELECT guest_id, MIN(check_in) AS next_check_in
        FROM bookings
        WHERE check_in >= DATE('now')
          AND status NOT IN ('cancelled')
        GROUP BY guest_id
      ) next ON next.guest_id = nb.guest_id AND next.next_check_in = nb.check_in
      WHERE nb.status NOT IN ('cancelled')
    ) upcoming ON upcoming.guest_id = g.id
    WHERE 1=1
  `;

  if (search) {
    query += ` AND (g.email LIKE ? OR g.first_name LIKE ? OR g.last_name LIKE ? OR g.phone LIKE ?)`;
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }

  if (tag) {
    query += `
      AND EXISTS (
        SELECT 1 FROM guest_tags gt
        WHERE gt.guest_id = g.id AND gt.tag = ?
      )
    `;
    params.push(tag);
  }

  if (upcoming) {
    query += ' AND upcoming.next_check_in IS NOT NULL';
  }

  query += `
    ORDER BY
      ${upcoming ? 'upcoming.next_check_in ASC,' : ''}
      g.last_check_out DESC NULLS LAST,
      g.updated_at DESC
    LIMIT ?
  `;
  params.push(limit);

  const rows = await dbAll(query, params);
  return rows.map(mapGuestRow);
};

export const getGuestDetail = async (guestId) => {
  const guest = await dbGet(`
    SELECT g.*,
      upcoming.next_check_in AS upcoming_check_in,
      upcoming.next_check_out AS upcoming_check_out,
      upcoming.room_id AS upcoming_room
    FROM guests g
    LEFT JOIN (
      SELECT nb.guest_id,
             nb.check_in AS next_check_in,
             nb.check_out AS next_check_out,
             nb.room_id AS room_id
      FROM bookings nb
      JOIN (
        SELECT guest_id, MIN(check_in) AS next_check_in
        FROM bookings
        WHERE check_in >= DATE('now')
          AND status NOT IN ('cancelled')
        GROUP BY guest_id
      ) next ON next.guest_id = nb.guest_id AND next.next_check_in = nb.check_in
      WHERE nb.status NOT IN ('cancelled')
    ) upcoming ON upcoming.guest_id = g.id
    WHERE g.id = ?
  `, [guestId]);
  if (!guest) return null;

  const tags = await dbAll('SELECT tag FROM guest_tags WHERE guest_id = ?', [guestId]);
  const interactions = await dbAll(
    `
      SELECT *
      FROM guest_interactions
      WHERE guest_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `,
    [guestId]
  );

  const bookings = await dbAll(
    `
      SELECT id, room_id, check_in, check_out, total_price, status
      FROM bookings
      WHERE guest_id = ?
      ORDER BY check_in DESC
      LIMIT 20
    `,
    [guestId]
  );

  return {
    ...guest,
    tags: tags.map((t) => t.tag),
    interactions,
    bookings,
    feedback: await getGuestFeedback(guestId, 10),
  };
};

export const addGuestTag = async (guestId, tag) => {
  await dbRun(
    `
      INSERT OR IGNORE INTO guest_tags (guest_id, tag)
      VALUES (?, ?)
    `,
    [guestId, tag]
  );
};

export const removeGuestTag = async (guestId, tag) => {
  await dbRun('DELETE FROM guest_tags WHERE guest_id = ? AND tag = ?', [guestId, tag]);
};

export const addInteraction = async (guestId, interaction) => {
  const result = await dbRun(
    `
      INSERT INTO guest_interactions (guest_id, type, subject, message, status, follow_up_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      guestId,
      interaction.type || 'note',
      interaction.subject || null,
      interaction.message || null,
      interaction.status || 'open',
      interaction.follow_up_date || null,
      interaction.created_by || 'admin'
    ]
  );

  if (interaction.type === 'followup') {
    await addGuestTag(guestId, 'followup');
  }

  return {
    id: result.lastID,
    ...interaction,
  };
};

export const updateInteraction = async (id, updates) => {
  const allowed = ['status', 'follow_up_date', 'message'];
  const sets = [];
  const params = [];
  allowed.forEach((field) => {
    if (updates[field] !== undefined) {
      sets.push(`${field} = ?`);
      params.push(updates[field]);
    }
  });

  if (!sets.length) {
    return;
  }

  params.push(id);
  await dbRun(`UPDATE guest_interactions SET ${sets.join(', ')} WHERE id = ?`, params);
};

export const listCampaigns = async () => {
  return dbAll('SELECT * FROM crm_campaigns ORDER BY created_at DESC');
};

export const createCampaign = async (campaign) => {
  const result = await dbRun(
    `
      INSERT INTO crm_campaigns
      (name, trigger, channel, template_subject, template_body, delay_days, target_filter, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      campaign.name,
      campaign.trigger || 'manual',
      campaign.channel || 'email',
      campaign.template_subject || '',
      campaign.template_body || '',
      campaign.delay_days || 0,
      campaign.target_filter ? JSON.stringify(campaign.target_filter) : null,
      campaign.active ? 1 : 0
    ]
  );

  return dbGet('SELECT * FROM crm_campaigns WHERE id = ?', [result.lastID]);
};

export const updateCampaign = async (id, updates) => {
  const allowed = ['name', 'trigger', 'channel', 'template_subject', 'template_body', 'delay_days', 'target_filter', 'active'];
  const sets = [];
  const params = [];
  allowed.forEach((field) => {
    if (updates[field] !== undefined) {
      sets.push(`${field} = ?`);
      params.push(field === 'target_filter' ? JSON.stringify(updates[field]) : updates[field]);
    }
  });

  if (!sets.length) {
    return dbGet('SELECT * FROM crm_campaigns WHERE id = ?', [id]);
  }

  params.push(id);
  await dbRun(`UPDATE crm_campaigns SET ${sets.join(', ')} WHERE id = ?`, params);
  return dbGet('SELECT * FROM crm_campaigns WHERE id = ?', [id]);
};

const hasCampaignSend = async (campaignId, guestId) => {
  const row = await dbGet(
    `SELECT id FROM crm_sends WHERE campaign_id = ? AND guest_id = ?`,
    [campaignId, guestId]
  );
  return Boolean(row);
};

const recordSend = async ({ campaignId, guestId, channel, status, error, payload }) => {
  await dbRun(
    `
      INSERT INTO crm_sends (campaign_id, guest_id, send_channel, status, error, payload, sent_at)
      VALUES (?, ?, ?, ?, ?, ?, CASE WHEN ? = 'sent' THEN CURRENT_TIMESTAMP ELSE NULL END)
    `,
    [
      campaignId,
      guestId,
      channel,
      status,
      error || null,
      payload ? JSON.stringify(payload) : null,
      status
    ]
  );
};

const filterGuestsForCampaign = (guests, campaign, options = {}) => {
  if (!campaign || !guests.length) return [];
  const target = campaign.target_filter ? JSON.parse(campaign.target_filter || '{}') : {};

  return guests.filter((guest) => {
    if (guest.marketing_opt_in === 0) return false;
    if (target.min_stays && guest.total_stays < target.min_stays) return false;
    if (target.max_days_since && guest.last_check_out) {
      const cutoff = subDays(new Date(), target.max_days_since);
      if (isBefore(new Date(guest.last_check_out), cutoff)) return false;
    }
    if (options.onlyUpcoming && !guest.upcoming_check_in) return false;
    if (target.with_upcoming === true && !guest.upcoming_check_in) return false;
    if (target.tags && target.tags.length) {
      // require at least one matching tag
      const guestTags = guest.tags || [];
      if (!guestTags.some((t) => target.tags.includes(t))) return false;
    }
    return true;
  });
};

export const runCampaign = async (campaignId) => {
  const campaign = await dbGet('SELECT * FROM crm_campaigns WHERE id = ?', [campaignId]);
  if (!campaign) {
    throw new Error('Campaign not found');
  }

  const guests = await dbAll(`
    SELECT g.*,
      GROUP_CONCAT(gt.tag) AS tag_list,
      upcoming.next_check_in AS upcoming_check_in,
      upcoming.next_check_out AS upcoming_check_out,
      upcoming.room_id AS upcoming_room
    FROM guests g
    LEFT JOIN guest_tags gt ON gt.guest_id = g.id
    LEFT JOIN (
      SELECT nb.guest_id,
             nb.check_in AS next_check_in,
             nb.check_out AS next_check_out,
             nb.room_id AS room_id
      FROM bookings nb
      JOIN (
        SELECT guest_id, MIN(check_in) AS next_check_in
        FROM bookings
        WHERE check_in >= DATE('now')
          AND status NOT IN ('cancelled')
        GROUP BY guest_id
      ) next ON next.guest_id = nb.guest_id AND next.next_check_in = nb.check_in
      WHERE nb.status NOT IN ('cancelled')
    ) upcoming ON upcoming.guest_id = g.id
    GROUP BY g.id
  `);

  const enrichedGuests = guests.map((guest) => ({
    ...guest,
    tags: guest.tag_list ? guest.tag_list.split(',') : []
  }));

  const targetGuests = filterGuestsForCampaign(enrichedGuests, campaign);
  const results = [];

  for (const guest of targetGuests) {
    if (await hasCampaignSend(campaign.id, guest.id)) {
      continue;
    }

    const payload = {
      subject: campaign.template_subject || 'Tilbage hos ØLIV?',
      body: campaign.template_body || 'Vi savner dig hos ØLIV. Skal vi hjælpe med næste ophold?',
    };

    const messageResult = await sendCrmMessage({
      channel: campaign.channel || 'email',
      guest,
      subject: payload.subject,
      body: payload.body
    });

    await recordSend({
      campaignId: campaign.id,
      guestId: guest.id,
      channel: campaign.channel || 'email',
      status: messageResult.success ? 'sent' : 'failed',
      error: messageResult.error || null,
      payload
    });

    results.push({
      guest_id: guest.id,
      success: messageResult.success,
      error: messageResult.error || null
    });
  }

  await dbRun('UPDATE crm_campaigns SET last_run_at = CURRENT_TIMESTAMP WHERE id = ?', [campaign.id]);
  return { campaign: campaign.id, sent: results.length, results };
};

export const runAutomations = async () => {
  await syncGuestsFromBookings();

  const campaigns = await dbAll(`
    SELECT * FROM crm_campaigns
    WHERE active = 1 AND trigger != 'manual'
  `);

  const now = new Date();

  for (const campaign of campaigns) {
    if (campaign.trigger === 'after_checkout') {
      const delay = campaign.delay_days || 7;
      const windowStart = subDays(now, delay + 7);
      const windowEnd = subDays(now, delay);

      const guests = await dbAll(
        `
          SELECT g.*, GROUP_CONCAT(gt.tag) AS tag_list
          FROM guests g
          LEFT JOIN guest_tags gt ON gt.guest_id = g.id
          WHERE g.last_check_out BETWEEN ? AND ?
            AND g.marketing_opt_in = 1
          GROUP BY g.id
        `,
        [formatISO(windowStart, { representation: 'date' }), formatISO(windowEnd, { representation: 'date' })]
      );

      const enrichedGuests = guests.map((guest) => ({
        ...guest,
        tags: guest.tag_list ? guest.tag_list.split(',') : []
      }));

      const filtered = filterGuestsForCampaign(enrichedGuests, campaign);
      for (const guest of filtered) {
        if (await hasCampaignSend(campaign.id, guest.id)) continue;

        const payload = {
          subject: campaign.template_subject || 'Tak for besøget hos ØLIV',
          body: campaign.template_body || 'Skal vi reservere næste ophold for dig? Vi har friske datoer klar.'
        };

        const result = await sendCrmMessage({
          channel: campaign.channel || 'email',
          guest,
          subject: payload.subject,
          body: payload.body
        });

        await recordSend({
          campaignId: campaign.id,
          guestId: guest.id,
          channel: campaign.channel || 'email',
          status: result.success ? 'sent' : 'failed',
          error: result.error || null,
          payload
        });
      }
    } else if (campaign.trigger === 'before_checkin') {
      const leadDays = campaign.delay_days || 3;
      const targetDate = addDays(now, leadDays);

      const guests = await dbAll(
        `
          SELECT g.*, GROUP_CONCAT(gt.tag) AS tag_list,
                 b.check_in AS upcoming_check_in,
                 b.check_out AS upcoming_check_out,
                 b.room_id AS upcoming_room,
                 b.id AS upcoming_booking_id
          FROM bookings b
          JOIN guests g ON g.id = b.guest_id
          LEFT JOIN guest_tags gt ON gt.guest_id = g.id
          WHERE b.check_in = DATE(?)
            AND b.status NOT IN ('cancelled')
            AND g.marketing_opt_in = 1
        `,
        [formatISO(targetDate, { representation: 'date' })]
      );

      const enrichedGuests = guests.map((guest) => ({
        ...guest,
        tags: guest.tag_list ? guest.tag_list.split(',') : [],
      }));

      const filtered = filterGuestsForCampaign(enrichedGuests, campaign, { onlyUpcoming: true });
      for (const guest of filtered) {
        if (await hasCampaignSend(campaign.id, guest.id)) continue;

        const payload = {
          subject: campaign.template_subject || 'Vi glæder os til dit ophold',
          body: campaign.template_body || `Vi glæder os til at byde dig velkommen ${guest.upcoming_check_in}. Har du særlige ønsker kan du svare direkte på denne mail.`
        };

        const result = await sendCrmMessage({
          channel: campaign.channel || 'email',
          guest,
          subject: payload.subject,
          body: payload.body
        });

        await recordSend({
          campaignId: campaign.id,
          guestId: guest.id,
          channel: campaign.channel || 'email',
          status: result.success ? 'sent' : 'failed',
          error: result.error || null,
          payload
        });
      }
    }
  }

  await runFeedbackRequests();

  // Run day-before check-in reminders
  await runCheckInReminders();
};

// Send reminder SMS to guests checking in tomorrow
const runCheckInReminders = async () => {
  const tomorrow = addDays(new Date(), 1);
  const tomorrowStr = formatISO(tomorrow, { representation: 'date' });

  // Find bookings with check-in tomorrow that haven't received a reminder
  const bookings = await dbAll(
    `
      SELECT 
        b.id, b.guest_id, b.room_id, b.check_in, b.check_out, b.guests, b.guest_name, b.guest_phone,
        r.name AS room_name,
        ru.label AS room_unit_label
      FROM bookings b
      LEFT JOIN rooms r ON r.id = b.room_id
      LEFT JOIN room_units ru ON ru.id = b.room_unit_id
      LEFT JOIN guests g ON g.id = b.guest_id
      WHERE DATE(b.check_in) = DATE(?)
        AND b.status NOT IN ('cancelled')
        AND b.checkin_reminder_sent IS NULL
        AND b.guest_phone IS NOT NULL
    `,
    [tomorrowStr]
  );

  console.log(`📅 Found ${bookings.length} bookings for check-in reminder (tomorrow: ${tomorrowStr})`);

  for (const booking of bookings) {
    // Get lock code if available
    const lockCode = await getLockCodesForBooking(booking.id);

    const result = await sendCheckInReminderSms({
      ...booking,
      lockCode: lockCode?.passcode || null
    });

    if (result.sent) {
      await dbRun(
        'UPDATE bookings SET checkin_reminder_sent = CURRENT_TIMESTAMP WHERE id = ?',
        [booking.id]
      );
      console.log(`✅ Check-in reminder sent to ${booking.guest_name} (${booking.guest_phone})`);
    } else if (result.error) {
      console.error(`❌ Failed to send check-in reminder for booking ${booking.id}: ${result.error}`);
    }
  }
};

export const startCrmScheduler = (intervalMinutes = 60) => {
  console.log(`🤝 CRM automations running every ${intervalMinutes} minutes`);
  setInterval(runAutomations, intervalMinutes * 60 * 1000);
};


