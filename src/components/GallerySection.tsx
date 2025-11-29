'use client';

import Image from 'next/image';

const galleryImages = [
  {
    src: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop',
    alt: 'Værelse interiør',
    span: 'col-span-2 row-span-2',
  },
  {
    src: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop',
    alt: 'Sauna',
    span: 'col-span-1 row-span-1',
  },
  {
    src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop',
    alt: 'Bryggeri',
    span: 'col-span-1 row-span-1',
  },
  {
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop',
    alt: 'Udsigt',
    span: 'col-span-1 row-span-2',
  },
  {
    src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
    alt: 'Morgenmad',
    span: 'col-span-1 row-span-1',
  },
  {
    src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop',
    alt: 'Gården',
    span: 'col-span-2 row-span-1',
  },
];

export const GallerySection = () => {
  return (
    <section className="py-32 lg:py-40 bg-[#e8e4da] relative">
      {/* Kalk texture effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-[#ddd8cc]/20" />
      </div>
      
      <div className="max-w-7xl mx-auto px-8 lg:px-12 relative">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="w-12 h-[1px] bg-[#b8a890]" />
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#8a7a6a]">
              Galleri
            </span>
            <span className="w-12 h-[1px] bg-[#b8a890]" />
          </div>
          <h2 className="font-display text-4xl md:text-5xl text-[#2d2820] leading-tight">
            Øjeblikke fra ØLIV
          </h2>
        </div>

        {/* Masonry-style grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[200px] lg:auto-rows-[250px]">
          {galleryImages.map((image, index) => (
            <div
              key={index}
              className={`image-hover relative ${image.span} cursor-pointer group`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
              />
              {/* Warm aged overlay on hover */}
              <div className="absolute inset-0 bg-[#3a352d]/0 group-hover:bg-[#3a352d]/20 transition-all duration-500" />
              {/* Border frame effect */}
              <div className="absolute inset-3 border border-[#f4f2eb]/0 group-hover:border-[#f4f2eb]/30 transition-all duration-500 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
