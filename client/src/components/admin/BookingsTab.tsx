import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { bookingsApi } from '../../services/api';

interface Booking {
  id: number;
  room_id: number;
  check_in: string;
  check_out: string;
  guests: number;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  notes?: string;
  status: string;
  source: string;
  total_price?: number;
  created_at: string;
}

const BookingsTab = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingsApi.getAll();
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId: number, newStatus: string) => {
    try {
      await bookingsApi.updateStatus(bookingId, newStatus);
      await loadBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#4caf50';
      case 'pending': return '#ff9800';
      case 'cancelled': return '#f44336';
      default: return '#757575';
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Indlæser bookings...</p>
      </div>
    );
  }

  return (
    <div className="bookings-tab">
      <div className="tab-header">
        <h2>Bookings ({filteredBookings.length})</h2>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Alle
          </button>
          <button 
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Afventende
          </button>
          <button 
            className={`filter-btn ${filter === 'confirmed' ? 'active' : ''}`}
            onClick={() => setFilter('confirmed')}
          >
            Bekræftet
          </button>
          <button 
            className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setFilter('cancelled')}
          >
            Annulleret
          </button>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="empty-state">
          <p>Ingen bookings fundet</p>
        </div>
      ) : (
        <div className="bookings-grid">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="booking-card">
              <div className="booking-card-header">
                <div>
                  <h3>Booking #{booking.id}</h3>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(booking.status) }}
                  >
                    {booking.status}
                  </span>
                </div>
                <div className="booking-source">{booking.source}</div>
              </div>

              <div className="booking-card-body">
                <div className="booking-info">
                  <div className="info-row">
                    <span className="info-label">Gæst:</span>
                    <span className="info-value">{booking.guest_name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{booking.guest_email}</span>
                  </div>
                  {booking.guest_phone && (
                    <div className="info-row">
                      <span className="info-label">Telefon:</span>
                      <span className="info-value">{booking.guest_phone}</span>
                    </div>
                  )}
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
                    <span className="info-value">{booking.room_id}</span>
                  </div>
                  {booking.total_price && (
                    <div className="info-row">
                      <span className="info-label">Total pris:</span>
                      <span className="info-value">
                        {new Intl.NumberFormat('da-DK', { 
                          style: 'currency', 
                          currency: 'DKK',
                          minimumFractionDigits: 0 
                        }).format(booking.total_price)}
                      </span>
                    </div>
                  )}
                  {booking.notes && (
                    <div className="info-row">
                      <span className="info-label">Besked:</span>
                      <span className="info-value">{booking.notes}</span>
                    </div>
                  )}
                </div>

                <div className="booking-actions">
                  <select
                    value={booking.status}
                    onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                    className="status-select"
                  >
                    <option value="pending">Afventende</option>
                    <option value="confirmed">Bekræftet</option>
                    <option value="cancelled">Annulleret</option>
                  </select>
                </div>
              </div>

              <div className="booking-card-footer">
                <small>
                  Oprettet: {format(new Date(booking.created_at), 'dd. MMM yyyy HH:mm', { locale: da })}
                </small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingsTab;

