-- Automation rules for channel manager
CREATE TABLE IF NOT EXISTS channel_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT DEFAULT 'all',
  rule_type TEXT NOT NULL,
  threshold REAL,
  lead_time_days INTEGER,
  action TEXT NOT NULL,
  active INTEGER DEFAULT 1,
  description TEXT,
  settings TEXT,
  last_triggered DATETIME,
  last_result TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


