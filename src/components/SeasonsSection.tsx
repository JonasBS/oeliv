'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';

const seasonImages = [
  'https://images.unsplash.com/photo-1462275646964-a0e3571f4f83?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1491002052546-bf38f186af56?q=80&w=1200&auto=format&fit=crop',
];

export const SeasonsSection = () => {
  const t = useTranslations('seasons');

  const seasons = [
    { key: 'spring', image: seasonImages[0] },
    { key: 'summer', image: seasonImages[1] },
    { key: 'autumn', image: seasonImages[2] },
    { key: 'winter', image: seasonImages[3] },
  ];

  return (
    <section className="py-32 lg:py-40 bg-[#e8e4da] relative">
      {/* Kalk/lime wash texture effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-[#ddd8cc]/20" />
      </div>
      
      <div className="max-w-7xl mx-auto px-8 lg:px-12 relative">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="w-12 h-[1px] bg-[#b8a890]" />
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#8a7a6a]">
              Årstiderne
            </span>
            <span className="w-12 h-[1px] bg-[#b8a890]" />
          </div>
          <h2 className="font-display text-4xl md:text-5xl text-[#2d2820] leading-tight">
            {t('title')}
          </h2>
        </div>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="flex lg:grid lg:grid-cols-4 gap-6 overflow-x-auto pb-4 lg:pb-0 -mx-8 px-8 lg:mx-0 lg:px-0 snap-x snap-mandatory">
          {seasons.map((season) => (
            <div
              key={season.key}
              className="flex-shrink-0 w-[280px] lg:w-auto snap-start group"
            >
              <div className="image-hover aspect-[3/4] relative mb-6">
                <Image
                  src={season.image}
                  alt={t(`${season.key}.title`)}
                  fill
                  className="object-cover"
                />
                {/* Warm aged overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#2d2820]/70 via-[#2d2820]/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <h3 className="font-display text-2xl text-[#f4f2eb] mb-2">
                    {t(`${season.key}.title`)}
                  </h3>
                </div>
              </div>
              <p className="text-[#6b5a4a] text-sm font-light leading-relaxed mb-3">
                {t(`${season.key}.description`)}
              </p>
              <p className="text-[10px] tracking-[0.2em] uppercase text-[#4a5a42]">
                {t(`${season.key}.note`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
