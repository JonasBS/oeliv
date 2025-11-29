-- Add detailed room fields for Booking.com and Airbnb

-- Physical details
ALTER TABLE rooms ADD COLUMN room_size INTEGER; -- in m²
ALTER TABLE rooms ADD COLUMN bed_type TEXT; -- Queen, King, Twin, etc.
ALTER TABLE rooms ADD COLUMN bathroom_type TEXT; -- Private, Shared, Ensuite
ALTER TABLE rooms ADD COLUMN floor_number INTEGER;
ALTER TABLE rooms ADD COLUMN view_type TEXT; -- Sea view, Garden view, etc.

-- Occupancy
ALTER TABLE rooms ADD COLUMN standard_occupancy INTEGER DEFAULT 2;
-- max_guests already exists

-- Amenities (JSON array for flexibility)
ALTER TABLE rooms ADD COLUMN amenities TEXT; -- JSON: ["WiFi","TV","Air Conditioning"]

-- Booking rules
ALTER TABLE rooms ADD COLUMN min_nights INTEGER DEFAULT 1;
ALTER TABLE rooms ADD COLUMN max_nights INTEGER;
ALTER TABLE rooms ADD COLUMN check_in_time TEXT DEFAULT '15:00';
ALTER TABLE rooms ADD COLUMN check_out_time TEXT DEFAULT '11:00';

-- Cancellation policy
ALTER TABLE rooms ADD COLUMN cancellation_policy TEXT DEFAULT 'flexible'; -- flexible, moderate, strict

-- Additional info
ALTER TABLE rooms ADD COLUMN smoking_allowed INTEGER DEFAULT 0;
ALTER TABLE rooms ADD COLUMN pets_allowed INTEGER DEFAULT 0;
ALTER TABLE rooms ADD COLUMN accessible INTEGER DEFAULT 0; -- wheelchair accessible




