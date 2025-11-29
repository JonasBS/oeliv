import { dbRun, dbAll, dbGet } from '../database/db.js';

/**
 * Log a communication (email or SMS) sent to a guest
 */
export const logCommunication = async ({
  bookingId,
  guestId = null,
  channel, // 'email' or 'sms'
  messageType, // 'booking_confirmation', 'check_in_reminder', 'lock_code', 'preferences_request', 'feedback_request', 'custom'
  recipient,
  subject = null,
  content = null,
  status = 'sent',
  externalId = null,
  errorMessage = null,
  metadata = null
}) => {
  try {
    const result = await dbRun(`
      INSERT INTO communication_log 
      (booking_id, guest_id, channel, message_type, recipient, subject, content, status, external_id, error_message, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      bookingId,
      guestId,
      channel,
      messageType,
      recipient,
      subject,
      content,
      status,
      externalId,
      errorMessage,
      metadata ? JSON.stringify(metadata) : null
    ]);
    
    return result.lastID;
  } catch (error) {
    console.error('Error logging communication:', error);
    // Don't throw - logging should not break the main flow
    return null;
  }
};

/**
 * Update communication status (e.g., when delivery confirmation received)
 */
export const updateCommunicationStatus = async (id, status, deliveredAt = null) => {
  try {
    await dbRun(`
      UPDATE communication_log 
      SET status = ?, delivered_at = ?
      WHERE id = ?
    `, [status, deliveredAt, id]);
  } catch (error) {
    console.error('Error updating communication status:', error);
  }
};

/**
 * Get communication history for a booking
 */
export const getBookingCommunications = async (bookingId) => {
  try {
    return await dbAll(`
      SELECT * FROM communication_log 
      WHERE booking_id = ?
      ORDER BY created_at DESC
    `, [bookingId]);
  } catch (error) {
    console.error('Error fetching booking communications:', error);
    return [];
  }
};

/**
 * Get communication history for a guest
 */
export const getGuestCommunications = async (guestId) => {
  try {
    return await dbAll(`
      SELECT cl.*, b.check_in, b.check_out, r.name as room_name
      FROM communication_log cl
      LEFT JOIN bookings b ON b.id = cl.booking_id
      LEFT JOIN rooms r ON r.id = b.room_id
      WHERE cl.guest_id = ?
      ORDER BY cl.created_at DESC
    `, [guestId]);
  } catch (error) {
    console.error('Error fetching guest communications:', error);
    return [];
  }
};

/**
 * Get recent communications (for admin dashboard)
 */
export const getRecentCommunications = async (limit = 50) => {
  try {
    return await dbAll(`
      SELECT cl.*, b.guest_name, b.check_in, r.name as room_name
      FROM communication_log cl
      LEFT JOIN bookings b ON b.id = cl.booking_id
      LEFT JOIN rooms r ON r.id = b.room_id
      ORDER BY cl.created_at DESC
      LIMIT ?
    `, [limit]);
  } catch (error) {
    console.error('Error fetching recent communications:', error);
    return [];
  }
};

/**
 * Get communication stats
 */
export const getCommunicationStats = async (days = 30) => {
  try {
    const stats = await dbGet(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN channel = 'email' THEN 1 ELSE 0 END) as emails,
        SUM(CASE WHEN channel = 'sms' THEN 1 ELSE 0 END) as sms,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM communication_log
      WHERE created_at >= datetime('now', '-${days} days')
    `);
    return stats;
  } catch (error) {
    console.error('Error fetching communication stats:', error);
    return { total: 0, emails: 0, sms: 0, sent: 0, delivered: 0, failed: 0 };
  }
};

export default {
  logCommunication,
  updateCommunicationStatus,
  getBookingCommunications,
  getGuestCommunications,
  getRecentCommunications,
  getCommunicationStats
};

