-- Channel configuration table for OTA integrations
CREATE TABLE IF NOT EXISTS channel_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  enabled INTEGER DEFAULT 0,
  auto_status TEXT DEFAULT 'open',
  auto_reason TEXT,
  username TEXT,
  password TEXT,
  api_key TEXT,
  api_secret TEXT,
  account_id TEXT,
  property_id TEXT,
  commission_rate REAL,
  markup_percentage REAL,
  priority INTEGER DEFAULT 0,
  notes TEXT,
  settings TEXT,
  last_synced DATETIME,
  last_error TEXT,
  last_auto_update DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO channel_configs (channel, display_name, enabled, priority)
VALUES 
  ('booking_com', 'Booking.com', 0, 90),
  ('airbnb', 'Airbnb', 0, 80),
  ('expedia', 'Expedia', 0, 70);


