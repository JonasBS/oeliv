import { useState, useEffect, useCallback } from 'react';

interface Webhook {
  id: number;
  name: string;
  url: string;
  secret?: string;
  events: string;
  headers?: string;
  active: number;
  retry_count: number;
  timeout_ms: number;
  created_at: string;
  updated_at: string;
}

interface WebhookLog {
  id: number;
  webhook_id: number;
  event_type: string;
  payload: string;
  response_status?: number;
  response_body?: string;
  success: number;
  attempts: number;
  error_message?: string;
  created_at: string;
}

interface EventInfo {
  events: string[];
  descriptions: Record<string, string>;
  categories?: Record<string, string[]>;
}

const API_BASE = 'http://localhost:3000/api';

const WebhooksTab = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingWebhook, setEditingWebhook] = useState<Partial<Webhook> | null>(null);
  const [showLogs, setShowLogs] = useState<number | null>(null);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [testingId, setTestingId] = useState<number | null>(null);

  const fetchWebhooks = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/webhooks`);
      if (!response.ok) throw new Error('Failed to fetch webhooks');
      const data = await response.json();
      setWebhooks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEventInfo = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/webhooks/events`);
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      setEventInfo(data);
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
    fetchEventInfo();
  }, [fetchWebhooks, fetchEventInfo]);

  const fetchLogs = async (webhookId: number) => {
    try {
      const response = await fetch(`${API_BASE}/webhooks/${webhookId}/logs`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      setLogs(data);
      setShowLogs(webhookId);
    } catch (err) {
      alert('Kunne ikke hente logs');
    }
  };

  const handleSave = async () => {
    if (!editingWebhook?.name || !editingWebhook?.url) {
      alert('Navn og URL er påkrævet');
      return;
    }

    try {
      const method = editingWebhook.id ? 'PUT' : 'POST';
      const url = editingWebhook.id 
        ? `${API_BASE}/webhooks/${editingWebhook.id}`
        : `${API_BASE}/webhooks`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingWebhook)
      });

      if (!response.ok) throw new Error('Failed to save webhook');
      
      setEditingWebhook(null);
      fetchWebhooks();
    } catch (err) {
      alert('Kunne ikke gemme webhook');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Er du sikker på du vil slette denne webhook?')) return;

    try {
      const response = await fetch(`${API_BASE}/webhooks/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete webhook');
      fetchWebhooks();
    } catch (err) {
      alert('Kunne ikke slette webhook');
    }
  };

  const handleToggleActive = async (webhook: Webhook) => {
    try {
      const response = await fetch(`${API_BASE}/webhooks/${webhook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: webhook.active ? 0 : 1 })
      });
      if (!response.ok) throw new Error('Failed to update webhook');
      fetchWebhooks();
    } catch (err) {
      alert('Kunne ikke opdatere webhook');
    }
  };

  const handleTest = async (id: number) => {
    setTestingId(id);
    try {
      const response = await fetch(`${API_BASE}/webhooks/${id}/test`, { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        alert('✅ Test webhook sendt succesfuldt!');
      } else {
        alert(`❌ Test fejlede: ${result.error || 'Ukendt fejl'}`);
      }
    } catch (err) {
      alert('Kunne ikke sende test webhook');
    } finally {
      setTestingId(null);
    }
  };

  const handleEventToggle = (event: string) => {
    if (!editingWebhook) return;
    
    const currentEvents = editingWebhook.events?.split(',').map(e => e.trim()).filter(Boolean) || [];
    
    if (currentEvents.includes('all')) {
      // If 'all' is selected, switch to just this event
      setEditingWebhook({ ...editingWebhook, events: event });
    } else if (currentEvents.includes(event)) {
      // Remove event
      const newEvents = currentEvents.filter(e => e !== event);
      setEditingWebhook({ ...editingWebhook, events: newEvents.length ? newEvents.join(',') : 'all' });
    } else {
      // Add event
      setEditingWebhook({ ...editingWebhook, events: [...currentEvents, event].join(',') });
    }
  };

  if (loading) return <div className="loading">Indlæser webhooks...</div>;
  if (error) return <div className="error">Fejl: {error}</div>;

  return (
    <div className="webhooks-tab">
      <div className="webhooks-header">
        <div className="webhooks-intro">
          <h3>🔗 Webhooks</h3>
          <p>Send automatiske beskeder til eksterne systemer (f.eks. Home Assistant) når bookinger oprettes, bekræftes eller annulleres.</p>
        </div>
        <button 
          type="button" 
          className="btn-primary"
          onClick={() => setEditingWebhook({ 
            name: '', 
            url: '', 
            events: 'all', 
            active: 1,
            retry_count: 3,
            timeout_ms: 5000
          })}
        >
          + Tilføj Webhook
        </button>
      </div>

      {webhooks.length === 0 ? (
        <div className="empty-state">
          <p>Ingen webhooks konfigureret endnu.</p>
          <p className="hint">Tilføj en webhook for at sende events til Home Assistant eller andre systemer.</p>
        </div>
      ) : (
        <div className="webhooks-list">
          {webhooks.map(webhook => (
            <div key={webhook.id} className={`webhook-card ${webhook.active ? '' : 'inactive'}`}>
              <div className="webhook-header">
                <div className="webhook-info">
                  <h4>{webhook.name}</h4>
                  <code className="webhook-url">{webhook.url}</code>
                </div>
                <div className="webhook-status">
                  <span className={`status-badge ${webhook.active ? 'active' : 'inactive'}`}>
                    {webhook.active ? '✅ Aktiv' : '⏸️ Inaktiv'}
                  </span>
                </div>
              </div>
              
              <div className="webhook-events">
                <strong>Events:</strong> {webhook.events === 'all' ? 'Alle events' : webhook.events.split(',').join(', ')}
              </div>

              <div className="webhook-actions">
                <button 
                  type="button" 
                  className="btn-small"
                  onClick={() => handleToggleActive(webhook)}
                >
                  {webhook.active ? 'Deaktiver' : 'Aktiver'}
                </button>
                <button 
                  type="button" 
                  className="btn-small"
                  onClick={() => handleTest(webhook.id)}
                  disabled={testingId === webhook.id}
                >
                  {testingId === webhook.id ? 'Sender...' : '🧪 Test'}
                </button>
                <button 
                  type="button" 
                  className="btn-small"
                  onClick={() => fetchLogs(webhook.id)}
                >
                  📋 Logs
                </button>
                <button 
                  type="button" 
                  className="btn-small"
                  onClick={() => setEditingWebhook(webhook)}
                >
                  ✏️ Rediger
                </button>
                <button 
                  type="button" 
                  className="btn-small btn-danger"
                  onClick={() => handleDelete(webhook.id)}
                >
                  🗑️ Slet
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create Modal */}
      {editingWebhook && (
        <div className="modal-overlay" onClick={() => setEditingWebhook(null)}>
          <div className="modal-content webhook-modal" onClick={e => e.stopPropagation()}>
            <h3>{editingWebhook.id ? 'Rediger Webhook' : 'Ny Webhook'}</h3>
            
            <div className="form-group">
              <label htmlFor="webhook-name">Navn</label>
              <input
                id="webhook-name"
                type="text"
                value={editingWebhook.name || ''}
                onChange={e => setEditingWebhook({ ...editingWebhook, name: e.target.value })}
                placeholder="F.eks. Home Assistant"
              />
            </div>

            <div className="form-group">
              <label htmlFor="webhook-url">URL</label>
              <input
                id="webhook-url"
                type="url"
                value={editingWebhook.url || ''}
                onChange={e => setEditingWebhook({ ...editingWebhook, url: e.target.value })}
                placeholder="https://homeassistant.local:8123/api/webhook/..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="webhook-secret">Secret (valgfrit)</label>
              <input
                id="webhook-secret"
                type="text"
                value={editingWebhook.secret || ''}
                onChange={e => setEditingWebhook({ ...editingWebhook, secret: e.target.value })}
                placeholder="Bruges til at signere webhook payloads"
              />
            </div>

            <div className="form-group">
              <label>Events</label>
              <div className="events-selector">
                <label className="event-checkbox all-events">
                  <input
                    type="checkbox"
                    checked={editingWebhook.events === 'all'}
                    onChange={() => setEditingWebhook({ ...editingWebhook, events: 'all' })}
                  />
                  <span>✨ Alle events</span>
                </label>
                
                {eventInfo?.categories && Object.entries(eventInfo.categories).map(([category, events]) => (
                  <div key={category} className="event-category">
                    <div className="event-category-header">
                      {category === 'booking' && '📅 Booking'}
                      {category === 'room' && '🏠 Værelse'}
                      {category === 'sauna' && '🧖 Sauna'}
                    </div>
                    {events.map(event => (
                      <label key={event} className="event-checkbox">
                        <input
                          type="checkbox"
                          checked={editingWebhook.events !== 'all' && editingWebhook.events?.includes(event)}
                          onChange={() => handleEventToggle(event)}
                          disabled={editingWebhook.events === 'all'}
                        />
                        <span>
                          {event.split('.')[1]}
                          <small>{eventInfo.descriptions[event]}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                ))}
                
                {/* Fallback if no categories */}
                {!eventInfo?.categories && eventInfo?.events.map(event => (
                  <label key={event} className="event-checkbox">
                    <input
                      type="checkbox"
                      checked={editingWebhook.events !== 'all' && editingWebhook.events?.includes(event)}
                      onChange={() => handleEventToggle(event)}
                      disabled={editingWebhook.events === 'all'}
                    />
                    <span>
                      {event}
                      <small>{eventInfo.descriptions[event]}</small>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="webhook-retries">Forsøg</label>
                <input
                  id="webhook-retries"
                  type="number"
                  min="1"
                  max="10"
                  value={editingWebhook.retry_count || 3}
                  onChange={e => setEditingWebhook({ ...editingWebhook, retry_count: parseInt(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="webhook-timeout">Timeout (ms)</label>
                <input
                  id="webhook-timeout"
                  type="number"
                  min="1000"
                  max="30000"
                  step="1000"
                  value={editingWebhook.timeout_ms || 5000}
                  onChange={e => setEditingWebhook({ ...editingWebhook, timeout_ms: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setEditingWebhook(null)}>
                Annuller
              </button>
              <button type="button" className="btn-primary" onClick={handleSave}>
                Gem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {showLogs && (
        <div className="modal-overlay" onClick={() => setShowLogs(null)}>
          <div className="modal-content logs-modal" onClick={e => e.stopPropagation()}>
            <h3>Webhook Logs</h3>
            
            {logs.length === 0 ? (
              <p>Ingen logs endnu</p>
            ) : (
              <div className="logs-list">
                {logs.map(log => (
                  <div key={log.id} className={`log-entry ${log.success ? 'success' : 'failed'}`}>
                    <div className="log-header">
                      <span className="log-status">{log.success ? '✅' : '❌'}</span>
                      <span className="log-event">{log.event_type}</span>
                      <span className="log-time">{new Date(log.created_at).toLocaleString('da-DK')}</span>
                    </div>
                    <div className="log-details">
                      {log.response_status && <span>Status: {log.response_status}</span>}
                      {log.attempts > 1 && <span>Forsøg: {log.attempts}</span>}
                      {log.error_message && <span className="log-error">{log.error_message}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowLogs(null)}>
                Luk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Home Assistant Setup Guide */}
      <div className="setup-guide">
        <h4>🏠 Home Assistant Integration</h4>
        <p>For at forbinde med Home Assistant:</p>
        <ol>
          <li>Gå til <strong>Settings → Automations → Create Automation</strong></li>
          <li>Vælg <strong>Webhook</strong> som trigger</li>
          <li>Kopier webhook URL'en og indsæt den ovenfor</li>
          <li>Tilføj actions for at styre varmepumpe eller sauna</li>
        </ol>
        
        <div className="setup-examples">
          <details>
            <summary>🌡️ Varmepumpe payload</summary>
            <pre>{`{
  "event": "room.occupied",
  "data": {
    "room_id": 1,
    "room_name": "Kystværelse",
    "status": "pre_arrival",
    "hvac": {
      "action": "comfort",
      "target_temperature": 21,
      "mode": "heat"
    }
  }
}`}</pre>
          </details>
          
          <details>
            <summary>🧖 Sauna payload</summary>
            <pre>{`{
  "event": "sauna.preheat",
  "data": {
    "action": "preheat",
    "sauna": {
      "power": "on",
      "target_temperature": 80,
      "preheat_minutes": 45
    },
    "booking_id": 123,
    "guest_name": "Jonas",
    "check_in": "2025-12-01"
  }
}`}</pre>
          </details>
        </div>
      </div>
    </div>
  );
};

export default WebhooksTab;

