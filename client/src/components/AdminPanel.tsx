import { useState } from 'react';
import BookingsTab from './admin/BookingsTab';
import RoomsTab from './admin/RoomsTab';
import AvailabilityTab from './admin/AvailabilityTab';
import './AdminPanel.css';

type TabType = 'bookings' | 'rooms' | 'availability';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<TabType>('bookings');

  return (
    <div className="admin-panel">
      <div className="admin-container">
        <header className="admin-header">
          <h1>ØLIV Admin Panel</h1>
          <p>Administrer bookings, værelser og tilgængelighed</p>
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
        </nav>

        <main className="admin-content">
          {activeTab === 'bookings' && <BookingsTab />}
          {activeTab === 'rooms' && <RoomsTab />}
          {activeTab === 'availability' && <AvailabilityTab />}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;

