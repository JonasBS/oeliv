import express from 'express';
import { dbAll, dbRun, dbGet } from '../database/db.js';

const router = express.Router();

// Get all active rooms (with images)
router.get('/', async (req, res, next) => {
  try {
    const rooms = await dbAll('SELECT * FROM rooms WHERE active = 1');
    
    // Get images & units for each room
    for (const room of rooms) {
      const images = await dbAll(
        `SELECT * FROM room_images 
         WHERE room_id = ? 
         ORDER BY is_primary DESC, display_order ASC`,
        [room.id]
      );
      room.images = images;
      
      // Set image_url to primary image for backward compatibility
      const primaryImage = images.find(img => img.is_primary) || images[0];
      if (primaryImage) {
        room.image_url = primaryImage.image_url;
      }
      const units = await dbAll(
        `SELECT id, room_id, label, ttlock_lock_id, active
         FROM room_units
         WHERE room_id = ?
         ORDER BY label ASC`,
        [room.id]
      );
      room.units = units;
    }
    
    res.json(rooms);
  } catch (error) {
    next(error);
  }
});

// Get room units
router.get('/:id/units', async (req, res, next) => {
  try {
    const { id } = req.params;
    const units = await dbAll(
      `SELECT id, room_id, label, ttlock_lock_id, active
       FROM room_units
       WHERE room_id = ?
       ORDER BY label ASC`,
      [id]
    );
    res.json(units);
  } catch (error) {
    next(error);
  }
});

// Create room unit
router.post('/:id/units', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { label, ttlock_lock_id, active = 1 } = req.body;

    if (!label) {
      return res.status(400).json({ error: 'Label is required' });
    }

    const result = await dbRun(
      `
        INSERT INTO room_units (room_id, label, ttlock_lock_id, active)
        VALUES (?, ?, ?, ?)
      `,
      [id, label, ttlock_lock_id || null, active ? 1 : 0]
    );

    const unit = await dbGet(
      `SELECT id, room_id, label, ttlock_lock_id, active
       FROM room_units WHERE id = ?`,
      [result.lastID]
    );

    res.json(unit);
  } catch (error) {
    next(error);
  }
});

// Update room unit
router.patch('/units/:unitId', async (req, res, next) => {
  try {
    const { unitId } = req.params;
    const { label, ttlock_lock_id, active } = req.body;

    const updates = [];
    const params = [];

    if (label !== undefined) {
      updates.push('label = ?');
      params.push(label);
    }

    if (ttlock_lock_id !== undefined) {
      updates.push('ttlock_lock_id = ?');
      params.push(ttlock_lock_id || null);
    }

    if (active !== undefined) {
      updates.push('active = ?');
      params.push(active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    params.push(unitId);

    await dbRun(
      `UPDATE room_units SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const unit = await dbGet(
      `SELECT id, room_id, label, ttlock_lock_id, active FROM room_units WHERE id = ?`,
      [unitId]
    );

    res.json(unit);
  } catch (error) {
    next(error);
  }
});

// Delete room unit
router.delete('/units/:unitId', async (req, res, next) => {
  try {
    const { unitId } = req.params;
    await dbRun('DELETE FROM room_units WHERE id = ?', [unitId]);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get single room by ID (with images)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const rooms = await dbAll('SELECT * FROM rooms WHERE id = ?', [id]);
    
    if (rooms.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    const room = rooms[0];
    
    // Get images for this room
    const images = await dbAll(
      `SELECT * FROM room_images 
       WHERE room_id = ? 
       ORDER BY is_primary DESC, display_order ASC`,
      [room.id]
    );
    room.images = images;
    
    const units = await dbAll(
      `SELECT id, room_id, label, ttlock_lock_id, active
       FROM room_units
       WHERE room_id = ?
       ORDER BY label ASC`,
      [room.id]
    );
    room.units = units;
    
    // Set image_url to primary image for backward compatibility
    const primaryImage = images.find(img => img.is_primary) || images[0];
    if (primaryImage) {
      room.image_url = primaryImage.image_url;
    }
    
    res.json(room);
  } catch (error) {
    next(error);
  }
});

// Update a room
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic UPDATE query based on provided fields
    const allowedFields = [
      'name', 'type', 'max_guests', 'base_price', 'active',
      'image_url', 'description',
      // Physical details
      'room_size', 'bed_type', 'bathroom_type', 'floor_number', 'view_type',
      // Occupancy
      'standard_occupancy', 'unit_count',
      // Amenities
      'amenities',
      // Booking rules
      'min_nights', 'max_nights', 'check_in_time', 'check_out_time', 'cancellation_policy',
      // Additional
      'smoking_allowed', 'pets_allowed', 'accessible',
      // Channel manager
      'booking_com_id', 'booking_com_room_name', 'booking_com_rate_plan_id',
      'airbnb_listing_id', 'airbnb_room_name',
      'channel_sync_enabled', 'channel_sync_notes',
      // Smart locks
      'ttlock_lock_id'
    ];

    const fieldsToUpdate = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fieldsToUpdate.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Add last_channel_sync timestamp if channel fields are being updated
    const channelFields = ['booking_com_id', 'airbnb_listing_id', 'channel_sync_enabled'];
    if (channelFields.some(field => field in updates)) {
      fieldsToUpdate.push('last_channel_sync = CURRENT_TIMESTAMP');
    }

    values.push(id);

    const sql = `UPDATE rooms SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
    await dbRun(sql, values);

    res.json({
      success: true,
      message: 'Room updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

