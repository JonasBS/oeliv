import type { Room, AvailableRoom } from '../types';
import './RoomSelector.css';

interface RoomSelectorProps {
  rooms: Room[];
  availableRooms: AvailableRoom[];
  nights: number;
  selectedRoomId: number | null;
  onSelectRoom: (roomId: number) => void;
}

const RoomSelector = ({ rooms, availableRooms, nights, selectedRoomId, onSelectRoom }: RoomSelectorProps) => {
  const availableRoomIds = new Set(availableRooms.map(r => r.room_id));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (availableRooms.length === 0) {
    return (
      <div className="rooms-empty">
        <p>Ingen værelser tilgængelige for valgte datoer.</p>
        <p>Prøv venligst andre datoer.</p>
      </div>
    );
  }

  return (
    <div className="rooms-selection">
      {rooms.map(room => {
        const isAvailable = availableRoomIds.has(room.id);
        const roomData = availableRooms.find(r => r.room_id === room.id);
        const totalPrice = roomData?.total_price || 0;
        const pricePerNight = totalPrice ? Math.round(totalPrice / nights) : 0;
        const isSelected = selectedRoomId === room.id;

        return (
          <button
            key={room.id}
            type="button"
            className={`room-card ${!isAvailable ? 'unavailable' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={() => isAvailable && onSelectRoom(room.id)}
            disabled={!isAvailable}
          >
            <div className="room-card-header">
              <div className="room-card-info">
                <div className="room-card-name">{room.name}</div>
                <div className="room-card-capacity">
                  Op til {room.max_guests} gæster
                </div>
              </div>
              {isAvailable && totalPrice > 0 && (
                <div className="room-card-price">
                  <div className="room-price-total">{formatCurrency(totalPrice)}</div>
                  <div className="room-price-per-night">
                    {nights} {nights === 1 ? 'nat' : 'nætter'} • {formatCurrency(pricePerNight)}/nat
                  </div>
                </div>
              )}
              {!isAvailable && (
                <div className="room-card-unavailable">
                  Ikke tilgængelig
                </div>
              )}
            </div>
            {isSelected && (
              <div className="room-card-selected-indicator">
                ✓ Valgt
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default RoomSelector;

