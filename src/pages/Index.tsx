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
import EarlyBirdBanner from "@/components/EarlyBirdBanner";
import { PromoHeaderBanner } from "@/components/PromoHeaderBanner";
import { usePromoBanner } from "@/hooks/usePromoBanner";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();
  
  // Hook pour la bannière promo - ciblage des visiteurs qui pourraient être médecins
  const { isVisible: isPromoBannerVisible, dismiss: dismissPromoBanner } = usePromoBanner({
    user,
    showForNewUsers: true,
    intendedUserType: 'doctor' // Sur la landing page, on cible les médecins potentiels
  });

  return (
    <>
      {/* Promo Header Banner fixe en haut de page pour visiteurs */}
      {!user && isPromoBannerVisible && (
        <PromoHeaderBanner 
          onClose={dismissPromoBanner}
          user={user}
        />
      )}
      
      <div className={`min-h-screen ${!user && isPromoBannerVisible ? 'pt-16' : ''}`}>
      <Header />
      <main>
        {/* 1. Hero - Première impression cruciale */}
        <HeroSection />

        {/* 2. Confiance - Logos partenaires, certifications */}
        <TrustSection />

        {/* 3. Problème - Identifier la douleur */}
        <ProblemSection />

        {/* 4. Solution - Comment ça marche */}
        <section id="fonctionnement">
          <HowItWorksSection />
        </section>

        {/* 6. CTA intermédiaire - Capturer l'intérêt */}
        <CTASection />

        {/* 7. Bénéfices - Pourquoi choisir nous */}
        <section id="avantages">
          <BenefitsSection />
        </section>

        {/* 8. Statistiques/Preuves sociales */}
        <StatsSection />

        {/* 9. Pricing - Offres et tarifs */}
        <section id="tarifs">
          <PricingSection onSubscribe={null} loading={false} />
        </section>

        {/* 11. Témoignages - Preuve sociale */}
        <section id="temoignages">
          <TestimonialSection />
        </section>

        {/* 12. FAQ - Lever les objections */}
        <section id="faq">
          <FAQSection />
        </section>
      </main>
      <Footer />
      </div>
    </>
  );
};

export default Index;
