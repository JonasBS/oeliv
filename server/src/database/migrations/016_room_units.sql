CREATE TABLE IF NOT EXISTS room_units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL,
  label TEXT NOT NULL,
  ttlock_lock_id TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

ALTER TABLE bookings ADD COLUMN room_unit_id INTEGER REFERENCES room_units(id);

CREATE INDEX IF NOT EXISTS idx_room_units_room ON room_units(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_unit ON bookings(room_unit_id);

