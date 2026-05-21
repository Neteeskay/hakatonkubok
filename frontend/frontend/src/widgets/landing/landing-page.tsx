import { FeatureDock } from "@/widgets/landing/ui/feature-dock";
import { LandingHero } from "@/widgets/landing/ui/landing-hero";
import { OpportunityCard } from "@/widgets/landing/ui/opportunity-card";
import { PeopleSection } from "@/widgets/landing/ui/people-section";
import { PremiumHeader } from "@/widgets/landing/ui/premium-header";
import { StatsRibbon } from "@/widgets/landing/ui/stats-ribbon";

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fffdf7]">
      <PremiumHeader />
      <LandingHero />

      <section className="relative z-20 px-4 pb-7 pt-8 md:px-8">
        <FeatureDock />
      </section>

      <StatsRibbon />
      <PeopleSection />
      <OpportunityCard />
    </main>
  );
}
