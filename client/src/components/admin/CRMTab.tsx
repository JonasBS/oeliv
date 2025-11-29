import { useEffect, useMemo, useState, useCallback } from 'react';
import { format, formatDistanceToNow, differenceInDays, addDays, isAfter, isBefore } from 'date-fns';
import { da } from 'date-fns/locale';
import { crmApi } from '../../services/api';
import type { CrmGuest, CrmGuestDetail, CrmCampaign, CrmFeedbackEntry, CrmFeedbackSummary } from '../../types';
import './CRMTab.css';

const formatDate = (date?: string | null) => {
  if (!date) return '—';
  try {
    return format(new Date(date), "d. MMM yyyy", { locale: da });
  } catch {
    return date;
  }
};

const formatRelativeDate = (date?: string | null) => {
  if (!date) return '';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: da });
  } catch {
    return '';
  }
};

type CRMFilter = 'all' | 'upcoming';
type ViewMode = 'dashboard' | 'guests' | 'campaigns' | 'feedback';

interface CRMTabProps {
  filter: CRMFilter;
  initialGuestId?: number | null;
}

// Guest Segment Types
type GuestSegment = 'all' | 'vip' | 'loyal' | 'new' | 'at_risk' | 'upcoming';

const SEGMENTS: { key: GuestSegment; label: string; icon: string; color: string }[] = [
  { key: 'all', label: 'Alle gæster', icon: '👥', color: '#6b7280' },
  { key: 'vip', label: 'VIP', icon: '⭐', color: '#f59e0b' },
  { key: 'loyal', label: 'Loyale', icon: '💎', color: '#8b5cf6' },
  { key: 'new', label: 'Nye gæster', icon: '🌱', color: '#10b981' },
  { key: 'at_risk', label: 'Risiko for churn', icon: '⚠️', color: '#ef4444' },
  { key: 'upcoming', label: 'Kommende', icon: '📅', color: '#3b82f6' },
];

