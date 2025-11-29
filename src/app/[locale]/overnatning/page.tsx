import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { type Locale } from '@/i18n/config';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'accommodation' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

export default async function AccommodationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('accommodation');

  const badges = [
    { icon: '🌊', key: 'location' },
    { icon: '🥖', key: 'breakfast' },
    { icon: '🧖', key: 'spa' },
    { icon: '🍺', key: 'brewery' },
  ];

  const includedItems = t.raw('included.items') as Array<{ title: string; description: string }>;

  return (
    <>
      <Navbar locale={locale as Locale} />
      <main>
        {/* Page Header */}
        <section className="py-16 lg:py-24 bg-cream text-center">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-medium tracking-[0.05em] mb-6 text-charcoal">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-muted max-w-2xl mx-auto leading-relaxed mb-10">
              {t('hero.subtitle')}
            </p>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {badges.map((badge) => (
                <div key={badge.key} className="text-center">
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <div className="font-medium text-charcoal text-sm">
                    {t(`badges.${badge.key}.title`)}
                  </div>
                  <div className="text-xs text-muted">
                    {t(`badges.${badge.key}.description`)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Rooms Grid - Dynamic from API */}
        <section className="py-20 bg-cream">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center text-muted py-12 bg-white rounded-2xl shadow-sm">
              <p className="text-lg">Værelser indlæses fra booking-systemet...</p>
              <p className="text-sm mt-2">Forbinder til API...</p>
            </div>
          </div>
        </section>

        {/* What's Included */}
        <section className="py-20 bg-olive/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 className="font-display text-3xl md:text-4xl font-medium tracking-[0.05em] uppercase mb-12 text-charcoal text-center">
              {t('included.title')}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {includedItems.map((item) => (
                <div key={item.title} className="p-6">
                  <h3 className="font-display text-xl font-medium mb-3 text-charcoal">
                    {item.title}
                  </h3>
                  <p className="text-muted leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
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
      <Footer />
    </>
  );
}

