'use client';

import { useTranslations } from 'next-intl';
import { useBooking } from './BookingProvider';

const testimonials = [
  {
    quote: 'Et sted hvor tiden står stille. Vi fandt den ro, vi ledte efter.',
    author: 'Marie & Thomas',
    location: 'København',
  },
  {
    quote: 'Autentisk og ærligt. Ingen unødvendige shows - bare ægte gæstfrihed.',
    author: 'Anna',
    location: 'Stockholm',
  },
  {
    quote: 'ØLIV Brew alene er værd at tage til Bornholm for. Kombineret med saunaen og roen - perfekt.',
    author: 'Henrik & Louise',
    location: 'Aarhus',
  },
];

export const TestimonialsSection = () => {
  const t = useTranslations('testimonials');
  const { openBooking } = useBooking();

  return (
    <section className="py-32 lg:py-40 bg-gradient-to-b from-[#2d2820] to-[#1c1a17] text-[#f4f2eb] relative overflow-hidden">
      {/* Decorative timber beam effect at top */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-[#4a4238] to-transparent opacity-50" />
      
      {/* Subtle texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }}
      />
      
      <div className="max-w-7xl mx-auto px-8 lg:px-12 relative">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="w-12 h-[1px] bg-[#b8a890]/50" />
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#b8a890]">
              Gæsternes ord
            </span>
            <span className="w-12 h-[1px] bg-[#b8a890]/50" />
          </div>
          <h2 className="font-display text-4xl md:text-5xl text-[#f4f2eb] leading-tight">
            {t('title')}
          </h2>
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-12 lg:gap-16 mb-20">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="text-center relative">
              {/* Quote mark - historic style */}
              <span className="block text-5xl font-display text-[#b8a890]/30 mb-4 leading-none">
                "
              </span>
              <blockquote className="font-display text-xl md:text-2xl text-[#ddd8cc] leading-relaxed mb-6 italic">
                {testimonial.quote}
              </blockquote>
              <div>
                <p className="text-[#c8c0b0] text-sm">{testimonial.author}</p>
                <p className="text-[#8a7a6a] text-xs tracking-[0.1em] uppercase">
                  {testimonial.location}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            type="button"
            onClick={openBooking}
            className="inline-block px-12 py-4 text-[11px] tracking-[0.2em] uppercase border border-[#b8a890]/40 text-[#ddd8cc] hover:bg-[#f4f2eb] hover:text-[#2d2820] transition-all duration-500"
          >
            {t('cta')}
          </button>
          <p className="text-[#8a7a6a] text-sm mt-4 font-light">
            {t('ctaNote')}
          </p>
        </div>
      </div>
    </section>
  );
};
