import express from 'express';
import { dbAll, dbRun, dbGet } from '../database/db.js';
import { eachDayOfInterval, format } from 'date-fns';
import {
  getBookingCountMap,
  computeRemainingUnits,
  buildAvailabilityMap,
  generateDateStrings,
} from '../services/inventoryService.js';

const router = express.Router();

// Get availability for date range
router.get('/availability', async (req, res, next) => {
  try {
    const { start_date, end_date, room_id } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date are required' });
    }

    let query = `
      SELECT 
        a.date,
        a.room_id,
        a.available,
        a.price,
        a.min_stay,
        a.open_units,
        r.name as room_name,
        r.type as room_type,
        r.max_guests,
        r.unit_count
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
    
    const rows = await dbAll(query, params);
    const bookingCountMap = await getBookingCountMap(start_date, end_date);

    const enriched = rows.map((row) => {
      const { baseUnits, remaining } = computeRemainingUnits({
        roomId: row.room_id,
        dateStr: row.date,
        roomUnitCount: row.unit_count || 1,
        availabilityRow: row,
        bookingCountMap,
      });

      const bookedUnits = baseUnits - remaining;

      return {
        ...row,
        open_units: baseUnits,
        capacity_units: row.unit_count || 1,
        booked_units: bookedUnits,
        remaining_units: remaining,
        available: remaining > 0 ? 1 : 0,
      };
    });

    res.json(enriched);
  } catch (error) {
    next(error);
  }
});

// Check availability for specific dates
router.post('/check-availability', async (req, res, next) => {
  try {
    const { check_in, check_out, guests, room_id } = req.body;
    
    if (!check_in || !check_out) {
      return res.status(400).json({ error: 'check_in and check_out are required' });
    }

    let roomQuery = `
      SELECT id, name, type, max_guests, base_price, unit_count
      FROM rooms
      WHERE active = 1
    `;
    const roomParams = [];

    if (room_id) {
      roomQuery += ' AND id = ?';
      roomParams.push(room_id);
    }

    if (guests) {
      roomQuery += ' AND max_guests >= ?';
      roomParams.push(guests);
    }

    const rooms = await dbAll(roomQuery, roomParams);

    if (rooms.length === 0) {
      return res.json({ available: [] });
    }

    const roomIds = rooms.map((room) => room.id);
    const bookingCountMap = await getBookingCountMap(check_in, check_out, roomIds);

    const availabilityParams = [check_in, check_out, ...roomIds];
    const placeholders = roomIds.map(() => '?').join(', ');

    const availabilityRows = await dbAll(
      `
        SELECT room_id, date, available, open_units, price, min_stay
        FROM availability
        WHERE date >= ? AND date < ?
          AND room_id IN (${placeholders})
      `,
      availabilityParams
    );

    const availabilityMap = buildAvailabilityMap(availabilityRows);
    const dateStrings = generateDateStrings(check_in, check_out);

    const availableRooms = [];

    rooms.forEach((room) => {
      const roomAvailability = availabilityMap[room.id] || {};
      let hasCapacity = true;
      let totalPrice = 0;
      let minStay = Number.MAX_SAFE_INTEGER;

      dateStrings.forEach((dateStr) => {
        const availabilityRow = roomAvailability[dateStr] || { available: 1, open_units: null, min_stay: 1 };
        const { remaining } = computeRemainingUnits({
          roomId: room.id,
          dateStr,
          roomUnitCount: room.unit_count || 1,
          availabilityRow,
          bookingCountMap,
        });

        if (remaining <= 0) {
          hasCapacity = false;
          return;
        }

        const nightlyPrice =
          availabilityRow.price !== null && availabilityRow.price !== undefined
            ? availabilityRow.price
            : room.base_price;
        totalPrice += nightlyPrice;
        minStay = Math.min(minStay, availabilityRow.min_stay || 1);
      });

      if (hasCapacity) {
        availableRooms.push({
          room_id: room.id,
          name: room.name,
          type: room.type,
          max_guests: room.max_guests,
          total_price: totalPrice,
          min_stay: minStay === Number.MAX_SAFE_INTEGER ? 1 : minStay,
          is_available: 1,
        });
      }
    });

    res.json({ available: availableRooms });
  } catch (error) {
    next(error);
  }
});

// Initialize availability for date range (admin)
router.post('/admin/availability', async (req, res, next) => {
  try {
    const { room_id, start_date, end_date, price, min_stay, available, open_units } = req.body;
    
    if (!room_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'room_id, start_date, and end_date are required' });
    }

    const room = await dbGet('SELECT unit_count FROM rooms WHERE id = ?', [room_id]);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    const maxUnits = room.unit_count || 1;
    
    // Generate dates between start and end
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const dates = eachDayOfInterval({ start: startDate, end: endDate })
      .map(date => format(date, 'yyyy-MM-dd'));
    
    // Insert/update availability
    for (const date of dates) {
      const existing = await dbGet(
        `SELECT available, price as existing_price, min_stay as existing_min_stay, open_units as existing_open_units
         FROM availability WHERE room_id = ? AND date = ?`,
        [room_id, date]
      );

      let resolvedOpenUnits;
      if (open_units === null) {
        resolvedOpenUnits = null;
      } else if (open_units !== undefined) {
        const parsed = parseInt(open_units, 10);
        resolvedOpenUnits = Number.isNaN(parsed) ? null : Math.max(0, Math.min(parsed, maxUnits));
      } else {
        resolvedOpenUnits = existing?.existing_open_units ?? null;
      }

      const resolvedAvailable = available !== undefined
        ? parseInt(available, 10)
        : resolvedOpenUnits === 0
          ? 0
          : existing?.available ?? 1;

      const resolvedPrice = price !== undefined
        ? price
        : existing?.existing_price ?? null;

      const resolvedMinStay = min_stay !== undefined
        ? min_stay
        : existing?.existing_min_stay ?? 1;

      await dbRun(`
        INSERT OR REPLACE INTO availability (room_id, date, available, open_units, price, min_stay, source)
        VALUES (?, ?, ?, ?, ?, ?, 'manual')
      `, [room_id, date, resolvedAvailable, resolvedOpenUnits, resolvedPrice, resolvedMinStay]);
    }
    
    res.json({ success: true, dates_updated: dates.length });
  } catch (error) {
    next(error);
  }
});

// Update price for single date
router.post('/admin/availability/price', async (req, res, next) => {
  try {
    const { room_id, date, price } = req.body;

    if (!room_id || !date) {
      return res.status(400).json({ error: 'room_id and date are required' });
    }

    await dbRun(`
      INSERT INTO availability (room_id, date, available, open_units, price, min_stay, source)
      VALUES (?, ?, 1, NULL, ?, 1, 'manual')
      ON CONFLICT(room_id, date)
      DO UPDATE SET price = excluded.price
    `, [room_id, date, price ?? null]);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;

