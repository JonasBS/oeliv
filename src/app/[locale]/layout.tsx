import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { locales, type Locale } from '@/i18n/config';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BookingProvider } from '@/components/BookingProvider';
import { BookingModal } from '@/components/BookingModal';

// Elegant serif for headings - inspired by luxury hotels
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-display',
  display: 'swap',
});

// Clean sans-serif for body
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ØLIV – Farm Hospitality på Bornholm',
  description: 'ØLIV – Eksklusivt gårdophold på Bornholm. 300 meter fra Østersøen med eget mikrobryggeri, gårdsauna og nordisk køkken. Autentiske oplevelser i rolige omgivelser.',
  keywords: ['Bornholm', 'boutique hotel', 'farm stay', 'gårdophold', 'mikrobryggeri', 'sauna', 'Danmark'],
  openGraph: {
    title: 'ØLIV – Farm Hospitality på Bornholm',
    description: 'Eksklusivt gårdophold på Bornholm. 300 meter fra Østersøen.',
    type: 'website',
    locale: 'da_DK',
  },
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${cormorant.variable} ${inter.variable}`}>
      <body className="font-body antialiased">
        <NextIntlClientProvider messages={messages}>
          <BookingProvider>
            <Navbar locale={locale as Locale} />
            {children}
            <Footer />
            <BookingModal />
          </BookingProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
