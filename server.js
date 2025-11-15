const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Enable CORS for all routes (needed for frontend on different domain)
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.static('.'));

// Database setup
const db = new sqlite3.Database('./bookings.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Rooms table
    db.run(`CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      max_guests INTEGER NOT NULL,
      base_price INTEGER NOT NULL,
      active INTEGER DEFAULT 1
    )`);

    // Bookings table
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      check_in DATE NOT NULL,
      check_out DATE NOT NULL,
      guests INTEGER NOT NULL,
      guest_name TEXT NOT NULL,
      guest_email TEXT NOT NULL,
      guest_phone TEXT,
      total_price INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      payment_status TEXT DEFAULT 'unpaid',
      payment_intent_id TEXT,
      notes TEXT,
      source TEXT DEFAULT 'website',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    )`);

    // Availability table (for channel manager sync)
    db.run(`CREATE TABLE IF NOT EXISTS availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      date DATE NOT NULL,
      available INTEGER DEFAULT 1,
      price INTEGER,
      min_stay INTEGER DEFAULT 1,
      source TEXT DEFAULT 'manual',
      synced_at DATETIME,
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      UNIQUE(room_id, date)
    )`);

    // Channel manager sync log
    db.run(`CREATE TABLE IF NOT EXISTS channel_sync (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel TEXT NOT NULL,
      action TEXT NOT NULL,
      booking_id INTEGER,
      data TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Insert default rooms if they don't exist
    db.get('SELECT COUNT(*) as count FROM rooms', (err, row) => {
      if (row.count === 0) {
        const rooms = [
          { name: 'Kystværelse', type: 'coast', max_guests: 2, base_price: 1200 },
          { name: 'Havsuite', type: 'suite', max_guests: 2, base_price: 1500 },
          { name: 'Stor havsuite', type: 'large_suite', max_guests: 4, base_price: 2000 },
          { name: 'Ferielejlighed', type: 'apartment', max_guests: 4, base_price: 1800 },
          { name: 'Gårdsværelser', type: 'garden', max_guests: 2, base_price: 1300 }
        ];
        
        const stmt = db.prepare('INSERT INTO rooms (name, type, max_guests, base_price) VALUES (?, ?, ?, ?)');
        rooms.forEach(room => {
          stmt.run(room.name, room.type, room.max_guests, room.base_price);
        });
        stmt.finalize();
        console.log('Default rooms inserted');
      }
    });
  });
}

// ========================================
// API Routes
// ========================================

