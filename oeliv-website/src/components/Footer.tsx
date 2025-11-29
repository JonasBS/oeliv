'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export const Footer = () => {
  const t = useTranslations('footer');

  const footerLinks = [
    { href: '/', label: t('links.home') },
    { href: '/overnatning', label: t('links.accommodation') },
    { href: '/spa', label: t('links.spa') },
    { href: '/bryggeri', label: t('links.brewery') },
    { href: '/om-os', label: t('links.about') },
  ];

  return (
    <footer className="bg-[#1c1a17] text-[#b8a890] py-16 lg:py-20 relative">
      {/* Decorative top border - like timber beam */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#4a4238] to-transparent" />
      
      <div className="max-w-7xl mx-auto px-8 lg:px-12">
        <div className="grid lg:grid-cols-3 gap-12 lg:gap-16 mb-16">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="font-display text-2xl tracking-[0.2em] uppercase text-[#f4f2eb] mb-4 block"
            >
              ØLIV
            </Link>
            <p className="text-sm font-light leading-relaxed text-[#9a9080]">
              {t('tagline')}
            </p>
            <div className="mt-6 flex items-center gap-2 text-[10px] tracking-[0.15em] uppercase text-[#8a7a6a]">
              <span>✦</span>
              <span>Grundlagt Anno 1780</span>
              <span>✦</span>
            </div>
          </div>

          {/* Links */}
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#8a7a6a] mb-6">
              Sider
            </p>
            <nav className="flex flex-col gap-3">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-light text-[#9a9080] hover:text-[#f4f2eb] transition-colors duration-300"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#8a7a6a] mb-6">
              Kontakt
            </p>
            <div className="space-y-3 text-sm font-light text-[#9a9080]">
              <p>
                Lærkegårdsvej 5<br />
                3770 Allinge<br />
                Bornholm, Danmark
              </p>
              <p>
                <a
                  href="mailto:hej@oeliv.dk"
                  className="hover:text-[#f4f2eb] transition-colors duration-300"
                >
                  hej@oeliv.dk
                </a>
              </p>
              <p>
                <a
                  href="tel:+4512345678"
                  className="hover:text-[#f4f2eb] transition-colors duration-300"
                >
                  +45 12 34 56 78
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-[#3a352d] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#6b5a4a]">
            © {new Date().getFullYear()} ØLIV. Alle rettigheder forbeholdes.
          </p>
          <div className="flex gap-6">
            <a
              href="https://instagram.com/oeliv"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs tracking-[0.1em] uppercase text-[#6b5a4a] hover:text-[#b8a890] transition-colors duration-300"
            >
              Instagram
            </a>
            <a
              href="#"
              className="text-xs tracking-[0.1em] uppercase text-[#6b5a4a] hover:text-[#b8a890] transition-colors duration-300"
            >
              Privatlivspolitik
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
