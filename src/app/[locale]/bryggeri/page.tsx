import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';


import { type Locale } from '@/i18n/config';
import Image from 'next/image';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'brewery' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

export default async function BreweryPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('brewery');

  const beers = [
    { name: 'Kystlys', type: 'Lys lager · 4.5%', description: t('beers.kystlys') },
    { name: 'Gårdens IPA', type: 'IPA · 5.8%', description: t('beers.ipa') },
    { name: 'Havbris', type: 'Wheat ale · 4.2%', description: t('beers.havbris') },
    { name: 'Sæsonens Stout', type: 'Stout · 6.0%', description: t('beers.stout') },
  ];

  const processSteps = [
    { title: t('process.ingredients.title'), description: t('process.ingredients.description') },
    { title: t('process.brewing.title'), description: t('process.brewing.description') },
    { title: t('process.fermentation.title'), description: t('process.fermentation.description') },
    { title: t('process.maturation.title'), description: t('process.maturation.description') },
  ];

  const tastings = [
    {
      title: t('tastings.small.title'),
      price: t('tastings.small.price'),
      description: t('tastings.small.description'),
      features: t.raw('tastings.small.features') as string[],
    },
    {
      title: t('tastings.extended.title'),
      price: t('tastings.extended.price'),
      description: t('tastings.extended.description'),
      features: t.raw('tastings.extended.features') as string[],
    },
    {
      title: t('tastings.private.title'),
      price: t('tastings.private.price'),
      description: t('tastings.private.description'),
      features: t.raw('tastings.private.features') as string[],
    },
  ];

  return (
    <main className="pt-20">
      {/* Page Header */}
      <section className="py-16 lg:py-24 bg-[#f4f2eb] text-center">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-medium tracking-[0.05em] mb-6 text-charcoal">
              ØLIV Brew
            </h1>
            <p className="text-xl text-muted max-w-2xl mx-auto leading-relaxed">
              {t('hero.subtitle')}
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-20 bg-cream">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="relative aspect-[4/5] rounded-sm overflow-hidden shadow-xl">
                <Image
                  src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop"
                  alt="Bornholmsk mark ved solnedgang"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="max-w-xl">
                <h2 className="font-display text-3xl md:text-4xl font-medium tracking-[0.05em] uppercase mb-6 text-charcoal relative inline-block">
                  {t('main.title')}
                  <span className="absolute bottom-[-8px] left-0 w-16 h-0.5 bg-olive" />
                </h2>
                <p className="text-xl text-charcoal italic mb-4">{t('main.subtitle')}</p>
                <p className="text-muted leading-relaxed mb-4">{t('main.text1')}</p>
                <p className="text-muted leading-relaxed mb-4">{t('main.text2')}</p>
                <p className="text-muted leading-relaxed mb-6">{t('main.text3')}</p>
                <div className="flex flex-wrap gap-3">
                  {(t.raw('main.tags') as string[]).map((tag: string) => (
                    <span
                      key={tag}
                      className="px-4 py-2 text-sm bg-olive/10 text-olive rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Beers - Artistic Labels inspired by Ale Farm */}
        <section className="py-24 bg-[#f4f2eb]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-[11px] tracking-[0.3em] uppercase text-[#8a7a6a] mb-4 block">
                Brygget paa Bornholm
              </span>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-[#2d2820]">
                {t('beersSection.title')}
              </h2>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              
              {/* Kystlys - Coastal sunrise theme */}
              <div className="group cursor-pointer">
                <div className="aspect-[3/4] relative overflow-hidden rounded-sm shadow-lg group-hover:shadow-xl transition-shadow duration-500">
                  {/* Label background - gradient sky */}
                  <svg viewBox="0 0 200 280" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                    <defs>
                      <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#87CEEB" />
                        <stop offset="40%" stopColor="#FFE4B5" />
                        <stop offset="60%" stopColor="#FFDAB9" />
                        <stop offset="100%" stopColor="#F5DEB3" />
                      </linearGradient>
                      <linearGradient id="seaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#5F9EA0" />
                        <stop offset="100%" stopColor="#2F4F4F" />
                      </linearGradient>
                    </defs>
                    
                    {/* Sky */}
                    <rect width="200" height="280" fill="url(#skyGradient)" />
                    
                    {/* Sun */}
                    <circle cx="100" cy="100" r="35" fill="#FFD700" opacity="0.9" />
                    <circle cx="100" cy="100" r="45" fill="#FFD700" opacity="0.3" />
                    
                    {/* Sun rays */}
                    <g stroke="#FFD700" strokeWidth="2" opacity="0.6">
                      <line x1="100" y1="40" x2="100" y2="20" />
                      <line x1="140" y1="60" x2="155" y2="45" />
                      <line x1="155" y1="100" x2="175" y2="100" />
                      <line x1="140" y1="140" x2="155" y2="155" />
                      <line x1="60" y1="60" x2="45" y2="45" />
                      <line x1="45" y1="100" x2="25" y2="100" />
                      <line x1="60" y1="140" x2="45" y2="155" />
                    </g>
                    
                    {/* Sea */}
                    <path d="M0 180 Q50 170 100 180 Q150 190 200 180 L200 280 L0 280 Z" fill="url(#seaGradient)" />
                    
                    {/* Waves */}
                    <path d="M0 200 Q25 195 50 200 Q75 205 100 200 Q125 195 150 200 Q175 205 200 200" fill="none" stroke="#fff" strokeWidth="2" opacity="0.5" />
                    <path d="M0 220 Q25 215 50 220 Q75 225 100 220 Q125 215 150 220 Q175 225 200 220" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.4" />
                    
                    {/* Coastal rocks */}
                    <ellipse cx="30" cy="250" rx="25" ry="15" fill="#696969" />
                    <ellipse cx="170" cy="260" rx="20" ry="12" fill="#696969" />
                    
                    {/* Label text area */}
                    <rect x="25" y="235" width="150" height="35" fill="#fff" opacity="0.9" rx="2" />
                  </svg>
                  
                  {/* Text overlay */}
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <p className="font-display text-xl text-[#2d2820] tracking-wide">Kystlys</p>
                    <p className="text-[9px] tracking-[0.15em] uppercase text-[#5F9EA0]">Lys Lager - 4.5%</p>
                  </div>
                  
                  {/* OELIV mark */}
                  <div className="absolute top-3 left-3">
                    <span className="text-[8px] tracking-[0.2em] uppercase text-white/80 font-medium">OELIV</span>
                  </div>
                </div>
                <p className="text-[#6b5a4a] text-sm leading-relaxed text-center mt-4">{t('beers.kystlys')}</p>
              </div>

              {/* Gaardens IPA - Hop field/farm theme */}
              <div className="group cursor-pointer">
                <div className="aspect-[3/4] relative overflow-hidden rounded-sm shadow-lg group-hover:shadow-xl transition-shadow duration-500">
                  <svg viewBox="0 0 200 280" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                    <defs>
                      <linearGradient id="farmSky" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#87CEEB" />
                        <stop offset="100%" stopColor="#E0F0FF" />
                      </linearGradient>
                      <linearGradient id="fieldGreen" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#6B8E23" />
                        <stop offset="100%" stopColor="#556B2F" />
                      </linearGradient>
                    </defs>
                    
                    {/* Sky */}
                    <rect width="200" height="280" fill="url(#farmSky)" />
                    
                    {/* Clouds */}
                    <ellipse cx="40" cy="40" rx="25" ry="12" fill="white" opacity="0.8" />
                    <ellipse cx="55" cy="35" rx="20" ry="10" fill="white" opacity="0.8" />
                    <ellipse cx="150" cy="50" rx="30" ry="14" fill="white" opacity="0.7" />
                    
                    {/* Rolling hills/fields */}
                    <path d="M0 160 Q50 140 100 160 Q150 180 200 150 L200 280 L0 280 Z" fill="url(#fieldGreen)" />
                    <path d="M0 190 Q60 170 120 190 Q180 210 200 185 L200 280 L0 280 Z" fill="#4a5a42" />
                    
                    {/* Hop poles/trellis */}
                    <g stroke="#8B4513" strokeWidth="2">
                      <line x1="40" y1="100" x2="40" y2="200" />
                      <line x1="80" y1="90" x2="80" y2="195" />
                      <line x1="120" y1="95" x2="120" y2="190" />
                      <line x1="160" y1="100" x2="160" y2="185" />
                    </g>
                    
                    {/* Hop vines */}
                    <g fill="#228B22">
                      <ellipse cx="40" cy="120" rx="8" ry="12" />
                      <ellipse cx="40" cy="145" rx="10" ry="14" />
                      <ellipse cx="40" cy="175" rx="8" ry="11" />
                      <ellipse cx="80" cy="110" rx="9" ry="13" />
                      <ellipse cx="80" cy="140" rx="11" ry="15" />
                      <ellipse cx="80" cy="170" rx="9" ry="12" />
                      <ellipse cx="120" cy="115" rx="8" ry="12" />
                      <ellipse cx="120" cy="145" rx="10" ry="14" />
                      <ellipse cx="120" cy="170" rx="8" ry="11" />
                      <ellipse cx="160" cy="120" rx="9" ry="13" />
                      <ellipse cx="160" cy="150" rx="8" ry="12" />
                    </g>
                    
                    {/* Barn in distance */}
                    <rect x="145" y="200" width="30" height="25" fill="#8B0000" />
                    <polygon points="145,200 160,185 175,200" fill="#8B0000" />
                    
                    {/* Label */}
                    <rect x="25" y="235" width="150" height="35" fill="#fff" opacity="0.9" rx="2" />
                  </svg>
                  
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <p className="font-display text-xl text-[#2d2820] tracking-wide">Gaardens IPA</p>
                    <p className="text-[9px] tracking-[0.15em] uppercase text-[#6B8E23]">IPA - 5.8%</p>
                  </div>
                  
                  <div className="absolute top-3 left-3">
                    <span className="text-[8px] tracking-[0.2em] uppercase text-[#4a5a42] font-medium">OELIV</span>
                  </div>
                </div>
                <p className="text-[#6b5a4a] text-sm leading-relaxed text-center mt-4">{t('beers.ipa')}</p>
              </div>

              {/* Havbris - Wheat field by the sea */}
              <div className="group cursor-pointer">
                <div className="aspect-[3/4] relative overflow-hidden rounded-sm shadow-lg group-hover:shadow-xl transition-shadow duration-500">
                  <svg viewBox="0 0 200 280" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                    <defs>
                      <linearGradient id="summerSky" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ADD8E6" />
                        <stop offset="100%" stopColor="#F0F8FF" />
                      </linearGradient>
                      <linearGradient id="wheatField" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#DAA520" />
                        <stop offset="100%" stopColor="#B8860B" />
                      </linearGradient>
                    </defs>
                    
                    {/* Sky */}
                    <rect width="200" height="280" fill="url(#summerSky)" />
                    
                    {/* Distant sea line */}
                    <rect x="0" y="90" width="200" height="30" fill="#4682B4" opacity="0.6" />
                    
                    {/* Wheat field */}
                    <path d="M0 120 L200 120 L200 280 L0 280 Z" fill="url(#wheatField)" />
                    
                    {/* Wheat stalks - detailed */}
                    <g stroke="#DAA520" strokeWidth="1.5" fill="none">
                      {/* Row 1 */}
                      <path d="M20 130 L20 200 M15 140 Q20 135 25 140 M13 150 Q20 143 27 150 M11 162 Q20 153 29 162" />
                      <path d="M50 125 L50 195 M45 135 Q50 130 55 135 M43 145 Q50 138 57 145 M41 157 Q50 148 59 157" />
                      <path d="M80 128 L80 198 M75 138 Q80 133 85 138 M73 148 Q80 141 87 148 M71 160 Q80 151 89 160" />
                      <path d="M110 123 L110 193 M105 133 Q110 128 115 133 M103 143 Q110 136 117 143 M101 155 Q110 146 119 155" />
                      <path d="M140 127 L140 197 M135 137 Q140 132 145 137 M133 147 Q140 140 147 147 M131 159 Q140 150 149 159" />
                      <path d="M170 130 L170 200 M165 140 Q170 135 175 140 M163 150 Q170 143 177 150 M161 162 Q170 153 179 162" />
                    </g>
                    
                    {/* Wind effect lines */}
                    <g stroke="#F5DEB3" strokeWidth="1" opacity="0.6">
                      <path d="M0 150 Q50 145 100 155 Q150 165 200 155" fill="none" />
                      <path d="M0 180 Q60 170 120 185 Q180 200 200 185" fill="none" />
                    </g>
                    
                    {/* Birds */}
                    <g fill="none" stroke="#333" strokeWidth="1">
                      <path d="M60 60 Q65 55 70 60 Q75 55 80 60" />
                      <path d="M130 45 Q135 40 140 45 Q145 40 150 45" />
                    </g>
                    
                    {/* Label */}
                    <rect x="25" y="235" width="150" height="35" fill="#fff" opacity="0.9" rx="2" />
                  </svg>
                  
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <p className="font-display text-xl text-[#2d2820] tracking-wide">Havbris</p>
                    <p className="text-[9px] tracking-[0.15em] uppercase text-[#DAA520]">Wheat Ale - 4.2%</p>
                  </div>
                  
                  <div className="absolute top-3 left-3">
                    <span className="text-[8px] tracking-[0.2em] uppercase text-[#4682B4] font-medium">OELIV</span>
                  </div>
                </div>
                <p className="text-[#6b5a4a] text-sm leading-relaxed text-center mt-4">{t('beers.havbris')}</p>
              </div>

              {/* Saesonens Stout - Night/winter forest */}
              <div className="group cursor-pointer">
                <div className="aspect-[3/4] relative overflow-hidden rounded-sm shadow-lg group-hover:shadow-xl transition-shadow duration-500">
                  <svg viewBox="0 0 200 280" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                    <defs>
                      <linearGradient id="nightSky" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#0a0a1a" />
                        <stop offset="50%" stopColor="#1a1a2e" />
                        <stop offset="100%" stopColor="#2d2d44" />
                      </linearGradient>
                      <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#FFFACD" />
                        <stop offset="100%" stopColor="#F0E68C" opacity="0" />
                      </radialGradient>
                    </defs>
                    
                    {/* Night sky */}
                    <rect width="200" height="280" fill="url(#nightSky)" />
                    
                    {/* Stars */}
                    <g fill="#fff">
                      <circle cx="30" cy="30" r="1.5" />
                      <circle cx="80" cy="20" r="1" />
                      <circle cx="150" cy="35" r="1.5" />
                      <circle cx="170" cy="15" r="1" />
                      <circle cx="45" cy="55" r="1" />
                      <circle cx="120" cy="45" r="1.2" />
                      <circle cx="180" cy="60" r="0.8" />
                      <circle cx="20" cy="80" r="1" />
                      <circle cx="95" cy="70" r="0.8" />
                      <circle cx="160" cy="85" r="1" />
                    </g>
                    
                    {/* Moon */}
                    <circle cx="150" cy="50" r="25" fill="url(#moonGlow)" />
                    <circle cx="150" cy="50" r="18" fill="#FFFACD" />
                    <circle cx="155" cy="45" r="15" fill="url(#nightSky)" />
                    
                    {/* Forest silhouette */}
                    <g fill="#1a1a2e">
                      <polygon points="0,180 20,120 40,180" />
                      <polygon points="25,180 50,100 75,180" />
                      <polygon points="55,180 85,90 115,180" />
                      <polygon points="95,180 120,110 145,180" />
                      <polygon points="130,180 155,95 180,180" />
                      <polygon points="160,180 185,115 200,160 200,180" />
                    </g>
                    
                    {/* Ground/snow */}
                    <rect x="0" y="175" width="200" height="105" fill="#2d2d44" />
                    
                    {/* Snow patches */}
                    <ellipse cx="50" cy="200" rx="30" ry="8" fill="#4a4a5e" opacity="0.5" />
                    <ellipse cx="140" cy="210" rx="25" ry="6" fill="#4a4a5e" opacity="0.5" />
                    
                    {/* Cabin with warm light */}
                    <rect x="70" y="195" width="40" height="30" fill="#3d3d3d" />
                    <polygon points="65,195 90,175 115,195" fill="#2d2d2d" />
                    <rect x="82" y="205" width="12" height="15" fill="#FFD700" opacity="0.8" />
                    <rect x="100" y="180" width="4" height="15" fill="#4a4a4a" />
                    
                    {/* Label */}
                    <rect x="25" y="235" width="150" height="35" fill="#1a1a2e" opacity="0.9" rx="2" />
                  </svg>
                  
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <p className="font-display text-xl text-[#FFFACD] tracking-wide">Saesonens Stout</p>
                    <p className="text-[9px] tracking-[0.15em] uppercase text-[#b8a890]">Stout - 6.0%</p>
                  </div>
                  
                  <div className="absolute top-3 left-3">
                    <span className="text-[8px] tracking-[0.2em] uppercase text-[#FFFACD]/80 font-medium">OELIV</span>
                  </div>
                </div>
                <p className="text-[#6b5a4a] text-sm leading-relaxed text-center mt-4">{t('beers.stout')}</p>
              </div>
              
            </div>
          </div>
        </section>

        {/* Brewing Process */}
        <section className="py-20 bg-cream">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 className="font-display text-3xl md:text-4xl font-medium tracking-[0.05em] uppercase mb-12 text-charcoal text-center">
              {t('processSection.title')}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {processSteps.map((step) => (
                <div key={step.title} className="p-6">
                  <h3 className="font-display text-xl font-medium mb-3 text-charcoal">
                    {step.title}
                  </h3>
                  <p className="text-muted leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tastings */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 className="font-display text-3xl md:text-4xl font-medium tracking-[0.05em] uppercase mb-12 text-charcoal text-center">
              {t('tastingsSection.title')}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {tastings.map((tasting) => (
                <div key={tasting.title} className="p-8 bg-olive/5 rounded-2xl">
                  <h3 className="font-display text-2xl font-medium mb-2 text-charcoal">
                    {tasting.title}
                  </h3>
                  <p className="text-lg text-olive font-medium mb-4">{tasting.price}</p>
                  <p className="text-muted mb-6">{tasting.description}</p>
                  <ul className="space-y-2">
                    {tasting.features.map((feature: string) => (
                      <li
                        key={feature}
                        className="text-sm text-muted pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-olive"
                      >
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Philosophy */}
        <section className="py-20 bg-olive/5">
          <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-medium tracking-[0.05em] uppercase mb-8 text-charcoal">
              {t('philosophy.title')}
            </h2>
            <p className="text-lg text-muted leading-relaxed mb-6">{t('philosophy.text1')}</p>
            <p className="text-lg text-muted leading-relaxed mb-6">{t('philosophy.text2')}</p>
            <p className="text-lg text-muted leading-relaxed">{t('philosophy.text3')}</p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-cream text-center">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className="font-display text-3xl md:text-4xl font-medium mb-8 text-charcoal">
              {t('cta.title')}
            </h2>
            <button
              type="button"
              className="bg-olive text-cream px-10 py-4 rounded-full text-base tracking-[0.1em] uppercase font-medium hover:bg-olive-soft transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              {t('cta.button')}
            </button>
          </div>
        </section>
    </main>
  );
}

