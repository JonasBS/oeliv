-- Communication log table for tracking all messages sent to guests
CREATE TABLE IF NOT EXISTS communication_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  guest_id INTEGER,
  channel TEXT NOT NULL CHECK(channel IN ('email', 'sms')),
  message_type TEXT NOT NULL, -- 'booking_confirmation', 'check_in_reminder', 'lock_code', 'preferences_request', 'feedback_request', 'custom'
  recipient TEXT NOT NULL, -- email address or phone number
  subject TEXT, -- for emails
  content TEXT, -- message content or summary
  status TEXT DEFAULT 'sent' CHECK(status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  external_id TEXT, -- Twilio SID or SendGrid message ID
  error_message TEXT,
  metadata TEXT, -- JSON for additional data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  delivered_at DATETIME,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (guest_id) REFERENCES guests(id)
);

CREATE INDEX IF NOT EXISTS idx_comm_log_booking ON communication_log(booking_id);
CREATE INDEX IF NOT EXISTS idx_comm_log_guest ON communication_log(guest_id);
CREATE INDEX IF NOT EXISTS idx_comm_log_created ON communication_log(created_at);

