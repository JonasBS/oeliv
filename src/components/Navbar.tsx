'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { useBooking } from './BookingProvider';

type NavbarProps = {
  locale: Locale;
};

export const Navbar = ({ locale }: NavbarProps) => {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { openBooking } = useBooking();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/overnatning', label: t('accommodation') },
    { href: '/spa', label: t('spa') },
    { href: '/bryggeri', label: t('brewery') },
  ];

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-700 ${
        isScrolled 
          ? 'bg-[#f4f2eb]/95 backdrop-blur-md py-4 shadow-sm' 
          : 'bg-transparent py-6'
      }`}
      role="navigation"
    >
      <div className="max-w-7xl mx-auto px-8 lg:px-12 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className={`font-display text-2xl tracking-[0.2em] uppercase transition-colors duration-500 ${
            isScrolled ? 'text-[#2d2820]' : 'text-[#f4f2eb]'
          }`}
        >
          ØLIV
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-12">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[11px] tracking-[0.2em] uppercase link-underline transition-colors duration-500 ${
                isScrolled ? 'text-[#6b5a4a] hover:text-[#2d2820]' : 'text-[#ddd8cc] hover:text-[#f4f2eb]'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Language Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLangOpen(!isLangOpen)}
              className={`text-[11px] tracking-[0.15em] uppercase transition-colors duration-500 ${
                isScrolled ? 'text-[#8a7a6a] hover:text-[#2d2820]' : 'text-[#b8a890] hover:text-[#f4f2eb]'
              }`}
            >
              {locale.toUpperCase()}
            </button>
            {isLangOpen && (
              <div className="absolute top-full right-0 mt-4 bg-[#f4f2eb] shadow-xl min-w-[120px] py-2 animate-fadeIn">
                {locales.map((loc) => (
                  <Link
                    key={loc}
                    href={pathname}
                    locale={loc}
                    className={`block px-6 py-2 text-[11px] tracking-[0.15em] uppercase transition-colors ${
                      loc === locale
                        ? 'text-[#2d2820] bg-[#e8e4da]'
                        : 'text-[#6b5a4a] hover:text-[#2d2820] hover:bg-[#e8e4da]'
                    }`}
                    onClick={() => setIsLangOpen(false)}
                  >
                    {localeNames[loc]}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Book Button */}
          <button
            type="button"
            onClick={openBooking}
            className={`text-[11px] tracking-[0.2em] uppercase px-8 py-3 transition-all duration-500 ${
              isScrolled 
                ? 'bg-[#4a5a42] text-[#f4f2eb] hover:bg-[#5a6b50]' 
                : 'bg-[#f4f2eb]/10 backdrop-blur-sm border border-[#b8a890]/40 text-[#f4f2eb] hover:bg-[#f4f2eb] hover:text-[#2d2820]'
            }`}
          >
            {t('bookStay')}
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? 'Luk menu' : 'Åbn menu'}
        >
          <span
            className={`w-6 h-[1px] transition-all duration-300 ${
              isScrolled ? 'bg-[#2d2820]' : 'bg-[#f4f2eb]'
            } ${isMenuOpen ? 'rotate-45 translate-y-[7px]' : ''}`}
          />
          <span
            className={`w-6 h-[1px] transition-all duration-300 ${
              isScrolled ? 'bg-[#2d2820]' : 'bg-[#f4f2eb]'
            } ${isMenuOpen ? 'opacity-0' : ''}`}
          />
          <span
            className={`w-6 h-[1px] transition-all duration-300 ${
              isScrolled ? 'bg-[#2d2820]' : 'bg-[#f4f2eb]'
            } ${isMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`}
          />
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-0 bg-[#f4f2eb] z-40 animate-fadeIn">
          <div className="flex flex-col items-center justify-center h-full gap-8">
            <Link
              href="/"
              className="font-display text-3xl tracking-[0.2em] uppercase text-[#2d2820] mb-8"
              onClick={() => setIsMenuOpen(false)}
            >
              ØLIV
            </Link>
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-lg tracking-[0.2em] uppercase text-[#6b5a4a] hover:text-[#2d2820] transition-colors animate-fadeInUp"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-6 mt-4">
              {locales.map((loc) => (
                <Link
                  key={loc}
                  href={pathname}
                  locale={loc}
                  className={`text-sm tracking-[0.15em] uppercase ${
                    loc === locale ? 'text-[#2d2820]' : 'text-[#8a7a6a]'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {loc.toUpperCase()}
                </Link>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                openBooking();
              }}
              className="mt-8 text-[11px] tracking-[0.2em] uppercase px-12 py-4 bg-[#4a5a42] text-[#f4f2eb] hover:bg-[#5a6b50] transition-all"
            >
              {t('bookStay')}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
