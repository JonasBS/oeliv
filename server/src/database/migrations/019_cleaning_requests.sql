-- Migration: Add cleaning request tracking and check-in reminder field
-- This migration adds support for tracking guest cleaning requests and reminder SMS

-- Add check-in reminder tracking to bookings
ALTER TABLE bookings ADD COLUMN checkin_reminder_sent DATETIME;

-- Add cleaning request tracking to bookings
ALTER TABLE bookings ADD COLUMN cleaning_requested INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN cleaning_requested_at DATETIME;
ALTER TABLE bookings ADD COLUMN cleaning_notes TEXT;

-- Create cleaning_requests table for detailed tracking
CREATE TABLE IF NOT EXISTS cleaning_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  guest_id INTEGER,
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  request_channel TEXT DEFAULT 'sms', -- 'sms', 'email', 'phone', 'in_person'
  request_message TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'scheduled', 'completed', 'cancelled'
  scheduled_date DATE,
  completed_at DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE SET NULL
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_cleaning_requests_booking ON cleaning_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_requests_status ON cleaning_requests(status);


