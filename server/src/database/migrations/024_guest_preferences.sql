-- Guest preferences table
CREATE TABLE IF NOT EXISTS guest_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  
  -- Access token for the form (so guests can access without login)
  access_token TEXT NOT NULL UNIQUE,
  
  -- Room & Comfort
  extra_pillows INTEGER DEFAULT 0,
  extra_blankets INTEGER DEFAULT 0,
  pillow_type TEXT, -- 'soft', 'firm', 'down', 'synthetic'
  room_temperature TEXT, -- 'cool', 'normal', 'warm'
  floor_heating INTEGER DEFAULT 0,
  blackout_curtains INTEGER DEFAULT 0,
  
  -- Allergies
  has_allergies INTEGER DEFAULT 0,
  allergies_details TEXT,
  
  -- Dietary
  has_dietary_requirements INTEGER DEFAULT 0,
  dietary_requirements TEXT, -- comma-separated: 'vegetarian', 'vegan', 'gluten-free', 'lactose-free', etc.
  dietary_details TEXT,
  
  -- Breakfast
  breakfast_in_room INTEGER DEFAULT 0,
  breakfast_time TEXT, -- preferred time
  
  -- Special occasions
  is_special_occasion INTEGER DEFAULT 0,
  occasion_type TEXT, -- 'birthday', 'anniversary', 'honeymoon', 'proposal', 'other'
  occasion_details TEXT,
  
  -- Room extras
  wants_flowers INTEGER DEFAULT 0,
  wants_champagne INTEGER DEFAULT 0,
  wants_chocolate INTEGER DEFAULT 0,
  other_requests TEXT,
  
  -- Arrival
  estimated_arrival_time TEXT,
  needs_early_checkin INTEGER DEFAULT 0,
  needs_late_checkout INTEGER DEFAULT 0,
  needs_parking INTEGER DEFAULT 0,
  
  -- Communication
  preferred_contact TEXT DEFAULT 'email', -- 'email', 'sms', 'both'
  do_not_disturb_until TEXT, -- time like '09:00'
  
  -- Status
  submitted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Index for token lookup
CREATE INDEX IF NOT EXISTS idx_guest_preferences_token ON guest_preferences(access_token);
CREATE INDEX IF NOT EXISTS idx_guest_preferences_booking ON guest_preferences(booking_id);

-- Add preferences_token to bookings for easy access
ALTER TABLE bookings ADD COLUMN preferences_token TEXT;
ALTER TABLE bookings ADD COLUMN preferences_submitted INTEGER DEFAULT 0;

