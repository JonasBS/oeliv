-- Add channel-specific fields to rooms table

-- Booking.com fields
ALTER TABLE rooms ADD COLUMN booking_com_id TEXT;
ALTER TABLE rooms ADD COLUMN booking_com_room_name TEXT;
ALTER TABLE rooms ADD COLUMN booking_com_rate_plan_id TEXT;

-- Airbnb fields
ALTER TABLE rooms ADD COLUMN airbnb_listing_id TEXT;
ALTER TABLE rooms ADD COLUMN airbnb_room_name TEXT;

-- General channel manager fields
ALTER TABLE rooms ADD COLUMN channel_sync_enabled INTEGER DEFAULT 0;
ALTER TABLE rooms ADD COLUMN last_channel_sync DATETIME;
ALTER TABLE rooms ADD COLUMN channel_sync_notes TEXT;

-- Index for quick channel lookups
CREATE INDEX IF NOT EXISTS idx_rooms_booking_com_id ON rooms(booking_com_id);
CREATE INDEX IF NOT EXISTS idx_rooms_airbnb_id ON rooms(airbnb_listing_id);




