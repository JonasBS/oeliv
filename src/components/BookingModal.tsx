'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useBooking, type RoomType } from './BookingProvider';

type BookingStep = 'dates' | 'room' | 'contact' | 'success';

type RoomWithImages = RoomType & { 
  images: string[];
  features: string[];
  size: string;
};

const ROOMS: RoomWithImages[] = [
  { 
    id: 'gaardvaerelse', 
    name: 'Gaardvaerelse', 
    price: '1.295', 
    description: 'Dobbeltseng, eget bad, gaardsudsigt',
    size: '18 m²',
    features: ['Dobbeltseng', 'Eget bad', 'Regnbruser', 'Morgenlys'],
    images: [
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop',
    ]
  },
  { 
    id: 'havevaerelse', 
    name: 'Havevaerelse', 
    price: '1.595', 
    description: 'Kingsize seng, privat terrasse, have-adgang',
    size: '24 m²',
    features: ['Kingsize seng', 'Privat terrasse', 'Badekar', 'Have-adgang'],
    images: [
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=800&auto=format&fit=crop',
    ]
  },
  { 
    id: 'suite', 
    name: 'Laerkegaard Suite', 
    price: '2.195', 
    description: 'Separat stue, havudsigt, privat terrasse',
    size: '42 m²',
    features: ['Separat stue', 'Havudsigt', 'Privat terrasse', 'Pejs'],
    images: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?q=80&w=800&auto=format&fit=crop',
    ]
  },
];

const MONTHS_DA = [
  'Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'December'
];

const WEEKDAYS_DA = ['Ma', 'Ti', 'On', 'To', 'Fr', 'Lo', 'So'];

