'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { useBooking } from './BookingProvider';

export const Hero = () => {
  const t = useTranslations('hero');
  const { openBooking } = useBooking();

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#f4f2eb]">
      {/* Split layout - Ett Hem inspired */}
      <div className="min-h-screen grid lg:grid-cols-2">
        
        {/* Left side - Text content with lots of whitespace */}
        <div className="flex flex-col justify-center px-8 md:px-16 lg:px-20 py-32 lg:py-20 order-2 lg:order-1">
          <div className="max-w-md">
            {/* Minimal logo */}
            <h1 
              className="font-display text-[#2d2820] text-5xl md:text-6xl lg:text-7xl tracking-[0.02em] mb-8 animate-fadeInUp opacity-0"
              style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
            >
              ØLIV
            </h1>

            {/* Poetic tagline - loose, artsy */}
            <p 
              className="text-[#6b5a4a] text-lg md:text-xl font-display font-light leading-[1.8] mb-6 animate-fadeInUp opacity-0"
              style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}
            >
              {t('tagline')}
            </p>

            {/* Short description */}
            <p 
              className="text-[#8a7a6a] text-base font-light leading-relaxed mb-12 animate-fadeInUp opacity-0"
              style={{ animationDelay: '0.7s', animationFillMode: 'forwards' }}
            >
              {t('description')}
            </p>

            {/* Minimal CTA - just text links */}
            <div 
              className="flex flex-col gap-4 animate-fadeInUp opacity-0"
              style={{ animationDelay: '0.9s', animationFillMode: 'forwards' }}
            >
              <button
                type="button"
                onClick={openBooking}
                className="group inline-flex items-center gap-3 text-[#2d2820] text-sm tracking-[0.05em]"
              >
                <span className="border-b border-[#2d2820] pb-0.5 group-hover:border-[#4a5a42] group-hover:text-[#4a5a42] transition-colors">
                  {t('cta.book')}
                </span>
                <span className="text-[#8a7a6a] group-hover:translate-x-1 transition-transform">→</span>
              </button>
              
              <Link
                href="/overnatning"
                className="group inline-flex items-center gap-3 text-[#8a7a6a] text-sm tracking-[0.05em]"
              >
                <span className="border-b border-transparent pb-0.5 group-hover:border-[#8a7a6a] transition-colors">
                  {t('cta.explore')}
                </span>
                <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
              </Link>
            </div>
          </div>

          {/* Bottom info - subtle */}
          <div 
            className="mt-auto pt-16 animate-fadeIn opacity-0"
            style={{ animationDelay: '1.2s', animationFillMode: 'forwards' }}
          >
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#b8a890]">
              Bornholm · 300m fra havet
            </p>
          </div>
        </div>

        {/* Right side - Full bleed image */}
        <div 
          className="relative min-h-[60vh] lg:min-h-screen order-1 lg:order-2 animate-fadeIn opacity-0"
          style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
        >
          <Image
            src="https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=2000&auto=format&fit=crop"
            alt="ØLIV - Historisk gård på Bornholm"
            fill
            className="object-cover"
            priority
            quality={90}
          />
          {/* Subtle overlay for depth */}
          <div className="absolute inset-0 bg-[#2d2820]/10" />
          
          {/* Floating text on image - artsy touch */}
          <div 
            className="absolute bottom-8 right-8 text-right animate-fadeInUp opacity-0"
            style={{ animationDelay: '1s', animationFillMode: 'forwards' }}
          >
            <p className="text-[#f4f2eb]/80 text-[11px] tracking-[0.15em] uppercase">
              Anno 1780
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
