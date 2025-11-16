import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { da } from 'date-fns/locale';
import { availabilityApi, roomsApi } from '../../services/api';
import type { Room } from '../../types';

interface AvailabilityDay {
  date: string;
  available: boolean;
  room_id: number;
}

const AvailabilityTab = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState<AvailabilityDay[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      loadAvailability();
    }
  }, [selectedRoom, currentMonth]);

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
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      
      const data = await availabilityApi.checkRange(
        selectedRoom,
        format(start, 'yyyy-MM-dd'),
        format(end, 'yyyy-MM-dd')
      );
      
      setAvailability(data);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (date: string, currentAvailable: boolean) => {
    if (!selectedRoom) return;

    try {
      await availabilityApi.setAvailability(selectedRoom, date, !currentAvailable);
      await loadAvailability();
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const handleBulkUpdate = async (available: boolean) => {
    if (!selectedRoom) return;

    setLoading(true);
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const days = eachDayOfInterval({ start, end });

      for (const day of days) {
        const dateStr = format(day, 'yyyy-MM-dd');
        await availabilityApi.setAvailability(selectedRoom, dateStr, available);
      }

      await loadAvailability();
    } catch (error) {
      console.error('Error bulk updating:', error);
    } finally {
      setLoading(false);
    }
  };

  const previousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getAvailabilityForDate = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const item = availability.find(a => a.date === dateStr);
    return item?.available ?? true;
  };

  const selectedRoomData = rooms.find(r => r.id === selectedRoom);

  return (
    <div className="availability-tab">
      <div className="tab-header">
        <h2>Tilgængelighed</h2>
        <div className="room-selector-header">
          {rooms.map((room) => (
            <button
              key={room.id}
              className={`room-selector-btn ${selectedRoom === room.id ? 'active' : ''}`}
              onClick={() => setSelectedRoom(room.id)}
            >
              {room.name}
            </button>
          ))}
        </div>
      </div>

      {selectedRoomData && (
        <div className="availability-info-card">
          <h3>{selectedRoomData.name}</h3>
          <p>Administrer tilgængelighed måned for måned</p>
        </div>
      )}

      <div className="calendar-controls">
        <button onClick={previousMonth} className="calendar-nav-btn">
          ← Forrige måned
        </button>
        <h3 className="calendar-month-title">
          {format(currentMonth, 'MMMM yyyy', { locale: da })}
        </h3>
        <button onClick={nextMonth} className="calendar-nav-btn">
          Næste måned →
        </button>
      </div>

      <div className="bulk-actions">
        <button 
          onClick={() => handleBulkUpdate(true)}
          className="bulk-btn bulk-btn-available"
          disabled={loading}
        >
          Marker alle ledige
        </button>
        <button 
          onClick={() => handleBulkUpdate(false)}
          className="bulk-btn bulk-btn-unavailable"
          disabled={loading}
        >
          Marker alle optaget
        </button>
      </div>

      {loading ? (
        <div className="admin-loading">
          <div className="spinner"></div>
          <p>Indlæser tilgængelighed...</p>
        </div>
      ) : (
        <div className="availability-calendar">
          {getDaysInMonth().map((day) => {
            const isAvailable = getAvailabilityForDate(day);
            const dateStr = format(day, 'yyyy-MM-dd');
            const isPast = day < new Date();

            return (
              <div 
                key={dateStr}
                className={`availability-day ${isAvailable ? 'available' : 'unavailable'} ${isPast ? 'past' : ''}`}
                onClick={() => !isPast && toggleAvailability(dateStr, isAvailable)}
                style={{ cursor: isPast ? 'not-allowed' : 'pointer' }}
              >
                <div className="day-number">{format(day, 'd')}</div>
                <div className="day-name">{format(day, 'EEE', { locale: da })}</div>
                <div className="day-status-icon">
                  {isAvailable ? '✓' : '✗'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AvailabilityTab;
