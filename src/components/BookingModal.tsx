'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useBooking } from './BookingProvider';

type BookingStep = 'dates' | 'room' | 'contact';

// Custom Calendar Component
const CustomCalendar = ({ 
  selectedDate, 
  onSelect, 
  minDate 
}: { 
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
  minDate?: Date;
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const monthNames = ['Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni', 
                      'Juli', 'August', 'September', 'Oktober', 'November', 'December'];
  const dayNames = ['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = (firstDay.getDay() + 6) % 7; // Monday = 0
    
    const days: (Date | null)[] = [];
    
    // Empty cells before first day
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const isDateDisabled = (date: Date | null) => {
    if (!date) return true;
    if (!minDate) return false;
    return date < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
  };

  const isDateSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === new Date().toDateString();
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="bg-[#faf9f5] border border-[#ddd8cc] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="w-8 h-8 flex items-center justify-center text-[#8a7a6a] hover:text-[#4a5a42] transition-colors"
        >
          ‹
        </button>
        <span className="font-display text-lg text-[#2d2820]">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button
          type="button"
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="w-8 h-8 flex items-center justify-center text-[#8a7a6a] hover:text-[#4a5a42] transition-colors"
        >
          ›
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-[10px] tracking-[0.1em] uppercase text-[#8a7a6a] py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => (
          <button
            key={index}
            type="button"
            disabled={isDateDisabled(date)}
            onClick={() => date && onSelect(date)}
            className={`
              aspect-square flex items-center justify-center text-sm transition-all
              ${!date ? 'invisible' : ''}
              ${isDateDisabled(date) ? 'text-[#c8c0b0] cursor-not-allowed' : 'hover:bg-[#4a5a42]/10'}
              ${isDateSelected(date) ? 'bg-[#4a5a42] text-[#f4f2eb]' : ''}
              ${isToday(date) && !isDateSelected(date) ? 'border border-[#4a5a42]' : ''}
            `}
          >
            {date?.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
};

export const BookingModal = () => {
  const t = useTranslations('booking');
  const { isOpen, closeBooking } = useBooking();
  const [step, setStep] = useState<BookingStep>('dates');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
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

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('dates');
      setFormData({
        arrivalDate: '',
        departureDate: '',
        guests: 2,
        roomId: '',
        name: '',
        email: '',
        phone: '',
        message: '',
      });
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
    setIsSubmitting(false);
    closeBooking();
    alert(t('toast.success'));
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop - warm, aged feel */}
      <div 
        className="absolute inset-0 bg-[#1c1a17]/85 backdrop-blur-sm animate-fadeIn"
        onClick={closeBooking}
      />

      {/* Modal - aged paper feel */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#f4f2eb] animate-fadeInScale shadow-2xl">
        {/* Decorative corners */}
        <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-[#b8a890]/40" />
        <div className="absolute top-4 right-4 w-8 h-8 border-t border-r border-[#b8a890]/40" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b border-l border-[#b8a890]/40" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-[#b8a890]/40" />

        {/* Close button */}
        <button
          type="button"
          onClick={closeBooking}
          className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-[#8a7a6a] hover:text-[#2d2820] transition-colors z-10"
          aria-label="Luk"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M1 1L19 19M19 1L1 19" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>

        {/* Header */}
        <div className="px-8 lg:px-12 pt-12 pb-8 border-b border-[#ddd8cc]">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#8a7a6a]">✦</span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#8a7a6a]">ØLIV · Bornholm</span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#8a7a6a]">✦</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl text-[#2d2820]">
            {t('title')}
          </h2>
          <p className="text-[#6b5a4a] font-light mt-2">
            {t('subtitle')}
          </p>
        </div>

        {/* Progress - historic style */}
        <div className="px-8 lg:px-12 py-6 border-b border-[#ddd8cc] bg-[#e8e4da]/50">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {(['dates', 'room', 'contact'] as const).map((s, index) => (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div 
                    className={`w-8 h-8 flex items-center justify-center text-sm transition-all duration-500 border ${
                      step === s 
                        ? 'bg-[#4a5a42] text-[#f4f2eb] border-[#4a5a42]' 
                        : index < ['dates', 'room', 'contact'].indexOf(step)
                          ? 'bg-[#7a8a6e] text-[#f4f2eb] border-[#7a8a6e]'
                          : 'bg-[#e8e4da] text-[#8a7a6a] border-[#c8c0b0]'
                    }`}
                  >
                    {index < ['dates', 'room', 'contact'].indexOf(step) ? '✓' : index + 1}
                  </div>
                  <span className="text-[10px] tracking-[0.1em] uppercase text-[#8a7a6a] mt-2">
                    {t(`steps.${s}`)}
                  </span>
                </div>
                {index < 2 && (
                  <div className={`w-16 lg:w-24 h-[1px] mx-2 transition-colors duration-500 ${
                    index < ['dates', 'room', 'contact'].indexOf(step) ? 'bg-[#7a8a6e]' : 'bg-[#c8c0b0]'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-8 lg:px-12 py-8">
          {/* Step 1: Dates */}
          {step === 'dates' && (
            <div className="animate-fadeIn">
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase text-[#8a7a6a] mb-2">
                      {t('step1.arrival')}
                    </label>
                    <input
                      type="date"
                      value={formData.arrivalDate}
                      onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                      className="w-full px-4 py-3 bg-[#faf9f5] border border-[#ddd8cc] text-[#2d2820] font-light focus:border-[#4a5a42] focus:outline-none focus:ring-2 focus:ring-[#4a5a42]/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase text-[#8a7a6a] mb-2">
                      {t('step1.nights')}
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-[#faf9f5] border border-[#ddd8cc] text-[#2d2820] font-light focus:border-[#4a5a42] focus:outline-none focus:ring-2 focus:ring-[#4a5a42]/10 transition-all appearance-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map(n => (
                        <option key={n} value={n}>{n} {n === 1 ? 'nat' : 'nætter'}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-[#8a7a6a] mb-3">
                    {t('step1.guests')}
                  </label>
                  <div className="flex gap-3">
                    {[1, 2, 3, 4].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setFormData({ ...formData, guests: n })}
                        className={`flex-1 py-3 text-center border transition-all duration-300 ${
                          formData.guests === n
                            ? 'bg-[#4a5a42] text-[#f4f2eb] border-[#4a5a42]'
                            : 'bg-[#faf9f5] text-[#2d2820] border-[#ddd8cc] hover:border-[#8a7a6a]'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-[#8a7a6a] mt-2 font-light">{t('step1.guestsHelp')}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep('room')}
                disabled={!formData.arrivalDate}
                className="w-full mt-8 py-4 bg-[#4a5a42] text-[#f4f2eb] text-[11px] tracking-[0.2em] uppercase hover:bg-[#5a6b50] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('step1.continue')}
              </button>
            </div>
          )}

          {/* Step 2: Room */}
          {step === 'room' && (
            <div className="animate-fadeIn">
              <div className="space-y-4">
                {[
                  { id: '1', name: 'Havudsigt', capacity: '2 gæster', price: '1.850', desc: 'Udsigt over Østersøen' },
                  { id: '2', name: 'Gårdshaven', capacity: '2-4 gæster', price: '2.250', desc: 'Udsigt til gården og haven' },
                  { id: '3', name: 'Bryggeriet', capacity: '2 gæster', price: '1.650', desc: 'Ved siden af bryggeriet' },
                ].map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, roomId: room.id })}
                    className={`w-full p-6 text-left border transition-all duration-300 ${
                      formData.roomId === room.id
                        ? 'border-[#4a5a42] bg-[#e8e4da]'
                        : 'border-[#ddd8cc] bg-[#faf9f5] hover:border-[#8a7a6a]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-display text-xl text-[#2d2820]">{room.name}</h3>
                        <p className="text-sm text-[#8a7a6a] font-light">{room.capacity}</p>
                        <p className="text-xs text-[#6b5a4a] font-light mt-1">{room.desc}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-xl text-[#4a5a42]">{room.price} kr</p>
                        <p className="text-xs text-[#8a7a6a]">pr. nat</p>
                      </div>
                    </div>
                    {formData.roomId === room.id && (
                      <div className="mt-4 pt-4 border-t border-[#c8c0b0]">
                        <p className="text-xs text-[#4a5a42]">✓ Valgt</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setStep('dates')}
                  className="flex-1 py-4 border border-[#ddd8cc] text-[#8a7a6a] text-[11px] tracking-[0.2em] uppercase hover:border-[#8a7a6a] transition-colors"
                >
                  {t('step2.back')}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('contact')}
                  disabled={!formData.roomId}
                  className="flex-1 py-4 bg-[#4a5a42] text-[#f4f2eb] text-[11px] tracking-[0.2em] uppercase hover:bg-[#5a6b50] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('step2.continue')}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Contact */}
          {step === 'contact' && (
            <div className="animate-fadeIn">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-[#8a7a6a] mb-2">
                    {t('step3.name')} <span className="text-[#a67c5b]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-[#faf9f5] border border-[#ddd8cc] text-[#2d2820] font-light focus:border-[#4a5a42] focus:outline-none focus:ring-2 focus:ring-[#4a5a42]/10 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-[#8a7a6a] mb-2">
                    {t('step3.email')} <span className="text-[#a67c5b]">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-[#faf9f5] border border-[#ddd8cc] text-[#2d2820] font-light focus:border-[#4a5a42] focus:outline-none focus:ring-2 focus:ring-[#4a5a42]/10 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-[#8a7a6a] mb-2">
                    {t('step3.phone')}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-[#faf9f5] border border-[#ddd8cc] text-[#2d2820] font-light focus:border-[#4a5a42] focus:outline-none focus:ring-2 focus:ring-[#4a5a42]/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-[#8a7a6a] mb-2">
                    {t('step3.message')}
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    placeholder={t('step3.messagePlaceholder')}
                    className="w-full px-4 py-3 bg-[#faf9f5] border border-[#ddd8cc] text-[#2d2820] font-light focus:border-[#4a5a42] focus:outline-none focus:ring-2 focus:ring-[#4a5a42]/10 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setStep('room')}
                  className="flex-1 py-4 border border-[#ddd8cc] text-[#8a7a6a] text-[11px] tracking-[0.2em] uppercase hover:border-[#8a7a6a] transition-colors"
                >
                  {t('step2.back')}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!formData.name || !formData.email || isSubmitting}
                  className="flex-1 py-4 bg-[#4a5a42] text-[#f4f2eb] text-[11px] tracking-[0.2em] uppercase hover:bg-[#5a6b50] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t('step3.sending') : t('step3.submit')}
                </button>
              </div>

              <p className="text-center text-xs text-[#8a7a6a] mt-6 font-light">
                {t('step3.note')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
