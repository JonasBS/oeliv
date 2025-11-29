import express from 'express';
import { getAccountLocks, isTtlockReady, processPendingLockCodes, getLockCodesForBooking } from '../services/ttlockService.js';
import { dbAll } from '../database/db.js';

const router = express.Router();

// Check if TTLock is configured
router.get('/status', (req, res) => {
  res.json({
    configured: isTtlockReady(),
    message: isTtlockReady() 
      ? 'TTLock integration is configured and ready'
      : 'TTLock credentials not configured in .env'
  });
});

// List all locks in the TTLock account
router.get('/locks', async (req, res, next) => {
  try {
    const result = await getAccountLocks();
    
    if (!result.enabled) {
      return res.status(400).json({ error: 'TTLock not configured' });
    }

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    // Return simplified lock list for easy assignment
    const locks = result.locks.map(lock => ({
      lockId: lock.lockId,
      lockName: lock.lockName,
      lockAlias: lock.lockAlias,
      lockMac: lock.lockMac,
      electricQuantity: lock.electricQuantity, // Battery level
      hasGateway: lock.hasGateway === 1
    }));

    res.json({
      success: true,
      locks,
      total: locks.length
    });
  } catch (error) {
    next(error);
  }
});

// Get all lock codes (for admin overview)
router.get('/codes', async (req, res, next) => {
  try {
    const codes = await dbAll(`
      SELECT 
        blc.*,
        b.guest_name,
        b.check_in,
        b.check_out,
        b.status as booking_status,
        r.name as room_name,
        ru.label as unit_label
      FROM booking_lock_codes blc
      JOIN bookings b ON b.id = blc.booking_id
      LEFT JOIN rooms r ON r.id = blc.room_id
      LEFT JOIN room_units ru ON ru.id = blc.room_unit_id
      ORDER BY blc.created_at DESC
      LIMIT 100
    `);

    res.json({
      success: true,
      codes
    });
  } catch (error) {
    next(error);
  }
});

// Get lock code for a specific booking
router.get('/codes/booking/:bookingId', async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const code = await getLockCodesForBooking(bookingId);

    if (!code) {
      return res.status(404).json({ error: 'No lock code found for this booking' });
    }

    res.json({
      success: true,
      code
    });
  } catch (error) {
    next(error);
  }
});

// Retry pending lock code operations
router.post('/process-pending', async (req, res, next) => {
  try {
    const result = await processPendingLockCodes();

    if (!result.enabled) {
      return res.status(400).json({ error: 'TTLock not configured' });
    }

    res.json({
      success: true,
      processed: result.processed,
      errors: result.errors
    });
  } catch (error) {
    next(error);
  }
});

export default router;


