/**
 * Language and country code service
 * Maps languages to default country codes and vice versa
 */

// Supported languages
export const SUPPORTED_LANGUAGES = {
  da: { name: 'Dansk', flag: '🇩🇰', defaultCountry: 'DK' },
  en: { name: 'English', flag: '🇬🇧', defaultCountry: 'GB' },
  de: { name: 'Deutsch', flag: '🇩🇪', defaultCountry: 'DE' },
  sv: { name: 'Svenska', flag: '🇸🇪', defaultCountry: 'SE' },
  no: { name: 'Norsk', flag: '🇳🇴', defaultCountry: 'NO' },
  nl: { name: 'Nederlands', flag: '🇳🇱', defaultCountry: 'NL' }
};

// Country codes with dial codes
export const COUNTRY_CODES = {
  DK: { name: 'Danmark', dialCode: '+45', flag: '🇩🇰', language: 'da' },
  DE: { name: 'Deutschland', dialCode: '+49', flag: '🇩🇪', language: 'de' },
  GB: { name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', language: 'en' },
  US: { name: 'United States', dialCode: '+1', flag: '🇺🇸', language: 'en' },
  SE: { name: 'Sverige', dialCode: '+46', flag: '🇸🇪', language: 'sv' },
  NO: { name: 'Norge', dialCode: '+47', flag: '🇳🇴', language: 'no' },
  NL: { name: 'Nederland', dialCode: '+31', flag: '🇳🇱', language: 'nl' },
  FR: { name: 'France', dialCode: '+33', flag: '🇫🇷', language: 'en' },
  ES: { name: 'España', dialCode: '+34', flag: '🇪🇸', language: 'en' },
  IT: { name: 'Italia', dialCode: '+39', flag: '🇮🇹', language: 'en' },
  AT: { name: 'Österreich', dialCode: '+43', flag: '🇦🇹', language: 'de' },
  CH: { name: 'Schweiz', dialCode: '+41', flag: '🇨🇭', language: 'de' },
  BE: { name: 'België', dialCode: '+32', flag: '🇧🇪', language: 'nl' },
  PL: { name: 'Polska', dialCode: '+48', flag: '🇵🇱', language: 'en' },
  FI: { name: 'Suomi', dialCode: '+358', flag: '🇫🇮', language: 'en' },
  IS: { name: 'Ísland', dialCode: '+354', flag: '🇮🇸', language: 'en' }
};

// Get default country code for a language
export const getDefaultCountryForLanguage = (language) => {
  const lang = SUPPORTED_LANGUAGES[language];
  return lang ? lang.defaultCountry : 'DK';
};

// Get language for a country code
export const getLanguageForCountry = (countryCode) => {
  const country = COUNTRY_CODES[countryCode];
  if (!country) return 'en';
  
  // Check if we support the country's language
  if (SUPPORTED_LANGUAGES[country.language]) {
    return country.language;
  }
  
  // Fall back to English for unsupported languages
  return 'en';
};

// Get dial code for a country
export const getDialCode = (countryCode) => {
  const country = COUNTRY_CODES[countryCode];
  return country ? country.dialCode : '+45';
};

// Detect language from phone number
export const detectLanguageFromPhone = (phone) => {
  if (!phone) return 'da';
  
  const normalized = phone.replace(/\s/g, '');
  
  for (const [code, country] of Object.entries(COUNTRY_CODES)) {
    if (normalized.startsWith(country.dialCode)) {
      return getLanguageForCountry(code);
    }
  }
  
  // Default to Danish
  return 'da';
};

// Format phone number with country code
export const formatPhoneWithCountry = (phone, countryCode) => {
  if (!phone) return null;
  
  let value = phone.trim().replace(/[\s()-]/g, '');
  
  // Already has country code
  if (value.startsWith('+')) {
    return value;
  }
  
  // Remove leading zeros
  value = value.replace(/^0+/, '');
  
  // Add country dial code
  const dialCode = getDialCode(countryCode);
  return `${dialCode}${value}`;
};

// Get all countries sorted by name
export const getAllCountries = () => {
  return Object.entries(COUNTRY_CODES)
    .map(([code, data]) => ({
      code,
      ...data
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

// Get popular countries (for showing at top of list)
export const getPopularCountries = () => {
  const popular = ['DK', 'DE', 'SE', 'NO', 'GB', 'NL'];
  return popular.map(code => ({
    code,
    ...COUNTRY_CODES[code]
  }));
};

