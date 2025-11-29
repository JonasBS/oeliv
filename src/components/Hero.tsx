'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { useBooking } from './BookingProvider';

export const Hero = () => {
  const t = useTranslations('hero');
  const { openBooking } = useBooking();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image - Atmospheric farmhouse */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=2000&auto=format&fit=crop"
          alt="ØLIV - Historisk gård på Bornholm"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        {/* Warm, aged overlay - like looking through old glass */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1c1a17]/60 via-[#1c1a17]/30 to-[#1c1a17]/70" />
        <div className="absolute inset-0 bg-[#3a352d]/20 mix-blend-multiply" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full py-32 lg:py-40">
        <div className="max-w-7xl mx-auto px-8 lg:px-12">
          <div className="max-w-2xl">
            {/* Small decorative element */}
            <div 
              className="flex items-center gap-3 mb-8 animate-fadeInUp opacity-0"
              style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
            >
              <span className="w-8 h-[1px] bg-[#b8a890]" />
              <span className="text-[#b8a890] text-[10px] tracking-[0.3em] uppercase">
                Bornholm · Anno 1780
              </span>
            </div>

            {/* Logo/Title - with historic feel */}
            <h1 
              className="font-display text-[#f4f2eb] text-6xl md:text-7xl lg:text-8xl tracking-[0.05em] mb-6 animate-fadeInUp opacity-0"
              style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}
            >
              ØLIV
            </h1>

            {/* Subtitle - elegant, understated */}
            <p 
              className="text-[#ddd8cc] text-xl md:text-2xl font-display font-light leading-relaxed mb-4 animate-fadeInUp opacity-0"
              style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}
            >
              {t('tagline')}
            </p>

            {/* Description */}
            <p 
              className="text-[#b8a890] text-base md:text-lg font-light leading-relaxed max-w-xl mb-10 animate-fadeInUp opacity-0"
              style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}
            >
              {t('description')}
            </p>

            {/* Badges - historic style */}
            <div 
              className="flex flex-wrap gap-3 mb-10 animate-fadeInUp opacity-0"
              style={{ animationDelay: '1s', animationFillMode: 'forwards' }}
            >
              {['Stråtag & Pigsten', 'Gårdsauna', 'ØLIV Brew', '300m til havet'].map((badge, i) => (
                <span 
                  key={badge}
                  className="px-4 py-2 text-[10px] tracking-[0.15em] uppercase text-[#ddd8cc] border border-[#b8a890]/30 bg-[#1c1a17]/30 backdrop-blur-sm"
                >
                  {badge}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div 
              className="flex flex-wrap gap-4 animate-fadeInUp opacity-0"
              style={{ animationDelay: '1.2s', animationFillMode: 'forwards' }}
            >
              <button
                type="button"
                onClick={openBooking}
                className="btn-elegant bg-[#4a5a42] text-[#f4f2eb] px-10 py-4 text-[11px] tracking-[0.2em] uppercase hover:bg-[#5a6b50]"
              >
                {t('cta.book')}
              </button>
              <Link
                href="/overnatning"
                className="px-10 py-4 text-[11px] tracking-[0.2em] uppercase border border-[#b8a890]/40 text-[#ddd8cc] hover:bg-[#f4f2eb]/10 transition-all duration-500"
              >
                {t('cta.explore')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative bottom element - like timber beam */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#1c1a17] to-transparent" />
      
      {/* Scroll indicator */}
      <div 
        className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-fadeIn opacity-0"
        style={{ animationDelay: '1.8s', animationFillMode: 'forwards' }}
      >
        <div className="flex flex-col items-center gap-3 text-[#b8a890]">
          <span className="text-[9px] tracking-[0.3em] uppercase">Udforsk</span>
          <div className="w-[1px] h-10 bg-gradient-to-b from-[#b8a890] to-transparent relative">
            <div className="absolute top-0 left-0 w-full h-4 bg-[#b8a890] animate-gentlePulse" />
          </div>
        </div>
      </div>
    </section>
  );
};
