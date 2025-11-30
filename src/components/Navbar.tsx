'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { locales, type Locale } from '@/i18n/config';
import { useBooking } from './BookingProvider';

type NavbarProps = {
  locale?: Locale;
};

export const Navbar = ({ locale = 'da' }: NavbarProps) => {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { openBooking } = useBooking();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: '/overnatning', label: t('accommodation') },
    { href: '/spa', label: t('spa') },
    { href: '/bryggeri', label: t('brewery') },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          isScrolled 
            ? 'bg-[#f4f2eb] shadow-sm' 
            : 'bg-[#f4f2eb]/80 backdrop-blur-sm'
        }`}
        role="navigation"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            
            {/* Logo - Left */}
            <Link
              href="/"
              className="font-display text-xl lg:text-2xl tracking-[0.08em] text-[#2d2820] hover:opacity-70 transition-opacity"
            >
              ØLIV
            </Link>

            {/* Center Navigation - Desktop */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[13px] tracking-[0.02em] transition-colors duration-300 ${
                    pathname === link.href 
                      ? 'text-[#2d2820]' 
                      : 'text-[#8a7a6a] hover:text-[#2d2820]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right side - Language & CTA */}
            <div className="hidden lg:flex items-center gap-5">
              {/* Language - just current locale, click to cycle */}
              <div className="relative group">
                <button className="text-[12px] tracking-[0.05em] uppercase text-[#8a7a6a] hover:text-[#2d2820] transition-colors px-2 py-1">
                  {locale.toUpperCase()}
                </button>
                {/* Dropdown */}
                <div className="absolute top-full right-0 mt-1 bg-[#f4f2eb] shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  {locales.filter(l => l !== locale).map((loc) => (
                    <Link
                      key={loc}
                      href={pathname || '/'}
                      locale={loc}
                      className="block px-4 py-2 text-[12px] tracking-[0.05em] uppercase text-[#8a7a6a] hover:text-[#2d2820] hover:bg-[#e8e4da] transition-colors whitespace-nowrap"
                    >
                      {loc.toUpperCase()}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Book Button */}
              <button
                type="button"
                onClick={openBooking}
                className="text-[12px] tracking-[0.08em] uppercase px-5 py-2.5 bg-[#2d2820] text-[#f4f2eb] hover:bg-[#1c1a17] transition-colors duration-300"
              >
                {t('bookStay')}
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 -mr-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <div className="w-5 h-4 relative flex flex-col justify-between">
                <span
                  className={`w-full h-[1px] bg-[#2d2820] transition-all duration-300 origin-center ${
                    isMenuOpen ? 'rotate-45 translate-y-[7px]' : ''
                  }`}
                />
                <span
                  className={`w-full h-[1px] bg-[#2d2820] transition-all duration-300 ${
                    isMenuOpen ? 'opacity-0' : ''
                  }`}
                />
                <span
                  className={`w-full h-[1px] bg-[#2d2820] transition-all duration-300 origin-center ${
                    isMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 bg-[#f4f2eb] transition-all duration-500 lg:hidden ${
          isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        <div className="flex flex-col h-full pt-20 px-6">
          {/* Links */}
          <div className="flex flex-col gap-6 py-8">
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-2xl font-display tracking-[0.02em] transition-all duration-500 ${
                  pathname === link.href ? 'text-[#2d2820]' : 'text-[#8a7a6a]'
                }`}
                style={{ 
                  opacity: isMenuOpen ? 1 : 0,
                  transform: isMenuOpen ? 'translateY(0)' : 'translateY(20px)',
                  transitionDelay: `${index * 80}ms`
                }}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Bottom section */}
          <div className="mt-auto pb-8">
            {/* Language */}
            <div className="flex items-center gap-4 mb-6">
              {locales.map((loc) => (
                <Link
                  key={loc}
                  href={pathname || '/'}
                  locale={loc}
                  className={`text-sm tracking-[0.05em] uppercase ${
                    loc === locale ? 'text-[#2d2820]' : 'text-[#a09080]'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {loc.toUpperCase()}
                </Link>
              ))}
            </div>

            {/* Book Button */}
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                openBooking();
              }}
              className="w-full py-4 bg-[#2d2820] text-[#f4f2eb] text-[12px] tracking-[0.1em] uppercase"
            >
              {t('bookStay')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
