import express from 'express';
import crypto from 'crypto';
import { dbGet, dbRun } from '../database/db.js';
import twilio from 'twilio';

const router = express.Router();

// Session duration: 7 days
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

// 2FA code duration: 5 minutes
const TWO_FACTOR_DURATION_MS = 5 * 60 * 1000;

// In-memory store for pending 2FA codes (in production, use Redis or database)
const pendingTwoFactorCodes = new Map();

// Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Verify password
const verifyPassword = (password, storedHash) => {
  const [salt, hash] = storedHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
};

// Hash password
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

// Generate session token
const generateToken = () => crypto.randomBytes(32).toString('hex');

// Generate 6-digit 2FA code
const generate2FACode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Clean expired sessions
const cleanExpiredSessions = async () => {
  await dbRun('DELETE FROM admin_sessions WHERE expires_at < datetime("now")');
};

// Send 2FA code via SMS
const send2FACode = async (phone, code) => {
  if (!twilioClient) {
    console.error('❌ Twilio not configured for 2FA');
    return false;
  }

  try {
    await twilioClient.messages.create({
      to: phone,
      from: process.env.TWILIO_FROM_NUMBER,
      body: `Din ØLIV login-kode er: ${code}. Koden udløber om 5 minutter.`
    });
    console.log(`✅ 2FA code sent to ${phone}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send 2FA code:', error.message);
    return false;
  }
};

// Step 1: Login with username/password - returns pending 2FA if enabled
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Brugernavn og adgangskode er påkrævet' });
    }

    const user = await dbGet(
      'SELECT * FROM admin_users WHERE username = ? AND active = 1',
      [username.toLowerCase().trim()]
    );

    if (!user) {
      return res.status(401).json({ error: 'Forkert brugernavn eller adgangskode' });
    }

    if (!verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Forkert brugernavn eller adgangskode' });
    }

    // Check if 2FA is enabled
    if (user.two_factor_enabled && user.phone) {
      const code = generate2FACode();
      const expiresAt = Date.now() + TWO_FACTOR_DURATION_MS;
      
      // Store pending 2FA
      const pendingId = crypto.randomBytes(16).toString('hex');
      pendingTwoFactorCodes.set(pendingId, {
        userId: user.id,
        code,
        expiresAt,
        attempts: 0
      });

      // Clean up expired codes
      for (const [key, value] of pendingTwoFactorCodes.entries()) {
        if (value.expiresAt < Date.now()) {
          pendingTwoFactorCodes.delete(key);
        }
      }

      // Send SMS
      const sent = await send2FACode(user.phone, code);
      
      if (!sent) {
        return res.status(500).json({ error: 'Kunne ikke sende bekræftelseskode. Prøv igen.' });
      }

      return res.json({
        requiresTwoFactor: true,
        pendingId,
        phoneHint: user.phone.slice(-4) // Last 4 digits
      });
    }

    // No 2FA - create session directly
    await cleanExpiredSessions();

    const token = generateToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

    await dbRun(
      'INSERT INTO admin_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, token, expiresAt]
    );

    await dbRun(
      'UPDATE admin_users SET last_login = datetime("now") WHERE id = ?',
      [user.id]
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

// Step 2: Verify 2FA code
router.post('/verify-2fa', async (req, res, next) => {
  try {
    const { pendingId, code } = req.body;

    if (!pendingId || !code) {
      return res.status(400).json({ error: 'Manglende data' });
    }

    const pending = pendingTwoFactorCodes.get(pendingId);

    if (!pending) {
      return res.status(401).json({ error: 'Ugyldig eller udløbet session. Log ind igen.' });
    }

    if (pending.expiresAt < Date.now()) {
      pendingTwoFactorCodes.delete(pendingId);
      return res.status(401).json({ error: 'Koden er udløbet. Log ind igen.' });
    }

    pending.attempts++;

    if (pending.attempts > 3) {
      pendingTwoFactorCodes.delete(pendingId);
      return res.status(401).json({ error: 'For mange forsøg. Log ind igen.' });
    }

    if (pending.code !== code) {
      return res.status(401).json({ error: `Forkert kode. ${3 - pending.attempts} forsøg tilbage.` });
    }

    // Code is correct - create session
    pendingTwoFactorCodes.delete(pendingId);

    const user = await dbGet('SELECT * FROM admin_users WHERE id = ?', [pending.userId]);

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Bruger ikke fundet' });
    }

    await cleanExpiredSessions();

    const token = generateToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

    await dbRun(
      'INSERT INTO admin_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, token, expiresAt]
    );

    await dbRun(
      'UPDATE admin_users SET last_login = datetime("now") WHERE id = ?',
      [user.id]
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

// Verify session
router.post('/verify', async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({ valid: false, error: 'Ingen token angivet' });
    }

    await cleanExpiredSessions();

    const session = await dbGet(
      `SELECT s.*, u.username, u.name, u.role
       FROM admin_sessions s
       JOIN admin_users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime("now") AND u.active = 1`,
      [token]
    );

    if (!session) {
      return res.status(401).json({ valid: false, error: 'Ugyldig eller udløbet session' });
    }

    res.json({
      valid: true,
      user: {
        id: session.user_id,
        username: session.username,
        name: session.name,
        role: session.role
      }
    });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', async (req, res, next) => {
  try {
    const { token } = req.body;

    if (token) {
      await dbRun('DELETE FROM admin_sessions WHERE token = ?', [token]);
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Change password (requires current session)
router.post('/change-password', async (req, res, next) => {
  try {
    const { token, currentPassword, newPassword } = req.body;

    if (!token || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Alle felter er påkrævet' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Adgangskoden skal være mindst 6 tegn' });
    }

    const session = await dbGet(
      `SELECT s.user_id, u.password_hash
       FROM admin_sessions s
       JOIN admin_users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime("now")`,
      [token]
    );

    if (!session) {
      return res.status(401).json({ error: 'Ugyldig session' });
    }

    if (!verifyPassword(currentPassword, session.password_hash)) {
      return res.status(401).json({ error: 'Forkert nuværende adgangskode' });
    }

    const newHash = hashPassword(newPassword);
    await dbRun(
      'UPDATE admin_users SET password_hash = ? WHERE id = ?',
      [newHash, session.user_id]
    );

    // Invalidate all other sessions for this user
    await dbRun(
      'DELETE FROM admin_sessions WHERE user_id = ? AND token != ?',
      [session.user_id, token]
    );

    res.json({ success: true, message: 'Adgangskode ændret' });
  } catch (error) {
    next(error);
  }
});

// Check if setup is needed (always returns false now - no self-registration)
router.get('/needs-setup', async (req, res) => {
  res.json({ needsSetup: false });
});

export default router;
