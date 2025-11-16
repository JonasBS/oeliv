import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

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
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadChannelBookings();
  }, []);

  const loadChannelBookings = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would call the channel API
      // For now, we'll show a placeholder
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
      setLoading(false);
    }
  };

  const syncChannels = async () => {
    setSyncing(true);
    try {
      // Simulate sync delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadChannelBookings();
    } catch (error) {
      console.error('Error syncing channels:', error);
    } finally {
      setSyncing(false);
    }
  };

  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(b => b.channel.toLowerCase().includes(filter.toLowerCase()));

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'booking.com': return '🏨';
      case 'airbnb': return '🏠';
      case 'expedia': return '✈️';
      default: return '📱';
    }
  };

  if (loading) {
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

      <div className="channel-filter">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Alle Kanaler
        </button>
        <button 
          className={`filter-btn ${filter === 'booking' ? 'active' : ''}`}
          onClick={() => setFilter('booking')}
        >
          🏨 Booking.com
        </button>
        <button 
          className={`filter-btn ${filter === 'airbnb' ? 'active' : ''}`}
          onClick={() => setFilter('airbnb')}
        >
          🏠 Airbnb
        </button>
        <button 
          className={`filter-btn ${filter === 'expedia' ? 'active' : ''}`}
          onClick={() => setFilter('expedia')}
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

      <div className="channel-setup-info">
        <h3>📋 Konfigurer OTA Integrationer</h3>
        <p>
          Channel Manager forbinder ØLIV med online rejsebureauer (OTAs) som Booking.com, Airbnb og Expedia.
          Når du konfigurerer disse integrationer, vil bookings automatisk blive synkroniseret hertil.
        </p>
        <div className="channel-status-grid">
          <div className="channel-status-card">
            <h4>🏨 Booking.com</h4>
            <span className="status-badge status-inactive">Ikke konfigureret</span>
          </div>
          <div className="channel-status-card">
            <h4>🏠 Airbnb</h4>
            <span className="status-badge status-inactive">Ikke konfigureret</span>
          </div>
          <div className="channel-status-card">
            <h4>✈️ Expedia</h4>
            <span className="status-badge status-inactive">Ikke konfigureret</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelManagerTab;

