import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import TrustSection from "@/components/TrustSection";
import ProblemSection from "@/components/ProblemSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import CTASection from "@/components/CTASection";
import BenefitsSection from "@/components/BenefitsSection";
import StatsSection from "@/components/StatsSection";
import PricingSection from "@/components/landing/PricingSection";
import UrgencySection from "@/components/UrgencySection";
import TestimonialSection from "@/components/TestimonialSection";
import FAQSection from "@/components/FAQSection";
import FinalCTASection from "@/components/FinalCTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* 1. Hero - Première impression cruciale */}
        <HeroSection />

        {/* 2. Confiance - Logos partenaires, certifications */}
        <TrustSection />

        {/* 3. Problème - Identifier la douleur */}
        <ProblemSection />

        {/* 4. Solution - Comment ça marche */}
        <HowItWorksSection />

        {/* 6. CTA intermédiaire - Capturer l'intérêt */}
        <CTASection />

        {/* 7. Bénéfices - Pourquoi choisir nous */}
        <BenefitsSection />

        {/* 8. Statistiques/Preuves sociales */}
        <StatsSection />

        {/* 9. Pricing - Offres et tarifs */}
        <PricingSection />

        {/* 10. Urgence - Offre limitée */}
        <UrgencySection />

        {/* 11. Témoignages - Preuve sociale */}
        <TestimonialSection />

        {/* 12. FAQ - Lever les objections */}
        <FAQSection />

        {/* 14. CTA final - Dernière chance */}
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
