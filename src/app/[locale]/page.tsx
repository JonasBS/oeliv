import { Hero } from '@/components/Hero';
import { ExperienceSection } from '@/components/ExperienceSection';
import { SeasonsSection } from '@/components/SeasonsSection';
import { PlaceSection } from '@/components/PlaceSection';
import { GallerySection } from '@/components/GallerySection';
import { TestimonialsSection } from '@/components/TestimonialsSection';

export default function HomePage() {
  return (
    <main className="grain-overlay">
      <Hero />
      <ExperienceSection />
      <SeasonsSection />
      <PlaceSection />
      <GallerySection />
      <TestimonialsSection />
    </main>
  );
}