// Get all rooms
app.get('/api/rooms', (req, res) => {
  db.all('SELECT * FROM rooms WHERE active = 1', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get availability for date range
app.get('/api/availability', (req, res) => {
  const { start_date, end_date, room_id } = req.query;
  
  if (!start_date || !end_date) {
    res.status(400).json({ error: 'start_date and end_date are required' });
    return;
  }

  let query = `
    SELECT 
      a.date,
      a.room_id,
      a.available,
      a.price,
      a.min_stay,
      r.name as room_name,
      r.type as room_type,
      r.max_guests
    FROM availability a
    JOIN rooms r ON a.room_id = r.id
    WHERE a.date >= ? AND a.date < ?
  `;
  
  const params = [start_date, end_date];
  
  if (room_id) {
    query += ' AND a.room_id = ?';
    params.push(room_id);
  }
  
  query += ' ORDER BY a.date, a.room_id';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Check availability for specific dates
app.post('/api/check-availability', (req, res) => {
  const { check_in, check_out, guests, room_id } = req.body;
  
  if (!check_in || !check_out) {
    res.status(400).json({ error: 'check_in and check_out are required' });
    return;
  }

  // Check if dates are available
  let query = `
    SELECT 
      a.room_id,
      r.name,
      r.type,
      r.max_guests,
      MIN(a.available) as is_available,
      SUM(a.price) as total_price,
      MIN(a.min_stay) as min_stay
    FROM availability a
    JOIN rooms r ON a.room_id = r.id
    WHERE a.date >= ? AND a.date < ?
  `;
  
  const params = [check_in, check_out];
  
  if (room_id) {
    query += ' AND a.room_id = ?';
    params.push(room_id);
  }
  
  if (guests) {
    query += ' AND r.max_guests >= ?';
    params.push(guests);
  }
  
  query += ' GROUP BY a.room_id';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Also check for existing bookings
    const bookingQuery = `
      SELECT room_id FROM bookings 
      WHERE status IN ('confirmed', 'pending')
      AND check_in < ? AND check_out > ?
    `;
    
    db.all(bookingQuery, [check_out, check_in], (err, bookings) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      const bookedRoomIds = new Set(bookings.map(b => b.room_id));
      const availableRooms = rows.filter(r => 
        r.is_available === 1 && !bookedRoomIds.has(r.room_id)
      );
      
      res.json({ available: availableRooms });
    });
  });
});

// Create booking
app.post('/api/bookings', (req, res) => {
  const { room_id, check_in, check_out, guests, guest_name, guest_email, guest_phone, notes, source } = req.body;
  
  if (!room_id || !check_in || !check_out || !guests || !guest_name || !guest_email) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  // First check availability
  db.all(`
    SELECT available FROM availability 
    WHERE room_id = ? AND date >= ? AND date < ?
  `, [room_id, check_in, check_out], (err, availability) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (availability.some(a => a.available === 0)) {
      res.status(400).json({ error: 'Room not available for selected dates' });
      return;
    }
    
    // Check for existing bookings
    db.all(`
      SELECT id FROM bookings 
      WHERE room_id = ? 
      AND status IN ('confirmed', 'pending')
      AND check_in < ? AND check_out > ?
    `, [room_id, check_out, check_in], (err, bookings) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (bookings.length > 0) {
        res.status(400).json({ error: 'Room already booked for selected dates' });
        return;
      }
      
      // Calculate price
      db.all(`
        SELECT SUM(price) as total FROM availability 
        WHERE room_id = ? AND date >= ? AND date < ?
      `, [room_id, check_in, check_out], (err, priceResult) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        const total_price = priceResult[0].total || 0;
        
        // Create booking
        db.run(`
          INSERT INTO bookings 
          (room_id, check_in, check_out, guests, guest_name, guest_email, guest_phone, total_price, notes, source)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [room_id, check_in, check_out, guests, guest_name, guest_email, guest_phone || null, total_price, notes || null, source || 'website'], function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          
          res.json({ 
            booking_id: this.lastID,
            total_price: total_price,
            status: 'pending'
          });
        });
      });
    });
  });
});

// Get booking by ID
app.get('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  
  db.get(`
    SELECT b.*, r.name as room_name, r.type as room_type
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    WHERE b.id = ?
  `, [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    res.json(row);
  });
});

// Update booking status
app.patch('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  const { status, payment_status, payment_intent_id } = req.body;
  
  const updates = [];
  const params = [];
  
  if (status) {
    updates.push('status = ?');
    params.push(status);
  }
  if (payment_status) {
    updates.push('payment_status = ?');
    params.push(payment_status);
  }
  if (payment_intent_id) {
    updates.push('payment_intent_id = ?');
    params.push(payment_intent_id);
  }
  
  if (updates.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }
  
  params.push(id);
  
  db.run(`
    UPDATE bookings 
    SET ${updates.join(', ')}
    WHERE id = ?
  `, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true, changes: this.changes });
  });
});

// Get all bookings (admin)
app.get('/api/admin/bookings', (req, res) => {
  const { status, start_date, end_date } = req.query;
  
  let query = `
    SELECT b.*, r.name as room_name, r.type as room_type
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    query += ' AND b.status = ?';
    params.push(status);
  }
  if (start_date) {
    query += ' AND b.check_in >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND b.check_out <= ?';
    params.push(end_date);
  }
  
  query += ' ORDER BY b.check_in DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Channel Manager: Sync availability
app.post('/api/channel/sync', (req, res) => {
  const { channel, availability } = req.body;
  
  // This would integrate with actual channel manager APIs
  // For now, we'll log the sync request
  db.run(`
    INSERT INTO channel_sync (channel, action, data, status)
    VALUES (?, 'sync', ?, 'pending')
  `, [channel, JSON.stringify(availability)], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true, sync_id: this.lastID });
  });
});

// Channel Manager: Receive booking from external channel
app.post('/api/channel/booking', (req, res) => {
  const { channel, booking_data } = req.body;
  
  // Process booking from external channel (booking.com, Airbnb, etc.)
  // Parse booking data based on channel
  let booking = null;
  
  try {
    if (channel === 'booking_com') {
      // Parse Booking.com format
      booking = {
        room_id: booking_data.room_id || null,
        check_in: booking_data.check_in,
        check_out: booking_data.check_out,
        guests: booking_data.guests || 2,
        guest_name: booking_data.guest_name,
        guest_email: booking_data.guest_email,
        guest_phone: booking_data.guest_phone || null,
        total_price: booking_data.total_price || 0,
        notes: `Booking from ${channel}: ${booking_data.booking_id || ''}`,
        source: channel
      };
    } else if (channel === 'airbnb') {
      // Parse Airbnb format
      booking = {
        room_id: booking_data.room_id || null,
        check_in: booking_data.check_in,
        check_out: booking_data.check_out,
        guests: booking_data.guests || 2,
        guest_name: booking_data.guest_name,
        guest_email: booking_data.guest_email,
        guest_phone: booking_data.guest_phone || null,
        total_price: booking_data.total_price || 0,
        notes: `Booking from ${channel}: ${booking_data.reservation_id || ''}`,
        source: channel
      };
    } else {
      // Generic format
      booking = {
        room_id: booking_data.room_id || null,
        check_in: booking_data.check_in,
        check_out: booking_data.check_out,
        guests: booking_data.guests || 2,
        guest_name: booking_data.guest_name,
        guest_email: booking_data.guest_email,
        guest_phone: booking_data.guest_phone || null,
        total_price: booking_data.total_price || 0,
        notes: `Booking from ${channel}`,
        source: channel
      };
    }
    
    // Create booking in database
    db.run(`
      INSERT INTO bookings 
      (room_id, check_in, check_out, guests, guest_name, guest_email, guest_phone, total_price, notes, source, status, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'paid')
    `, [
      booking.room_id,
      booking.check_in,
      booking.check_out,
      booking.guests,
      booking.guest_name,
      booking.guest_email,
      booking.guest_phone,
      booking.total_price,
      booking.notes,
      booking.source
    ], function(err) {
      if (err) {
        console.error('Error creating channel booking:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Log sync
      db.run(`
        INSERT INTO channel_sync (channel, action, booking_id, data, status)
        VALUES (?, 'booking_received', ?, ?, 'completed')
      `, [channel, this.lastID, JSON.stringify(booking_data)]);
      
      res.json({ 
        success: true, 
        booking_id: this.lastID,
        message: `Booking received from ${channel}` 
      });
    });
  } catch (error) {
    console.error('Error processing channel booking:', error);
    res.status(500).json({ error: error.message });
  }
});

// Initialize availability for date range (admin)
app.post('/api/admin/availability', (req, res) => {
  const { room_id, start_date, end_date, price, min_stay, available } = req.body;
  
  if (!room_id || !start_date || !end_date) {
    res.status(400).json({ error: 'room_id, start_date, and end_date are required' });
    return;
  }
  
  // Generate dates between start and end
  const dates = [];
  const start = new Date(start_date);
  const end = new Date(end_date);
  
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }
  
  // Use provided available status or default to 1 (available)
  const isAvailable = available !== undefined ? parseInt(available) : 1;
  
  // Insert/update availability
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO availability (room_id, date, available, price, min_stay, source)
    VALUES (?, ?, ?, ?, ?, 'manual')
  `);
  
  dates.forEach(date => {
    stmt.run(room_id, date, isAvailable, price || null, min_stay || 1);
  });
  
  stmt.finalize((err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true, dates_updated: dates.length });
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Booking engine server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
