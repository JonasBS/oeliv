import { dbRun, dbGet, dbAll } from '../database/db.js';
import crypto from 'crypto';

// TTLock API endpoints (EU server)
const TTLOCK_API_BASE = 'https://euapi.ttlock.com';

const REQUIRED_ENV_VARS = [
  'TTLOCK_CLIENT_ID',
  'TTLOCK_CLIENT_SECRET',
  'TTLOCK_USERNAME',
  'TTLOCK_PASSWORD'
];

// In-memory token cache
let accessToken = null;
let tokenExpiry = 0;
let refreshToken = null;

const isTtlockConfigured = () =>
  REQUIRED_ENV_VARS.every((key) => Boolean(process.env[key]));

const md5Hash = (str) => crypto.createHash('md5').update(str).digest('hex');

const toUnixMs = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString).getTime();
};

const generateTemporaryPasscode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/**
 * Get OAuth access token (with caching and refresh)
 */
const getAccessToken = async () => {
  const now = Date.now();
  
  // Return cached token if still valid (with 5 min buffer)
  if (accessToken && tokenExpiry > now + 300000) {
    return accessToken;
  }

  // Try refresh token first
  if (refreshToken) {
    try {
      const refreshed = await refreshAccessToken();
      if (refreshed) return accessToken;
    } catch (err) {
      console.warn('🔐 TTLock refresh failed, re-authenticating...', err.message);
    }
  }

  // Full authentication
  const params = new URLSearchParams({
    clientId: process.env.TTLOCK_CLIENT_ID,
    clientSecret: process.env.TTLOCK_CLIENT_SECRET,
    username: process.env.TTLOCK_USERNAME,
    password: md5Hash(process.env.TTLOCK_PASSWORD)
  });

  const response = await fetch(`${TTLOCK_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  const data = await response.json();

  if (data.errcode) {
    throw new Error(`TTLock auth failed: ${data.errmsg} (code ${data.errcode})`);
  }

  accessToken = data.access_token;
  refreshToken = data.refresh_token;
  tokenExpiry = now + (data.expires_in * 1000);

  console.log('🔐 TTLock authenticated successfully');
  return accessToken;
};

/**
 * Refresh the access token
 */
const refreshAccessToken = async () => {
  const params = new URLSearchParams({
    clientId: process.env.TTLOCK_CLIENT_ID,
    clientSecret: process.env.TTLOCK_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  });

  const response = await fetch(`${TTLOCK_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  const data = await response.json();

  if (data.errcode) {
    throw new Error(`TTLock refresh failed: ${data.errmsg}`);
  }

  accessToken = data.access_token;
  refreshToken = data.refresh_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000);

  return true;
};

/**
 * Create a temporary passcode on the lock
 */
const createPasscodeOnLock = async (lockId, passcode, validFromMs, validToMs, name) => {
  const token = await getAccessToken();

  const params = new URLSearchParams({
    clientId: process.env.TTLOCK_CLIENT_ID,
    accessToken: token,
    lockId: lockId,
    keyboardPwd: passcode,
    keyboardPwdName: name || 'Guest Code',
    startDate: validFromMs.toString(),
    endDate: validToMs.toString(),
    addType: '2', // Custom passcode (type 2)
    date: Date.now().toString()
  });

  const response = await fetch(`${TTLOCK_API_BASE}/v3/keyboardPwd/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  const data = await response.json();

  if (data.errcode) {
    throw new Error(`TTLock passcode creation failed: ${data.errmsg} (code ${data.errcode})`);
  }

  return {
    keyboardPwdId: data.keyboardPwdId,
    success: true
  };
};

/**
 * Delete a passcode from the lock
 */
const deletePasscodeFromLock = async (lockId, keyboardPwdId) => {
  const token = await getAccessToken();

  const params = new URLSearchParams({
    clientId: process.env.TTLOCK_CLIENT_ID,
    accessToken: token,
    lockId: lockId,
    keyboardPwdId: keyboardPwdId.toString(),
    deleteType: '2', // Delete from lock and cloud
    date: Date.now().toString()
  });

  const response = await fetch(`${TTLOCK_API_BASE}/v3/keyboardPwd/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  const data = await response.json();

  if (data.errcode) {
    throw new Error(`TTLock passcode deletion failed: ${data.errmsg} (code ${data.errcode})`);
  }

  return { success: true };
};

/**
 * Get list of locks for the account (owned locks)
 */
export const getAccountLocks = async () => {
  if (!isTtlockConfigured()) {
    return { enabled: false, locks: [], keys: [] };
  }

  try {
    const token = await getAccessToken();

    // Get owned locks
    const lockParams = new URLSearchParams({
      clientId: process.env.TTLOCK_CLIENT_ID,
      accessToken: token,
      pageNo: '1',
      pageSize: '100',
      date: Date.now().toString()
    });

    const lockResponse = await fetch(`${TTLOCK_API_BASE}/v3/lock/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: lockParams.toString()
    });

    const lockData = await lockResponse.json();
    const ownedLocks = lockData.list || [];

    // Get shared keys (locks shared with this account)
    const keyParams = new URLSearchParams({
      clientId: process.env.TTLOCK_CLIENT_ID,
      accessToken: token,
      pageNo: '1',
      pageSize: '100',
      date: Date.now().toString()
    });

    const keyResponse = await fetch(`${TTLOCK_API_BASE}/v3/key/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: keyParams.toString()
    });

    const keyData = await keyResponse.json();
    const sharedKeys = keyData.list || [];

    // Combine and deduplicate by lockId
    const allLocks = [...ownedLocks];
    const seenLockIds = new Set(ownedLocks.map(l => l.lockId));

    for (const key of sharedKeys) {
      if (!seenLockIds.has(key.lockId)) {
        allLocks.push({
          lockId: key.lockId,
          lockName: key.lockName,
          lockAlias: key.lockAlias,
          lockMac: key.lockMac,
          keyId: key.keyId,
          keyStatus: key.keyStatus,
          isShared: true
        });
        seenLockIds.add(key.lockId);
      }
    }

    return {
      enabled: true,
      locks: allLocks,
      ownedCount: ownedLocks.length,
      sharedCount: sharedKeys.length
    };
  } catch (err) {
    console.error('❌ TTLock getAccountLocks error:', err.message);
    return { enabled: true, error: err.message, locks: [] };
  }
};

/**
 * Provision a lock code for a booking (queue + immediate API call)
 */
export const provisionLockCodeForBooking = async ({
  bookingId,
  lockContext,
  checkIn,
  checkOut
}) => {
  if (!isTtlockConfigured()) {
    return { enabled: false };
  }

  const lockId = lockContext?.ttlock_lock_id;

  if (!lockId) {
    console.warn(
      `🔐 TTLock configured but no lock_id for booking ${bookingId} (room ${lockContext?.roomId})`
    );
    return { enabled: true, skipped: 'missing_lock_id' };
  }

  // Check-in at 15:00, check-out at 11:00
  const checkInDate = new Date(checkIn);
  checkInDate.setHours(15, 0, 0, 0);
  const checkOutDate = new Date(checkOut);
  checkOutDate.setHours(11, 0, 0, 0);

  const validFromMs = checkInDate.getTime();
  const validToMs = checkOutDate.getTime();
  const passcode = generateTemporaryPasscode();

  // Insert pending record
  const result = await dbRun(
    `
      INSERT INTO booking_lock_codes
      (booking_id, room_id, room_unit_id, room_unit_label, lock_id, passcode, status, valid_from, valid_to)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      bookingId,
      lockContext.roomId,
      lockContext.roomUnitId || null,
      lockContext.roomUnitLabel || null,
      lockId,
      passcode,
      'pending_provision',
      Math.floor(validFromMs / 1000),
      Math.floor(validToMs / 1000)
    ]
  );

  const lockCodeId = result.lastID;

  // Try to create passcode on lock immediately
  try {
    const codeName = `Booking #${bookingId}${lockContext.roomUnitLabel ? ` - ${lockContext.roomUnitLabel}` : ''}`;
    const apiResult = await createPasscodeOnLock(lockId, passcode, validFromMs, validToMs, codeName);

    await dbRun(
      `
        UPDATE booking_lock_codes
        SET status = ?, remote_code_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      ['active', apiResult.keyboardPwdId.toString(), lockCodeId]
    );

    console.log(
      `🔐 TTLock passcode created for booking ${bookingId}: ${passcode} (lock ${lockId})`
    );

    return {
      enabled: true,
      status: 'active',
      passcode,
      remoteCodeId: apiResult.keyboardPwdId
    };
  } catch (err) {
    console.error(`❌ TTLock passcode creation failed for booking ${bookingId}:`, err.message);

    await dbRun(
      `
        UPDATE booking_lock_codes
        SET status = ?, last_error = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      ['error', err.message, lockCodeId]
    );

    return {
      enabled: true,
      status: 'error',
      passcode,
      error: err.message
    };
  }
};

/**
 * Revoke a lock code for a booking
 */
export const revokeLockCodeForBooking = async ({ bookingId }) => {
  if (!isTtlockConfigured()) {
    return { enabled: false };
  }

  const lockCode = await dbGet(
    `
      SELECT * FROM booking_lock_codes
      WHERE booking_id = ?
      ORDER BY id DESC
      LIMIT 1
    `,
    [bookingId]
  );

  if (!lockCode) {
    return { enabled: true, skipped: 'no_lock_code' };
  }

  if (lockCode.status === 'revoked') {
    return { enabled: true, skipped: 'already_revoked' };
  }

  // If we have a remote code ID, delete it from the lock
  if (lockCode.remote_code_id) {
    try {
      await deletePasscodeFromLock(lockCode.lock_id, lockCode.remote_code_id);

      await dbRun(
        `
          UPDATE booking_lock_codes
          SET status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        ['revoked', lockCode.id]
      );

      console.log(
        `🔐 TTLock passcode revoked for booking ${bookingId} (code ${lockCode.remote_code_id})`
      );

      return { enabled: true, status: 'revoked' };
    } catch (err) {
      console.error(`❌ TTLock passcode revocation failed for booking ${bookingId}:`, err.message);

      await dbRun(
        `
          UPDATE booking_lock_codes
          SET status = ?, last_error = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        ['revocation_error', err.message, lockCode.id]
      );

      return { enabled: true, status: 'revocation_error', error: err.message };
    }
  } else {
    // No remote code, just mark as revoked locally
    await dbRun(
      `
        UPDATE booking_lock_codes
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      ['revoked', lockCode.id]
    );

    return { enabled: true, status: 'revoked' };
  }
};

/**
 * Get lock codes for a booking
 */
export const getLockCodesForBooking = async (bookingId) =>
  dbGet(
    `
      SELECT * FROM booking_lock_codes
      WHERE booking_id = ?
      ORDER BY id DESC
      LIMIT 1
    `,
    [bookingId]
  );

/**
 * Process any pending lock code operations (for retry logic)
 */
export const processPendingLockCodes = async () => {
  if (!isTtlockConfigured()) {
    return { enabled: false };
  }

  const pending = await dbAll(
    `
      SELECT blc.*, b.check_in, b.check_out, b.guest_name
      FROM booking_lock_codes blc
      JOIN bookings b ON b.id = blc.booking_id
      WHERE blc.status IN ('pending_provision', 'error')
      AND b.status NOT IN ('cancelled')
    `
  );

  let processed = 0;
  let errors = 0;

  for (const code of pending) {
    try {
      const checkInDate = new Date(code.check_in);
      checkInDate.setHours(15, 0, 0, 0);
      const checkOutDate = new Date(code.check_out);
      checkOutDate.setHours(11, 0, 0, 0);

      const codeName = `Booking #${code.booking_id}${code.room_unit_label ? ` - ${code.room_unit_label}` : ''}`;
      const apiResult = await createPasscodeOnLock(
        code.lock_id,
        code.passcode,
        checkInDate.getTime(),
        checkOutDate.getTime(),
        codeName
      );

      await dbRun(
        `
          UPDATE booking_lock_codes
          SET status = ?, remote_code_id = ?, last_error = NULL, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        ['active', apiResult.keyboardPwdId.toString(), code.id]
      );

      console.log(`🔐 Retried TTLock passcode for booking ${code.booking_id}: success`);
      processed++;
    } catch (err) {
      console.error(`❌ Retry failed for booking ${code.booking_id}:`, err.message);
      await dbRun(
        `
          UPDATE booking_lock_codes
          SET last_error = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [err.message, code.id]
      );
      errors++;
    }
  }

  return { enabled: true, processed, errors };
};

export const isTtlockReady = isTtlockConfigured;
