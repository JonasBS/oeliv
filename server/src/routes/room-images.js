import express from 'express';
import { dbRun, dbGet, dbAll } from '../database/db.js';

const router = express.Router();

// GET /api/room-images/:roomId - Get all images for a room
router.get('/:roomId', async (req, res, next) => {
  try {
    const { roomId } = req.params;
    
    const images = await dbAll(
      `SELECT * FROM room_images 
       WHERE room_id = ? 
       ORDER BY is_primary DESC, display_order ASC, created_at ASC`,
      [roomId]
    );
    
    res.json(images);
  } catch (error) {
    next(error);
  }
});

// POST /api/room-images/:roomId - Add image to room
router.post('/:roomId', async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { image_url, caption, is_primary } = req.body;
    
    if (!image_url) {
      return res.status(400).json({ error: 'image_url er påkrævet' });
    }
    
    // If setting as primary, unset other primary images
    if (is_primary) {
      await dbRun(
        'UPDATE room_images SET is_primary = 0 WHERE room_id = ?',
        [roomId]
      );
    }
    
    // Get next display order
    const lastImage = await dbGet(
      'SELECT MAX(display_order) as max_order FROM room_images WHERE room_id = ?',
      [roomId]
    );
    const nextOrder = (lastImage?.max_order || 0) + 1;
    
    // Insert new image
    await dbRun(
      `INSERT INTO room_images (room_id, image_url, display_order, is_primary, caption)
       VALUES (?, ?, ?, ?, ?)`,
      [roomId, image_url, nextOrder, is_primary ? 1 : 0, caption || null]
    );
    
    res.json({
      success: true,
      message: 'Billede tilføjet'
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/room-images/:imageId - Update image
router.patch('/:imageId', async (req, res, next) => {
  try {
    const { imageId } = req.params;
    const { caption, is_primary, display_order } = req.body;
    
    // Get image to find room_id
    const image = await dbGet('SELECT room_id FROM room_images WHERE id = ?', [imageId]);
    
    if (!image) {
      return res.status(404).json({ error: 'Billede ikke fundet' });
    }
    
    // If setting as primary, unset other primary images
    if (is_primary) {
      await dbRun(
        'UPDATE room_images SET is_primary = 0 WHERE room_id = ?',
        [image.room_id]
      );
    }
    
    // Build update query
    const updates = [];
    const values = [];
    
    if (caption !== undefined) {
      updates.push('caption = ?');
      values.push(caption);
    }
    if (is_primary !== undefined) {
      updates.push('is_primary = ?');
      values.push(is_primary ? 1 : 0);
    }
    if (display_order !== undefined) {
      updates.push('display_order = ?');
      values.push(display_order);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Ingen felter at opdatere' });
    }
    
    values.push(imageId);
    
    await dbRun(
      `UPDATE room_images SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    res.json({
      success: true,
      message: 'Billede opdateret'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/room-images/:imageId - Delete image
router.delete('/:imageId', async (req, res, next) => {
  try {
    const { imageId } = req.params;
    
    await dbRun('DELETE FROM room_images WHERE id = ?', [imageId]);
    
    res.json({
      success: true,
      message: 'Billede slettet'
    });
  } catch (error) {
    next(error);
  }
});

export default router;




