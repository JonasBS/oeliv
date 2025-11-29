import crypto from 'crypto';
import { formatISO, subDays, differenceInCalendarDays } from 'date-fns';
import { dbAll, dbGet, dbRun } from '../database/db.js';
import { sendCrmMessage } from './notificationService.js';

const FEEDBACK_BASE_URL = process.env.FEEDBACK_FORM_BASE_URL || 'http://localhost:5173/feedback';
const FEEDBACK_DELAY_DAYS = Number(process.env.FEEDBACK_DELAY_DAYS || 1);

const buildFeedbackLink = (token) => {
  if (!token) return '#';
  const base = FEEDBACK_BASE_URL.replace(/\/$/, '');
  if (base.includes('{token}')) {
    return base.replace('{token}', token);
  }
  return `${base}/${token}`;
};

const generateToken = () => crypto.randomBytes(24).toString('hex');

const mapFeedbackRow = (row) => ({
  id: row.id,
  booking_id: row.booking_id,
  guest_id: row.guest_id,
  rating: row.rating,
  positive_note: row.positive_note,
  improvement_note: row.improvement_note,
  highlight_tags: row.highlight_tags ? JSON.parse(row.highlight_tags) : [],
  contact_ok: row.contact_ok === 1,
  created_at: row.created_at,
  request_created_at: row.request_created_at,
  check_in: row.check_in,
  check_out: row.check_out,
  room_name: row.room_name,
  guest_name: row.guest_name,
});

export const runFeedbackRequests = async () => {
  const targetDate = subDays(new Date(), FEEDBACK_DELAY_DAYS);
  const targetDateStr = formatISO(targetDate, { representation: 'date' });

  const bookings = await dbAll(
    `
      SELECT b.*, g.first_name, g.last_name, g.email, g.phone, r.name AS room_name
      FROM bookings b
      JOIN guests g ON g.id = b.guest_id
      LEFT JOIN rooms r ON r.id = b.room_id
      LEFT JOIN feedback_requests fr ON fr.booking_id = b.id
      WHERE DATE(b.check_out) = DATE(?)
        AND b.status NOT IN ('cancelled')
        AND g.marketing_opt_in = 1
        AND fr.id IS NULL
    `,
    [targetDateStr]
  );

  if (!bookings.length) {
    return { created: 0 };
  }

  let created = 0;
  for (const booking of bookings) {
    const token = generateToken();
    const { lastID } = await dbRun(
      `
        INSERT INTO feedback_requests
        (booking_id, guest_id, token)
        VALUES (?, ?, ?)
      `,
      [booking.id, booking.guest_id, token]
    );

    const link = buildFeedbackLink(token);
    const guestName = booking.first_name || booking.last_name || booking.guest_name || 'gæst';
    const nights = differenceInCalendarDays(new Date(booking.check_out), new Date(booking.check_in));
    const emailSubject = 'Tak for besøget hos ØLIV – må vi høre din feedback?';
    const emailBody = `
      <p>Vi håber dit ophold gav ro i kroppen og gode minder. Fortæl os gerne hvordan det gik, så vi kan gøre dit næste besøg endnu bedre.</p>
      <p style="margin:24px 0;">
        <a href="${link}" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;border-radius:999px;text-decoration:none;">Del din feedback</a>
      </p>
      <p>Det tager under ét minut og betyder meget for os.</p>
    `;
    const smsBody = `Tak for dit ophold hos ØLIV, ${guestName}! Del gerne din feedback (60 sek): ${link}`;

    let emailStatus = 'skipped';
    let smsStatus = 'skipped';
    let emailError = null;
    let smsError = null;
    let emailSentAt = null;
    let smsSentAt = null;

    if (booking.email) {
      const result = await sendCrmMessage({
        channel: 'email',
        guest: { email: booking.email, first_name: booking.first_name, last_name: booking.last_name },
        subject: emailSubject,
        body: emailBody,
      });
      emailStatus = result.success ? 'sent' : 'failed';
      emailError = result.success ? null : result.error || 'unknown error';
      emailSentAt = result.success ? formatISO(new Date()) : null;
    } else {
      emailStatus = 'missing';
    }

    if (booking.phone) {
      const result = await sendCrmMessage({
        channel: 'sms',
        guest: { phone: booking.phone },
        body: smsBody,
      });
      smsStatus = result.success ? 'sent' : 'failed';
      smsError = result.success ? null : result.error || 'unknown error';
      smsSentAt = result.success ? formatISO(new Date()) : null;
    } else {
      smsStatus = 'missing';
    }

    const finalStatus =
      (emailStatus === 'sent' || smsStatus === 'sent') ? 'sent'
        : (emailStatus === 'failed' && smsStatus === 'failed') ? 'failed'
          : 'pending';

    await dbRun(
      `
        UPDATE feedback_requests
        SET status = ?,
            email_status = ?, email_error = ?, email_sent_at = COALESCE(?, email_sent_at),
            sms_status = ?, sms_error = ?, sms_sent_at = COALESCE(?, sms_sent_at)
        WHERE id = ?
      `,
      [finalStatus, emailStatus, emailError, emailSentAt, smsStatus, smsError, smsSentAt, lastID]
    );

    created += 1;
  }

  return { created };
};

