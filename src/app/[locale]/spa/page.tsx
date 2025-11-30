import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';


import { type Locale } from '@/i18n/config';
import Image from 'next/image';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'spa' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

export default async function SpaPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('spa');

  const ritualSteps = t.raw('ritual.steps') as Array<{ title: string; description: string }>;
  const infoQuestions = t.raw('info.questions') as Array<{ title: string; answer: string }>;
  const experiences = t.raw('experiences.items') as Array<{ title: string; description: string }>;

  return (
    <main className="pt-20">
      {/* Page Header */}
      <section className="py-16 lg:py-24 bg-[#2d2820] text-[#f4f2eb] text-center">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-medium tracking-[0.05em] mb-6">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-cream/80 max-w-2xl mx-auto leading-relaxed">
              {t('hero.subtitle')}
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-20 bg-charcoal text-cream">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="max-w-xl">
                <h2 className="font-display text-3xl md:text-4xl font-medium tracking-[0.05em] uppercase mb-6 relative inline-block">
                  {t('main.title')}
                  <span className="absolute bottom-[-8px] left-0 w-16 h-0.5 bg-beige" />
                </h2>
                <p className="text-xl text-cream/90 mb-4">{t('main.intro')}</p>
                <p className="text-cream/80 leading-relaxed mb-4">{t('main.text1')}</p>
                <p className="text-cream/80 leading-relaxed mb-6">{t('main.text2')}</p>
                <ul className="space-y-3 mb-8">
                  {(t.raw('main.features') as string[]).map((feature: string) => (
                    <li
                      key={feature}
                      className="text-cream/90 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-beige"
                    >
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="bg-olive text-cream px-8 py-4 rounded-full text-base tracking-[0.1em] uppercase font-medium hover:bg-olive-soft transition-all"
                >
                  {t('main.cta')}
                </button>
              </div>
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-xl">
                <Image
                  src="https://images.unsplash.com/photo-1599054278630-3bbf6416a95a?q=80&w=1200&auto=format&fit=crop"
                  alt="Gårdsauna"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Ritual Section */}
        <section className="py-20 bg-cream">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 className="font-display text-3xl md:text-4xl font-medium tracking-[0.05em] uppercase mb-12 text-charcoal text-center">
              {t('ritual.title')}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {ritualSteps.map((step, index) => (
                <div key={step.title} className="text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-olive text-cream flex items-center justify-center text-2xl font-display font-semibold mx-auto mb-4">
                    {index + 1}
                  </div>
                  <h3 className="font-display text-xl font-medium mb-3 text-charcoal">
                    {step.title}
                  </h3>
                  <p className="text-muted leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 gap-8">
              {infoQuestions.map((item) => (
                <div key={item.title} className="p-6 bg-olive/5 rounded-2xl">
                  <h3 className="font-display text-lg font-medium mb-3 text-charcoal">
                    {item.title}
                  </h3>
                  <p className="text-muted leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Other Experiences */}
        <section className="py-20 bg-cream">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 className="font-display text-3xl md:text-4xl font-medium tracking-[0.05em] uppercase mb-12 text-charcoal text-center">
              {t('experiences.title')}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {experiences.map((exp) => (
                <div key={exp.title} className="p-6 bg-olive/5 rounded-2xl">
                  <h3 className="font-display text-lg font-medium mb-3 text-charcoal">
                    {exp.title}
                  </h3>
                  <p className="text-muted leading-relaxed">{exp.description}</p>
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
      
    </>
  );
}

