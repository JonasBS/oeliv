-- TTLock integration prep: add lock mapping and booking lock codes

ALTER TABLE rooms ADD COLUMN ttlock_lock_id TEXT;

CREATE TABLE IF NOT EXISTS booking_lock_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  room_id INTEGER NOT NULL,
  lock_id TEXT NOT NULL,
  passcode TEXT,
  remote_code_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending_provision',
  valid_from INTEGER,
  valid_to INTEGER,
  last_error TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lock_codes_booking ON booking_lock_codes(booking_id);
CREATE INDEX IF NOT EXISTS idx_lock_codes_room ON booking_lock_codes(room_id);

