import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { FeaturesSection } from '@/components/FeaturesSection';

export default function HomePage() {
  return (
    <main style={{ backgroundColor: '#050510', minHeight: '100vh' }}>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
    </main>
  );
}
