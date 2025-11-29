CREATE TABLE IF NOT EXISTS guests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  city TEXT,
  country TEXT,
  marketing_opt_in INTEGER DEFAULT 1,
  total_stays INTEGER DEFAULT 0,
  total_nights INTEGER DEFAULT 0,
  lifetime_value REAL DEFAULT 0,
  last_check_out DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS trg_guests_updated_at
AFTER UPDATE ON guests
FOR EACH ROW
BEGIN
  UPDATE guests
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.id;
END;

CREATE TABLE IF NOT EXISTS guest_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guest_id INTEGER NOT NULL,
  tag TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(guest_id, tag),
  FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_guest_tags_guest ON guest_tags(guest_id);

CREATE TABLE IF NOT EXISTS guest_interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guest_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  subject TEXT,
  message TEXT,
  status TEXT DEFAULT 'open',
  follow_up_date DATE,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_guest_interactions_guest ON guest_interactions(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_interactions_followup ON guest_interactions(follow_up_date);

CREATE TABLE IF NOT EXISTS crm_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  trigger TEXT DEFAULT 'manual',
  channel TEXT DEFAULT 'email',
  template_subject TEXT,
  template_body TEXT,
  delay_days INTEGER DEFAULT 0,
  target_filter TEXT,
  active INTEGER DEFAULT 1,
  last_run_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS trg_crm_campaigns_updated
AFTER UPDATE ON crm_campaigns
FOR EACH ROW
BEGIN
  UPDATE crm_campaigns
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.id;
END;

CREATE TABLE IF NOT EXISTS crm_sends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER,
  guest_id INTEGER,
  send_channel TEXT NOT NULL,
  status TEXT DEFAULT 'queued',
  error TEXT,
  payload TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME,
  FOREIGN KEY (campaign_id) REFERENCES crm_campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_crm_sends_campaign ON crm_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_crm_sends_guest ON crm_sends(guest_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_sends_unique ON crm_sends(campaign_id, guest_id);

ALTER TABLE bookings ADD COLUMN guest_id INTEGER REFERENCES guests(id);


