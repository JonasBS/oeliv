import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import BookingCalendar from './BookingCalendar';
import RoomSelector from './RoomSelector';
import { roomsApi, availabilityApi, bookingsApi } from '../services/api';
import type { Room, AvailableRoom, DateSelection, BookingFormData } from '../types';
import './BookingModal.css';

interface BookingModalProps {
  onClose: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

const BookingModal = ({ onClose, showToast }: BookingModalProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDates, setSelectedDates] = useState<DateSelection>({ start: null, end: null });
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<BookingFormData>({
    date: '',
    nights: 2,
    guests: 2,
    room: null,
    name: '',
    email: '',
    phone: '',
    note: '',
  });

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const data = await roomsApi.getAll();
        setRooms(data);
      } catch (error) {
        console.error('Error loading rooms:', error);
        showToast('Kunne ikke indlæse værelser', 'error');
      }
    };
    loadRooms();
  }, [showToast]);

  const handleDateSelection = (dates: DateSelection) => {
    setSelectedDates(dates);
    
    if (dates.start && dates.end) {
      const nights = Math.ceil(
        (dates.end.getTime() - dates.start.getTime()) / (1000 * 60 * 60 * 24)
      );
      setFormData(prev => ({
        ...prev,
        date: format(dates.start!, 'yyyy-MM-dd'),
        nights,
      }));
      showToast(`Valgt ${nights} ${nights === 1 ? 'nat' : 'nætter'}`, 'success');
    }
  };

  const checkAvailability = async () => {
    if (!selectedDates.start || !selectedDates.end) return;

    setLoading(true);
    try {
      const checkIn = format(selectedDates.start, 'yyyy-MM-dd');
      const checkOut = format(selectedDates.end, 'yyyy-MM-dd');
      
      const { available } = await availabilityApi.checkAvailability(
        checkIn,
        checkOut,
        formData.guests
      );
      
      setAvailableRooms(available);
    } catch (error) {
      console.error('Error checking availability:', error);
      showToast('Kunne ikke tjekke tilgængelighed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!selectedDates.start || !selectedDates.end) {
        showToast('Vælg venligst ankomst- og afrejsedato', 'error');
        return false;
      }
      return true;
    }
    
    if (step === 2) {
      if (!formData.room) {
        showToast('Vælg venligst et værelse', 'error');
        return false;
      }
      return true;
    }
    
    if (step === 3) {
      if (!formData.name || !formData.email) {
        showToast('Navn og email er påkrævet', 'error');
        return false;
      }
      return true;
    }
    
    return true;
  };

  const handleNextStep = async () => {
    if (!validateStep(currentStep)) return;
    
    if (currentStep === 1) {
      await checkAvailability();
    }
    
    setCurrentStep(prev => prev + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(3)) return;
    if (!selectedDates.start || !selectedDates.end || !formData.room) return;

    setLoading(true);
    try {
      const booking = {
        room_id: formData.room,
        check_in: format(selectedDates.start, 'yyyy-MM-dd'),
        check_out: format(selectedDates.end, 'yyyy-MM-dd'),
        guests: formData.guests,
        guest_name: formData.name,
        guest_email: formData.email,
        guest_phone: formData.phone,
        notes: formData.note,
        source: 'website',
      };

      const result = await bookingsApi.create(booking);
      showToast(`Booking #${result.booking_id} oprettet! Vi kontakter dig snarest.`, 'success');
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error creating booking:', error);
      showToast('Der opstod en fejl. Prøv igen senere.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedRoom = rooms.find(r => r.id === formData.room);
  const roomData = availableRooms.find(r => r.room_id === formData.room);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button 
          type="button"
          className="modal-close" 
          onClick={onClose}
          aria-label="Luk"
        >
          ×
        </button>

        <div className="modal-header">
          <h2>Book dit ophold</h2>
          <div className="progress-bar">
            {[1, 2, 3].map(step => (
              <div
                key={step}
                className={`progress-step ${step < currentStep ? 'completed' : ''} ${
                  step === currentStep ? 'active' : ''
                }`}
              >
                {step}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="booking-form">
          {/* Step 1: Dates */}
          {currentStep === 1 && (
            <div className="form-step active">
              <div className="step-header">
                <h3>Hvornår vil du bo hos os?</h3>
                <p>Vælg ankomst- og afrejsedato ved at klikke i kalenderen</p>
              </div>

              <BookingCalendar 
                onSelect={handleDateSelection}
                selectedDates={selectedDates}
              />

              <div className="form-group">
                <label htmlFor="guests">Antal gæster</label>
                <div className="guest-selector">
                  {[2, 3, 4].map(count => (
                    <button
                      key={count}
                      type="button"
                      className={`guest-btn ${formData.guests === count ? 'active' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, guests: count }))}
                    >
                      {count} {count === 1 ? 'gæst' : 'gæster'}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="button"
                className="btn-primary btn-next-step"
                onClick={handleNextStep}
                disabled={!selectedDates.start || !selectedDates.end}
              >
                Næste
              </button>
            </div>
          )}

          {/* Step 2: Room Selection */}
          {currentStep === 2 && (
            <div className="form-step active">
              <div className="step-header">
                <h3>Vælg værelse</h3>
                <p>Se tilgængelige værelser for dine datoer</p>
              </div>

              {loading ? (
                <div className="loading">Tjekker tilgængelighed...</div>
              ) : (
                <RoomSelector
                  rooms={rooms}
                  availableRooms={availableRooms}
                  nights={formData.nights}
                  selectedRoomId={formData.room}
                  onSelectRoom={(roomId) => setFormData(prev => ({ ...prev, room: roomId }))}
                />
              )}

              <div className="form-actions">
                <button 
                  type="button"
                  className="btn-secondary"
                  onClick={handlePreviousStep}
                >
                  Tilbage
                </button>
                <button 
                  type="button"
                  className="btn-primary"
                  onClick={handleNextStep}
                  disabled={!formData.room}
                >
                  Næste
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Guest Information */}
          {currentStep === 3 && (
            <div className="form-step active">
              <div className="step-header">
                <h3>Dine oplysninger</h3>
              </div>

              {/* Booking Summary */}
              {selectedDates.start && selectedDates.end && selectedRoom && (
                <div className="booking-summary">
                  <h4>Booking oversigt</h4>
                  <div className="summary-row">
                    <span className="summary-label">Ankomst:</span>
                    <span className="summary-value">
                      {format(selectedDates.start, 'EEEE, d. MMMM yyyy')}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Afrejse:</span>
                    <span className="summary-value">
                      {format(selectedDates.end, 'EEEE, d. MMMM yyyy')}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Ophold:</span>
                    <span className="summary-value">
                      {formData.nights} {formData.nights === 1 ? 'nat' : 'nætter'}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Gæster:</span>
                    <span className="summary-value">{formData.guests}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Værelse:</span>
                    <span className="summary-value">{selectedRoom.name}</span>
                  </div>
                  {roomData && (
                    <div className="summary-row summary-total">
                      <span className="summary-label">Total pris:</span>
                      <span className="summary-value">
                        {new Intl.NumberFormat('da-DK', { 
                          style: 'currency', 
                          currency: 'DKK',
                          minimumFractionDigits: 0 
                        }).format(roomData.total_price)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="name">Fulde navn *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Telefon</label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="note">Bemærkninger</label>
                <textarea
                  id="note"
                  value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  rows={3}
                  className="form-input"
                  placeholder="Har du specielle ønsker eller bemærkninger?"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button"
                  className="btn-secondary"
                  onClick={handlePreviousStep}
                >
                  Tilbage
                </button>
                <button 
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Sender...' : 'Send forespørgsel'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default BookingModal;

