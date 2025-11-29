'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export const NewsletterSection = () => {
  const t = useTranslations('newsletter');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement newsletter signup
    console.log('Newsletter signup:', email);
    setEmail('');
  };

  return (
    <section className="py-20 lg:py-28 bg-olive/5">
      <div className="max-w-xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="font-display text-3xl md:text-4xl font-medium tracking-[0.05em] uppercase mb-6 text-charcoal">
          {t('title')}
        </h2>
        <p className="text-lg text-muted leading-relaxed mb-10 font-light">
          {t('description')}
        </p>
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex gap-3 mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('placeholder')}
              required
              className="flex-1 px-4 py-3 border border-black/10 rounded-lg bg-white text-charcoal focus:outline-none focus:border-olive transition-colors"
              aria-label={t('placeholder')}
            />
            <button
              type="submit"
              className="bg-olive text-cream px-6 py-3 rounded-lg text-sm tracking-[0.1em] uppercase font-medium hover:bg-olive-soft transition-colors whitespace-nowrap"
            >
              {t('submit')}
            </button>
          </div>
          <p className="text-xs text-muted">{t('privacy')}</p>
        </form>
      </div>
    </section>
  );
};

