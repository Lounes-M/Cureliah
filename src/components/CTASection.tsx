import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  Sparkles,
  Star,
  CheckCircle,
  Clock,
  TrendingUp,
  Shield,
  Users,
  Play,
  MessageCircle,
  User,
  Building2,
  Award,
  Rocket,
  Heart,
  Euro,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const CTASection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [clickedButton, setClickedButton] = useState(null);
  const sectionRef = useRef(null);
  const navigate = useNavigate();

  // Animation d'apparition
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Animation des étapes
  useEffect(() => {
    if (!isVisible) return;

    const stepTimer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 2000);

    return () => clearInterval(stepTimer);
  }, [isVisible]);

  const trackEvent = (action, persona, section) => {
    // window.gtag?.('event', action, { persona, section: 'cta-section', value: section });
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        persona,
        section: 'cta-section',
        value: section
      });
    }
  };

  const handleClick = (onClick, persona, section) => {
    setClickedButton(section);
    setTimeout(() => setClickedButton(null), 200);
    trackEvent('cta_click', persona, section);
    onClick();
  };

  const handleDoctorCTA = () => {
    navigate("/auth?type=doctor&source=cta-section");
  };

  const handleEstablishmentCTA = () => {
    navigate("/auth?type=establishment&source=cta-section");
  };

  const handleContactSales = () => {
    navigate("/contact-sales");
  };

  // Données des étapes du processus
  const processSteps = [
    {
      icon: User,
      title: "Inscription rapide",
      description: "2 minutes pour créer votre profil",
      color: "from-blue-500 to-blue-600",
      highlight: "Gratuit",
    },
    {
      icon: CheckCircle,
      title: "Validation express",
      description: "Vérification sous 24h maximum",
      color: "from-emerald-500 to-emerald-600",
      highlight: "Rapide",
    },
    {
      icon: Rocket,
      title: "Démarrage immédiat",
      description: "Commencez à publier ou réserver",
      color: "from-purple-500 to-purple-600",
      highlight: "Simple",
    },
  ];

  // Avantages principaux
  const mainBenefits = [
    {
      icon: Clock,
      text: "Gain de temps immédiat",
      detail: "78% plus rapide",
    },
    {
      icon: Euro,
      text: "Économies garanties",
      detail: "Jusqu'à 30%",
    },
    {
      icon: Shield,
      text: "100% sécurisé",
      detail: "Conformité RGPD",
    },
    {
      icon: Award,
      text: "Support expert",
      detail: "24h/24, 7j/7",
    },
  ];

  const ProcessStep = ({ step, index, isActive }) => {
    const Icon = step.icon;
    return (
      <div
        className={`
          relative flex flex-col items-center text-center transition-all duration-500 transform
          ${isActive ? "scale-110" : "scale-100"}
          ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}
        `}
        style={{ animationDelay: `${index * 200}ms` }}
      >
        {/* Cercle avec icône */}
        <div
          className={`
            relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r ${
              step.color
            } p-3 sm:p-4 shadow-lg mb-4
            ${isActive ? "ring-4 ring-white ring-opacity-50 shadow-2xl" : ""}
            transition-all duration-500
          `}
        >
          <Icon className="w-10 h-10 sm:w-12 sm:h-12 text-white mx-auto" />

          {/* Badge highlight */}
          <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full px-2 py-1 text-xs font-bold">
            {step.highlight}
          </div>

          {/* Effet de pulsation pour l'étape active */}
          {isActive && (
            <div
              className={`absolute inset-0 rounded-full bg-gradient-to-r ${step.color} opacity-30 scale-125 animate-pulse`}
            ></div>
          )}
        </div>

        {/* Contenu */}
        <h4 className="text-base sm:text-lg font-bold text-white mb-2">{step.title}</h4>
        <p className="text-blue-100 text-xs sm:text-sm max-w-28 sm:max-w-32">{step.description}</p>

        {/* Ligne de connexion - seulement sur desktop */}
        {index < processSteps.length - 1 && (
          <div className="hidden lg:block absolute top-8 sm:top-10 left-full w-12 sm:w-16 h-0.5 bg-white/30">
            <div
              className={`h-full bg-white transition-all duration-1000 ${
                activeStep > index ? "w-full" : "w-0"
              }`}
            ></div>
          </div>
        )}
      </div>
    );
  };

  const BenefitBadge = ({ benefit, index }) => {
    const Icon = benefit.icon;
    return (
      <div
        className={`
          flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20
          hover:bg-white/20 transition-all duration-300 group
          ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}
        `}
        style={{ animationDelay: `${600 + index * 100}ms` }}
      >
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div>
          <div className="text-white font-semibold text-xs sm:text-sm">{benefit.text}</div>
          <div className="text-blue-200 text-xs">{benefit.detail}</div>
        </div>
      </div>
    );
  };

  const ActionButton = ({
    primary = false,
    icon: Icon,
    title,
    subtitle,
    onClick,
    className = "",
    id,
    stats = "",
  }) => (
    <button
      onClick={() => handleClick(onClick, id, 'main_cta')}
      onMouseEnter={() => setHoveredButton(id)}
      onMouseLeave={() => setHoveredButton(null)}
      aria-describedby={`${id}-description`}
      className={`
        group relative overflow-hidden rounded-3xl p-6 sm:p-8 text-left transition-all duration-300 transform hover:-translate-y-2
        ${
          primary
            ? "bg-gradient-to-r from-white to-gray-50 text-gray-900 shadow-2xl hover:shadow-3xl"
            : "bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20"
        }
        ${clickedButton === id ? "scale-95" : "scale-100"}
        ${className}
      `}
    >
      {/* Effet de brillance au hover */}
      <div
        className={`
        absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
        transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700
        ${primary ? "via-blue-500/20" : "via-white/10"}
      `}
      ></div>

      <div className="relative z-10 flex items-center gap-4">
        <div
          className={`
          w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110
          ${
            primary
              ? "bg-gradient-to-r from-blue-500 to-emerald-500"
              : "bg-gradient-to-r from-emerald-500 to-blue-500"
          }
        `}
        >
          <Icon
            className={`w-6 h-6 sm:w-7 sm:h-7 text-white`}
          />
        </div>

        <div className="flex-1">
          <h3
            className={`text-lg sm:text-xl font-bold mb-1 ${
              primary ? "text-gray-900" : "text-white"
            }`}
          >
            {title}
          </h3>
          <p
            id={`${id}-description`}
            className={`text-xs sm:text-sm ${primary ? "text-gray-600" : "text-blue-100"}`}
          >
            {subtitle}
          </p>
          {stats && (
            <div className={`text-xs mt-1 font-medium ${primary ? "text-medical-blue" : "text-yellow-300"}`}>
              {stats}
            </div>
          )}
        </div>

        <ArrowRight
          className={`
          w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 group-hover:translate-x-1
          ${primary ? "text-medical-blue" : "text-white"}
          ${hoveredButton === id ? "scale-125" : "scale-100"}
        `}
        />
      </div>
    </button>
  );

  return (
    <section
      ref={sectionRef}
      id="cta-section"
      className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-emerald-600 relative overflow-hidden"
      aria-labelledby="cta-title"
      role="region"
      aria-label="Inscription à la plateforme"
    >
      {/* Éléments décoratifs de fond - Mobile responsive */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-48 sm:w-64 lg:w-96 h-48 sm:h-64 lg:h-96 bg-emerald-400/20 rounded-full translate-x-24 sm:translate-x-32 lg:translate-x-48 -translate-y-24 sm:-translate-y-32 lg:-translate-y-48 blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 left-0 w-48 sm:w-64 lg:w-96 h-48 sm:h-64 lg:h-96 bg-blue-400/20 rounded-full -translate-x-24 sm:-translate-x-32 lg:-translate-x-48 translate-y-24 sm:translate-y-32 lg:translate-y-48 blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 right-1/4 w-32 sm:w-48 lg:w-64 h-32 sm:h-48 lg:h-64 bg-purple-400/20 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Motif en arrière-plan */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* En-tête avec badge - Mobile responsive */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <div
            className={`
              inline-flex items-center gap-1 sm:gap-2 bg-white/20 backdrop-blur-sm text-white 
              px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 lg:py-3 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4 lg:mb-6 shadow-lg border border-white/30
              transition-all duration-1000 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }
            `}
          >
            <Sparkles className="w-3 sm:w-4 h-3 sm:h-4" />
            <span className="hidden xs:inline">Prêt à transformer votre pratique médicale ?</span>
            <span className="xs:hidden">Prêt à transformer ?</span>
            <Star className="w-3 sm:w-4 h-3 sm:h-4" />
          </div>

          <h2
            id="cta-title"
            className={`
              text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 lg:mb-6 leading-tight px-2 sm:px-0
              transition-all duration-1000 delay-200 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }
            `}
          >
            Rejoignez
            <span className="text-yellow-300"> 500+ professionnels </span>
            qui ont fait le choix de l'efficacité
          </h2>

          <p
            className={`
              text-lg sm:text-xl text-blue-100 max-w-4xl mx-auto leading-relaxed
              transition-all duration-1000 delay-300 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }
            `}
          >
            En 3 étapes simples, accédez à la plateforme qui révolutionne les
            vacations médicales en France.
          </p>
        </div>

        {/* Processus d'inscription animé */}
        <div
          className={`
            flex justify-center items-center gap-6 sm:gap-8 md:gap-16 mb-12 sm:mb-16 transition-all duration-1000 delay-500
            flex-col sm:flex-row ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }
          `}
        >
          {processSteps.map((step, index) => (
            <div key={index}>
              <ProcessStep
                step={step}
                index={index}
                isActive={activeStep === index}
              />
            </div>
          ))}
        </div>

        {/* Avantages en badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-12 sm:mb-16">
          {mainBenefits.map((benefit, index) => (
            <div key={index}>
              <BenefitBadge benefit={benefit} index={index} />
            </div>
          ))}
        </div>

        {/* Boutons d'action principaux */}
        <div
          className={`
            grid md:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16 transition-all duration-1000 delay-700 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }
          `}
        >
          <ActionButton
            primary
            icon={User}
            title="Je suis médecin"
            subtitle="Publiez vos disponibilités et trouvez des missions"
            onClick={handleDoctorCTA}
            id="doctor"
            stats="350+ médecins actifs"
          />

          <ActionButton
            icon={Building2}
            title="Je suis un établissement"
            subtitle="Trouvez rapidement le médecin qu'il vous faut"
            onClick={handleEstablishmentCTA}
            id="establishment"
            stats="150+ établissements partenaires"
          />
        </div>

        {/* Actions secondaires */}
        <div
          className={`
            grid md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto mb-12 sm:mb-16 transition-all duration-1000 delay-900 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }
          `}
        >
          <ActionButton
            icon={MessageCircle}
            title="Parler à un expert"
            subtitle="Échangez avec notre équipe commerciale"
            onClick={handleContactSales}
            id="contact"
            className="md:col-span-2"
          />
        </div>

        {/* Témoignage et statistiques */}
        <div
          className={`
            bg-white/10 backdrop-blur-sm rounded-3xl p-6 sm:p-8 md:p-12 border border-white/30 text-center
            transition-all duration-1000 delay-1000 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }
          `}
        >
          {/* Étoiles */}
          <div className="flex justify-center mb-4 sm:mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 fill-current" />
            ))}
          </div>

          <blockquote className="text-lg sm:text-xl md:text-2xl text-white font-medium mb-4 sm:mb-6 italic leading-relaxed">
            "En 2 semaines, j'ai déjà économisé 15h de démarches administratives
            et trouvé 3 nouvelles missions parfaitement adaptées à mon
            planning."
          </blockquote>

          <div className="flex items-center justify-center gap-4 mb-6 sm:mb-8">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">
              Dr
            </div>
            <div className="text-left">
              <div className="text-white font-semibold text-sm sm:text-base">Dr. Claire Dubois</div>
              <div className="text-blue-200 text-xs sm:text-sm">Cardiologue, Lyon</div>
            </div>
          </div>

          {/* Statistiques finales */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-6 sm:pt-8 border-t border-white/20">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-yellow-300 mb-1 sm:mb-2">
                2 min
              </div>
              <div className="text-blue-200 text-xs sm:text-sm">Temps d'inscription</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-yellow-300 mb-1 sm:mb-2">24h</div>
              <div className="text-blue-200 text-xs sm:text-sm">Validation express</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-yellow-300 mb-1 sm:mb-2">0€</div>
              <div className="text-blue-200 text-xs sm:text-sm">Frais d'inscription</div>
            </div>
          </div>
        </div>

        {/* Urgence douce */}
        <div
          className={`
            text-center mt-8 sm:mt-12 transition-all duration-1000 delay-1200 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }
          `}
        >
          <div className="inline-flex items-center gap-2 text-blue-200 text-xs sm:text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>+47 nouveaux membres cette semaine</span>
            <Heart className="w-4 h-4 text-red-400 animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;

// Ajout pour TypeScript : déclaration de window.gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}