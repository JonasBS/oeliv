type StructuredDataProps = {
  data: object;
};

export const StructuredData = ({ data }: StructuredDataProps) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
};

export const getOelivStructuredData = (locale: string) => ({
  '@context': 'https://schema.org',
  '@type': 'LodgingBusiness',
  name: 'ØLIV',
  description:
    locale === 'da'
      ? 'Farm hospitality på Bornholm. Rolige gårdophold 300 m fra Østersøen med eget bryggeri, gårdsauna og naturlige omgivelser.'
      : locale === 'de'
        ? 'Farm Hospitality auf Bornholm. Ruhige Hofaufenthalte 300 m von der Ostsee mit eigener Brauerei, Hofsauna und natürlicher Umgebung.'
        : 'Farm hospitality on Bornholm. Peaceful farm stays 300 m from the Baltic Sea with our own brewery, farm sauna and natural surroundings.',
  url: 'https://oliv-bornholm.dk',
  image:
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Lærkegårdsvej 5',
    addressLocality: 'Allinge',
    postalCode: '3770',
    addressRegion: 'Bornholm',
    addressCountry: 'DK',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: '55.2697',
    longitude: '14.7916',
  },
  priceRange: '$$',
  telephone: '+45 XX XX XX XX',
  email: 'mail@oliv-retreat.dk',
  amenityFeature: [
    {
      '@type': 'LocationFeatureSpecification',
      name: 'Farm hospitality',
      value: true,
    },
    {
      '@type': 'LocationFeatureSpecification',
      name: 'Brewery',
      value: true,
    },
    {
      '@type': 'LocationFeatureSpecification',
      name: 'Sauna',
      value: true,
    },
    {
      '@type': 'LocationFeatureSpecification',
      name: 'Free WiFi',
      value: true,
    },
    {
      '@type': 'LocationFeatureSpecification',
      name: 'Free Parking',
      value: true,
    },
    {
      '@type': 'LocationFeatureSpecification',
      name: 'Breakfast Included',
      value: true,
    },
  ],
  checkinTime: '15:00',
  checkoutTime: '11:00',
  numberOfRooms: 5,
  petsAllowed: false,
  availableLanguage: ['Danish', 'English', 'German'],
});

export const getBreweryStructuredData = () => ({
  '@context': 'https://schema.org',
  '@type': 'Brewery',
  name: 'ØLIV Brew',
  description: 'Mikrobryggeri på Bornholm. Lyse, rene øl brygget med lokale råvarer.',
  url: 'https://oliv-bornholm.dk/bryggeri',
  image:
    'https://images.unsplash.com/photo-1541959833400-049d37f97c86?q=80&w=1200&auto=format&fit=crop',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Lærkegårdsvej 5',
    addressLocality: 'Allinge',
    postalCode: '3770',
    addressRegion: 'Bornholm',
    addressCountry: 'DK',
  },
  parentOrganization: {
    '@type': 'LodgingBusiness',
    name: 'ØLIV',
  },
});