const CRMTab = ({ filter, initialGuestId = null }: CRMTabProps) => {
  const [guests, setGuests] = useState<CrmGuest[]>([]);
  const [selectedGuestId, setSelectedGuestId] = useState<number | null>(null);
  const [guestDetail, setGuestDetail] = useState<CrmGuestDetail | null>(null);
  const [campaigns, setCampaigns] = useState<CrmCampaign[]>([]);
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<GuestSegment>('all');
  const [loadingGuests, setLoadingGuests] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [interactionMessage, setInteractionMessage] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [newTag, setNewTag] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [creatingCampaign, setCreatingCampaign] = useState({
    name: '',
    delay_days: 14,
    channel: 'email',
  });
  const [feedbackSummary, setFeedbackSummary] = useState<CrmFeedbackSummary | null>(null);
  const [recentFeedback, setRecentFeedback] = useState<CrmFeedbackEntry[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const loadGuests = useCallback(async () => {
    setLoadingGuests(true);
    try {
      const data = await crmApi.getGuests({
        search,
        limit: 200,
        upcoming: filter === 'upcoming' || segment === 'upcoming',
      });
      setGuests(data);
    } catch (error) {
      console.error('Error loading guests', error);
    } finally {
      setLoadingGuests(false);
    }
  }, [search, filter, segment]);

  const loadGuestDetail = async (id: number) => {
    setLoadingDetail(true);
    try {
      const data = await crmApi.getGuest(id);
      setGuestDetail(data);
    } catch (error) {
      console.error('Error loading guest detail', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      const data = await crmApi.getCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns', error);
    }
  };

  const loadFeedbackInsights = async () => {
    setFeedbackLoading(true);
    try {
      const [summary, latest] = await Promise.all([
        crmApi.getFeedbackSummary(),
        crmApi.getRecentFeedback(10),
      ]);
      setFeedbackSummary(summary);
      setRecentFeedback(latest);
    } catch (error) {
      console.error('Error loading feedback insights', error);
    } finally {
      setFeedbackLoading(false);
    }
  };

  useEffect(() => {
    loadGuests();
    loadCampaigns();
    loadFeedbackInsights();
  }, [loadGuests]);

  useEffect(() => {
    if (selectedGuestId) {
      loadGuestDetail(selectedGuestId);
      setShowGuestModal(true);
    } else {
      setGuestDetail(null);
    }
  }, [selectedGuestId]);

  useEffect(() => {
    if (initialGuestId) {
      setSelectedGuestId(initialGuestId);
      setViewMode('guests');
    }
  }, [initialGuestId]);

  // Segment guests
  const segmentedGuests = useMemo(() => {
    const today = new Date();
    
    return guests.filter(guest => {
      if (search) {
        const searchLower = search.toLowerCase();
        const name = `${guest.first_name || ''} ${guest.last_name || ''}`.toLowerCase();
        const email = (guest.email || '').toLowerCase();
        if (!name.includes(searchLower) && !email.includes(searchLower)) {
          return false;
        }
      }
      
      switch (segment) {
        case 'vip':
          return guest.total_stays >= 5 || (guest.total_revenue && guest.total_revenue > 20000);
        case 'loyal':
          return guest.total_stays >= 3;
        case 'new':
          return guest.total_stays === 1;
        case 'at_risk': {
          if (!guest.last_check_out) return false;
          const daysSince = differenceInDays(today, new Date(guest.last_check_out));
          return daysSince > 180 && guest.total_stays >= 2;
        }
        case 'upcoming':
          return !!guest.upcoming_check_in;
        default:
          return true;
      }
    });
  }, [guests, segment, search]);

  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = addDays(today, -30);
    
    const totalGuests = guests.length;
    const vipCount = guests.filter(g => g.total_stays >= 5 || (g.total_revenue && g.total_revenue > 20000)).length;
    const loyalCount = guests.filter(g => g.total_stays >= 3).length;
    const newGuestsCount = guests.filter(g => g.total_stays === 1).length;
    const upcomingCount = guests.filter(g => g.upcoming_check_in).length;
    const atRiskCount = guests.filter(g => {
      if (!g.last_check_out) return false;
      const daysSince = differenceInDays(today, new Date(g.last_check_out));
      return daysSince > 180 && g.total_stays >= 2;
    }).length;
    
    const recentGuests = guests.filter(g => 
      g.last_check_out && isAfter(new Date(g.last_check_out), thirtyDaysAgo)
    ).length;
    
    const totalRevenue = guests.reduce((sum, g) => sum + (g.total_revenue || 0), 0);
    const avgStays = guests.length > 0 
      ? (guests.reduce((sum, g) => sum + g.total_stays, 0) / guests.length).toFixed(1) 
      : '0';
    
    const avgRating = feedbackSummary?.avgRating30d || 0;
    const responseRate = feedbackSummary?.completionRate || 0;
    
    return {
      totalGuests,
      vipCount,
      loyalCount,
      newGuestsCount,
      upcomingCount,
      atRiskCount,
      recentGuests,
      totalRevenue,
      avgStays,
      avgRating,
      responseRate,
    };
  }, [guests, feedbackSummary]);

  const upcomingBookings = useMemo(() => {
    if (!guestDetail) return [];
    const today = new Date();
    return guestDetail.bookings.filter((booking) => new Date(booking.check_in) >= today);
  }, [guestDetail]);

  const prefillPreStay = () => {
    if (!upcomingBookings.length) return;
    const next = upcomingBookings[0];
    setInteractionMessage(`Forberedelse til ophold ${formatDate(next.check_in)} – husk at sende velkomst/tilkøb.`);
    setFollowUpDate(next.check_in);
  };

  const handleAddInteraction = async () => {
    if (!selectedGuestId || !interactionMessage.trim()) return;
    try {
      await crmApi.addInteraction(selectedGuestId, {
        type: followUpDate ? 'followup' : 'note',
        message: interactionMessage,
        follow_up_date: followUpDate || null,
      });
      setInteractionMessage('');
      setFollowUpDate('');
      await loadGuestDetail(selectedGuestId);
      await loadGuests();
    } catch (error) {
      console.error('Error adding interaction', error);
    }
  };

  const handleAddTag = async () => {
    if (!selectedGuestId || !newTag.trim()) return;
    try {
      await crmApi.addTag(selectedGuestId, newTag.trim());
      setNewTag('');
      await loadGuestDetail(selectedGuestId);
    } catch (error) {
      console.error('Error adding tag', error);
    }
  };

  const handleRemoveTag = async (tag: string) => {
    if (!selectedGuestId) return;
    await crmApi.removeTag(selectedGuestId, tag);
    await loadGuestDetail(selectedGuestId);
  };

  const handleCreateCampaign = async () => {
    if (!creatingCampaign.name.trim()) return;
    try {
      await crmApi.createCampaign({
        name: creatingCampaign.name,
        trigger: 'after_checkout',
        delay_days: Number(creatingCampaign.delay_days) || 14,
        channel: creatingCampaign.channel,
      });
      setCreatingCampaign({ name: '', delay_days: 14, channel: 'email' });
      await loadCampaigns();
    } catch (error) {
      console.error('Error creating campaign', error);
    }
  };

  const handleRunCampaign = async (id: number) => {
    try {
      await crmApi.runCampaign(id);
      alert('Kampagne kørt');
    } catch (error) {
      console.error('Error running campaign', error);
    }
  };

  const closeGuestModal = () => {
    setShowGuestModal(false);
    setSelectedGuestId(null);
    setGuestDetail(null);
  };

  const getGuestTier = (guest: CrmGuest | CrmGuestDetail) => {
    if (guest.total_stays >= 5 || (guest.total_revenue && guest.total_revenue > 20000)) {
      return { label: 'VIP', color: '#f59e0b', icon: '⭐' };
    }
    if (guest.total_stays >= 3) {
      return { label: 'Loyal', color: '#8b5cf6', icon: '💎' };
    }
    if (guest.total_stays === 1) {
      return { label: 'Ny', color: '#10b981', icon: '🌱' };
    }
    return { label: 'Gæst', color: '#6b7280', icon: '👤' };
  };

  const renderStars = (rating: number) => {
    return (
      <div className="crm-stars">
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} className={star <= rating ? 'star filled' : 'star'}>★</span>
        ))}
      </div>
    );
  };

  // Dashboard View
  const renderDashboard = () => (
    <div className="crm-dashboard">
      {/* KPI Cards */}
      <div className="crm-kpi-grid">
        <div className="crm-kpi-card primary">
          <div className="kpi-icon">👥</div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.totalGuests}</span>
            <span className="kpi-label">Gæster i alt</span>
          </div>
          <div className="kpi-trend positive">+{stats.recentGuests} denne måned</div>
        </div>
        
        <div className="crm-kpi-card gold">
          <div className="kpi-icon">⭐</div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.vipCount}</span>
            <span className="kpi-label">VIP Gæster</span>
          </div>
          <div className="kpi-subtitle">{stats.loyalCount} loyale gæster</div>
        </div>
        
        <div className="crm-kpi-card blue">
          <div className="kpi-icon">📅</div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.upcomingCount}</span>
            <span className="kpi-label">Kommende ophold</span>
          </div>
          <div className="kpi-subtitle">Næste 30 dage</div>
        </div>
        
        <div className="crm-kpi-card green">
          <div className="kpi-icon">💰</div>
          <div className="kpi-content">
            <span className="kpi-value">{(stats.totalRevenue / 1000).toFixed(0)}k</span>
            <span className="kpi-label">Total omsætning</span>
          </div>
          <div className="kpi-subtitle">Gns. {stats.avgStays} ophold/gæst</div>
        </div>
      </div>

      {/* Quick Actions & Insights */}
      <div className="crm-dashboard-grid">
        {/* Upcoming Arrivals */}
        <div className="crm-dash-card">
          <div className="dash-card-header">
            <h3>📅 Kommende ankomster</h3>
            <button className="btn-link" onClick={() => { setSegment('upcoming'); setViewMode('guests'); }}>
              Se alle →
            </button>
          </div>
          <div className="dash-card-content">
            {guests.filter(g => g.upcoming_check_in).slice(0, 5).map(guest => {
              const tier = getGuestTier(guest);
              return (
                <div 
                  key={guest.id} 
                  className="upcoming-guest-row"
                  onClick={() => setSelectedGuestId(guest.id)}
                >
                  <div className="guest-avatar" style={{ background: tier.color }}>
                    {tier.icon}
                  </div>
                  <div className="guest-info">
                    <span className="guest-name">
                      {guest.first_name || guest.last_name 
                        ? `${guest.first_name || ''} ${guest.last_name || ''}`.trim() 
                        : guest.email}
                    </span>
                    <span className="guest-meta">
                      {formatDate(guest.upcoming_check_in)} · {guest.total_stays} ophold
                    </span>
                  </div>
                  <span className="tier-badge" style={{ background: `${tier.color}20`, color: tier.color }}>
                    {tier.label}
                  </span>
                </div>
              );
            })}
            {!guests.filter(g => g.upcoming_check_in).length && (
              <p className="empty-state">Ingen kommende ankomster</p>
            )}
          </div>
        </div>

        {/* At Risk Guests */}
        <div className="crm-dash-card warning">
          <div className="dash-card-header">
            <h3>⚠️ Risiko for churn</h3>
            <span className="badge-count">{stats.atRiskCount}</span>
          </div>
          <div className="dash-card-content">
            {guests.filter(g => {
              if (!g.last_check_out) return false;
              const daysSince = differenceInDays(new Date(), new Date(g.last_check_out));
              return daysSince > 180 && g.total_stays >= 2;
            }).slice(0, 4).map(guest => (
              <div 
                key={guest.id} 
                className="at-risk-row"
                onClick={() => setSelectedGuestId(guest.id)}
              >
                <div className="guest-info">
                  <span className="guest-name">
                    {guest.first_name || guest.last_name 
                      ? `${guest.first_name || ''} ${guest.last_name || ''}`.trim() 
                      : guest.email}
                  </span>
                  <span className="guest-meta">
                    {guest.total_stays} ophold · Sidst set {formatRelativeDate(guest.last_check_out)}
                  </span>
                </div>
                <button className="btn-sm btn-outline" onClick={(e) => {
                  e.stopPropagation();
                  setSelectedGuestId(guest.id);
                }}>
                  Kontakt
                </button>
              </div>
            ))}
            {stats.atRiskCount === 0 && (
              <p className="empty-state success">✓ Ingen gæster i risikozonen</p>
            )}
          </div>
        </div>

        {/* Feedback Overview */}
        <div className="crm-dash-card">
          <div className="dash-card-header">
            <h3>⭐ Feedback</h3>
            <button className="btn-link" onClick={() => setViewMode('feedback')}>
              Se alle →
            </button>
          </div>
          <div className="dash-card-content">
            <div className="feedback-stats-row">
              <div className="feedback-stat">
                <span className="stat-value">{stats.avgRating.toFixed(1)}</span>
                <span className="stat-label">Gns. rating</span>
                {renderStars(Math.round(stats.avgRating))}
              </div>
              <div className="feedback-stat">
                <span className="stat-value">{stats.responseRate}%</span>
                <span className="stat-label">Svarprocent</span>
              </div>
            </div>
            <div className="recent-feedback-mini">
              {recentFeedback.slice(0, 3).map(fb => (
                <div key={fb.id} className="feedback-mini-item">
                  {renderStars(fb.rating)}
                  <p className="feedback-text">
                    {fb.positive_note || fb.improvement_note || 'Ingen kommentar'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="crm-dash-card">
          <div className="dash-card-header">
            <h3>📧 Kampagner</h3>
            <button className="btn-link" onClick={() => setViewMode('campaigns')}>
              Administrer →
            </button>
          </div>
          <div className="dash-card-content">
            {campaigns.slice(0, 4).map(campaign => (
              <div key={campaign.id} className="campaign-row">
                <div className="campaign-info">
                  <span className="campaign-name">{campaign.name}</span>
                  <span className="campaign-meta">
                    {campaign.channel === 'email' ? '📧' : '📱'} {campaign.trigger === 'manual' ? 'Manuel' : `${campaign.delay_days}d efter checkout`}
                  </span>
                </div>
                <button 
                  className="btn-sm btn-primary"
                  onClick={() => handleRunCampaign(campaign.id)}
                >
                  Kør
                </button>
              </div>
            ))}
            {!campaigns.length && (
              <p className="empty-state">Ingen kampagner oprettet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Guests View
  const renderGuests = () => (
    <div className="crm-guests-view">
      {/* Segment Tabs */}
      <div className="segment-tabs">
        {SEGMENTS.map(seg => (
          <button
            key={seg.key}
            className={`segment-tab ${segment === seg.key ? 'active' : ''}`}
            onClick={() => setSegment(seg.key)}
            style={{ '--segment-color': seg.color } as React.CSSProperties}
          >
            <span className="segment-icon">{seg.icon}</span>
            <span className="segment-label">{seg.label}</span>
            <span className="segment-count">
              {seg.key === 'all' ? stats.totalGuests :
               seg.key === 'vip' ? stats.vipCount :
               seg.key === 'loyal' ? stats.loyalCount :
               seg.key === 'new' ? stats.newGuestsCount :
               seg.key === 'at_risk' ? stats.atRiskCount :
               stats.upcomingCount}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="guests-search-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Søg efter navn eller email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
        <span className="results-count">{segmentedGuests.length} gæster</span>
      </div>

      {/* Guest Grid */}
      <div className="guests-grid">
        {loadingGuests ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Indlæser gæster...</p>
          </div>
        ) : segmentedGuests.length === 0 ? (
          <div className="empty-state-large">
            <span className="empty-icon">👥</span>
            <h3>Ingen gæster fundet</h3>
            <p>Prøv at ændre dit filter eller søgning</p>
          </div>
        ) : (
          segmentedGuests.map(guest => {
            const tier = getGuestTier(guest);
            return (
              <div 
                key={guest.id} 
                className="guest-card"
                onClick={() => setSelectedGuestId(guest.id)}
              >
                <div className="guest-card-header">
                  <div className="guest-avatar-large" style={{ background: tier.color }}>
                    {tier.icon}
                  </div>
                  <span className="tier-badge-small" style={{ background: `${tier.color}20`, color: tier.color }}>
                    {tier.label}
                  </span>
                </div>
                <div className="guest-card-body">
                  <h4 className="guest-name">
                    {guest.first_name || guest.last_name 
                      ? `${guest.first_name || ''} ${guest.last_name || ''}`.trim() 
                      : 'Ukendt navn'}
                  </h4>
                  <p className="guest-email">{guest.email}</p>
                  <div className="guest-stats">
                    <div className="stat">
                      <span className="stat-value">{guest.total_stays}</span>
                      <span className="stat-label">Ophold</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{guest.total_nights}</span>
                      <span className="stat-label">Nætter</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">
                        {guest.total_revenue ? `${(guest.total_revenue / 1000).toFixed(1)}k` : '—'}
                      </span>
                      <span className="stat-label">DKK</span>
                    </div>
                  </div>
                </div>
                <div className="guest-card-footer">
                  {guest.upcoming_check_in ? (
                    <span className="upcoming-badge">
                      📅 {formatDate(guest.upcoming_check_in)}
                    </span>
                  ) : guest.last_check_out ? (
                    <span className="last-visit">
                      Sidst: {formatRelativeDate(guest.last_check_out)}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // Campaigns View
  const renderCampaigns = () => (
    <div className="crm-campaigns-view">
      <div className="campaigns-header">
        <h2>📧 Kampagner</h2>
        <p>Automatiser din gæstekommunikation</p>
      </div>

      <div className="campaigns-layout">
        <div className="campaigns-list">
          {campaigns.map(campaign => (
            <div key={campaign.id} className="campaign-card">
              <div className="campaign-card-header">
                <span className="campaign-icon">
                  {campaign.channel === 'email' ? '📧' : '📱'}
                </span>
                <div className="campaign-title">
                  <h4>{campaign.name}</h4>
                  <span className="campaign-trigger">
                    {campaign.trigger === 'manual' ? 'Manuel udsendelse' : `${campaign.delay_days} dage efter checkout`}
                  </span>
                </div>
              </div>
              <div className="campaign-card-body">
                {campaign.last_run_at && (
                  <p className="last-run">Sidst kørt: {formatDate(campaign.last_run_at)}</p>
                )}
              </div>
              <div className="campaign-card-actions">
                <button className="btn-primary" onClick={() => handleRunCampaign(campaign.id)}>
                  ▶ Kør nu
                </button>
              </div>
            </div>
          ))}
          
          {!campaigns.length && (
            <div className="empty-campaigns">
              <span className="empty-icon">📧</span>
              <h3>Ingen kampagner endnu</h3>
              <p>Opret din første kampagne for at holde kontakten med dine gæster</p>
            </div>
          )}
        </div>

        <div className="new-campaign-form">
          <h3>➕ Opret ny kampagne</h3>
          <div className="form-group">
            <label>Kampagnenavn</label>
            <input
              type="text"
              placeholder="F.eks. 'Tak for dit ophold'"
              value={creatingCampaign.name}
              onChange={(e) => setCreatingCampaign(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Forsinkelse (dage)</label>
              <input
                type="number"
                min={1}
                value={creatingCampaign.delay_days}
                onChange={(e) => setCreatingCampaign(prev => ({ ...prev, delay_days: Number(e.target.value) }))}
              />
            </div>
            <div className="form-group">
              <label>Kanal</label>
              <select
                value={creatingCampaign.channel}
                onChange={(e) => setCreatingCampaign(prev => ({ ...prev, channel: e.target.value }))}
              >
                <option value="email">📧 Email</option>
                <option value="sms">📱 SMS</option>
              </select>
            </div>
          </div>
          <button 
            className="btn-primary btn-block"
            onClick={handleCreateCampaign}
            disabled={!creatingCampaign.name.trim()}
          >
            Opret kampagne
          </button>
        </div>
      </div>
    </div>
  );

  // Feedback View
  const renderFeedback = () => (
    <div className="crm-feedback-view">
      <div className="feedback-header">
        <h2>⭐ Gæstefeedback</h2>
        <button className="btn-secondary" onClick={loadFeedbackInsights}>
          🔄 Opdater
        </button>
      </div>

      <div className="feedback-summary-cards">
        <div className="feedback-summary-card">
          <div className="summary-icon">⭐</div>
          <div className="summary-content">
            <span className="summary-value">{feedbackSummary?.avgRating30d?.toFixed(1) || '—'}</span>
            <span className="summary-label">Gns. rating (30d)</span>
          </div>
        </div>
        <div className="feedback-summary-card">
          <div className="summary-icon">📊</div>
          <div className="summary-content">
            <span className="summary-value">{feedbackSummary?.completionRate || 0}%</span>
            <span className="summary-label">Svarprocent</span>
          </div>
        </div>
        <div className="feedback-summary-card">
          <div className="summary-icon">📝</div>
          <div className="summary-content">
            <span className="summary-value">{feedbackSummary?.responses7d || 0}</span>
            <span className="summary-label">Svar (7 dage)</span>
          </div>
        </div>
        <div className="feedback-summary-card">
          <div className="summary-icon">⏳</div>
          <div className="summary-content">
            <span className="summary-value">{feedbackSummary?.pendingRequests || 0}</span>
            <span className="summary-label">Afventer svar</span>
          </div>
        </div>
      </div>

      <div className="feedback-list">
        <h3>Seneste feedback</h3>
        {feedbackLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
          </div>
        ) : recentFeedback.length === 0 ? (
          <div className="empty-state-large">
            <span className="empty-icon">⭐</span>
            <h3>Ingen feedback endnu</h3>
            <p>Feedback vil vises her når gæster svarer</p>
          </div>
        ) : (
          recentFeedback.map(fb => (
            <div key={fb.id} className="feedback-card">
              <div className="feedback-card-header">
                {renderStars(fb.rating)}
                <span className="feedback-date">{formatDate(fb.created_at)}</span>
              </div>
              <div className="feedback-card-body">
                {fb.positive_note && (
                  <div className="feedback-section positive">
                    <span className="section-icon">👍</span>
                    <p>{fb.positive_note}</p>
                  </div>
                )}
                {fb.improvement_note && (
                  <div className="feedback-section improvement">
                    <span className="section-icon">💡</span>
                    <p>{fb.improvement_note}</p>
                  </div>
                )}
                {!fb.positive_note && !fb.improvement_note && (
                  <p className="no-comment">Ingen kommentar</p>
                )}
              </div>
              {fb.highlight_tags && fb.highlight_tags.length > 0 && (
                <div className="feedback-tags">
                  {fb.highlight_tags.map(tag => (
                    <span key={tag} className="feedback-tag">{tag}</span>
                  ))}
                </div>
              )}
              <div className="feedback-card-footer">
                <span className="room-info">🛏️ {fb.room_name || 'Ukendt værelse'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Guest Detail Modal
  const renderGuestModal = () => {
    if (!showGuestModal || !guestDetail) return null;
    
    const tier = getGuestTier(guestDetail);
    
    return (
      <div className="crm-modal-overlay" onClick={closeGuestModal}>
        <div className="crm-modal guest-modal" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={closeGuestModal}>✕</button>
          
          {loadingDetail ? (
            <div className="modal-loading">
              <div className="spinner"></div>
              <p>Indlæser gæsteprofil...</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="guest-modal-header" style={{ borderColor: tier.color }}>
                <div className="guest-avatar-xl" style={{ background: tier.color }}>
                  {tier.icon}
                </div>
                <div className="guest-header-info">
                  <h2>
                    {guestDetail.first_name || guestDetail.last_name 
                      ? `${guestDetail.first_name || ''} ${guestDetail.last_name || ''}`.trim() 
                      : 'Ukendt navn'}
                  </h2>
                  <p className="guest-email-large">{guestDetail.email}</p>
                  <span className="tier-badge-large" style={{ background: `${tier.color}20`, color: tier.color }}>
                    {tier.icon} {tier.label}
                  </span>
                </div>
                <div className="guest-header-stats">
                  <div className="header-stat">
                    <span className="value">{guestDetail.total_stays}</span>
                    <span className="label">Ophold</span>
                  </div>
                  <div className="header-stat">
                    <span className="value">{guestDetail.total_nights}</span>
                    <span className="label">Nætter</span>
                  </div>
                  <div className="header-stat">
                    <span className="value">
                      {guestDetail.total_revenue ? `${(guestDetail.total_revenue / 1000).toFixed(1)}k` : '—'}
                    </span>
                    <span className="label">DKK</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="guest-tags-section">
                <div className="tags-list">
                  {guestDetail.tags.map(tag => (
                    <span key={tag} className="guest-tag" onClick={() => handleRemoveTag(tag)}>
                      {tag} ✕
                    </span>
                  ))}
                  <div className="add-tag-inline">
                    <input
                      type="text"
                      placeholder="+ Tilføj tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                  </div>
                </div>
              </div>

              {/* Content Grid */}
              <div className="guest-modal-grid">
                {/* Booking History */}
                <div className="modal-section">
                  <h3>📋 Bookinghistorik</h3>
                  <div className="booking-timeline">
                    {guestDetail.bookings.map((booking, idx) => (
                      <div key={booking.id} className="booking-item">
                        <div className="booking-marker" />
                        <div className="booking-content">
                          <div className="booking-header">
                            <span className="booking-id">#{booking.id}</span>
                            <span className={`booking-status ${booking.status}`}>
                              {booking.status === 'confirmed' ? '✓ Bekræftet' : 
                               booking.status === 'cancelled' ? '✗ Annulleret' : 
                               '⏳ Afventer'}
                            </span>
                          </div>
                          <p className="booking-dates">
                            {formatDate(booking.check_in)} → {formatDate(booking.check_out)}
                          </p>
                          <p className="booking-price">
                            {booking.total_price ? `${booking.total_price.toLocaleString('da-DK')} DKK` : '—'}
                          </p>
                        </div>
                      </div>
                    ))}
                    {!guestDetail.bookings.length && (
                      <p className="empty-mini">Ingen bookinger registreret</p>
                    )}
                  </div>
                </div>

                {/* Upcoming + Actions */}
                <div className="modal-section">
                  <h3>📅 Kommende ophold</h3>
                  {upcomingBookings.length > 0 ? (
                    <div className="upcoming-bookings">
                      {upcomingBookings.map(booking => (
                        <div key={booking.id} className="upcoming-booking-card">
                          <div className="upcoming-dates">
                            <span className="date-range">
                              {formatDate(booking.check_in)} → {formatDate(booking.check_out)}
                            </span>
                            <span className="days-until">
                              om {differenceInDays(new Date(booking.check_in), new Date())} dage
                            </span>
                          </div>
                          <button className="btn-sm btn-outline" onClick={prefillPreStay}>
                            📝 Forbered note
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-mini">Ingen kommende ophold</p>
                  )}

                  <h3 style={{ marginTop: '1.5rem' }}>💬 Tilføj note</h3>
                  <div className="add-note-form">
                    <textarea
                      placeholder="Skriv en note om gæsten..."
                      value={interactionMessage}
                      onChange={(e) => setInteractionMessage(e.target.value)}
                    />
                    <div className="note-actions">
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        title="Follow-up dato"
                      />
                      <button 
                        className="btn-primary"
                        onClick={handleAddInteraction}
                        disabled={!interactionMessage.trim()}
                      >
                        Gem note
                      </button>
                    </div>
                  </div>
                </div>

                {/* Feedback */}
                <div className="modal-section">
                  <h3>⭐ Feedback</h3>
                  {guestDetail.feedback && guestDetail.feedback.length > 0 ? (
                    <div className="guest-feedback-list">
                      {guestDetail.feedback.map(fb => (
                        <div key={fb.id} className="guest-feedback-item">
                          <div className="feedback-header">
                            {renderStars(fb.rating)}
                            <span className="feedback-date">{formatDate(fb.created_at)}</span>
                          </div>
                          {fb.positive_note && <p className="positive">👍 {fb.positive_note}</p>}
                          {fb.improvement_note && <p className="improvement">💡 {fb.improvement_note}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-mini">Ingen feedback fra denne gæst</p>
                  )}
                </div>

                {/* Timeline */}
                <div className="modal-section full-width">
                  <h3>📜 Tidslinje</h3>
                  <div className="interaction-timeline">
                    {guestDetail.interactions.map(interaction => (
                      <div key={interaction.id} className="timeline-item">
                        <div className="timeline-dot" />
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="interaction-type">
                              {interaction.type === 'note' ? '📝' : 
                               interaction.type === 'followup' ? '📅' : 
                               interaction.type === 'email' ? '📧' : 
                               interaction.type === 'sms' ? '📱' : '💬'}
                              {interaction.type}
                            </span>
                            <span className="interaction-date">{formatDate(interaction.created_at)}</span>
                          </div>
                          <p>{interaction.message}</p>
                          {interaction.follow_up_date && (
                            <span className="follow-up-badge">
                              📅 Follow-up: {formatDate(interaction.follow_up_date)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {!guestDetail.interactions.length && (
                      <p className="empty-mini">Ingen interaktioner endnu</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="crm-tab-new">
      {/* View Switcher */}
      <div className="crm-view-switcher">
        <button 
          className={`view-btn ${viewMode === 'dashboard' ? 'active' : ''}`}
          onClick={() => setViewMode('dashboard')}
        >
          <span className="btn-icon">📊</span>
          <span className="btn-label">Overblik</span>
        </button>
        <button 
          className={`view-btn ${viewMode === 'guests' ? 'active' : ''}`}
          onClick={() => setViewMode('guests')}
        >
          <span className="btn-icon">👥</span>
          <span className="btn-label">Gæster</span>
        </button>
        <button 
          className={`view-btn ${viewMode === 'campaigns' ? 'active' : ''}`}
          onClick={() => setViewMode('campaigns')}
        >
          <span className="btn-icon">📧</span>
          <span className="btn-label">Kampagner</span>
        </button>
        <button 
          className={`view-btn ${viewMode === 'feedback' ? 'active' : ''}`}
          onClick={() => setViewMode('feedback')}
        >
          <span className="btn-icon">⭐</span>
          <span className="btn-label">Feedback</span>
        </button>
      </div>

      {/* Content */}
      <div className="crm-content">
        {viewMode === 'dashboard' && renderDashboard()}
        {viewMode === 'guests' && renderGuests()}
        {viewMode === 'campaigns' && renderCampaigns()}
        {viewMode === 'feedback' && renderFeedback()}
      </div>

      {/* Guest Modal */}
      {renderGuestModal()}
    </div>
  );
};

export default CRMTab;
