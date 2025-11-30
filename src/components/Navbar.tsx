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
        className={`fixed top-0 w-full z-50 transition-all duration-700 ${
          isScrolled 
            ? 'bg-[#f4f2eb]/95 backdrop-blur-md shadow-sm py-4' 
            : 'bg-transparent py-6'
        }`}
        role="navigation"
      >
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between">
            
            {/* Logo */}
            <Link
              href="/"
              className={`font-display text-2xl tracking-[0.1em] transition-colors duration-500 ${
                isScrolled ? 'text-[#2d2820]' : 'text-[#2d2820]'
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
                  className={`relative text-[13px] tracking-[0.05em] transition-colors duration-300 ${
                    pathname === link.href 
                      ? 'text-[#2d2820]' 
                      : 'text-[#6b5a4a] hover:text-[#2d2820]'
                  }`}
                >
                  {link.label}
                  {pathname === link.href && (
                    <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-[#2d2820]" />
                  )}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="hidden lg:flex items-center gap-6">
              {/* Language switcher - minimal */}
              <div className="flex items-center">
                {locales.map((loc, index) => (
                  <span key={loc} className="flex items-center">
                    <Link
                      href={pathname || '/'}
                      locale={loc}
                      className={`text-[12px] tracking-[0.05em] uppercase transition-colors duration-300 ${
                        loc === locale 
                          ? 'text-[#2d2820]' 
                          : 'text-[#a09080] hover:text-[#2d2820]'
                      }`}
                    >
                      {loc.toUpperCase()}
                    </Link>
                    {index < locales.length - 1 && (
                      <span className="mx-2 text-[#c8c0b0]">/</span>
                    )}
                  </span>
                ))}
              </div>

              {/* Book Button */}
              <button
                type="button"
                onClick={openBooking}
                className="text-[12px] tracking-[0.1em] uppercase px-5 py-2 bg-[#2d2820] text-[#f4f2eb] hover:bg-[#1c1a17] transition-colors duration-300"
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
              <div className="w-6 h-4 relative flex flex-col justify-between">
                <span
                  className={`w-full h-[1px] bg-[#2d2820] transition-all duration-300 origin-center ${
                    isMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                  }`}
                />
                <span
                  className={`w-full h-[1px] bg-[#2d2820] transition-all duration-300 ${
                    isMenuOpen ? 'opacity-0' : ''
                  }`}
                />
                <span
                  className={`w-full h-[1px] bg-[#2d2820] transition-all duration-300 origin-center ${
                    isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
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
        <div className="flex flex-col h-full pt-24 px-8">
          {/* Links */}
          <div className="flex flex-col gap-8">
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-2xl font-display tracking-[0.05em] transition-all duration-500 ${
                  pathname === link.href ? 'text-[#2d2820]' : 'text-[#8a7a6a]'
                }`}
                style={{ 
                  opacity: isMenuOpen ? 1 : 0,
                  transform: isMenuOpen ? 'translateY(0)' : 'translateY(20px)',
                  transitionDelay: `${index * 100}ms`
                }}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Bottom section */}
          <div className="mt-auto pb-12">
            {/* Language */}
            <div className="flex items-center gap-4 mb-8">
              {locales.map((loc) => (
                <Link
                  key={loc}
                  href={pathname || '/'}
                  locale={loc}
                  className={`text-sm tracking-[0.1em] uppercase ${
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
              className="w-full py-4 bg-[#2d2820] text-[#f4f2eb] text-[12px] tracking-[0.15em] uppercase"
            >
              {t('bookStay')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
