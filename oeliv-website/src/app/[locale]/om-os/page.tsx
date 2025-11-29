import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { type Locale } from '@/i18n/config';
import Image from 'next/image';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('about');

  const values = t.raw('values.items') as Array<{ title: string; description: string }>;
  const directions = t.raw('directions.items') as Array<{ title: string; description: string }>;
  const sustainabilityItems = t.raw('sustainability.items') as string[];
  const faqItems = t.raw('faq.items') as Array<{ question: string; answer: string }>;

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
            <p className="text-xl text-muted max-w-2xl mx-auto leading-relaxed">
              {t('hero.subtitle')}
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-20 bg-cream">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="max-w-xl">
                <h2 className="font-display text-3xl md:text-4xl font-medium tracking-[0.05em] uppercase mb-6 text-charcoal relative inline-block">
                  {t('story.title')}
                  <span className="absolute bottom-[-8px] left-0 w-16 h-0.5 bg-olive" />
                </h2>
                <p className="text-muted leading-relaxed mb-4">{t('story.text1')}</p>
                <p className="text-muted leading-relaxed mb-4">{t('story.text2')}</p>
                <p className="text-muted leading-relaxed">{t('story.text3')}</p>
              </div>
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl">
                <Image
                  src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop"
                  alt="ØLIV gård"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 className="font-display text-3xl md:text-4xl font-medium tracking-[0.05em] uppercase mb-12 text-charcoal text-center">
              {t('values.title')}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {values.map((value) => (
                <div key={value.title} className="p-6 bg-olive/5 rounded-2xl">
                  <h3 className="font-display text-xl font-medium mb-3 text-charcoal">
                    {value.title}
                  </h3>
                  <p className="text-muted leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Directions */}
        <section className="py-20 bg-olive/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 className="font-display text-3xl md:text-4xl font-medium tracking-[0.05em] uppercase mb-12 text-charcoal text-center">
              {t('directions.title')}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {directions.map((direction) => (
                <div key={direction.title} className="p-6 bg-white rounded-2xl shadow-sm">
                  <h3 className="font-display text-lg font-medium mb-3 text-charcoal">
                    {direction.title}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed">{direction.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sustainability */}
        <section className="py-20 bg-cream">
          <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-medium tracking-[0.05em] uppercase mb-6 text-charcoal">
              {t('sustainability.title')}
            </h2>
            <p className="text-lg text-muted mb-8">{t('sustainability.text')}</p>
            <ul className="text-left max-w-xl mx-auto space-y-3">
              {sustainabilityItems.map((item) => (
                <li
                  key={item}
                  className="text-muted pl-6 relative before:content-['•'] before:absolute before:left-0 before:text-olive"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-white">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className="font-display text-3xl md:text-4xl font-medium tracking-[0.05em] uppercase mb-12 text-charcoal text-center">
              {t('faq.title')}
            </h2>
            <div className="space-y-4">
              {faqItems.map((item) => (
                <details
                  key={item.question}
                  className="bg-cream rounded-2xl overflow-hidden group"
                >
                  <summary className="p-6 cursor-pointer font-display text-lg font-medium text-charcoal hover:bg-olive/5 transition-colors flex justify-between items-center list-none">
                    {item.question}
                    <span className="text-olive text-2xl group-open:rotate-45 transition-transform">
                      +
                    </span>
                  </summary>
                  <div className="px-6 pb-6">
                    <p className="text-muted leading-relaxed">{item.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="py-20 bg-cream">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 className="font-display text-3xl md:text-4xl font-medium tracking-[0.05em] uppercase mb-12 text-charcoal text-center">
              {t('contact.title')}
            </h2>
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="p-8">
                <h3 className="font-display text-2xl font-medium mb-4 text-charcoal">
                  {t('contact.info.name')}
                </h3>
                <p className="text-muted mb-2">{t('contact.info.subtitle')}</p>
                <p className="text-muted mb-4">{t('contact.info.location')}</p>
                <p className="text-muted">
                  <strong>Email:</strong> {t('contact.info.email')}
                </p>
                <p className="text-muted">
                  <strong>Telefon:</strong> {t('contact.info.phone')}
                </p>
              </div>
              <div className="p-8 bg-white rounded-2xl shadow-sm">
                <h3 className="font-display text-xl font-medium mb-6 text-charcoal">
                  {t('contact.form.title')}
                </h3>
                <form className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-muted mb-2">
                      {t('contact.form.name')}
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-black/10 rounded-lg focus:outline-none focus:border-olive transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-muted mb-2">
                      {t('contact.form.email')}
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border border-black/10 rounded-lg focus:outline-none focus:border-olive transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-muted mb-2">
                      {t('contact.form.message')}
                    </label>
                    <textarea
                      rows={5}
                      className="w-full px-4 py-3 border border-black/10 rounded-lg focus:outline-none focus:border-olive transition-colors resize-y"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-olive text-cream px-8 py-3 rounded-full text-sm tracking-[0.1em] uppercase font-medium hover:bg-olive-soft transition-colors w-full"
                  >
                    {t('contact.form.submit')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

