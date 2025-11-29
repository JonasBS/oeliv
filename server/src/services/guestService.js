import { differenceInCalendarDays, parseISO } from 'date-fns';
import { dbAll, dbGet, dbRun } from '../database/db.js';

const splitName = (fullName = '') => {
  if (!fullName) return { firstName: null, lastName: null };
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: null };
  }
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName };
};

const calculateNights = (checkIn, checkOut) => {
  try {
    const nights = differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn));
    return nights > 0 ? nights : 1;
  } catch {
    return 1;
  }
};

const upsertGuest = async ({ name, email, phone, check_in, check_out, total_price }) => {
  if (!email) return null;

  const nights = calculateNights(check_in, check_out);

  const existing = await dbGet('SELECT * FROM guests WHERE email = ?', [email]);
  if (existing) {
    await dbRun(
      `
        UPDATE guests
        SET
          phone = COALESCE(?, phone),
          total_stays = total_stays + 1,
          total_nights = total_nights + ?,
          lifetime_value = lifetime_value + ?,
          last_check_out = CASE
            WHEN last_check_out IS NULL OR last_check_out < ?
              THEN ?
            ELSE last_check_out
          END
        WHERE id = ?
      `,
      [phone || existing.phone, nights, total_price || 0, check_out, check_out, existing.id]
    );
    return existing.id;
  }

  const { firstName, lastName } = splitName(name);
  const result = await dbRun(
    `
      INSERT INTO guests (
        first_name,
        last_name,
        email,
        phone,
        total_stays,
        total_nights,
        lifetime_value,
        last_check_out
      ) VALUES (?, ?, ?, ?, 1, ?, ?, ?)
    `,
    [
      firstName,
      lastName,
      email,
      phone || null,
      nights,
      total_price || 0,
      check_out
    ]
  );

  return result.lastID;
};

export const syncGuestsFromBookings = async () => {
  const bookings = await dbAll(`
    SELECT id, guest_name, guest_email, guest_phone, check_in, check_out, total_price
    FROM bookings
    WHERE guest_email IS NOT NULL
  `);

  for (const booking of bookings) {
    const guestId = await upsertGuest({
      name: booking.guest_name,
      email: booking.guest_email,
      phone: booking.guest_phone,
      check_in: booking.check_in,
      check_out: booking.check_out,
      total_price: booking.total_price
    });

    if (guestId) {
      await dbRun('UPDATE bookings SET guest_id = ? WHERE id = ?', [guestId, booking.id]);
    }
  }
};

export const recordGuestFromBooking = async (booking) => {
  if (!booking.guest_email) {
    return null;
  }

  const guestId = await upsertGuest({
    name: booking.guest_name,
    email: booking.guest_email,
    phone: booking.guest_phone,
    check_in: booking.check_in,
    check_out: booking.check_out,
    total_price: booking.total_price
  });

  if (guestId) {
    await dbRun('UPDATE bookings SET guest_id = ? WHERE id = ?', [guestId, booking.id]);
  }

  return guestId;
};



