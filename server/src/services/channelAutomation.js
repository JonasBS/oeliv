import { dbAll, dbGet } from '../database/db.js';
import {
  listChannelConfigs,
  listChannelRules,
  updateChannelConfig,
  updateChannelRule
} from './channelConfigService.js';

const DEFAULT_AUTOMATION_INTERVAL =
  Number(process.env.CHANNEL_AUTOMATION_INTERVAL_MINUTES || 15);

let automationInterval = null;

const dateToISO = (date) => date.toISOString().split('.')[0] + 'Z';

const getOccupancyStats = async (windowDays = 30) => {
  const { total_rooms = 0 } =
    (await dbGet(`SELECT COUNT(*) as total_rooms FROM rooms`)) || {};

  if (!total_rooms) {
    return {
      total_rooms: 0,
      window_days: windowDays,
      booked_nights: 0,
      occupancy: 0,
      soonest_check_in_days: null
    };
  }

  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + windowDays);

  const bookings = await dbAll(
    `
    SELECT check_in, check_out
    FROM bookings
    WHERE status IN ('pending', 'confirmed')
      AND check_out > ?
      AND check_in < ?
  `,
    [start.toISOString(), end.toISOString()]
  );

  let bookedNights = 0;
  let soonestCheckInDays = null;

  bookings.forEach((booking) => {
    const checkIn = new Date(booking.check_in);
    const checkOut = new Date(booking.check_out);

    const periodStart = checkIn > start ? checkIn : start;
    const periodEnd = checkOut < end ? checkOut : end;

    const diffMs = periodEnd.getTime() - periodStart.getTime();
    if (diffMs > 0) {
      bookedNights += diffMs / (1000 * 60 * 60 * 24);
    }

    const leadTimeDays = Math.ceil((checkIn.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (leadTimeDays >= 0) {
      if (soonestCheckInDays === null || leadTimeDays < soonestCheckInDays) {
        soonestCheckInDays = leadTimeDays;
      }
    }
  });

  const totalNights = total_rooms * windowDays;
  const occupancy = totalNights ? bookedNights / totalNights : 0;

  return {
    total_rooms,
    window_days: windowDays,
    booked_nights: bookedNights,
    occupancy: Number(occupancy.toFixed(4)),
    soonest_check_in_days: soonestCheckInDays
  };
};

const evaluateRule = (rule, stats) => {
  switch (rule.rule_type) {
    case 'occupancy_ceiling': {
      if (typeof rule.threshold !== 'number') return false;
      return stats.occupancy >= rule.threshold;
    }
    case 'lead_time_protect': {
      if (typeof rule.lead_time_days !== 'number') return false;
      if (stats.soonest_check_in_days === null) return false;
      return stats.soonest_check_in_days <= rule.lead_time_days;
    }
    default:
      return false;
  }
};

const defaultReasonForRule = (rule, stats) => {
  switch (rule.rule_type) {
    case 'occupancy_ceiling':
      return `Automatisk ${rule.action === 'auto_close' ? 'lukket' : 'åben'} – belægning ${(stats.occupancy * 100).toFixed(
        1
      )}%`;
    case 'lead_time_protect':
      return `Automatisk ${rule.action === 'auto_close' ? 'lukket' : 'åben'} – kort varsel (${stats.soonest_check_in_days} dage)`;
    default:
      return 'Automatisk opdatering';
  }
};

export const runChannelAutomation = async () => {
  const [configs, rules, stats] = await Promise.all([
    listChannelConfigs(),
    listChannelRules(),
    getOccupancyStats()
  ]);

  const activeRules = rules.filter((rule) => rule.active === 1);
  const triggered = [];
  const nowIso = dateToISO(new Date());

  for (const config of configs) {
    let autoStatus = 'open';
    let autoReason = null;

    for (const rule of activeRules) {
      if (rule.channel !== 'all' && rule.channel !== config.channel) {
        continue;
      }

      const isTriggered = evaluateRule(rule, stats);
      if (!isTriggered) {
        continue;
      }

      autoStatus = rule.action === 'auto_close' ? 'auto_closed' : 'open';
      autoReason = rule.description || defaultReasonForRule(rule, stats);
      triggered.push({ channel: config.channel, rule_id: rule.id, autoStatus });

      await updateChannelRule(rule.id, {
        last_triggered: nowIso,
        last_result: `${config.channel} -> ${autoStatus}`
      });

      break;
    }

    await updateChannelConfig(config.channel, {
      auto_status: autoStatus,
      auto_reason: autoReason,
      last_auto_update: nowIso
    });
  }

  return { stats, triggered };
};

export const startChannelAutomationScheduler = (intervalMinutes = DEFAULT_AUTOMATION_INTERVAL) => {
  if (automationInterval) {
    clearInterval(automationInterval);
  }

  if (intervalMinutes <= 0) {
    console.warn('Channel automation scheduler disabled (interval <= 0)');
    return null;
  }

  automationInterval = setInterval(() => {
    runChannelAutomation().catch((error) => {
      console.error('Channel automation error:', error);
    });
  }, intervalMinutes * 60 * 1000);

  console.log(`⚙️  Channel automation running every ${intervalMinutes} minutes`);
  return automationInterval;
};

export const stopChannelAutomationScheduler = () => {
  if (automationInterval) {
    clearInterval(automationInterval);
    automationInterval = null;
  }
};


