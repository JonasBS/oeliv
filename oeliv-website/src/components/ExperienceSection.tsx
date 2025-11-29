'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/routing';

const experienceImages = [
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop',
];

export const ExperienceSection = () => {
  const t = useTranslations('experience');

  const experiences = [
    { key: 'accommodation', image: experienceImages[0], href: '/overnatning' },
    { key: 'sauna', image: experienceImages[1], href: '/spa' },
    { key: 'brewery', image: experienceImages[2], href: '/bryggeri' },
    { key: 'surroundings', image: experienceImages[3], href: '/om-os' },
  ];

  return (
    <section className="py-32 lg:py-40 bg-[#f4f2eb] relative">
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }}
      />
      
      <div className="max-w-7xl mx-auto px-8 lg:px-12 relative">
        {/* Section Header - with historic flourish */}
        <div className="max-w-2xl mb-20">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#8a7a6a]">
              ✦ Oplevelsen ✦
            </span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl text-[#2d2820] leading-tight mb-6">
            {t('title')}
          </h2>
          <p className="text-[#6b5a4a] text-lg font-light leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* Experience Grid - Asymmetric layout */}
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Large feature - Accommodation */}
          <div className="lg:col-span-7 group">
            <Link href={experiences[0].href} className="block">
              <div className="image-hover aspect-[4/3] lg:aspect-[4/5] relative mb-6">
                <Image
                  src={experiences[0].image}
                  alt={t(`${experiences[0].key}.title`)}
                  fill
                  className="object-cover"
                />
                {/* Aged photo overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#2d2820]/40 to-transparent" />
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-display text-2xl md:text-3xl text-[#2d2820] mb-2 group-hover:text-[#4a5a42] transition-colors duration-500">
                    {t(`${experiences[0].key}.title`)}
                  </h3>
                  <p className="text-[#6b5a4a] font-light max-w-md leading-relaxed">
                    {t(`${experiences[0].key}.description`)}
                  </p>
                </div>
                <span className="text-[#8a7a6a] text-sm tracking-[0.1em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  Udforsk →
                </span>
              </div>
            </Link>
          </div>

          {/* Smaller items - stacked */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:gap-8 lg:pt-24">
            {experiences.slice(1).map((exp) => (
              <div key={exp.key} className="group">
                <Link href={exp.href} className="block">
                  <div className="image-hover aspect-[3/2] relative mb-4">
                    <Image
                      src={exp.image}
                      alt={t(`${exp.key}.title`)}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2d2820]/30 to-transparent" />
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-display text-xl md:text-2xl text-[#2d2820] mb-1 group-hover:text-[#4a5a42] transition-colors duration-500">
                        {t(`${exp.key}.title`)}
                      </h3>
                      <p className="text-[#6b5a4a] text-sm font-light">
                        {t(`${exp.key}.description`).substring(0, 80)}...
                      </p>
                    </div>
                    <span className="text-[#8a7a6a] text-xs tracking-[0.1em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      →
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
