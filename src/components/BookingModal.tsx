'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useBooking } from './BookingProvider';

type BookingStep = 'dates' | 'room' | 'contact';

export const BookingModal = () => {
  const t = useTranslations('booking');
  const { isOpen, closeBooking } = useBooking();
  const [step, setStep] = useState<BookingStep>('dates');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    arrivalDate: '',
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
        nights: 2,
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });
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
        className="absolute inset-0 bg-[#1c1a17]/80 backdrop-blur-sm"
        onClick={closeBooking}
      />

      {/* Modal - Ett Hem inspired, minimal */}
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#f4f2eb] shadow-2xl">
        
        {/* Close button - minimal */}
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

        {/* Header - simple, elegant */}
        <div className="px-10 pt-12 pb-8">
          <p className="text-[11px] tracking-[0.2em] uppercase text-[#8a7a6a] mb-4">
            ØLIV · Bornholm
          </p>
          <h2 className="font-display text-3xl text-[#2d2820] mb-2">
            {t('title')}
          </h2>
          <p className="text-[#6b5a4a] font-light text-sm">
            {t('subtitle')}
          </p>
        </div>

        {/* Progress - minimal dots */}
        <div className="px-10 pb-8">
          <div className="flex items-center gap-3">
            {(['dates', 'room', 'contact'] as const).map((s, index) => (
              <div key={s} className="flex items-center gap-3">
                <div 
                  className={`w-2 h-2 rounded-full transition-all ${
                    step === s 
                      ? 'bg-[#4a5a42] scale-125' 
                      : index < ['dates', 'room', 'contact'].indexOf(step)
                        ? 'bg-[#7a8a6e]'
                        : 'bg-[#c8c0b0]'
                  }`}
                />
                {index < 2 && (
                  <div className={`w-12 h-[1px] ${
                    index < ['dates', 'room', 'contact'].indexOf(step) ? 'bg-[#7a8a6e]' : 'bg-[#ddd8cc]'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-10 pb-10">
          {/* Step 1: Dates */}
          {step === 'dates' && (
            <div className="space-y-8">
              <div>
                <label className="block text-[11px] tracking-[0.15em] uppercase text-[#8a7a6a] mb-3">
                  {t('step1.arrival')}
                </label>
                <input
                  type="date"
                  value={formData.arrivalDate}
                  onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-0 py-3 bg-transparent border-0 border-b border-[#c8c0b0] text-[#2d2820] text-lg font-light focus:border-[#4a5a42] focus:outline-none transition-colors"
                />
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

              <button
                type="button"
                onClick={() => setStep('room')}
                disabled={!formData.arrivalDate}
                className="w-full mt-4 py-4 bg-[#4a5a42] text-[#f4f2eb] text-[11px] tracking-[0.2em] uppercase hover:bg-[#3d4a35] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('step1.continue')} →
              </button>
            </div>
          )}

          {/* Step 2: Room */}
          {step === 'room' && (
            <div className="space-y-4">
              {[
                { id: '1', name: 'Gårdværelse', price: '1.295', desc: 'Dobbeltseng, eget bad' },
                { id: '2', name: 'Haveværelse', price: '1.595', desc: 'Kingsize seng, adgang til haven' },
                { id: '3', name: 'Lærkegaard Suite', price: '2.195', desc: 'Separat stue, privat terrasse' },
              ].map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, roomId: room.id })}
                  className={`w-full p-5 text-left border-b transition-all ${
                    formData.roomId === room.id
                      ? 'bg-[#e8e4da] border-[#4a5a42]'
                      : 'border-[#ddd8cc] hover:bg-[#faf9f5]'
                  }`}
                >
                  <div className="flex justify-between items-baseline">
                    <div>
                      <h3 className="font-display text-lg text-[#2d2820]">{room.name}</h3>
                      <p className="text-sm text-[#8a7a6a] font-light mt-1">{room.desc}</p>
                    </div>
                    <p className="text-[#4a5a42] font-light">
                      {room.price} <span className="text-xs text-[#8a7a6a]">kr/nat</span>
                    </p>
                  </div>
                </button>
              ))}

              <div className="flex gap-4 mt-8">
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

          {/* Step 3: Contact */}
          {step === 'contact' && (
            <div className="space-y-6">
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
                  onClick={() => setStep('room')}
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
      </div>
    </div>
  );
};
