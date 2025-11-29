'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';

export const PlaceSection = () => {
  const t = useTranslations('place');

  return (
    <section className="py-32 lg:py-40 bg-[#f4f2eb]">
      <div className="max-w-7xl mx-auto px-8 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Image */}
          <div className="order-2 lg:order-1">
            <div className="image-hover aspect-[4/5] relative">
              <Image
                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop"
                alt="Bornholm landskab"
                fill
                className="object-cover"
              />
              {/* Aged photo effect */}
              <div className="absolute inset-0 bg-[#3a352d]/10 mix-blend-multiply" />
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#8a7a6a]">
                ✦ Stedet ✦
              </span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl text-[#2d2820] leading-tight mb-8">
              {t('title')}
            </h2>
            
            <div className="space-y-6 text-[#6b5a4a] font-light leading-relaxed">
              <p>{t('text1')}</p>
              <p>{t('text2')}</p>
              <p>{t('text3')}</p>
            </div>

            {/* Location details - historic card style */}
            <div className="mt-12 p-8 bg-[#e8e4da] relative">
              {/* Corner flourishes */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t border-l border-[#b8a890]/50" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b border-r border-[#b8a890]/50" />
              
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#8a7a6a] mb-3">
                    Adresse
                  </p>
                  <p className="text-[#2d2820] font-light leading-relaxed">
                    Lærkegårdsvej 5<br />
                    3770 Allinge<br />
                    Bornholm
                  </p>
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#8a7a6a] mb-3">
                    Afstand
                  </p>
                  <p className="text-[#2d2820] font-light leading-relaxed">
                    300m til kysten<br />
                    15 min fra Rønne<br />
                    1t færge fra Ystad
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
