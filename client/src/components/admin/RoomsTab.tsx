import { useState, useEffect } from 'react';
import { roomsApi } from '../../services/api';
import type { Room } from '../../types';

const RoomsTab = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const data = await roomsApi.getAll();
      setRooms(data);
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Indlæser værelser...</p>
      </div>
    );
  }

  return (
    <div className="rooms-tab">
      <div className="tab-header">
        <h2>Værelser ({rooms.length})</h2>
      </div>

      <div className="rooms-grid">
        {rooms.map((room) => (
          <div key={room.id} className="room-card-admin">
            <div className="room-card-header">
              <h3>{room.name}</h3>
              <span className="room-type-badge">Værelse</span>
            </div>

            <div className="room-card-body">
              <div className="room-info">
                <div className="info-row">
                  <span className="info-label">Pris pr. nat:</span>
                  <span className="info-value">
                    {new Intl.NumberFormat('da-DK', { 
                      style: 'currency', 
                      currency: 'DKK',
                      minimumFractionDigits: 0 
                    }).format(room.base_price)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomsTab;

