import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { DeveloperSection } from '@/components/landing/DeveloperSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HeroSection } from '@/components/landing/HeroSection';
import { PricingSection } from '@/components/landing/PricingSection';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <LandingHeader />
      <main>
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <DeveloperSection />
      </main>
      <LandingFooter />
    </div>
  );
}
