import express from 'express';
import { dbAll } from '../database/db.js';

const router = express.Router();

// Get all active rooms
router.get('/', async (req, res, next) => {
  try {
    const rows = await dbAll('SELECT * FROM rooms WHERE active = 1');
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

export default router;

