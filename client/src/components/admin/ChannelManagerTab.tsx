import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { channelApi } from '../../services/api';
import type { ChannelConfig, ChannelRule, ChannelAutomationSummary } from '../../types';

interface ChannelBooking {
  id: number;
  channel: string;
  external_id: string;
  room_id: number;
  check_in: string;
  check_out: string;
  guests: number;
  guest_name: string;
  status: string;
  synced_at: string;
}

const ChannelManagerTab = () => {
  const [bookings, setBookings] = useState<ChannelBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [configs, setConfigs] = useState<ChannelConfig[]>([]);
  const [configLoading, setConfigLoading] = useState(true);
  const [rules, setRules] = useState<ChannelRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [configDrafts, setConfigDrafts] = useState<Record<string, Partial<ChannelConfig>>>({});
  const [savingChannel, setSavingChannel] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [automationSummary, setAutomationSummary] = useState<ChannelAutomationSummary | null>(null);
  const [runningAutomation, setRunningAutomation] = useState(false);
  const [ruleSubmitting, setRuleSubmitting] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    channel: 'all',
    rule_type: 'occupancy_ceiling',
    thresholdPercent: 75,
    leadTimeDays: 7,
    action: 'auto_close',
    active: true,
    description: ''
  });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadChannelBookings();
    loadChannelConfigs();
    loadChannelRules();
  }, []);

  const loadChannelBookings = async () => {
    setBookingsLoading(true);
    try {
      const mockData: ChannelBooking[] = [
        {
          id: 1,
          channel: 'Booking.com',
          external_id: 'BK123456',
          room_id: 1,
          check_in: '2025-12-01',
          check_out: '2025-12-03',
          guests: 2,
          guest_name: 'John Doe',
          status: 'confirmed',
          synced_at: new Date().toISOString(),
        },
        {
          id: 2,
          channel: 'Airbnb',
          external_id: 'AB789012',
          room_id: 2,
          check_in: '2025-12-05',
          check_out: '2025-12-08',
          guests: 4,
          guest_name: 'Jane Smith',
          status: 'confirmed',
          synced_at: new Date().toISOString(),
        },
      ];
      setBookings(mockData);
    } catch (error) {
      console.error('Error loading channel bookings:', error);
    } finally {
      setBookingsLoading(false);
    }
  };

  const loadChannelConfigs = async () => {
    setConfigLoading(true);
    try {
      const data = await channelApi.getConfigs();
      setConfigs(data);
    } catch (error) {
      console.error('Error loading channel configs:', error);
    } finally {
      setConfigLoading(false);
    }
  };

  const loadChannelRules = async () => {
    setRulesLoading(true);
    try {
      const data = await channelApi.getRules();
      setRules(data);
    } catch (error) {
      console.error('Error loading channel rules:', error);
    } finally {
      setRulesLoading(false);
    }
  };

  const syncChannels = async () => {
    setSyncing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadChannelBookings();
    } catch (error) {
      console.error('Error syncing channels:', error);
    } finally {
      setSyncing(false);
    }
  };

  const filteredBookings = useMemo(() => {
    if (filter === 'all') return bookings;
    return bookings.filter((b) => b.channel.toLowerCase().includes(filter.toLowerCase()));
  }, [bookings, filter]);

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'booking.com': return '🏨';
      case 'airbnb': return '🏠';
      case 'expedia': return '✈️';
      default: return '📱';
    }
  };

  const pendingChanges = (channel: string) => {
    const draft = configDrafts[channel];
    return draft && Object.keys(draft).length > 0;
  };

  const getConfigValue = <K extends keyof ChannelConfig>(config: ChannelConfig, key: K) => {
    const draft = configDrafts[config.channel];
    if (draft && draft[key] !== undefined) {
      return draft[key] as ChannelConfig[K];
    }
    return config[key];
  };

  const handleConfigFieldChange = (channel: string, field: keyof ChannelConfig, value: any) => {
    setConfigDrafts((prev) => ({
      ...prev,
      [channel]: {
        ...(prev[channel] || {}),
        [field]: value
      }
    }));
  };

  const handleSaveConfig = async (channel: string) => {
    const updates = configDrafts[channel];
    if (!updates || Object.keys(updates).length === 0) return;

    try {
      setSavingChannel(channel);
      await channelApi.updateConfig(channel, updates);
      await loadChannelConfigs();
      setConfigDrafts((prev) => {
        const next = { ...prev };
        delete next[channel];
        return next;
      });
      alert('✅ Kanal opdateret');
    } catch (error) {
      console.error('Error saving channel config:', error);
      alert('❌ Kunne ikke gemme kanal');
    } finally {
      setSavingChannel(null);
    }
  };

  const handleResetConfig = (channel: string) => {
    setConfigDrafts((prev) => {
      const next = { ...prev };
      delete next[channel];
      return next;
    });
  };

  const handleRunAutomation = async () => {
    try {
      setRunningAutomation(true);
      const result = await channelApi.runAutomation();
      setAutomationSummary(result.summary);
      setConfigs(result.configs);
    } catch (error) {
      console.error('Automation error:', error);
      alert('❌ Kunne ikke køre automatiske regler');
    } finally {
      setRunningAutomation(false);
    }
  };

  const handleRuleFieldChange = (field: string, value: string | number | boolean) => {
    setRuleForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRuleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setRuleSubmitting(true);
      const payload: any = {
        channel: ruleForm.channel,
        rule_type: ruleForm.rule_type,
        action: ruleForm.action,
        active: ruleForm.active ? 1 : 0,
        description: ruleForm.description
      };

      if (ruleForm.rule_type === 'occupancy_ceiling') {
        payload.threshold = Number(ruleForm.thresholdPercent) / 100;
      }

      if (ruleForm.rule_type === 'lead_time_protect') {
        payload.lead_time_days = Number(ruleForm.leadTimeDays);
      }

      await channelApi.createRule(payload);
      await loadChannelRules();
      setRuleForm({
        channel: 'all',
        rule_type: 'occupancy_ceiling',
        thresholdPercent: 75,
        leadTimeDays: 7,
        action: 'auto_close',
        active: true,
        description: ''
      });
    } catch (error) {
      console.error('Error creating rule:', error);
      alert('❌ Kunne ikke oprette regel');
    } finally {
      setRuleSubmitting(false);
    }
  };

  const handleToggleRule = async (rule: ChannelRule, isActive: boolean) => {
    try {
      await channelApi.updateRule(rule.id, { active: isActive ? 1 : 0 });
      await loadChannelRules();
    } catch (error) {
      console.error('Error updating rule:', error);
      alert('❌ Kunne ikke opdatere regel');
    }
  };

  const handleDeleteRule = async (id: number) => {
    if (!confirm('Er du sikker på at du vil slette denne regel?')) return;
    try {
      await channelApi.deleteRule(id);
      await loadChannelRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      alert('❌ Kunne ikke slette regel');
    }
  };

  const formatRuleDescription = (rule: ChannelRule) => {
    if (rule.rule_type === 'occupancy_ceiling') {
      return `Luk når belægning ≥ ${(Number(rule.threshold || 0) * 100).toFixed(0)}%`;
    }
    if (rule.rule_type === 'lead_time_protect') {
      return `Luk ved forespørgsler under ${rule.lead_time_days} dage før ankomst`;
    }
    return rule.description || 'Automationsregel';
  };

  const channelName = (channelKey: string) => {
    if (channelKey === 'all') return 'Alle kanaler';
    const match = configs.find((cfg) => cfg.channel === channelKey);
    return match?.display_name || channelKey;
  };

  const automationStats = automationSummary?.stats;
  const occupancyPercent = automationStats ? (automationStats.occupancy * 100).toFixed(1) : null;
  const autoClosed = configs.filter((cfg) => cfg.auto_status === 'auto_closed').length;
  const totalChannels = configs.length;

  const initialLoading = bookingsLoading && configLoading && rulesLoading;

  if (initialLoading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Indlæser channel bookings...</p>
      </div>
    );
  }

  return (
    <div className="channel-manager-tab">
      <div className="tab-header">
        <h2>Channel Manager ({filteredBookings.length})</h2>
        <div className="channel-actions">
          <button 
            onClick={syncChannels}
            className="sync-btn"
            disabled={syncing}
          >
            {syncing ? '🔄 Synkroniserer...' : '🔄 Synkroniser'}
          </button>
        </div>
      </div>

      <div className="channel-automation-summary">
        <div>
          <p className="summary-label">Belægning (30 dage)</p>
          <p className="summary-value">{occupancyPercent ? `${occupancyPercent}%` : '—'}</p>
        </div>
        <div>
          <p className="summary-label">Auto-lukkede kanaler</p>
          <p className="summary-value">{autoClosed}/{totalChannels}</p>
        </div>
        <div>
          <p className="summary-label">Sidste kørsel</p>
          <p className="summary-value">
            {automationSummary?.stats
              ? new Date().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })
              : '—'}
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={handleRunAutomation}
          disabled={runningAutomation}
          type="button"
        >
          {runningAutomation ? '⚙️ Kører...' : '⚙️ Kør automatiske regler'}
        </button>
      </div>

      <div className="channel-config-grid">
        {configLoading ? (
          <div className="admin-loading small">
            <div className="spinner"></div>
            <p>Henter konfigurationer...</p>
          </div>
        ) : configs.length === 0 ? (
          <p>Ingen kanaler fundet</p>
        ) : (
          configs.map((config) => (
            <div key={config.channel} className="channel-config-card">
              <div className="channel-config-header">
                <div>
                  <h3>{config.display_name}</h3>
                  <p className="channel-key">{config.channel}</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(getConfigValue(config, 'enabled'))}
                    onChange={(event) =>
                      handleConfigFieldChange(
                        config.channel,
                        'enabled',
                        event.target.checked ? 1 : 0
                      )
                    }
                  />
                  <span>Aktiv</span>
                </label>
              </div>

              <div className="channel-status-row">
                <span className={`status-badge ${config.auto_status === 'auto_closed' ? 'status-inactive' : 'status-active'}`}>
                  {config.auto_status === 'auto_closed' ? 'Auto lukket' : 'Åben'}
                </span>
                {config.auto_reason && (
                  <small>{config.auto_reason}</small>
                )}
              </div>

              <div className="channel-fields">
                <div className="form-group">
                  <label>Brugernavn</label>
                  <input
                    type="text"
                    className="form-input"
                    value={(getConfigValue(config, 'username') as string) || ''}
                    onChange={(event) =>
                      handleConfigFieldChange(config.channel, 'username', event.target.value)
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Password / API secret</label>
                  <input
                    type="text"
                    className="form-input"
                    value={(getConfigValue(config, 'password') as string) || ''}
                    onChange={(event) =>
                      handleConfigFieldChange(config.channel, 'password', event.target.value)
                    }
                  />
                </div>
                <div className="form-group">
                  <label>API Key</label>
                  <input
                    type="text"
                    className="form-input"
                    value={(getConfigValue(config, 'api_key') as string) || ''}
                    onChange={(event) =>
                      handleConfigFieldChange(config.channel, 'api_key', event.target.value)
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Property ID</label>
                  <input
                    type="text"
                    className="form-input"
                    value={(getConfigValue(config, 'property_id') as string) || ''}
                    onChange={(event) =>
                      handleConfigFieldChange(config.channel, 'property_id', event.target.value)
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Noter</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={(getConfigValue(config, 'notes') as string) || ''}
                    onChange={(event) =>
                      handleConfigFieldChange(config.channel, 'notes', event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="channel-config-footer">
                <div>
                  <small>Sidst auto-opdateret:</small>
                  <strong>
                    {config.last_auto_update
                      ? new Date(config.last_auto_update).toLocaleString('da-DK')
                      : '—'}
                  </strong>
                </div>
                <div className="channel-config-actions">
                  {pendingChanges(config.channel) && (
                    <>
                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={() => handleResetConfig(config.channel)}
                      >
                        Nulstil
                      </button>
                      <button
                        className="btn-primary"
                        type="button"
                        onClick={() => handleSaveConfig(config.channel)}
                        disabled={savingChannel === config.channel}
                      >
                        {savingChannel === config.channel ? 'Gemmer...' : 'Gem kanal'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <section className="channel-rules-section">
        <div className="section-header">
          <h3>Automatiske regler</h3>
          <p>Skru op eller ned for OTA-eksponering afhængig af belægning og forespørgsler.</p>
        </div>

        {rulesLoading ? (
          <div className="admin-loading small">
            <div className="spinner"></div>
            <p>Indlæser regler...</p>
          </div>
        ) : rules.length === 0 ? (
          <p className="empty-state-sub">Ingen regler endnu – tilføj din første herunder.</p>
        ) : (
          <div className="channel-rules-list">
            {rules.map((rule) => (
              <div key={rule.id} className="channel-rule-card">
                <div>
                  <p className="rule-channel">{channelName(rule.channel)}</p>
                  <h4>{formatRuleDescription(rule)}</h4>
                  {rule.description && <p className="rule-note">{rule.description}</p>}
                  {rule.last_triggered && (
                    <small>
                      Sidst trigget {new Date(rule.last_triggered).toLocaleString('da-DK')}
                    </small>
                  )}
                </div>
                <div className="rule-actions">
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={rule.active === 1}
                      onChange={(event) => handleToggleRule(rule, event.target.checked)}
                    />
                    <span>Aktiv</span>
                  </label>
                  <button
                    type="button"
                    className="btn-icon delete-btn"
                    onClick={() => handleDeleteRule(rule.id)}
                    aria-label="Slet regel"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <form className="channel-rule-form" onSubmit={handleRuleSubmit}>
          <h4>Ny regel</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Kanal</label>
              <select
                className="form-select"
                value={ruleForm.channel}
                onChange={(event) => handleRuleFieldChange('channel', event.target.value)}
              >
                <option value="all">Alle kanaler</option>
                {configs.map((config) => (
                  <option key={config.channel} value={config.channel}>
                    {config.display_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Regel type</label>
              <select
                className="form-select"
                value={ruleForm.rule_type}
                onChange={(event) => handleRuleFieldChange('rule_type', event.target.value)}
              >
                <option value="occupancy_ceiling">Belægningsgrænse</option>
                <option value="lead_time_protect">Lead time beskyttelse</option>
              </select>
            </div>
            <div className="form-group">
              <label>Handling</label>
              <select
                className="form-select"
                value={ruleForm.action}
                onChange={(event) => handleRuleFieldChange('action', event.target.value)}
              >
                <option value="auto_close">Luk kanal</option>
                <option value="auto_open">Åbn kanal</option>
              </select>
            </div>
          </div>

          {ruleForm.rule_type === 'occupancy_ceiling' && (
            <div className="form-group">
              <label>Luk ved belægning (%)</label>
              <input
                type="number"
                className="form-input"
                min={10}
                max={100}
                value={ruleForm.thresholdPercent}
                onChange={(event) =>
                  handleRuleFieldChange('thresholdPercent', Number(event.target.value))
                }
              />
            </div>
          )}

          {ruleForm.rule_type === 'lead_time_protect' && (
            <div className="form-group">
              <label>Luk ved forespørgsler under (dage)</label>
              <input
                type="number"
                className="form-input"
                min={1}
                max={30}
                value={ruleForm.leadTimeDays}
                onChange={(event) =>
                  handleRuleFieldChange('leadTimeDays', Number(event.target.value))
                }
              />
            </div>
          )}

          <div className="form-group">
            <label>Beskrivelse (valgfrit)</label>
            <input
              type="text"
              className="form-input"
              value={ruleForm.description}
              onChange={(event) => handleRuleFieldChange('description', event.target.value)}
            />
          </div>

          <div className="form-footer">
            <label className="toggle">
              <input
                type="checkbox"
                checked={ruleForm.active}
                onChange={(event) => handleRuleFieldChange('active', event.target.checked)}
              />
              <span>Aktiv ved oprettelse</span>
            </label>
            <button className="btn-primary" type="submit" disabled={ruleSubmitting}>
              {ruleSubmitting ? 'Tilføjer...' : 'Tilføj regel'}
            </button>
          </div>
        </form>
      </section>

      <div className="channel-filter">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
          type="button"
        >
          Alle Kanaler
        </button>
        <button 
          className={`filter-btn ${filter === 'booking' ? 'active' : ''}`}
          onClick={() => setFilter('booking')}
          type="button"
        >
          🏨 Booking.com
        </button>
        <button 
          className={`filter-btn ${filter === 'airbnb' ? 'active' : ''}`}
          onClick={() => setFilter('airbnb')}
          type="button"
        >
          🏠 Airbnb
        </button>
        <button 
          className={`filter-btn ${filter === 'expedia' ? 'active' : ''}`}
          onClick={() => setFilter('expedia')}
          type="button"
        >
          ✈️ Expedia
        </button>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="empty-state">
          <p>📱 Ingen channel bookings fundet</p>
          <p className="empty-state-sub">
            Konfigurer dine OTA integrationer for at se bookings herfra
          </p>
        </div>
      ) : (
        <div className="channel-bookings-grid">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="channel-booking-card">
              <div className="channel-booking-header">
                <div className="channel-info">
                  <span className="channel-icon">{getChannelIcon(booking.channel)}</span>
                  <div>
                    <h3>{booking.channel}</h3>
                    <span className="external-id">ID: {booking.external_id}</span>
                  </div>
                </div>
                <span className="status-badge status-confirmed">
                  {booking.status}
                </span>
              </div>

              <div className="channel-booking-body">
                <div className="booking-info">
                  <div className="info-row">
                    <span className="info-label">Gæst:</span>
                    <span className="info-value">{booking.guest_name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Check-in:</span>
                    <span className="info-value">
                      {format(new Date(booking.check_in), 'dd. MMM yyyy', { locale: da })}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Check-out:</span>
                    <span className="info-value">
                      {format(new Date(booking.check_out), 'dd. MMM yyyy', { locale: da })}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Gæster:</span>
                    <span className="info-value">{booking.guests}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Værelse ID:</span>
                    <span className="info-value">#{booking.room_id}</span>
                  </div>
                </div>
              </div>

              <div className="channel-booking-footer">
                <small>
                  Synkroniseret: {format(new Date(booking.synced_at), 'dd. MMM yyyy HH:mm', { locale: da })}
                </small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChannelManagerTab;

