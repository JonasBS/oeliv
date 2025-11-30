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

        {/* Our Beers - Product Photos */}
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
              
              {/* Kystlys */}
              <div className="group">
                <div className="relative aspect-[3/4] bg-[#0a0a0a] rounded-sm overflow-hidden shadow-xl group-hover:shadow-2xl transition-all duration-500">
                  <Image
                    src="/images/beers/kystlys.png"
                    alt="Kystlys - OELIV Brew"
                    fill
                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="mt-6 text-center">
                  <h3 className="font-display text-2xl text-[#2d2820] mb-1">Kystlys</h3>
                  <p className="text-[11px] tracking-[0.15em] uppercase text-[#87CEEB] mb-3">Lys Lager - 4.5%</p>
                  <p className="text-[#6b5a4a] text-sm leading-relaxed">{t('beers.kystlys')}</p>
                </div>
              </div>

              {/* Gaardens IPA */}
              <div className="group">
                <div className="relative aspect-[3/4] bg-[#0a0a0a] rounded-sm overflow-hidden shadow-xl group-hover:shadow-2xl transition-all duration-500">
                  <Image
                    src="/images/beers/gaardens-ipa.png"
                    alt="Gaardens IPA - OELIV Brew"
                    fill
                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="mt-6 text-center">
                  <h3 className="font-display text-2xl text-[#2d2820] mb-1">Gaardens IPA</h3>
                  <p className="text-[11px] tracking-[0.15em] uppercase text-[#6B8E23] mb-3">IPA - 5.8%</p>
                  <p className="text-[#6b5a4a] text-sm leading-relaxed">{t('beers.ipa')}</p>
                </div>
              </div>

              {/* Havbris */}
              <div className="group">
                <div className="relative aspect-[3/4] bg-[#e8e4da] rounded-sm overflow-hidden shadow-xl group-hover:shadow-2xl transition-all duration-500">
                  <Image
                    src="/images/beers/havbris.png"
                    alt="Havbris - OELIV Brew"
                    fill
                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="mt-6 text-center">
                  <h3 className="font-display text-2xl text-[#2d2820] mb-1">Havbris</h3>
                  <p className="text-[11px] tracking-[0.15em] uppercase text-[#4682B4] mb-3">Wheat Ale - 4.2%</p>
                  <p className="text-[#6b5a4a] text-sm leading-relaxed">{t('beers.havbris')}</p>
                </div>
              </div>

              {/* Saesonens Stout */}
              <div className="group">
                <div className="relative aspect-[3/4] bg-[#0a0a0a] rounded-sm overflow-hidden shadow-xl group-hover:shadow-2xl transition-all duration-500">
                  <Image
                    src="/images/beers/saesonens-stout.png"
                    alt="Saesonens Stout - OELIV Brew"
                    fill
                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="mt-6 text-center">
                  <h3 className="font-display text-2xl text-[#2d2820] mb-1">Saesonens Stout</h3>
                  <p className="text-[11px] tracking-[0.15em] uppercase text-[#8B4513] mb-3">Stout - 6.0%</p>
                  <p className="text-[#6b5a4a] text-sm leading-relaxed">{t('beers.stout')}</p>
                </div>
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

