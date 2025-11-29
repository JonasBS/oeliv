-- Experience Bookings Table
-- Stores bookings for Lærkegaards featured experiences (sauna, picnic, massage, etc.)

CREATE TABLE IF NOT EXISTS experience_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Link to guest booking (optional - can also be standalone)
    booking_id INTEGER,
    
    -- Experience details
    experience_id TEXT NOT NULL,
    experience_name TEXT NOT NULL,
    
    -- Guest info (from booking or manual entry)
    guest_name TEXT NOT NULL,
    guest_email TEXT,
    guest_phone TEXT,
    room_name TEXT,
    
    -- Booking details
    booking_date DATE NOT NULL,
    time_slot TEXT,
    duration TEXT,
    guests INTEGER DEFAULT 1,
    
    -- Pricing
    price_per_unit REAL,
    quantity INTEGER DEFAULT 1,
    total_price REAL,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    
    -- Special requests
    notes TEXT,
    
    -- Staff handling
    confirmed_by TEXT,
    confirmed_at DATETIME,
    
    -- External system sync (for future integration)
    external_booking_id TEXT,
    external_system TEXT,
    synced_at DATETIME,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_experience_bookings_date ON experience_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_experience_bookings_experience ON experience_bookings(experience_id);
CREATE INDEX IF NOT EXISTS idx_experience_bookings_status ON experience_bookings(status);
CREATE INDEX IF NOT EXISTS idx_experience_bookings_booking ON experience_bookings(booking_id);

