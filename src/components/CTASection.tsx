'use client';

import { useTranslations } from 'next-intl';
import { useBooking } from './BookingProvider';

export const CTASection = () => {
  const t = useTranslations('cta');
  const { openBooking } = useBooking();

  return (
    <section className="py-20 lg:py-28 bg-cream text-center">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <h2 className="font-display text-3xl md:text-4xl font-medium mb-8 text-charcoal">
          {t('title')}
        </h2>
        <button
          type="button"
          onClick={openBooking}
          className="bg-olive text-cream px-10 py-4 rounded-full text-base tracking-[0.1em] uppercase font-medium hover:bg-olive-soft transition-all hover:-translate-y-0.5 hover:shadow-xl"
        >
          {t('button')}
        </button>
      </div>
    </section>
  );
};

