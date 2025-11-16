import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new sqlite3.Database('./bookings.db', (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Promisify database methods
export const dbRun = promisify(db.run.bind(db));
export const dbGet = promisify(db.get.bind(db));
export const dbAll = promisify(db.all.bind(db));

// Export database instance for services
export const getDatabase = () => db;

export const initializeDatabase = async () => {
  try {
    // Rooms table
    await dbRun(`CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      max_guests INTEGER NOT NULL,
      base_price INTEGER NOT NULL,
      active INTEGER DEFAULT 1
    )`);

    // Bookings table
    await dbRun(`CREATE TABLE IF NOT EXISTS bookings (
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

    // Availability table
    await dbRun(`CREATE TABLE IF NOT EXISTS availability (
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
    await dbRun(`CREATE TABLE IF NOT EXISTS channel_sync (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel TEXT NOT NULL,
      action TEXT NOT NULL,
      booking_id INTEGER,
      data TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Run revenue management migrations
    const migrations = ['003_revenue_management.sql', '004_add_search_dates.sql', '005_room_prices.sql'];
    for (const migrationFile of migrations) {
      const migrationPath = path.join(__dirname, 'migrations', migrationFile);
      if (fs.existsSync(migrationPath)) {
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await dbRun(statement);
            } catch (err) {
              // Ignore "duplicate column" errors for idempotency
              if (!err.message.includes('duplicate column')) {
                throw err;
              }
            }
          }
        }
        console.log(`✅ Migration ${migrationFile} complete`);
      }
    }

    // Insert default rooms if they don't exist
    const { count } = await dbGet('SELECT COUNT(*) as count FROM rooms');
    
    if (count === 0) {
      const rooms = [
        { name: 'Kystværelse', type: 'coast', max_guests: 2, base_price: 1200 },
        { name: 'Havsuite', type: 'suite', max_guests: 2, base_price: 1500 },
        { name: 'Stor havsuite', type: 'large_suite', max_guests: 4, base_price: 2000 },
        { name: 'Ferielejlighed', type: 'apartment', max_guests: 4, base_price: 1800 },
        { name: 'Gårdsværelser', type: 'garden', max_guests: 2, base_price: 1300 }
      ];

      for (const room of rooms) {
        await dbRun(
          'INSERT INTO rooms (name, type, max_guests, base_price) VALUES (?, ?, ?, ?)',
          [room.name, room.type, room.max_guests, room.base_price]
        );
      }
      console.log('✅ Default rooms inserted');
    }

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

export default db;

