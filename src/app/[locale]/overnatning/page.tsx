import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { type Locale } from '@/i18n/config';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'accommodation' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

export default async function AccommodationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('accommodation');

  const rooms = [
    {
      id: 'gaardvaerelse',
      name: 'Gaardvaerelse',
      tagline: 'Autentisk hygge',
      description: 'Et intimt vaerelse med udsigt til den historiske gaardsplads. Originale bjaelkelofter, dobbeltseng med okologisk sengetoej og eget badevaerelse med regnbruser.',
      price: '1.295',
      capacity: '2 gaester',
      size: '18 m2',
      image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1200&auto=format&fit=crop',
      features: ['Bjaelkeloft', 'Regnbruser', 'Gaardsplads-udsigt', 'Morgenlys'],
    },
    {
      id: 'havevaerelse',
      name: 'Havevaerelse',
      tagline: 'Privat oase',
      description: 'Rummeligt vaerelse med egen udgang til den frodige have. Kingsize seng, fritstaaende badekar og privat terrasse omgivet af lavendel og roser.',
      price: '1.595',
      capacity: '2 gaester',
      size: '24 m2',
      image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1200&auto=format&fit=crop',
      features: ['Privat terrasse', 'Fritstaaende kar', 'Have-adgang', 'Aftensol'],
    },
    {
      id: 'suite',
      name: 'Laerkegaard Suite',
      tagline: 'Den ultimative flugt',
      description: 'Vores signatur-suite med separat opholdsstue, panoramaudsigt over markerne til havet, privat terrasse og luksuriost badevaerelse med baade kar og bruser.',
      price: '2.195',
      capacity: '2-4 gaester',
      size: '42 m2',
      image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1200&auto=format&fit=crop',
      features: ['Opholdsstue', 'Havudsigt', 'Privat terrasse', 'Pejs'],
    },
  ];

  const includedItems = t.raw('included.items') as Array<{ title: string; description: string }>;

  return (
    <main className="pt-20">
      
      {/* Hero - Cinematic full-width */}
      <section className="relative h-[70vh] min-h-[500px] flex items-end">
        <Image
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2000&auto=format&fit=crop"
          alt="OELIV Accommodation"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1c1a17]/80 via-[#1c1a17]/20 to-transparent" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pb-16 lg:pb-24 w-full">
          <span className="inline-block text-[#c8c0b0] text-[11px] tracking-[0.3em] uppercase mb-4">
            Overnatning
          </span>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white mb-4">
            {t('hero.title')}
          </h1>
          <p className="text-[#ddd8cc] text-lg max-w-xl leading-relaxed">
            {t('hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Intro Quote */}
      <section className="py-16 lg:py-24 bg-[#f4f2eb]">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <blockquote className="font-display text-2xl md:text-3xl lg:text-4xl text-[#2d2820] leading-relaxed italic">
            &ldquo;Hvert vaerelse er indrettet med omhu - en blanding af historiens patina og nutidens komfort&rdquo;
          </blockquote>
          <div className="mt-8 flex items-center justify-center gap-4">
            <span className="w-12 h-[1px] bg-[#c8c0b0]" />
            <span className="text-[11px] tracking-[0.2em] uppercase text-[#8a7a6a]">Laerkegaard - Anno 1780</span>
            <span className="w-12 h-[1px] bg-[#c8c0b0]" />
          </div>
        </div>
      </section>

      {/* Rooms - Alternating Layout */}
      <section className="bg-[#f4f2eb]">
        {rooms.map((room, index) => (
          <div 
            key={room.id}
            className={`border-t border-[#ddd8cc] ${index === rooms.length - 1 ? 'border-b' : ''}`}
          >
            <div className="max-w-7xl mx-auto">
              <div className={`grid lg:grid-cols-2 ${index % 2 === 1 ? 'lg:grid-flow-dense' : ''}`}>
                
                {/* Image */}
                <div className={`relative aspect-[4/3] lg:aspect-auto lg:min-h-[600px] overflow-hidden ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                  <Image
                    src={room.image}
                    alt={room.name}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>

                {/* Content */}
                <div className={`relative flex flex-col justify-center px-6 lg:px-16 py-12 lg:py-20 ${index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
                  
                  {/* Room number - decorative */}
                  <span className="absolute top-8 right-8 lg:top-12 lg:right-16 text-[100px] lg:text-[160px] font-display text-[#e8e4da] leading-none select-none pointer-events-none">
                    0{index + 1}
                  </span>
                  
                  <div className="relative z-10">
                    {/* Tagline */}
                    <span className="text-[11px] tracking-[0.2em] uppercase text-[#8a7a6a] mb-3 block">
                      {room.tagline}
                    </span>
                    
                    {/* Name */}
                    <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-[#2d2820] mb-4">
                      {room.name}
                    </h2>
                    
                    {/* Description */}
                    <p className="text-[#6b5a4a] leading-relaxed mb-8 max-w-md">
                      {room.description}
                    </p>
                    
                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-8">
                      {room.features.map((feature) => (
                        <span 
                          key={feature}
                          className="text-[10px] tracking-[0.1em] uppercase text-[#8a7a6a] px-3 py-1.5 border border-[#ddd8cc]"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                    
                    {/* Meta */}
                    <div className="flex items-center gap-6 mb-8 text-sm text-[#8a7a6a]">
                      <span>{room.size}</span>
                      <span className="w-[1px] h-4 bg-[#c8c0b0]" />
                      <span>{room.capacity}</span>
                    </div>
                    
                    {/* Price & CTA */}
                    <div className="flex items-center justify-between pt-6 border-t border-[#ddd8cc]">
                      <div>
                        <span className="font-display text-2xl text-[#2d2820]">{room.price} kr</span>
                        <span className="text-sm text-[#8a7a6a] ml-2">/ nat</span>
                      </div>
                      <button 
                        type="button"
                        className="group flex items-center gap-2 text-[#2d2820] text-[11px] tracking-[0.15em] uppercase"
                      >
                        <span className="pb-0.5 border-b border-[#2d2820]">Book nu</span>
                        <span className="group-hover:translate-x-1 transition-transform">-&gt;</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Whats Included - Elegant Grid */}
      <section className="py-20 lg:py-32 bg-[#2d2820]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <span className="text-[11px] tracking-[0.3em] uppercase text-[#8a7a6a] mb-4 block">
              Alt inkluderet
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-[#f4f2eb]">
              {t('included.title')}
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#4a4238]">
            {includedItems.map((item, index) => (
              <div 
                key={item.title} 
                className="bg-[#2d2820] p-8 lg:p-10 group hover:bg-[#3a352d] transition-colors duration-500"
              >
                <span className="text-[48px] font-display text-[#4a5a42] mb-4 block">
                  0{index + 1}
                </span>
                <h3 className="font-display text-xl text-[#f4f2eb] mb-3">
                  {item.title}
                </h3>
                <p className="text-[#9a9080] text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 lg:py-32 bg-[#f4f2eb]">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <span className="text-[11px] tracking-[0.3em] uppercase text-[#8a7a6a] mb-4 block">
            Bornholm venter
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-[#2d2820] mb-6">
            {t('cta.title')}
          </h2>
          <p className="text-[#6b5a4a] mb-10 max-w-lg mx-auto">
            Book dit ophold direkte og faa den bedste pris. Vi bekraefter din reservation inden for 24 timer.
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-3 bg-[#2d2820] text-[#f4f2eb] px-10 py-4 text-[12px] tracking-[0.15em] uppercase hover:bg-[#1c1a17] transition-colors"
          >
            {t('cta.button')}
            <span>-&gt;</span>
          </button>
        </div>
      </section>
      
    </main>
  );
}
