-- Competitor prices table
CREATE TABLE IF NOT EXISTS competitor_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  url TEXT,
  price INTEGER,
  availability TEXT DEFAULT 'available',
  room_type TEXT,
  scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_competitor_prices_scraped ON competitor_prices(scraped_at);
CREATE INDEX IF NOT EXISTS idx_competitor_prices_source ON competitor_prices(source);

-- Competitor configuration table
CREATE TABLE IF NOT EXISTS competitor_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  url TEXT NOT NULL,
  room_mapping TEXT, -- JSON mapping of their room types to our rooms
  scraping_interval INTEGER DEFAULT 360, -- minutes
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Dynamic pricing table (per room, per date)
CREATE TABLE IF NOT EXISTS dynamic_pricing (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL,
  date DATE NOT NULL,
  price INTEGER NOT NULL,
  source TEXT DEFAULT 'manual', -- 'manual', 'ai_recommendation', 'seasonal_rule'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(room_id, date),
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);

CREATE INDEX IF NOT EXISTS idx_dynamic_pricing_room_date ON dynamic_pricing(room_id, date);

-- Price changes log
CREATE TABLE IF NOT EXISTS price_changes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL,
  target_date DATE,
  old_price INTEGER,
  new_price INTEGER NOT NULL,
  reason TEXT,
  applied_by TEXT DEFAULT 'system',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);

CREATE INDEX IF NOT EXISTS idx_price_changes_room ON price_changes(room_id);
CREATE INDEX IF NOT EXISTS idx_price_changes_date ON price_changes(target_date);

-- Pricing settings table
CREATE TABLE IF NOT EXISTS pricing_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  auto_apply_enabled INTEGER DEFAULT 0,
  min_price_percentage INTEGER DEFAULT 80, -- Minimum price as % of base price
  max_price_percentage INTEGER DEFAULT 150, -- Maximum price as % of base price
  notification_email TEXT,
  scraping_schedule TEXT DEFAULT '0 */6 * * *', -- Cron format
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CHECK (id = 1) -- Ensure only one settings row
);

-- Insert default settings
INSERT OR IGNORE INTO pricing_settings (id) VALUES (1);

-- Price recommendations log (for analytics)
CREATE TABLE IF NOT EXISTS price_recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL,
  target_date DATE NOT NULL,
  current_price INTEGER NOT NULL,
  recommended_price INTEGER NOT NULL,
  confidence REAL,
  reason TEXT,
  factors TEXT, -- JSON with all pricing factors
  potential_revenue_increase INTEGER,
  applied INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);

CREATE INDEX IF NOT EXISTS idx_price_recommendations_room_date ON price_recommendations(room_id, target_date);
CREATE INDEX IF NOT EXISTS idx_price_recommendations_applied ON price_recommendations(applied);

