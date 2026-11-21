import { HeroSection } from "./_components/hero-section"
import { MarketingHeader } from "./_components/marketing-header"
import { FeatureSimulation, FeatureAnalytics, FeatureProfiles, MarketingCTA } from "./_components/marketing-feature-blocks"
import { MarketingFooter } from "./_components/marketing-footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--brand-light-50)] text-[var(--brand-ink-900)]">
      <MarketingHeader />

      <main>
        <HeroSection />
        
        <FeatureSimulation />
        <FeatureAnalytics />
        <FeatureProfiles />
        
      </main>

      <MarketingCTA />
      <MarketingFooter />
    </div>
  )
}
