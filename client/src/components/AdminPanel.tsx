import { useState } from 'react';
import BookingsTab from './admin/BookingsTab';
import RoomsTab from './admin/RoomsTab';
import AvailabilityTab from './admin/AvailabilityTab';
import ChannelManagerTab from './admin/ChannelManagerTab';
import './AdminPanel.css';

type TabType = 'bookings' | 'rooms' | 'availability' | 'channels';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<TabType>('bookings');

  return (
    <div className="admin-panel">
      <div className="admin-container">
        <header className="admin-header">
          <h1>ØLIV Admin Panel</h1>
          <p>Administrer bookings, værelser, tilgængelighed og channels</p>
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
            className={`admin-tab ${activeTab === 'availability' ? 'active' : ''}`}
            onClick={() => setActiveTab('availability')}
          >
            📊 Tilgængelighed
          </button>
          <button
            className={`admin-tab ${activeTab === 'channels' ? 'active' : ''}`}
            onClick={() => setActiveTab('channels')}
          >
            📱 Channel Manager
          </button>
        </nav>

        <main className="admin-content">
          {activeTab === 'bookings' && <BookingsTab />}
          {activeTab === 'rooms' && <RoomsTab />}
          {activeTab === 'availability' && <AvailabilityTab />}
          {activeTab === 'channels' && <ChannelManagerTab />}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;

