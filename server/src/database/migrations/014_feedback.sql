CREATE TABLE IF NOT EXISTS feedback_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  guest_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending',
  email_status TEXT DEFAULT 'pending',
  email_error TEXT,
  email_sent_at DATETIME,
  sms_status TEXT DEFAULT 'pending',
  sms_error TEXT,
  sms_sent_at DATETIME,
  opened_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_feedback_requests_booking ON feedback_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_guest ON feedback_requests(guest_id);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_status ON feedback_requests(status);

CREATE TABLE IF NOT EXISTS guest_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL UNIQUE,
  booking_id INTEGER NOT NULL,
  guest_id INTEGER NOT NULL,
  rating INTEGER,
  positive_note TEXT,
  improvement_note TEXT,
  highlight_tags TEXT,
  contact_ok INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES feedback_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_guest_feedback_guest ON guest_feedback(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_feedback_booking ON guest_feedback(booking_id);