export const getFeedbackFormData = async (token) => {
  const row = await dbGet(
    `
      SELECT fr.*, b.check_in, b.check_out, b.room_id, r.name AS room_name,
             g.first_name, g.last_name, b.guest_name
      FROM feedback_requests fr
      JOIN bookings b ON b.id = fr.booking_id
      JOIN guests g ON g.id = fr.guest_id
      LEFT JOIN rooms r ON r.id = b.room_id
      WHERE fr.token = ?
    `,
    [token]
  );

  if (!row) return null;

  if (!row.opened_at) {
    await dbRun('UPDATE feedback_requests SET opened_at = CURRENT_TIMESTAMP WHERE id = ?', [row.id]);
  }

  return {
    request_id: row.id,
    guest_name: row.first_name || row.last_name || row.guest_name || 'Gæst',
    check_in: row.check_in,
    check_out: row.check_out,
    room_name: row.room_name,
    nights: Math.max(1, differenceInCalendarDays(new Date(row.check_out), new Date(row.check_in))),
    status: row.status,
  };
};

export const submitFeedbackResponse = async (token, payload) => {
  const row = await dbGet(
    `
      SELECT fr.*, b.check_in, b.check_out
      FROM feedback_requests fr
      JOIN bookings b ON b.id = fr.booking_id
      WHERE fr.token = ?
    `,
    [token]
  );

  if (!row) {
    throw new Error('invalid_token');
  }

  if (row.completed_at) {
    throw new Error('already_submitted');
  }

  const rating = Math.max(1, Math.min(5, Number(payload.rating || 0)));
  const highlightTags = Array.isArray(payload.highlight_tags) ? payload.highlight_tags : [];

  await dbRun(
    `
      INSERT INTO guest_feedback
        (request_id, booking_id, guest_id, rating, positive_note, improvement_note, highlight_tags, contact_ok)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      row.id,
      row.booking_id,
      row.guest_id,
      rating,
      payload.positive_note || null,
      payload.improvement_note || null,
      highlightTags.length ? JSON.stringify(highlightTags) : null,
      payload.contact_ok ? 1 : 0,
    ]
  );

  await dbRun(
    `
      UPDATE feedback_requests
      SET status = 'completed',
          completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [row.id]
  );

  return { success: true };
};

export const getFeedbackStats = async () => {
  const [responses7d, pending, avgRating30d, sentTotal] = await Promise.all([
    dbGet(`SELECT COUNT(*) as count FROM guest_feedback WHERE created_at >= DATE('now', '-7 days')`),
    dbGet(`SELECT COUNT(*) as count FROM feedback_requests WHERE status IN ('sent', 'pending') AND completed_at IS NULL`),
    dbGet(`
      SELECT AVG(rating) as avg_rating
      FROM guest_feedback
      WHERE created_at >= DATE('now', '-30 days')
    `),
    dbGet(`SELECT COUNT(*) as count FROM feedback_requests WHERE status IN ('sent', 'completed')`),
  ]);
  const completed = await dbGet(`SELECT COUNT(*) as count FROM feedback_requests WHERE status = 'completed'`);

  const avgRatingValue = avgRating30d?.avg_rating ? Number(avgRating30d.avg_rating) : null;

  return {
    responses7d: responses7d?.count || 0,
    pendingRequests: pending?.count || 0,
    avgRating30d: avgRatingValue ? Math.round(avgRatingValue * 10) / 10 : null,
    completionRate: sentTotal?.count
      ? Math.round(((completed?.count || 0) / sentTotal.count) * 100)
      : 0,
  };
};

export const getRecentFeedback = async (limit = 10) => {
  const rows = await dbAll(
    `
      SELECT gf.*, fr.created_at AS request_created_at,
             b.check_in, b.check_out, r.name AS room_name,
             COALESCE(g.first_name || ' ' || g.last_name, g.email) AS guest_name
      FROM guest_feedback gf
      JOIN feedback_requests fr ON fr.id = gf.request_id
      JOIN bookings b ON b.id = gf.booking_id
      JOIN guests g ON g.id = gf.guest_id
      LEFT JOIN rooms r ON r.id = b.room_id
      ORDER BY gf.created_at DESC
      LIMIT ?
    `,
    [limit]
  );

  return rows.map(mapFeedbackRow);
};

export const getGuestFeedback = async (guestId, limit = 10) => {
  const rows = await dbAll(
    `
      SELECT gf.*, fr.created_at AS request_created_at,
             b.check_in, b.check_out, r.name AS room_name,
             COALESCE(g.first_name || ' ' || g.last_name, g.email) AS guest_name
      FROM guest_feedback gf
      JOIN feedback_requests fr ON fr.id = gf.request_id
      JOIN bookings b ON b.id = gf.booking_id
      JOIN guests g ON g.id = gf.guest_id
      LEFT JOIN rooms r ON r.id = b.room_id
      WHERE gf.guest_id = ?
      ORDER BY gf.created_at DESC
      LIMIT ?
    `,
    [guestId, limit]
  );

  return rows.map(mapFeedbackRow);
};

