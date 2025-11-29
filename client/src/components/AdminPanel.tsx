import { useState } from 'react';
import BookingsTab from './admin/BookingsTab';
import RoomsTab from './admin/RoomsTab';
import AvailabilityTab from './admin/AvailabilityTab';
import PricingTab from './admin/PricingTab';
import RevenueManagementTab from './admin/RevenueManagementTab';
import ChannelManagerTab from './admin/ChannelManagerTab';
import CRMTab from './admin/CRMTab';
import WebhooksTab from './admin/WebhooksTab';
import TemplatesTab from './admin/TemplatesTab';
import './AdminPanel.css';
import { crmApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type Section =
  | 'bookings'
  | 'crm'
  | 'rooms'
  | 'pricing'
  | 'availability'
  | 'revenue'
  | 'channels'
  | 'webhooks'
  | 'templates';

const sidebarItems: Array<{ id: Section; label: string; icon: string; description: string }> = [
  { id: 'bookings', label: 'Bookings', icon: '📅', description: 'Håndter forespørgsler og status' },
  { id: 'crm', label: 'CRM', icon: '🤝', description: 'Hold kontakten med gæsterne' },
  { id: 'rooms', label: 'Værelser', icon: '🏠', description: 'Administrer værelsestyper' },
  { id: 'pricing', label: 'Priser & Sæsoner', icon: '💰', description: 'Opdater priser og perioder' },
  { id: 'availability', label: 'Tilgængelighed', icon: '📆', description: 'Åbn og luk datoer' },
  { id: 'revenue', label: 'Revenue', icon: '📊', description: 'Overvåg markedet' },
  { id: 'channels', label: 'Channel Manager', icon: '📱', description: 'Synkroniser kanaler' },
  { id: 'webhooks', label: 'Webhooks', icon: '🔗', description: 'Smart home & integrationer' },
  { id: 'templates', label: 'Beskeder', icon: '📝', description: 'Rediger SMS & email skabeloner' },
];

const AdminPanel = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>('bookings');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [crmFilter, setCrmFilter] = useState<'all' | 'upcoming'>('all');
  const [crmGuestId, setCrmGuestId] = useState<number | null>(null);
  const [automationLoading, setAutomationLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = async () => {
    if (confirm('Er du sikker på du vil logge ud?')) {
      await logout();
    }
  };

  const handleRunCrmAutomation = async () => {
    setAutomationLoading(true);
    try {
      await crmApi.runAutomation();
      alert('CRM automation kørt');
    } catch (error) {
      console.error(error);
      alert('Kunne ikke køre automation');
    } finally {
      setAutomationLoading(false);
    }
  };

  const handleOpenGuestFromBooking = (guestId: number) => {
    setCrmGuestId(guestId);
    setActiveSection('crm');
  };

  const renderTopbarContent = () => {
    if (activeSection === 'bookings') {
      return (
        <>
          <div>
            <h1>Bookings</h1>
            <p>Håndter alle forespørgsler og statusser</p>
          </div>
          <div className="topbar-filters">
            {[
              { id: 'all', label: 'Alle' },
              { id: 'pending', label: 'Afventende' },
              { id: 'confirmed', label: 'Bekræftet' },
              { id: 'cancelled', label: 'Annulleret' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                className={bookingFilter === item.id ? 'active' : ''}
                onClick={() => setBookingFilter(item.id as typeof bookingFilter)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      );
    }

    if (activeSection === 'crm') {
      return (
        <>
          <div>
            <h1>CRM & Loyalitet</h1>
            <p>Følg op på gæster og konverter dem til nye ophold</p>
          </div>
          <div className="topbar-filters">
            {[
              { id: 'all', label: 'Alle' },
              { id: 'upcoming', label: 'Kommende ophold' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                className={crmFilter === item.id ? 'active' : ''}
                onClick={() => setCrmFilter(item.id as typeof crmFilter)}
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              className="btn-secondary"
              onClick={handleRunCrmAutomation}
              disabled={automationLoading}
            >
              {automationLoading ? 'Kører...' : 'Kør automation'}
            </button>
          </div>
        </>
      );
    }

    const current = sidebarItems.find((item) => item.id === activeSection);
    return (
      <>
        <div>
          <h1>{current?.label ?? ''}</h1>
          <p>{current?.description ?? ''}</p>
        </div>
      </>
    );
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'bookings':
        return <BookingsTab filter={bookingFilter} onOpenGuest={handleOpenGuestFromBooking} />;
      case 'crm':
        return <CRMTab filter={crmFilter} initialGuestId={crmGuestId} />;
      case 'rooms':
        return <RoomsTab />;
      case 'pricing':
        return <PricingTab />;
      case 'availability':
        return <AvailabilityTab />;
      case 'revenue':
        return <RevenueManagementTab />;
      case 'channels':
        return <ChannelManagerTab />;
      case 'webhooks':
        return <WebhooksTab />;
      case 'templates':
        return <TemplatesTab />;
      default:
        return null;
    }
  };

  return (
    <div className="admin-panel">
      <div className={`admin-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Hover trigger zone when sidebar is collapsed */}
        {sidebarCollapsed && (
          <div 
            className="sidebar-hover-trigger"
            onMouseEnter={() => setSidebarCollapsed(false)}
          />
        )}
        
        <aside 
          className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
          onMouseLeave={() => setSidebarCollapsed(true)}
        >
          <div className="sidebar-logo">
            <span>ØLIV</span>
            <small className="sidebar-label">Guest Experience</small>
          </div>
          
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Åbn menu' : 'Luk menu'}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
          
          <nav>
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`sidebar-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-footer">
            <div className="sidebar-user">
              <span className="user-icon">👤</span>
              <span className="user-name sidebar-label">{user?.name || user?.username}</span>
            </div>
            <button
              type="button"
              className="sidebar-logout"
              onClick={handleLogout}
              title={sidebarCollapsed ? 'Log ud' : undefined}
            >
              🚪 <span className="sidebar-label">Log ud</span>
            </button>
          </div>
        </aside>
        <div className="admin-main">
          <header className="admin-topbar">
            {renderTopbarContent()}
          </header>
          <main className="admin-main-content">
            {renderSection()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

