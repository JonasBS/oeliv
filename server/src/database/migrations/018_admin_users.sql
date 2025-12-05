-- Admin users table for authentication
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'admin',
  active INTEGER DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Admin sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- Default admin user (password: oeliv2024)
-- Change password after first login!
INSERT OR IGNORE INTO admin_users (username, password_hash, name, role, active)
VALUES (
  'admin',
  '8f549394a51e8d0eb6edbba3c3a9a428:72e88c944880bab46ef22f5273e2f0b00f42db785cf237de0422e34215189039f9a919d83063c8702236af5a5f2f31e85738dbba4efb000d742a76b68287916f',
  'Administrator',
  'admin',
  1
);

