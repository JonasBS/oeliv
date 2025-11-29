import { useState, useEffect, useMemo } from 'react';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { da } from 'date-fns/locale';
import { bookingsApi } from '../../services/api';
import type { Booking } from '../../types';
import './BookingsTab.css';

interface BookingsTabProps {
  filter: 'all' | 'pending' | 'confirmed' | 'cancelled';
  onOpenGuest?: (guestId: number) => void;
}

interface BookingDetails {
  booking: Booking & {
    room_name: string;
    room_type: string;
    room_unit_label?: string;
    nights: number;
    crm_guest_id?: number;
    total_stays?: number;
    total_nights?: number;
    total_revenue?: number;
  };
  lockCode: {
    id: number;
    status: string;
    created_at: string;
    provisioned_at?: string;
    revoked_at?: string;
    valid_from?: string;
    valid_to?: string;
    error_message?: string;
  } | null;
  preferences: {
    room_temperature?: string;
    floor_heating?: number;
    extra_pillows?: number;
    extra_blankets?: number;
    pillow_type?: string;
    blackout_curtains?: number;
    has_allergies?: number;
    allergies_details?: string;
    has_dietary_requirements?: number;
    dietary_requirements?: string;
    dietary_details?: string;
    breakfast_in_room?: number;
    breakfast_time?: string;
    is_special_occasion?: number;
    occasion_type?: string;
    occasion_details?: string;
    wants_flowers?: number;
    wants_champagne?: number;
    wants_chocolate?: number;
    other_requests?: string;
    estimated_arrival_time?: string;
    needs_early_checkin?: number;
    needs_late_checkout?: number;
    needs_parking?: number;
    submitted_at?: string;
  } | null;
  communications: Array<{
    id: number;
    channel: 'email' | 'sms';
    message_type: string;
    recipient: string;
    subject?: string;
    content?: string;
    status: string;
    created_at: string;
  }>;
  cleaningRequests: Array<{
    id: number;
    request_date: string;
    status: string;
    created_at: string;
  }>;
  feedback: {
    rating: number;
    positive_note?: string;
    improvement_note?: string;
    created_at: string;
  } | null;
  guestHistory: Array<{
    id: number;
    room_name: string;
    check_in: string;
    check_out: string;
    status: string;
    total_price: number;
  }>;
}

