'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { useBooking } from './BookingProvider';

export const Hero = () => {
  const t = useTranslations('hero');
  const { openBooking } = useBooking();

  return (
    <section className="relative min-h-screen bg-[#f4f2eb]">
      {/* Main content grid */}
      <div className="min-h-screen grid lg:grid-cols-12">
        
        {/* Left content - 5 columns */}
        <div className="lg:col-span-5 flex flex-col justify-center px-8 md:px-12 lg:px-16 py-32 lg:py-24 order-2 lg:order-1">
          <div className="max-w-sm">
            {/* Overline */}
            <p className="text-[11px] tracking-[0.25em] uppercase text-[#8a7a6a] mb-6">
              Bornholm
            </p>

            {/* Title */}
            <h1 className="font-display text-[#2d2820] text-5xl lg:text-6xl tracking-[0.02em] leading-[1.1] mb-6">
              ØLIV
            </h1>

            {/* Tagline */}
            <p className="font-display text-[#4a4238] text-xl lg:text-2xl font-light leading-relaxed mb-6">
              {t('tagline')}
            </p>

            {/* Description */}
            <p className="text-[#6b5a4a] text-[15px] leading-[1.8] mb-10">
              {t('description')}
            </p>

            {/* CTAs - stacked, minimal */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => openBooking()}
                className="group flex items-center gap-3 text-[#2d2820]"
              >
                <span className="text-[14px] tracking-[0.02em] border-b border-[#2d2820] pb-0.5 group-hover:border-[#4a5a42] group-hover:text-[#4a5a42] transition-colors">
                  {t('cta.book')}
                </span>
                <svg 
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              
              <Link
                href="/overnatning"
                className="group flex items-center gap-3 text-[#8a7a6a] hover:text-[#2d2820] transition-colors"
              >
                <span className="text-[14px] tracking-[0.02em]">
                  {t('cta.explore')}
                </span>
                <svg 
                  className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Bottom detail */}
          <div className="mt-auto pt-12 lg:pt-20">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#b8a890]">
              300m fra Østersøen · Anno 1780
            </p>
          </div>
        </div>

        {/* Right image - 7 columns */}
        <div className="lg:col-span-7 relative min-h-[50vh] lg:min-h-screen order-1 lg:order-2">
          <Image
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2000&auto=format&fit=crop"
            alt="ØLIV - Bornholm kyst"
            fill
            className="object-cover"
            priority
            quality={90}
          />
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#f4f2eb] via-transparent to-transparent opacity-30 lg:opacity-50" />
        </div>
      </div>

      {/* Scroll indicator - bottom center */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2">
        <span className="text-[9px] tracking-[0.2em] uppercase text-[#8a7a6a]">Scroll</span>
        <div className="w-[1px] h-8 bg-[#c8c0b0]" />
      </div>
    </section>
  );
};
