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
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-xl">
                <Image
                  src="https://images.unsplash.com/photo-1541959833400-049d37f97c86?q=80&w=1200&auto=format&fit=crop"
                  alt="ØLIV Brew bryggeri"
                  fill
                  className="object-cover"
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

        {/* Our Beers - Illustrated Labels */}
        <section className="py-24 bg-[#f4f2eb]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-[11px] tracking-[0.3em] uppercase text-[#8a7a6a] mb-4 block">
                Vores sortiment
              </span>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-[#2d2820]">
                {t('beersSection.title')}
              </h2>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Kystlys */}
              <div className="group">
                <div className="bg-white p-8 mb-6 aspect-[3/4] flex flex-col items-center justify-center relative overflow-hidden border border-[#e8e4da] hover:border-[#c8c0b0] transition-colors">
                  {/* Decorative frame */}
                  <div className="absolute inset-4 border border-[#e8e4da]" />
                  
                  {/* Illustrated bottle - minimalist line art */}
                  <svg viewBox="0 0 80 160" className="w-20 h-40 mb-4" fill="none" stroke="#4a5a42" strokeWidth="1">
                    {/* Bottle shape */}
                    <path d="M30 20 L30 35 C20 40 15 50 15 70 L15 145 C15 150 20 155 25 155 L55 155 C60 155 65 150 65 145 L65 70 C65 50 60 40 50 35 L50 20" />
                    {/* Bottle neck */}
                    <path d="M30 20 L30 10 C30 5 35 2 40 2 C45 2 50 5 50 10 L50 20" />
                    {/* Cap */}
                    <rect x="28" y="2" width="24" height="8" rx="2" fill="#4a5a42" />
                    {/* Label area */}
                    <rect x="20" y="70" width="40" height="50" rx="2" stroke="#b8a890" />
                    {/* Sun rays - representing light/kyst */}
                    <circle cx="40" cy="90" r="8" stroke="#b8a890" />
                    <path d="M40 78 L40 72 M52 90 L58 90 M40 102 L40 108 M28 90 L22 90" stroke="#b8a890" />
                    {/* Waves at bottom */}
                    <path d="M25 130 Q32 125 40 130 Q48 135 55 130" stroke="#b8a890" />
                  </svg>
                  
                  {/* Beer name on label style */}
                  <div className="text-center relative z-10">
                    <p className="font-display text-2xl text-[#2d2820] mb-1">Kystlys</p>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-[#8a7a6a]">Lys Lager - 4.5%</p>
                  </div>
                </div>
                <p className="text-[#6b5a4a] text-sm leading-relaxed text-center">{t('beers.kystlys')}</p>
              </div>

              {/* Gaardens IPA */}
              <div className="group">
                <div className="bg-white p-8 mb-6 aspect-[3/4] flex flex-col items-center justify-center relative overflow-hidden border border-[#e8e4da] hover:border-[#c8c0b0] transition-colors">
                  <div className="absolute inset-4 border border-[#e8e4da]" />
                  
                  <svg viewBox="0 0 80 160" className="w-20 h-40 mb-4" fill="none" stroke="#4a5a42" strokeWidth="1">
                    <path d="M30 20 L30 35 C20 40 15 50 15 70 L15 145 C15 150 20 155 25 155 L55 155 C60 155 65 150 65 145 L65 70 C65 50 60 40 50 35 L50 20" />
                    <path d="M30 20 L30 10 C30 5 35 2 40 2 C45 2 50 5 50 10 L50 20" />
                    <rect x="28" y="2" width="24" height="8" rx="2" fill="#4a5a42" />
                    <rect x="20" y="70" width="40" height="50" rx="2" stroke="#b8a890" />
                    {/* Hop cone illustration */}
                    <ellipse cx="40" cy="88" rx="6" ry="10" stroke="#4a5a42" />
                    <path d="M34 85 Q30 82 28 88 M34 91 Q30 94 28 88" stroke="#4a5a42" />
                    <path d="M46 85 Q50 82 52 88 M46 91 Q50 94 52 88" stroke="#4a5a42" />
                    <path d="M40 78 L40 75 M38 76 L40 75 L42 76" stroke="#4a5a42" />
                    {/* Leaf details */}
                    <path d="M32 100 Q36 98 40 100 Q44 102 48 100" stroke="#b8a890" />
                  </svg>
                  
                  <div className="text-center relative z-10">
                    <p className="font-display text-2xl text-[#2d2820] mb-1">Gaardens IPA</p>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-[#8a7a6a]">IPA - 5.8%</p>
                  </div>
                </div>
                <p className="text-[#6b5a4a] text-sm leading-relaxed text-center">{t('beers.ipa')}</p>
              </div>

              {/* Havbris */}
              <div className="group">
                <div className="bg-white p-8 mb-6 aspect-[3/4] flex flex-col items-center justify-center relative overflow-hidden border border-[#e8e4da] hover:border-[#c8c0b0] transition-colors">
                  <div className="absolute inset-4 border border-[#e8e4da]" />
                  
                  <svg viewBox="0 0 80 160" className="w-20 h-40 mb-4" fill="none" stroke="#4a5a42" strokeWidth="1">
                    <path d="M30 20 L30 35 C20 40 15 50 15 70 L15 145 C15 150 20 155 25 155 L55 155 C60 155 65 150 65 145 L65 70 C65 50 60 40 50 35 L50 20" />
                    <path d="M30 20 L30 10 C30 5 35 2 40 2 C45 2 50 5 50 10 L50 20" />
                    <rect x="28" y="2" width="24" height="8" rx="2" fill="#4a5a42" />
                    <rect x="20" y="70" width="40" height="50" rx="2" stroke="#b8a890" />
                    {/* Wheat illustration */}
                    <path d="M40 78 L40 105" stroke="#b8a890" />
                    <ellipse cx="40" cy="82" rx="3" ry="5" stroke="#b8a890" />
                    <ellipse cx="36" cy="86" rx="3" ry="5" transform="rotate(-20 36 86)" stroke="#b8a890" />
                    <ellipse cx="44" cy="86" rx="3" ry="5" transform="rotate(20 44 86)" stroke="#b8a890" />
                    <ellipse cx="34" cy="92" rx="3" ry="5" transform="rotate(-30 34 92)" stroke="#b8a890" />
                    <ellipse cx="46" cy="92" rx="3" ry="5" transform="rotate(30 46 92)" stroke="#b8a890" />
                    {/* Wind lines */}
                    <path d="M25 130 C30 128 35 132 40 130 C45 128 50 132 55 130" stroke="#b8a890" strokeWidth="0.5" />
                    <path d="M28 135 C33 133 38 137 43 135 C48 133 53 137 55 135" stroke="#b8a890" strokeWidth="0.5" />
                  </svg>
                  
                  <div className="text-center relative z-10">
                    <p className="font-display text-2xl text-[#2d2820] mb-1">Havbris</p>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-[#8a7a6a]">Wheat Ale - 4.2%</p>
                  </div>
                </div>
                <p className="text-[#6b5a4a] text-sm leading-relaxed text-center">{t('beers.havbris')}</p>
              </div>

              {/* Saesonens Stout */}
              <div className="group">
                <div className="bg-[#2d2820] p-8 mb-6 aspect-[3/4] flex flex-col items-center justify-center relative overflow-hidden border border-[#4a4238] hover:border-[#6b5a4a] transition-colors">
                  <div className="absolute inset-4 border border-[#4a4238]" />
                  
                  <svg viewBox="0 0 80 160" className="w-20 h-40 mb-4" fill="none" stroke="#b8a890" strokeWidth="1">
                    <path d="M30 20 L30 35 C20 40 15 50 15 70 L15 145 C15 150 20 155 25 155 L55 155 C60 155 65 150 65 145 L65 70 C65 50 60 40 50 35 L50 20" />
                    <path d="M30 20 L30 10 C30 5 35 2 40 2 C45 2 50 5 50 10 L50 20" />
                    <rect x="28" y="2" width="24" height="8" rx="2" fill="#b8a890" />
                    <rect x="20" y="70" width="40" height="50" rx="2" stroke="#8a7a6a" />
                    {/* Moon and stars - night/winter theme */}
                    <circle cx="40" cy="85" r="8" stroke="#f4f2eb" />
                    <circle cx="44" cy="82" r="6" fill="#2d2820" stroke="none" />
                    {/* Stars */}
                    <circle cx="28" cy="80" r="1" fill="#f4f2eb" />
                    <circle cx="52" cy="95" r="1" fill="#f4f2eb" />
                    <circle cx="30" cy="100" r="0.8" fill="#f4f2eb" />
                    <circle cx="50" cy="78" r="0.8" fill="#f4f2eb" />
                    {/* Coffee bean hint */}
                    <ellipse cx="35" cy="108" rx="4" ry="6" stroke="#8a7a6a" />
                    <path d="M35 104 L35 112" stroke="#8a7a6a" />
                    <ellipse cx="45" cy="108" rx="4" ry="6" stroke="#8a7a6a" />
                    <path d="M45 104 L45 112" stroke="#8a7a6a" />
                  </svg>
                  
                  <div className="text-center relative z-10">
                    <p className="font-display text-2xl text-[#f4f2eb] mb-1">Saesonens Stout</p>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-[#b8a890]">Stout - 6.0%</p>
                  </div>
                </div>
                <p className="text-[#6b5a4a] text-sm leading-relaxed text-center">{t('beers.stout')}</p>
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