const BookingsTab = ({ filter, onOpenGuest }: BookingsTabProps) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Detail modal state
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'preferences' | 'communications' | 'history'>('overview');
  
  // Lock code modal
  const [showLockCodeModal, setShowLockCodeModal] = useState(false);
  const [lockCodePin, setLockCodePin] = useState('');
  const [lockCode, setLockCode] = useState<string | null>(null);
  const [lockCodeLoading, setLockCodeLoading] = useState(false);
  const [lockCodeError, setLockCodeError] = useState<string | null>(null);

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

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

  const loadBookingDetails = async (id: number) => {
    setLoadingDetails(true);
    setActiveTab('overview');
    try {
      const apiBase = (window as any).API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/bookings/${id}/details`);
      if (!response.ok) throw new Error('Failed to load booking details');
      const data = await response.json();
      setBookingDetails(data);
    } catch (error) {
      console.error('Error loading booking details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const openBookingModal = (id: number) => {
    setSelectedBookingId(id);
    loadBookingDetails(id);
  };

  const closeBookingModal = () => {
    setSelectedBookingId(null);
    setBookingDetails(null);
    setLockCode(null);
    setLockCodePin('');
    setShowLockCodeModal(false);
    setActionSuccess(null);
  };

  const handleStatusChange = async (bookingId: number, newStatus: string) => {
    setActionLoading('status');
    try {
      await bookingsApi.updateStatus(bookingId, newStatus);
      await loadBookings();
      if (selectedBookingId === bookingId) {
        await loadBookingDetails(bookingId);
      }
      setActionSuccess('Status opdateret');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewLockCode = async () => {
    if (!selectedBookingId || !lockCodePin) return;
    setLockCodeLoading(true);
    setLockCodeError(null);
    
    try {
      const apiBase = (window as any).API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/bookings/${selectedBookingId}/lock-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: lockCodePin })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Forkert kode');
      setLockCode(data.lock_code);
    } catch (error: any) {
      setLockCodeError(error.message);
    } finally {
      setLockCodeLoading(false);
    }
  };

  const handleResendLockCode = async () => {
    if (!selectedBookingId || !lockCodePin) return;
    setActionLoading('resend_lock');
    
    try {
      const apiBase = (window as any).API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/bookings/${selectedBookingId}/resend-lock-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: lockCodePin })
      });
      if (!response.ok) throw new Error('Kunne ikke gensende');
      setActionSuccess('Låsekode gensendt til gæsten!');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (error) {
      console.error('Error resending lock code:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendPreferences = async () => {
    if (!selectedBookingId) return;
    setActionLoading('preferences');
    
    try {
      const apiBase = (window as any).API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/preferences/resend/${selectedBookingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Kunne ikke sende');
      setActionSuccess('Præference-link sendt til gæsten!');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (error) {
      console.error('Error sending preferences:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResendConfirmation = async () => {
    if (!selectedBookingId) return;
    setActionLoading('confirmation');
    
    try {
      const apiBase = (window as any).API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/bookings/${selectedBookingId}/resend-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Kunne ikke sende');
      setActionSuccess('Bekræftelse gensendt!');
      await loadBookingDetails(selectedBookingId);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (error) {
      console.error('Error resending confirmation:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBookings = useMemo(() => {
    let result = bookings;
    
    if (filter !== 'all') {
      result = result.filter((b) => (b.status ?? 'pending') === filter);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter((b) => 
        b.guest_name?.toLowerCase().includes(searchLower) ||
        b.guest_email?.toLowerCase().includes(searchLower) ||
        b.guest_phone?.includes(search) ||
        String(b.id).includes(search)
      );
    }
    
    return result;
  }, [bookings, filter, search]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return { bg: '#d1fae5', color: '#059669', label: 'Bekræftet', icon: '✓' };
      case 'pending': return { bg: '#fef3c7', color: '#d97706', label: 'Afventer', icon: '⏳' };
      case 'cancelled': return { bg: '#fee2e2', color: '#dc2626', label: 'Annulleret', icon: '✗' };
      default: return { bg: '#f3f4f6', color: '#6b7280', label: status, icon: '?' };
    }
  };

  const getLockStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return { bg: '#d1fae5', color: '#059669', label: 'Aktiv' };
      case 'revoked': return { bg: '#fee2e2', color: '#dc2626', label: 'Ophævet' };
      case 'pending_provision': return { bg: '#fef3c7', color: '#d97706', label: 'Afventer' };
      case 'error': return { bg: '#fee2e2', color: '#dc2626', label: 'Fejl' };
      default: return { bg: '#f3f4f6', color: '#6b7280', label: status };
    }
  };

  const getMessageTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'booking_confirmation': '📧 Booking bekræftelse',
      'check_in_reminder': '⏰ Check-in påmindelse',
      'lock_code': '🔐 Låsekode',
      'preferences_request': '✨ Præference-forespørgsel',
      'feedback_request': '⭐ Feedback-forespørgsel',
      'custom': '💬 Brugerdefineret'
    };
    return labels[type] || type;
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "d. MMM yyyy", { locale: da });
  };

  const formatDateTime = (date: string) => {
    return format(new Date(date), "d. MMM yyyy 'kl.' HH:mm", { locale: da });
  };

  const formatRelative = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: da });
  };

  const renderStars = (rating: number) => (
    <div className="stars">
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} className={star <= rating ? 'star filled' : 'star'}>★</span>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="bookings-loading">
        <div className="spinner"></div>
        <p>Indlæser bookings...</p>
      </div>
    );
  }

  return (
    <div className="bookings-tab-new">
      {/* Search & Stats */}
      <div className="bookings-header">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Søg efter navn, email, telefon eller booking ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
        <span className="results-count">{filteredBookings.length} bookings</span>
      </div>

      {/* Bookings Table */}
      {filteredBookings.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <h3>Ingen bookings fundet</h3>
          <p>Prøv at ændre dit filter eller søgning</p>
        </div>
      ) : (
        <div className="bookings-table-container">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Gæst</th>
                <th>Værelse</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Gæster</th>
                <th>Pris</th>
                <th>Status</th>
                <th>Lås</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => {
                const statusBadge = getStatusBadge(booking.status ?? 'pending');
                const hasLockCode = (booking as any).has_lock_code === 1;
                const lockStatus = (booking as any).lock_code_status;
                
                return (
                  <tr 
                    key={booking.id} 
                    className={`booking-row ${booking.status}`}
                    onClick={() => openBookingModal(booking.id!)}
                  >
                    <td className="col-id">#{booking.id}</td>
                    <td className="col-guest">
                      <div className="guest-cell">
                        <span className="guest-name">{booking.guest_name}</span>
                        <span className="guest-email">{booking.guest_email}</span>
                      </div>
                    </td>
                    <td className="col-room">
                      <span className="room-name">{(booking as any).room_name || `ID ${booking.room_id}`}</span>
                      {(booking as any).room_unit_label && (
                        <span className="room-unit">{(booking as any).room_unit_label}</span>
                      )}
                    </td>
                    <td className="col-date">{format(new Date(booking.check_in), 'dd. MMM', { locale: da })}</td>
                    <td className="col-date">{format(new Date(booking.check_out), 'dd. MMM', { locale: da })}</td>
                    <td className="col-guests">{booking.guests}</td>
                    <td className="col-price">
                      {booking.total_price ? `${booking.total_price.toLocaleString('da-DK')} kr` : '—'}
                    </td>
                    <td className="col-status">
                      <span 
                        className="status-badge"
                        style={{ background: statusBadge.bg, color: statusBadge.color }}
                      >
                        {statusBadge.icon} {statusBadge.label}
                      </span>
                    </td>
                    <td className="col-lock">
                      {hasLockCode ? (
                        <span 
                          className="lock-badge"
                          style={{ 
                            background: getLockStatusBadge(lockStatus).bg,
                            color: getLockStatusBadge(lockStatus).color
                          }}
                        >
                          🔐 {getLockStatusBadge(lockStatus).label}
                        </span>
                      ) : (
                        <span className="no-lock">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Booking Detail Modal */}
      {selectedBookingId && (
        <div className="booking-modal-overlay" onClick={closeBookingModal}>
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeBookingModal}>✕</button>
            
            {loadingDetails ? (
              <div className="modal-loading">
                <div className="spinner"></div>
                <p>Indlæser booking...</p>
              </div>
            ) : bookingDetails ? (
              <>
                {/* Modal Header */}
                <div className="modal-header-section">
                  <div className="header-main">
                    <div className="header-info">
                      <div className="booking-title">
                        <span className="booking-id-large">#{bookingDetails.booking.id}</span>
                        <span 
                          className="status-badge-large"
                          style={{ 
                            background: getStatusBadge(bookingDetails.booking.status ?? 'pending').bg,
                            color: getStatusBadge(bookingDetails.booking.status ?? 'pending').color
                          }}
                        >
                          {getStatusBadge(bookingDetails.booking.status ?? 'pending').icon} {getStatusBadge(bookingDetails.booking.status ?? 'pending').label}
                        </span>
                      </div>
                      <h2>{bookingDetails.booking.guest_name}</h2>
                      <div className="contact-info">
                        <a href={`mailto:${bookingDetails.booking.guest_email}`}>
                          📧 {bookingDetails.booking.guest_email}
                        </a>
                        {bookingDetails.booking.guest_phone && (
                          <a href={`tel:${bookingDetails.booking.guest_phone}`}>
                            📱 {bookingDetails.booking.guest_phone}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="header-stats">
                      <div className="stat">
                        <span className="stat-value">{bookingDetails.booking.nights}</span>
                        <span className="stat-label">nætter</span>
                      </div>
                      <div className="stat">
                        <span className="stat-value">{bookingDetails.booking.guests}</span>
                        <span className="stat-label">gæster</span>
                      </div>
                      <div className="stat">
                        <span className="stat-value">
                          {bookingDetails.booking.total_price?.toLocaleString('da-DK') || '—'}
                        </span>
                        <span className="stat-label">DKK</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="booking-summary">
                    <div className="summary-item">
                      <span className="summary-icon">🏨</span>
                      <div>
                        <strong>{bookingDetails.booking.room_name}</strong>
                        {bookingDetails.booking.room_unit_label && (
                          <span className="unit-tag">{bookingDetails.booking.room_unit_label}</span>
                        )}
                      </div>
                    </div>
                    <div className="summary-item">
                      <span className="summary-icon">📅</span>
                      <div>
                        <strong>{formatDate(bookingDetails.booking.check_in)}</strong>
                        <span className="arrow">→</span>
                        <strong>{formatDate(bookingDetails.booking.check_out)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Success Message */}
                {actionSuccess && (
                  <div className="action-success">
                    ✅ {actionSuccess}
                  </div>
                )}

                {/* Tab Navigation */}
                <div className="modal-tabs">
                  <button 
                    className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    📋 Overblik
                  </button>
                  <button 
                    className={`tab ${activeTab === 'preferences' ? 'active' : ''}`}
                    onClick={() => setActiveTab('preferences')}
                  >
                    ✨ Præferencer
                    {bookingDetails.preferences?.submitted_at && <span className="tab-badge">✓</span>}
                  </button>
                  <button 
                    className={`tab ${activeTab === 'communications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('communications')}
                  >
                    📧 Kommunikation
                    {bookingDetails.communications.length > 0 && (
                      <span className="tab-count">{bookingDetails.communications.length}</span>
                    )}
                  </button>
                  <button 
                    className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                  >
                    📜 Historik
                    {bookingDetails.guestHistory.length > 0 && (
                      <span className="tab-count">{bookingDetails.guestHistory.length}</span>
                    )}
                  </button>
                </div>

                {/* Tab Content */}
                <div className="modal-content">
                  {activeTab === 'overview' && (
                    <div className="tab-content overview-tab">
                      {/* Quick Actions */}
                      <div className="section">
                        <h3>⚡ Hurtige handlinger</h3>
                        <div className="quick-actions">
                          <div className="action-group">
                            <label>Status</label>
                            <select
                              value={bookingDetails.booking.status ?? 'pending'}
                              onChange={(e) => handleStatusChange(bookingDetails.booking.id!, e.target.value)}
                              disabled={actionLoading === 'status'}
                            >
                              <option value="pending">⏳ Afventer</option>
                              <option value="confirmed">✓ Bekræftet</option>
                              <option value="cancelled">✗ Annulleret</option>
                            </select>
                          </div>
                          
                          <button 
                            className="action-btn"
                            onClick={handleResendConfirmation}
                            disabled={actionLoading === 'confirmation'}
                          >
                            {actionLoading === 'confirmation' ? '...' : '📧 Gensend bekræftelse'}
                          </button>
                          
                          <button 
                            className="action-btn"
                            onClick={handleSendPreferences}
                            disabled={actionLoading === 'preferences'}
                          >
                            {actionLoading === 'preferences' ? '...' : '✨ Send præference-link'}
                          </button>
                          
                          {bookingDetails.booking.crm_guest_id && (
                            <button 
                              className="action-btn"
                              onClick={() => onOpenGuest?.(bookingDetails.booking.crm_guest_id!)}
                            >
                              👤 Åbn i CRM
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Lock Code Section */}
                      {bookingDetails.lockCode && (
                        <div className="section">
                          <h3>🔐 Låsekode</h3>
                          <div className="lock-code-section">
                            <div className="lock-status">
                              <span 
                                className="lock-badge-large"
                                style={{ 
                                  background: getLockStatusBadge(bookingDetails.lockCode.status).bg,
                                  color: getLockStatusBadge(bookingDetails.lockCode.status).color
                                }}
                              >
                                {getLockStatusBadge(bookingDetails.lockCode.status).label}
                              </span>
                              {bookingDetails.lockCode.valid_from && (
                                <span className="lock-validity">
                                  Gyldig: {formatDateTime(bookingDetails.lockCode.valid_from)} - {formatDateTime(bookingDetails.lockCode.valid_to!)}
                                </span>
                              )}
                            </div>
                            
                            {!showLockCodeModal ? (
                              <button 
                                className="action-btn primary"
                                onClick={() => setShowLockCodeModal(true)}
                              >
                                👁️ Se låsekode
                              </button>
                            ) : lockCode ? (
                              <div className="lock-code-display">
                                <div className="code-value">{lockCode}</div>
                                <div className="code-actions">
                                  <button onClick={() => {
                                    navigator.clipboard.writeText(lockCode);
                                    setActionSuccess('Kode kopieret!');
                                    setTimeout(() => setActionSuccess(null), 2000);
                                  }}>
                                    📋 Kopier
                                  </button>
                                  <button 
                                    onClick={handleResendLockCode}
                                    disabled={actionLoading === 'resend_lock'}
                                  >
                                    {actionLoading === 'resend_lock' ? '...' : '📤 Gensend'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="pin-input-section">
                                <input
                                  type="password"
                                  placeholder="Admin adgangskode"
                                  value={lockCodePin}
                                  onChange={(e) => setLockCodePin(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleViewLockCode()}
                                />
                                <button 
                                  onClick={handleViewLockCode}
                                  disabled={lockCodeLoading || !lockCodePin}
                                >
                                  {lockCodeLoading ? '...' : 'Vis kode'}
                                </button>
                                {lockCodeError && <p className="error">{lockCodeError}</p>}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Cleaning Requests */}
                      {bookingDetails.cleaningRequests.length > 0 && (
                        <div className="section">
                          <h3>🧹 Rengøringsanmodninger</h3>
                          <div className="cleaning-list">
                            {bookingDetails.cleaningRequests.map(req => (
                              <div key={req.id} className="cleaning-item">
                                <span className="cleaning-date">{formatDate(req.request_date)}</span>
                                <span className={`cleaning-status ${req.status}`}>
                                  {req.status === 'pending' ? '⏳ Afventer' : 
                                   req.status === 'completed' ? '✓ Udført' : req.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Feedback */}
                      {bookingDetails.feedback && (
                        <div className="section">
                          <h3>⭐ Feedback</h3>
                          <div className="feedback-display">
                            {renderStars(bookingDetails.feedback.rating)}
                            {bookingDetails.feedback.positive_note && (
                              <p className="feedback-positive">
                                👍 {bookingDetails.feedback.positive_note}
                              </p>
                            )}
                            {bookingDetails.feedback.improvement_note && (
                              <p className="feedback-improvement">
                                💡 {bookingDetails.feedback.improvement_note}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {bookingDetails.booking.notes && (
                        <div className="section">
                          <h3>📝 Noter</h3>
                          <p className="notes-content">{bookingDetails.booking.notes}</p>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="section metadata">
                        <div className="meta-item">
                          <span className="meta-label">Oprettet</span>
                          <span className="meta-value">{formatDateTime(bookingDetails.booking.created_at!)}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Kilde</span>
                          <span className="meta-value">{bookingDetails.booking.source || 'Website'}</span>
                        </div>
                        {bookingDetails.booking.payment_status && (
                          <div className="meta-item">
                            <span className="meta-label">Betaling</span>
                            <span className="meta-value">{bookingDetails.booking.payment_status}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'preferences' && (
                    <div className="tab-content preferences-tab">
                      {bookingDetails.preferences?.submitted_at ? (
                        <>
                          <div className="preferences-submitted">
                            ✅ Præferencer modtaget {formatRelative(bookingDetails.preferences.submitted_at)}
                          </div>
                          
                          <div className="preferences-grid">
                            {/* Temperature */}
                            <div className="pref-card">
                              <h4>🌡️ Temperatur</h4>
                              <p className="pref-value">
                                {bookingDetails.preferences.room_temperature === 'cool' ? '18°C (Køligt)' :
                                 bookingDetails.preferences.room_temperature === 'warm' ? '24°C (Varmt)' :
                                 '21°C (Normal)'}
                              </p>
                              {bookingDetails.preferences.floor_heating === 1 && (
                                <span className="pref-tag">🔥 Gulvvarme ønskes</span>
                              )}
                            </div>

                            {/* Bedding */}
                            <div className="pref-card">
                              <h4>🛏️ Seng</h4>
                              <div className="pref-tags">
                                {bookingDetails.preferences.extra_pillows === 1 && <span>Ekstra puder</span>}
                                {bookingDetails.preferences.extra_blankets === 1 && <span>Ekstra tæpper</span>}
                                {bookingDetails.preferences.pillow_type && (
                                  <span>{bookingDetails.preferences.pillow_type} puder</span>
                                )}
                                {bookingDetails.preferences.blackout_curtains === 1 && (
                                  <span>Mørklægning</span>
                                )}
                              </div>
                            </div>

                            {/* Allergies */}
                            {bookingDetails.preferences.has_allergies === 1 && (
                              <div className="pref-card warning">
                                <h4>⚠️ Allergier</h4>
                                <p>{bookingDetails.preferences.allergies_details || 'Ikke specificeret'}</p>
                              </div>
                            )}

                            {/* Dietary */}
                            {bookingDetails.preferences.has_dietary_requirements === 1 && (
                              <div className="pref-card">
                                <h4>🍽️ Diæt</h4>
                                <div className="pref-tags">
                                  {bookingDetails.preferences.dietary_requirements?.split(',').map(d => (
                                    <span key={d}>{d}</span>
                                  ))}
                                </div>
                                {bookingDetails.preferences.dietary_details && (
                                  <p>{bookingDetails.preferences.dietary_details}</p>
                                )}
                              </div>
                            )}

                            {/* Breakfast */}
                            {bookingDetails.preferences.breakfast_in_room === 1 && (
                              <div className="pref-card">
                                <h4>☕ Morgenmad</h4>
                                <p>På værelset kl. {bookingDetails.preferences.breakfast_time || 'Ikke valgt'}</p>
                              </div>
                            )}

                            {/* Special Occasion */}
                            {bookingDetails.preferences.is_special_occasion === 1 && (
                              <div className="pref-card highlight">
                                <h4>🎉 Særlig anledning</h4>
                                <p className="occasion-type">
                                  {bookingDetails.preferences.occasion_type === 'birthday' ? '🎂 Fødselsdag' :
                                   bookingDetails.preferences.occasion_type === 'anniversary' ? '💑 Jubilæum' :
                                   bookingDetails.preferences.occasion_type === 'honeymoon' ? '💒 Bryllupsrejse' :
                                   bookingDetails.preferences.occasion_type === 'proposal' ? '💍 Forlovelse' :
                                   '✨ Andet'}
                                </p>
                                {bookingDetails.preferences.occasion_details && (
                                  <p>{bookingDetails.preferences.occasion_details}</p>
                                )}
                                <div className="pref-tags">
                                  {bookingDetails.preferences.wants_flowers === 1 && <span>💐 Blomster</span>}
                                  {bookingDetails.preferences.wants_champagne === 1 && <span>🍾 Champagne</span>}
                                  {bookingDetails.preferences.wants_chocolate === 1 && <span>🍫 Chokolade</span>}
                                </div>
                              </div>
                            )}

                            {/* Arrival */}
                            <div className="pref-card">
                              <h4>🚗 Ankomst</h4>
                              {bookingDetails.preferences.estimated_arrival_time && (
                                <p>Forventet: ca. {bookingDetails.preferences.estimated_arrival_time}</p>
                              )}
                              <div className="pref-tags">
                                {bookingDetails.preferences.needs_early_checkin === 1 && (
                                  <span>Tidlig check-in</span>
                                )}
                                {bookingDetails.preferences.needs_late_checkout === 1 && (
                                  <span>Sen check-out</span>
                                )}
                                {bookingDetails.preferences.needs_parking === 1 && (
                                  <span>Parkering</span>
                                )}
                              </div>
                            </div>

                            {/* Other */}
                            {bookingDetails.preferences.other_requests && (
                              <div className="pref-card full-width">
                                <h4>💬 Andre ønsker</h4>
                                <p>{bookingDetails.preferences.other_requests}</p>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="no-preferences">
                          <span className="empty-icon">✨</span>
                          <h3>Ingen præferencer modtaget</h3>
                          <p>Gæsten har ikke udfyldt præference-formularen endnu.</p>
                          <button 
                            className="action-btn primary"
                            onClick={handleSendPreferences}
                            disabled={actionLoading === 'preferences'}
                          >
                            {actionLoading === 'preferences' ? 'Sender...' : '📤 Send præference-link'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'communications' && (
                    <div className="tab-content communications-tab">
                      {bookingDetails.communications.length > 0 ? (
                        <div className="communications-timeline">
                          {bookingDetails.communications.map(comm => (
                            <div key={comm.id} className={`comm-item ${comm.status}`}>
                              <div className="comm-icon">
                                {comm.channel === 'email' ? '📧' : '📱'}
                              </div>
                              <div className="comm-content">
                                <div className="comm-header">
                                  <span className="comm-type">{getMessageTypeLabel(comm.message_type)}</span>
                                  <span className="comm-time">{formatDateTime(comm.created_at)}</span>
                                </div>
                                <p className="comm-recipient">
                                  Til: {comm.recipient}
                                </p>
                                {comm.subject && (
                                  <p className="comm-subject">Emne: {comm.subject}</p>
                                )}
                                <span className={`comm-status ${comm.status}`}>
                                  {comm.status === 'sent' ? '✓ Sendt' :
                                   comm.status === 'delivered' ? '✓✓ Leveret' :
                                   comm.status === 'failed' ? '✗ Fejlet' :
                                   comm.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-communications">
                          <span className="empty-icon">📧</span>
                          <h3>Ingen kommunikation endnu</h3>
                          <p>Der er ikke sendt beskeder til denne booking.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'history' && (
                    <div className="tab-content history-tab">
                      {bookingDetails.guestHistory.length > 0 ? (
                        <>
                          {bookingDetails.booking.total_stays && (
                            <div className="guest-summary">
                              <div className="summary-stat">
                                <span className="value">{bookingDetails.booking.total_stays}</span>
                                <span className="label">ophold i alt</span>
                              </div>
                              <div className="summary-stat">
                                <span className="value">{bookingDetails.booking.total_nights}</span>
                                <span className="label">nætter i alt</span>
                              </div>
                              <div className="summary-stat">
                                <span className="value">
                                  {bookingDetails.booking.total_revenue?.toLocaleString('da-DK') || '—'}
                                </span>
                                <span className="label">DKK i alt</span>
                              </div>
                            </div>
                          )}
                          
                          <h3>Tidligere bookings</h3>
                          <div className="history-list">
                            {bookingDetails.guestHistory.map(hist => {
                              const histStatus = getStatusBadge(hist.status);
                              return (
                                <div 
                                  key={hist.id} 
                                  className="history-item"
                                  onClick={() => {
                                    setSelectedBookingId(hist.id);
                                    loadBookingDetails(hist.id);
                                  }}
                                >
                                  <div className="history-main">
                                    <span className="history-id">#{hist.id}</span>
                                    <span className="history-room">{hist.room_name}</span>
                                    <span className="history-dates">
                                      {formatDate(hist.check_in)} → {formatDate(hist.check_out)}
                                    </span>
                                  </div>
                                  <div className="history-meta">
                                    <span 
                                      className="status-mini"
                                      style={{ background: histStatus.bg, color: histStatus.color }}
                                    >
                                      {histStatus.label}
                                    </span>
                                    <span className="history-price">
                                      {hist.total_price?.toLocaleString('da-DK')} kr
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <div className="no-history">
                          <span className="empty-icon">📜</span>
                          <h3>Første booking</h3>
                          <p>Dette er gæstens første booking hos ØLIV.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsTab;
