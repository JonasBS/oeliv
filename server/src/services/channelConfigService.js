import { dbAll, dbGet, dbRun } from '../database/db.js';

const CONFIG_UPDATABLE_FIELDS = [
  'enabled',
  'auto_status',
  'auto_reason',
  'username',
  'password',
  'api_key',
  'api_secret',
  'account_id',
  'property_id',
  'commission_rate',
  'markup_percentage',
  'priority',
  'notes',
  'settings',
  'last_synced',
  'last_error',
  'last_auto_update'
];

const RULE_UPDATABLE_FIELDS = [
  'channel',
  'rule_type',
  'threshold',
  'lead_time_days',
  'action',
  'active',
  'description',
  'settings',
  'last_triggered',
  'last_result'
];

export const listChannelConfigs = async () => {
  return dbAll(`SELECT * FROM channel_configs ORDER BY priority DESC, channel ASC`);
};

export const getChannelConfig = async (channel) => {
  return dbGet(`SELECT * FROM channel_configs WHERE channel = ?`, [channel]);
};

export const updateChannelConfig = async (channel, updates = {}) => {
  const keys = Object.keys(updates).filter((key) => CONFIG_UPDATABLE_FIELDS.includes(key));

  if (keys.length === 0) {
    throw new Error('No valid fields provided for update');
  }

  const setClause = keys.map((key) => `${key} = ?`).join(', ');
  const params = keys.map((key) => updates[key]);
  params.push(channel);

  await dbRun(`UPDATE channel_configs SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE channel = ?`, params);
  return getChannelConfig(channel);
};

export const listChannelRules = async () => {
  return dbAll(`SELECT * FROM channel_rules ORDER BY created_at DESC`);
};

export const getChannelRule = async (id) => {
  return dbGet(`SELECT * FROM channel_rules WHERE id = ?`, [id]);
};

export const createChannelRule = async (rule) => {
  const fields = [
    'channel',
    'rule_type',
    'threshold',
    'lead_time_days',
    'action',
    'active',
    'description',
    'settings'
  ];

  const values = fields.map((field) => rule[field] ?? null);
  const placeholders = fields.map(() => '?').join(', ');

  const result = await dbRun(
    `INSERT INTO channel_rules (${fields.join(', ')}) VALUES (${placeholders})`,
    values
  );

  return getChannelRule(result.lastID);
};

export const updateChannelRule = async (id, updates = {}) => {
  const keys = Object.keys(updates).filter((key) => RULE_UPDATABLE_FIELDS.includes(key));

  if (keys.length === 0) {
    throw new Error('No valid fields provided for update');
  }

  const setClause = keys.map((key) => `${key} = ?`).join(', ');
  const params = keys.map((key) => updates[key]);
  params.push(id);

  await dbRun(`UPDATE channel_rules SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, params);
  return getChannelRule(id);
};

export const deleteChannelRule = async (id) => {
  await dbRun(`DELETE FROM channel_rules WHERE id = ?`, [id]);
  return { success: true };
};

