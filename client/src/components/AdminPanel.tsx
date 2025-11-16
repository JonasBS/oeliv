import { useState } from 'react';
import BookingsTab from './admin/BookingsTab';
import RoomsTab from './admin/RoomsTab';
import AvailabilityTab from './admin/AvailabilityTab';
import PricingTab from './admin/PricingTab';
import RevenueManagementTab from './admin/RevenueManagementTab';
import ChannelManagerTab from './admin/ChannelManagerTab';
import SmartPricingTab from './admin/SmartPricingTab';
import './AdminPanel.css';

type TabType = 'bookings' | 'rooms' | 'availability' | 'pricing' | 'revenue' | 'channels' | 'smart-pricing';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<TabType>('bookings');

  return (
    <div className="admin-panel">
      <div className="admin-container">
        <header className="admin-header">
          <h1>ØLIV Admin Panel</h1>
          <p>Administrer bookings, værelser, priser, revenue management og channels</p>
        </header>

        <nav className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            📅 Bookings
          </button>
          <button
            className={`admin-tab ${activeTab === 'rooms' ? 'active' : ''}`}
            onClick={() => setActiveTab('rooms')}
          >
            🏠 Værelser
          </button>
          <button
            className={`admin-tab ${activeTab === 'pricing' ? 'active' : ''}`}
            onClick={() => setActiveTab('pricing')}
          >
            💰 Priser & Sæsoner
          </button>
          <button
            className={`admin-tab ${activeTab === 'revenue' ? 'active' : ''}`}
            onClick={() => setActiveTab('revenue')}
          >
            📊 Revenue Management
          </button>
          <button
            className={`admin-tab ${activeTab === 'availability' ? 'active' : ''}`}
            onClick={() => setActiveTab('availability')}
          >
            📆 Tilgængelighed
          </button>
          <button
            className={`admin-tab ${activeTab === 'channels' ? 'active' : ''}`}
            onClick={() => setActiveTab('channels')}
          >
            📱 Channel Manager
          </button>
          <button
            className={`admin-tab ${activeTab === 'smart-pricing' ? 'active' : ''}`}
            onClick={() => setActiveTab('smart-pricing')}
          >
            💡 Smart Prissætning
          </button>
        </nav>

        <main className="admin-content">
          {activeTab === 'bookings' && <BookingsTab />}
          {activeTab === 'rooms' && <RoomsTab />}
          {activeTab === 'pricing' && <PricingTab />}
          {activeTab === 'revenue' && <RevenueManagementTab />}
          {activeTab === 'availability' && <AvailabilityTab />}
          {activeTab === 'channels' && <ChannelManagerTab />}
          {activeTab === 'smart-pricing' && <SmartPricingTab />}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;

