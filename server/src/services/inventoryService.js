import { dbAll } from '../database/db.js';
import { eachDayOfInterval, format, max as dateMax, min as dateMin } from 'date-fns';

const DATE_FORMAT = 'yyyy-MM-dd';

const buildDateStrings = (start, end) => {
  const interval = eachDayOfInterval({
    start: new Date(start),
    end: new Date(new Date(end).getTime() - 24 * 60 * 60 * 1000),
  });
  return interval.map((date) => format(date, DATE_FORMAT));
};

export const getBookingCountMap = async (startDate, endDate, roomIds = []) => {
  const params = [endDate, startDate];
  let roomFilter = '';
  if (roomIds.length > 0) {
    roomFilter = ` AND room_id IN (${roomIds.map(() => '?').join(',')})`;
    params.push(...roomIds);
  }

  const bookings = await dbAll(
    `
      SELECT room_id, check_in, check_out
      FROM bookings
      WHERE status IN ('confirmed', 'pending')
        AND check_in < ?
        AND check_out > ?
        ${roomFilter}
    `,
    params
  );

  const map = {};
  bookings.forEach((booking) => {
    const roomId = booking.room_id;
    if (!map[roomId]) {
      map[roomId] = {};
    }
    const rangeStart = dateMax([new Date(booking.check_in), new Date(startDate)]);
    const rangeEnd = dateMin([new Date(booking.check_out), new Date(endDate)]);
    const dates = eachDayOfInterval({
      start: rangeStart,
      end: new Date(rangeEnd.getTime() - 24 * 60 * 60 * 1000),
    });
    dates.forEach((date) => {
      const dateStr = format(date, DATE_FORMAT);
      map[roomId][dateStr] = (map[roomId][dateStr] || 0) + 1;
    });
  });

  return map;
};

export const clampUnits = (value, maxUnits) => {
  if (value === null || value === undefined) return null;
  if (value < 0) return 0;
  if (value > maxUnits) return maxUnits;
  return value;
};

export const buildAvailabilityMap = (rows) => {
  const map = {};
  rows.forEach((row) => {
    if (!map[row.room_id]) {
      map[row.room_id] = {};
    }
    map[row.room_id][row.date] = row;
  });
  return map;
};

export const computeRemainingUnits = ({
  roomId,
  dateStr,
  roomUnitCount,
  availabilityRow,
  bookingCountMap,
}) => {
  const manualOverride =
    availabilityRow && availabilityRow.open_units !== null && availabilityRow.open_units !== undefined
      ? availabilityRow.open_units
      : null;

  let baseUnits;
  if (manualOverride !== null) {
    baseUnits = clampUnits(manualOverride, roomUnitCount);
  } else if (availabilityRow && availabilityRow.available === 0) {
    baseUnits = 0;
  } else {
    baseUnits = roomUnitCount;
  }

  const booked = bookingCountMap[roomId]?.[dateStr] || 0;
  const remaining = Math.max(baseUnits - booked, 0);

  return {
    baseUnits,
    booked,
    remaining,
  };
};

export const getRoomsUnitCounts = async (roomIds = []) => {
  let query = 'SELECT id, unit_count FROM rooms WHERE active = 1';
  const params = [];

  if (roomIds.length > 0) {
    query += ` AND id IN (${roomIds.map(() => '?').join(',')})`;
    params.push(...roomIds);
  }

  const rows = await dbAll(query, params);
  const map = {};
  rows.forEach((row) => {
    map[row.id] = row.unit_count || 1;
  });
  return map;
};

export const generateDateStrings = buildDateStrings;


