import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { da } from 'date-fns/locale';
import { availabilityApi, roomsApi } from '../../services/api';
import type { Room } from '../../types';

interface Availability {
  id: number;
  room_id: number;
  date: string;
  available: boolean;
  price?: number;
}

const AvailabilityTab = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const data = await roomsApi.getAll();
      setRooms(data);
      if (data.length > 0) {
        setSelectedRoom(data[0].id);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadAvailability = async () => {
    if (!selectedRoom) return;

    setLoading(true);
    try {
      const data = await availabilityApi.checkRange(selectedRoom, startDate, endDate);
      setAvailability(data);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetAvailability = async (date: string, available: boolean) => {
    if (!selectedRoom) return;

    try {
      await availabilityApi.setAvailability(selectedRoom, date, available);
      await loadAvailability();
    } catch (error) {
      console.error('Error setting availability:', error);
    }
  };

  return (
    <div className="availability-tab">
      <div className="tab-header">
        <h2>Tilgængelighed</h2>
      </div>

      <div className="availability-controls">
        <div className="form-group">
          <label htmlFor="room-select">Værelse:</label>
          <select
            id="room-select"
            value={selectedRoom || ''}
            onChange={(e) => setSelectedRoom(Number(e.target.value))}
            className="form-select"
          >
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="start-date">Fra dato:</label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="end-date">Til dato:</label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="form-input"
          />
        </div>

        <button 
          onClick={loadAvailability}
          className="btn-primary"
          disabled={loading}
        >
          {loading ? 'Indlæser...' : 'Vis tilgængelighed'}
        </button>
      </div>

      {availability.length > 0 && (
        <div className="availability-grid">
          {availability.map((item) => (
            <div 
              key={item.id} 
              className={`availability-day ${item.available ? 'available' : 'unavailable'}`}
            >
              <div className="day-date">
                {format(new Date(item.date), 'dd. MMM', { locale: da })}
              </div>
              <div className="day-status">
                {item.available ? '✓ Ledig' : '✗ Optaget'}
              </div>
              <button
                onClick={() => handleSetAvailability(item.date, !item.available)}
                className="toggle-btn"
              >
                {item.available ? 'Marker optaget' : 'Marker ledig'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailabilityTab;

