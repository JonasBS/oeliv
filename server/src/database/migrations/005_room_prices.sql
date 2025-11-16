-- Room Prices Table: Date-specific pricing
CREATE TABLE IF NOT EXISTS room_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL,
  price_date DATE NOT NULL,
  price INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  UNIQUE(room_id, price_date)
);

-- Index for fast date lookups
CREATE INDEX IF NOT EXISTS idx_room_prices_date ON room_prices(price_date);
CREATE INDEX IF NOT EXISTS idx_room_prices_room_date ON room_prices(room_id, price_date);

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_room_prices_timestamp 
AFTER UPDATE ON room_prices
FOR EACH ROW
BEGIN
  UPDATE room_prices SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

