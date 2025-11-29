import { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';

const baseUrl = 'https://oliv-bornholm.dk';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/overnatning', '/spa', '/bryggeri', '/om-os'];

  const sitemap: MetadataRoute.Sitemap = [];

  // Add routes for each locale
  for (const locale of locales) {
    for (const route of routes) {
      const url = locale === 'da' ? `${baseUrl}${route}` : `${baseUrl}/${locale}${route}`;

      sitemap.push({
        url,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: route === '' ? 1 : 0.8,
        alternates: {
          languages: {
            da: `${baseUrl}${route}`,
            en: `${baseUrl}/en${route}`,
            de: `${baseUrl}/de${route}`,
          },
        },
      });
    }
  }

  return sitemap;
}