// Custom Calendar Component - Compact version
const CustomCalendar = ({
  selectedDate,
  onSelect,
  onClose,
}: {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
  onClose: () => void;
}) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = (firstDay.getDay() + 6) % 7;

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const isDateDisabled = (date: Date | null) => {
    if (!date) return true;
    return date < today;
  };

  const isDateSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === today.toDateString();
  };

  const days = getDaysInMonth(currentMonth);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const canGoPrev = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1) > today;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-[#f4f2eb] border border-[#ddd8cc] shadow-lg z-50">
      {/* Header - compact */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#e8e4da]">
        <button
          type="button"
          onClick={prevMonth}
          disabled={!canGoPrev}
          className={`w-6 h-6 flex items-center justify-center transition-colors ${
            canGoPrev ? 'text-[#2d2820] hover:bg-[#e8e4da]' : 'text-[#c8c0b0] cursor-not-allowed'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
        <span className="font-display text-sm text-[#2d2820]">
          {MONTHS_DA[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="w-6 h-6 flex items-center justify-center text-[#2d2820] hover:bg-[#e8e4da] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      {/* Weekday headers - compact */}
      <div className="grid grid-cols-7 px-1">
        {WEEKDAYS_DA.map((day) => (
          <div
            key={day}
            className="py-1 text-center text-[9px] tracking-[0.05em] uppercase text-[#8a7a6a]"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid - compact */}
      <div className="grid grid-cols-7 gap-0.5 p-1">
        {days.map((date, index) => (
          <button
            key={index}
            type="button"
            disabled={isDateDisabled(date)}
            onClick={() => {
              if (date && !isDateDisabled(date)) {
                onSelect(date);
                onClose();
              }
            }}
            className={`
              w-8 h-8 flex items-center justify-center text-xs transition-all rounded-sm
              ${!date ? 'invisible' : ''}
              ${isDateDisabled(date) ? 'text-[#c8c0b0] cursor-not-allowed' : 'hover:bg-[#4a5a42] hover:text-[#f4f2eb]'}
              ${isDateSelected(date) ? 'bg-[#4a5a42] text-[#f4f2eb]' : ''}
              ${isToday(date) && !isDateSelected(date) ? 'ring-1 ring-[#4a5a42] text-[#4a5a42]' : ''}
            `}
          >
            {date?.getDate()}
          </button>
        ))}
      </div>

      {/* Footer - compact */}
      <div className="flex justify-between items-center px-3 py-2 border-t border-[#e8e4da]">
        <button
          type="button"
          onClick={() => {
            onSelect(today);
            onClose();
          }}
          className="text-[10px] tracking-[0.1em] uppercase text-[#4a5a42] hover:text-[#2d2820] transition-colors"
        >
          I dag
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-[10px] tracking-[0.1em] uppercase text-[#8a7a6a] hover:text-[#2d2820] transition-colors"
        >
          Luk
        </button>
      </div>
    </div>
  );
};

// Room Gallery Modal
const RoomGalleryModal = ({
  room,
  onClose,
  onSelect,
  nights,
}: {
  room: RoomWithImages;
  onClose: () => void;
  onSelect: () => void;
  nights: number;
}) => {
  const [currentImage, setCurrentImage] = useState(0);

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % room.images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + room.images.length) % room.images.length);
  };

  const total = parseInt(room.price.replace('.', '')) * nights;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1c1a17]/90" onClick={onClose} />
      
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#f4f2eb] overflow-hidden">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 bg-[#f4f2eb]/90 flex items-center justify-center text-[#2d2820] hover:bg-[#f4f2eb] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>

        {/* Image Gallery */}
        <div className="relative aspect-[16/10] bg-[#2d2820]">
          <img
            src={room.images[currentImage]}
            alt={`${room.name} - billede ${currentImage + 1}`}
            className="w-full h-full object-cover"
          />
          
          {/* Navigation arrows */}
          {room.images.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#f4f2eb]/90 flex items-center justify-center text-[#2d2820] hover:bg-[#f4f2eb] transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#f4f2eb]/90 flex items-center justify-center text-[#2d2820] hover:bg-[#f4f2eb] transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
            </>
          )}

          {/* Image dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {room.images.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentImage(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImage ? 'bg-[#f4f2eb]' : 'bg-[#f4f2eb]/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Thumbnails */}
        <div className="flex gap-1 p-2 bg-[#e8e4da]">
          {room.images.map((img, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentImage(index)}
              className={`w-16 h-12 overflow-hidden transition-opacity ${
                index === currentImage ? 'ring-2 ring-[#4a5a42]' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        {/* Room Info */}
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-display text-2xl text-[#2d2820]">{room.name}</h3>
              <p className="text-sm text-[#8a7a6a] mt-1">{room.size} · {room.description}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl text-[#4a5a42]">{room.price} kr</p>
              <p className="text-xs text-[#8a7a6a]">pr. nat</p>
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-2 mb-6">
            {room.features.map((feature) => (
              <span
                key={feature}
                className="text-[10px] tracking-[0.1em] uppercase text-[#6b5a4a] px-3 py-1.5 bg-[#e8e4da]"
              >
                {feature}
              </span>
            ))}
          </div>

          {/* Total & Select */}
          <div className="flex items-center justify-between pt-4 border-t border-[#ddd8cc]">
            <div>
              <p className="text-sm text-[#8a7a6a]">{nights} {nights === 1 ? 'nat' : 'naetter'}</p>
              <p className="font-display text-xl text-[#2d2820]">{total.toLocaleString('da-DK')} kr total</p>
            </div>
            <button
              type="button"
              onClick={onSelect}
              className="px-8 py-3 bg-[#4a5a42] text-[#f4f2eb] text-[11px] tracking-[0.2em] uppercase hover:bg-[#3d4a35] transition-colors"
            >
              Vaelg dette vaerelse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const BookingModal = () => {
  const t = useTranslations('booking');
  const { isOpen, selectedRoom, closeBooking } = useBooking();
  const [step, setStep] = useState<BookingStep>('dates');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [galleryRoom, setGalleryRoom] = useState<RoomWithImages | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    arrivalDate: null as Date | null,
    nights: 2,
    guests: 2,
    roomId: '',
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle pre-selected room
  useEffect(() => {
    if (isOpen && selectedRoom) {
      setFormData(prev => ({ ...prev, roomId: selectedRoom.id }));
      setStep('dates');
    }
  }, [isOpen, selectedRoom]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
      setStep('dates');
        setShowCalendar(false);
      setFormData({
          arrivalDate: null,
          nights: 2,
        guests: 2,
        roomId: '',
        name: '',
        email: '',
        phone: '',
        message: '',
      });
      }, 300);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Booking submitted:', formData);
    setIsSubmitting(false);
    setStep('success');
  };

  const getSelectedRoom = () => ROOMS.find(r => r.id === formData.roomId);

  const calculateTotal = () => {
    const room = getSelectedRoom();
    if (!room) return 0;
    return parseInt(room.price.replace('.', '')) * formData.nights;
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('da-DK');
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('da-DK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateShort = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('da-DK', {
      day: 'numeric',
      month: 'short'
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#1c1a17]/80 backdrop-blur-sm animate-fadeIn"
        onClick={closeBooking}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#f4f2eb] shadow-2xl animate-slideUp">

        {/* Close button */}
        <button
          type="button"
          onClick={closeBooking}
          className="absolute top-6 right-6 text-[#8a7a6a] hover:text-[#2d2820] transition-colors z-10"
          aria-label="Luk"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>

        {/* Success State */}
        {step === 'success' ? (
          <div className="px-10 py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#4a5a42] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#f4f2eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="font-display text-3xl text-[#2d2820] mb-4">
              {t('success.title')}
            </h2>
            <p className="text-[#6b5a4a] mb-8 max-w-sm mx-auto">
              {t('success.message')}
            </p>
            
            {/* Booking Summary */}
            <div className="bg-[#e8e4da] p-6 text-left mb-8">
              <h3 className="text-[11px] tracking-[0.15em] uppercase text-[#8a7a6a] mb-4">
                {t('success.summary')}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#8a7a6a]">{t('success.room')}</span>
                  <span className="text-[#2d2820]">{getSelectedRoom()?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8a7a6a]">{t('success.arrival')}</span>
                  <span className="text-[#2d2820]">{formatDate(formData.arrivalDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8a7a6a]">{t('success.nights')}</span>
                  <span className="text-[#2d2820]">{formData.nights}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8a7a6a]">{t('success.guests')}</span>
                  <span className="text-[#2d2820]">{formData.guests}</span>
                </div>
                <div className="flex justify-between pt-3 mt-3 border-t border-[#c8c0b0]">
                  <span className="text-[#2d2820] font-medium">{t('success.total')}</span>
                  <span className="text-[#4a5a42] font-medium">{formatPrice(calculateTotal())} kr</span>
                </div>
              </div>
            </div>
            
            <button
              type="button"
              onClick={closeBooking}
              className="w-full py-4 bg-[#2d2820] text-[#f4f2eb] text-[11px] tracking-[0.2em] uppercase hover:bg-[#1c1a17] transition-colors"
            >
              {t('success.close')}
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-10 pt-12 pb-6">
              <p className="text-[11px] tracking-[0.2em] uppercase text-[#8a7a6a] mb-4">
                OELIV - Bornholm
              </p>
              <h2 className="font-display text-3xl text-[#2d2820] mb-2">
            {t('title')}
          </h2>
              
              {/* Show selected room if pre-selected */}
              {selectedRoom && (
                <div className="mt-4 p-4 bg-[#e8e4da] border-l-2 border-[#4a5a42]">
                  <p className="text-[10px] tracking-[0.15em] uppercase text-[#8a7a6a] mb-1">
                    Valgt vaerelse
                  </p>
                  <p className="font-display text-lg text-[#2d2820]">{selectedRoom.name}</p>
                  <p className="text-sm text-[#4a5a42]">{selectedRoom.price} kr / nat</p>
                </div>
              )}
        </div>

            {/* Progress */}
            <div className="px-10 pb-6">
              <div className="flex items-center gap-2">
                {(['dates', 'room', 'contact'] as const).map((s, index) => {
                  const stepIndex = ['dates', 'room', 'contact'].indexOf(step);
                  const isActive = step === s;
                  const isCompleted = index < stepIndex;
                  
                  if (s === 'room' && selectedRoom) return null;
                  
                  return (
                    <div key={s} className="flex items-center gap-2">
                      <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                          isActive 
                            ? 'bg-[#4a5a42] text-[#f4f2eb]' 
                            : isCompleted
                              ? 'bg-[#7a8a6e] text-[#f4f2eb]'
                              : 'bg-[#e8e4da] text-[#8a7a6a]'
                        }`}
                      >
                        {isCompleted ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        ) : (
                          selectedRoom ? (index === 0 ? 1 : 2) : index + 1
                        )}
                  </div>
                      {index < (selectedRoom ? 1 : 2) && (
                        <div className={`w-8 h-[1px] ${isCompleted ? 'bg-[#7a8a6e]' : 'bg-[#ddd8cc]'}`} />
                      )}
                </div>
                  );
                })}
          </div>
        </div>

        {/* Content */}
            <div className="px-10 pb-10">
          {/* Step 1: Dates */}
          {step === 'dates' && (
                <div className="space-y-8">
                  {/* Custom Date Picker */}
                  <div ref={calendarRef} className="relative">
                    <label className="block text-[11px] tracking-[0.15em] uppercase text-[#8a7a6a] mb-3">
                      {t('step1.arrival')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCalendar(!showCalendar)}
                      className="w-full px-0 py-3 bg-transparent border-0 border-b border-[#c8c0b0] text-left text-lg font-light focus:border-[#4a5a42] focus:outline-none transition-colors flex items-center justify-between"
                    >
                      <span className={formData.arrivalDate ? 'text-[#2d2820]' : 'text-[#b8a890]'}>
                        {formData.arrivalDate ? formatDate(formData.arrivalDate) : 'Vaelg dato...'}
                      </span>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#8a7a6a]">
                        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M3 9H21" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M8 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M16 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                    
                    {showCalendar && (
                      <CustomCalendar
                        selectedDate={formData.arrivalDate}
                        onSelect={(date) => setFormData({ ...formData, arrivalDate: date })}
                        onClose={() => setShowCalendar(false)}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] tracking-[0.15em] uppercase text-[#8a7a6a] mb-3">
                      {t('step1.nights')}
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5, 6, 7].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setFormData({ ...formData, nights: n })}
                          className={`w-10 h-10 text-sm transition-all ${
                            formData.nights === n
                              ? 'bg-[#4a5a42] text-[#f4f2eb]'
                              : 'text-[#6b5a4a] hover:bg-[#e8e4da]'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                  </div>
                </div>

                <div>
                    <label className="block text-[11px] tracking-[0.15em] uppercase text-[#8a7a6a] mb-3">
                    {t('step1.guests')}
                  </label>
                    <div className="flex gap-2">
                    {[1, 2, 3, 4].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setFormData({ ...formData, guests: n })}
                          className={`w-10 h-10 text-sm transition-all ${
                          formData.guests === n
                              ? 'bg-[#4a5a42] text-[#f4f2eb]'
                              : 'text-[#6b5a4a] hover:bg-[#e8e4da]'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  </div>

                  {/* Price preview if room selected */}
                  {formData.roomId && (
                    <div className="p-4 bg-[#e8e4da] mt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-[#8a7a6a]">
                            {getSelectedRoom()?.name} - {formData.nights} {formData.nights === 1 ? 'nat' : 'naetter'}
                          </p>
                        </div>
                        <p className="font-display text-xl text-[#2d2820]">
                          {formatPrice(calculateTotal())} kr
                        </p>
                </div>
              </div>
                  )}

              <button
                type="button"
                    onClick={() => setStep(selectedRoom ? 'contact' : 'room')}
                disabled={!formData.arrivalDate}
                    className="w-full mt-4 py-4 bg-[#4a5a42] text-[#f4f2eb] text-[11px] tracking-[0.2em] uppercase hover:bg-[#3d4a35] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                    {t('step1.continue')} →
              </button>
            </div>
          )}

              {/* Step 2: Room (only if no pre-selected room) */}
              {step === 'room' && !selectedRoom && (
                <div className="space-y-3">
                  <p className="text-sm text-[#6b5a4a] mb-4">
                    Vaelg det vaerelse der passer bedst til dit ophold
                  </p>
                  
                  {ROOMS.map((room) => (
                    <div
                      key={room.id}
                      className={`border transition-all overflow-hidden ${
                        formData.roomId === room.id
                          ? 'border-[#4a5a42] ring-1 ring-[#4a5a42]'
                          : 'border-[#ddd8cc]'
                      }`}
                    >
                      <div className="flex">
                        {/* Room Image - clickable for gallery */}
                        <button
                          type="button"
                          onClick={() => setGalleryRoom(room)}
                          className="w-24 h-24 flex-shrink-0 relative overflow-hidden group"
                        >
                          <img 
                            src={room.images[0]} 
                            alt={room.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          {/* Expand icon */}
                          <div className="absolute inset-0 bg-[#1c1a17]/0 group-hover:bg-[#1c1a17]/40 transition-colors flex items-center justify-center">
                            <svg 
                              width="20" 
                              height="20" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              className="text-[#f4f2eb] opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          </div>
                          {/* Image count badge */}
                          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-[#1c1a17]/70 text-[#f4f2eb] text-[9px]">
                            {room.images.length} 📷
                          </div>
                          {formData.roomId === room.id && (
                            <div className="absolute top-1 left-1 w-5 h-5 bg-[#4a5a42] rounded-full flex items-center justify-center">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                <path d="M5 13l4 4L19 7" stroke="#f4f2eb" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </div>
                          )}
                        </button>
                        
                        {/* Room Info - clickable to select */}
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, roomId: room.id })}
                          className="flex-1 p-3 flex flex-col justify-between text-left hover:bg-[#faf9f5] transition-colors"
                        >
                          <div>
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-display text-base text-[#2d2820]">{room.name}</h3>
                                <p className="text-[10px] text-[#8a7a6a]">{room.size}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[#4a5a42] font-display text-base">
                                  {room.price} kr
                                </p>
                                <p className="text-[10px] text-[#8a7a6a]">pr. nat</p>
                              </div>
                            </div>
                            <p className="text-xs text-[#8a7a6a] font-light mt-1 line-clamp-1">{room.description}</p>
                          </div>
                          
                          {formData.roomId === room.id && (
                            <div className="flex justify-between text-xs mt-2 pt-2 border-t border-[#ddd8cc]">
                              <span className="text-[#8a7a6a]">{formData.nights} {formData.nights === 1 ? 'nat' : 'naetter'}</span>
                              <span className="text-[#2d2820] font-medium">
                                {formatPrice(parseInt(room.price.replace('.', '')) * formData.nights)} kr total
                              </span>
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-4 mt-6 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep('dates')}
                      className="text-[#8a7a6a] text-sm hover:text-[#2d2820] transition-colors"
                    >
                      ← {t('step2.back')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('contact')}
                      disabled={!formData.roomId}
                      className="flex-1 py-4 bg-[#4a5a42] text-[#f4f2eb] text-[11px] tracking-[0.2em] uppercase hover:bg-[#3d4a35] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {t('step2.continue')} →
                    </button>
                  </div>
                </div>
              )}

              {/* Room Gallery Modal */}
              {galleryRoom && (
                <RoomGalleryModal
                  room={galleryRoom}
                  onClose={() => setGalleryRoom(null)}
                  onSelect={() => {
                    setFormData({ ...formData, roomId: galleryRoom.id });
                    setGalleryRoom(null);
                  }}
                  nights={formData.nights}
                />
              )}

          {/* Step 3: Contact */}
          {step === 'contact' && (
              <div className="space-y-6">
                  {/* Booking summary */}
                  <div className="p-4 bg-[#e8e4da] mb-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-display text-lg text-[#2d2820]">{getSelectedRoom()?.name}</p>
                        <p className="text-sm text-[#8a7a6a]">
                          {formatDateShort(formData.arrivalDate)} - {formData.nights} {formData.nights === 1 ? 'nat' : 'naetter'} - {formData.guests} {formData.guests === 1 ? 'gaest' : 'gaester'}
                        </p>
                      </div>
                      <p className="font-display text-xl text-[#4a5a42]">
                        {formatPrice(calculateTotal())} kr
                      </p>
                    </div>
                  </div>

                <div>
                    <label className="block text-[11px] tracking-[0.15em] uppercase text-[#8a7a6a] mb-2">
                      {t('step3.name')} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-0 py-3 bg-transparent border-0 border-b border-[#c8c0b0] text-[#2d2820] font-light focus:border-[#4a5a42] focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                    <label className="block text-[11px] tracking-[0.15em] uppercase text-[#8a7a6a] mb-2">
                      {t('step3.email')} *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-0 py-3 bg-transparent border-0 border-b border-[#c8c0b0] text-[#2d2820] font-light focus:border-[#4a5a42] focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                    <label className="block text-[11px] tracking-[0.15em] uppercase text-[#8a7a6a] mb-2">
                    {t('step3.phone')}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-0 py-3 bg-transparent border-0 border-b border-[#c8c0b0] text-[#2d2820] font-light focus:border-[#4a5a42] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                    <label className="block text-[11px] tracking-[0.15em] uppercase text-[#8a7a6a] mb-2">
                    {t('step3.message')}
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={3}
                    placeholder={t('step3.messagePlaceholder')}
                      className="w-full px-0 py-3 bg-transparent border-0 border-b border-[#c8c0b0] text-[#2d2820] font-light focus:border-[#4a5a42] focus:outline-none transition-colors resize-none"
                  />
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                      onClick={() => setStep(selectedRoom ? 'dates' : 'room')}
                      className="text-[#8a7a6a] text-sm hover:text-[#2d2820] transition-colors"
                >
                      ← {t('step2.back')}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!formData.name || !formData.email || isSubmitting}
                      className="flex-1 py-4 bg-[#4a5a42] text-[#f4f2eb] text-[11px] tracking-[0.2em] uppercase hover:bg-[#3d4a35] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t('step3.sending') : t('step3.submit')}
                </button>
              </div>

                  <p className="text-center text-xs text-[#8a7a6a] mt-4 font-light">
                {t('step3.note')}
              </p>
            </div>
          )}
        </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};
