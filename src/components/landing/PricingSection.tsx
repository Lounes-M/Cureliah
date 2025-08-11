import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, HelpCircle, Star, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

// Constantes pour les couleurs et styles
const THEME_COLORS = {
  primary: "bg-medical-blue hover:bg-medical-blue-dark",
  secondary: "bg-medical-green hover:bg-medical-green-dark",
  accent: "text-medical-blue hover:text-medical-blue-dark",
};

const pricingPlans = [
  {
    id: "price_1RsMk8EL5OGpZLTY5HHdsRtb", // Price ID Stripe - Essentiel Monthly
    yearlyId: "price_1RsMk8EL5OGpZLTY7VcvYyLF", // Price ID Stripe - Essentiel Yearly
    name: "Essentiel",
    monthlyPrice: "49",
    yearlyPrice: "470", // ~39€/mois, économie de ~20%
    description: "Parfait pour commencer votre activité médicale",
    features: [
      "Profil médecin vérifié et sécurisé",
      "Recherche de missions par spécialité",
      "Notifications par email en temps réel",
      "Support technique basique (48h)",
    ],
    cta: "Choisir Essentiel",
    popular: false,
    icon: Check,
    badge: null,
  },
  {
    id: "price_1RsMkOEL5OGpZLTYVa4yHAz6", // Price ID Stripe - Pro Monthly
    yearlyId: "price_1RsMkzEL5OGpZLTYLYKANste", // Price ID Stripe - Pro Yearly
    name: "Pro",
    monthlyPrice: "99",
    yearlyPrice: "950", // ~79€/mois, économie de ~20%
    description: "Pour les médecins actifs et ambitieux",
    features: [
      "Toutes les fonctionnalités Essentiel",
      "Accès prioritaire aux missions",
      "Statistiques détaillées et analytics",
      "Support prioritaire (24h)",
      "Facturation automatique et rapports",
      "Intégration calendrier avancée",
    ],
    cta: "Choisir Pro",
    popular: true,
    icon: Star,
    badge: "Le plus populaire",
  },
  {
    id: "price_1RsMlQEL5OGpZLTYAqJFgJIg", // Price ID Stripe - Premium Monthly
    yearlyId: "price_1RsMlhEL5OGpZLTYBdPpEwJH", // Price ID Stripe - Premium Yearly
    name: "Premium",
    monthlyPrice: "199",
    yearlyPrice: "1910", // ~159€/mois, économie de ~20%
    description: "Pour les médecins experts et établissements",
    features: [
      "Toutes les fonctionnalités Pro",
      "Missions exclusives haute rémunération",
      "Accès aux établissements premium",
      "Formation personnalisée incluse",
      "Manager dédicacé personnel",
      "API complète et webhooks",
      "Support 24/7 avec hotline directe",
    ],
    cta: "Choisir Premium",
    popular: false,
    icon: Zap,
    badge: "Développeurs",
  },
];

// Composant PricingCard séparé pour une meilleure lisibilité
function PricingCard({ plan, isYearly, isLoading, onSubscribe }) {
  // Prix affiché selon le mode (annuel divisé par 12 pour l'affichage mensuel)
  const currentPrice = isYearly 
    ? Math.round(plan.yearlyPrice / 12) 
    : plan.monthlyPrice;
  
  // Calcul des économies : comparaison entre 12 mois vs prix annuel
  const monthlyTotal = plan.monthlyPrice * 12;
  const savings = isYearly
    ? Math.round(((monthlyTotal - plan.yearlyPrice) / monthlyTotal) * 100)
    : 0;
  const IconComponent = plan.icon;

  return (
    <Card
      className={`
        relative flex flex-col h-full transition-all duration-300 hover:scale-105 hover:shadow-xl
        ${
          plan.popular
            ? "border-2 border-medical-blue shadow-lg ring-2 ring-medical-blue/20"
            : "hover:border-medical-blue/50"
        }
      `}
      role="article"
      aria-labelledby={`plan-${plan.id}-title`}
    >
      {/* Badge populaire amélioré - Mobile responsive */}
      {plan.badge && (
        <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div
            className={`
            px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg flex items-center gap-1 sm:gap-2
            ${
              plan.popular
                ? "bg-gradient-to-r from-medical-blue to-blue-600 text-white"
                : "bg-gradient-to-r from-medical-green to-green-600 text-white"
            }
          `}
          >
            <IconComponent className="w-3 sm:w-4 h-3 sm:h-4" />
            {plan.badge}
          </div>
        </div>
      )}

      <CardHeader className="text-center pb-3 sm:pb-4">
        <div className="mx-auto mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 w-fit">
          <IconComponent
            className={`w-6 sm:w-8 h-6 sm:h-8 ${
              plan.popular ? "text-medical-blue" : "text-medical-green"
            }`}
          />
        </div>
        <CardTitle
          id={`plan-${plan.id}-title`}
          className="text-xl sm:text-2xl font-bold text-gray-900 mb-2"
        >
          {plan.name}
        </CardTitle>
        <CardDescription className="text-gray-600 text-sm sm:text-base leading-relaxed px-2 sm:px-0">
          {plan.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pt-0 px-4 sm:px-6">
        {/* Prix avec économies - Mobile responsive */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              €{currentPrice}
            </span>
            <span className="text-gray-600 font-medium text-sm sm:text-base">/mois</span>
          </div>
          {isYearly && savings > 0 && (
            <div className="mt-2">
              <span className="inline-block bg-green-100 text-green-800 text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 rounded-full">
                Économisez {savings}% par an
              </span>
            </div>
          )}
          {isYearly && (
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Soit €{plan.yearlyPrice} facturé annuellement
            </p>
          )}
          
          {/* Badge 1er mois gratuit */}
          <div className="mt-3">
            <div className="inline-flex items-center bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 rounded-full shadow-lg">
              <span className="mr-1.5">🎁</span>
              1er mois gratuit avec WELCOME100
            </div>
          </div>
        </div>

        {/* Liste des fonctionnalités - Mobile responsive */}
        <ul className="space-y-3 sm:space-y-4" role="list">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 sm:gap-3" role="listitem">
              <div className="flex-shrink-0 mt-0.5 sm:mt-1">
                <Check
                  className="w-4 sm:w-5 h-4 sm:h-5 text-medical-green"
                  aria-hidden="true"
                />
              </div>
              <span className="text-gray-700 leading-relaxed text-sm sm:text-base">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-4 sm:pt-6 px-4 sm:px-6">
        {onSubscribe ? (
          <Button
            className={`
              w-full h-11 sm:h-12 font-semibold transition-all duration-200 transform hover:scale-105 text-sm sm:text-base
              ${plan.popular ? THEME_COLORS.primary : THEME_COLORS.secondary}
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
            `}
            disabled={isLoading}
            onClick={() => onSubscribe(isYearly ? plan.yearlyId : plan.id, isYearly)}
            aria-label={`Choisir le plan ${plan.name} à ${currentPrice}€ par mois`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Chargement...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <IconComponent className="w-4 h-4" />
                {plan.cta}
              </span>
            )}
          </Button>
        ) : (
          <Button
            className={`
              w-full h-12 font-semibold transition-all duration-200 transform hover:scale-105
              ${plan.popular ? THEME_COLORS.primary : THEME_COLORS.secondary}
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
            `}
            disabled={isLoading}
            asChild={!isLoading}
            aria-label={`Choisir le plan ${plan.name} à ${currentPrice}€ par mois`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Chargement...
              </span>
            ) : (
              <Link
                to={`/auth?type=doctor&plan=${plan.id}`}
                className="flex items-center justify-center gap-2"
              >
                <IconComponent className="w-4 h-4" />
                {plan.cta}
              </Link>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function PricingSection({ onSubscribe, loading }) {
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePlanToggle = () => {
    setIsLoading(true);
    // Simulation d'un délai de chargement
    setTimeout(() => {
      setIsYearly(!isYearly);
      setIsLoading(false);
    }, 300);
  };

  return (
    <section
      className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-medical-blue-light/30 via-white to-medical-green-light/30 relative overflow-hidden"
      aria-labelledby="pricing-title"
    >
      {/* Éléments décoratifs de fond - Mobile responsive */}
      <div
        className="absolute inset-0 bg-grid-pattern opacity-5"
        aria-hidden="true"
      />
      <div
        className="absolute top-0 left-0 w-48 sm:w-64 lg:w-72 h-48 sm:h-64 lg:h-72 bg-medical-blue/10 rounded-full -translate-x-24 sm:-translate-x-32 lg:-translate-x-36 -translate-y-24 sm:-translate-y-32 lg:-translate-y-36 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 right-0 w-48 sm:w-64 lg:w-72 h-48 sm:h-64 lg:h-72 bg-medical-green/10 rounded-full translate-x-24 sm:translate-x-32 lg:translate-x-36 translate-y-24 sm:translate-y-32 lg:translate-y-36 blur-3xl"
        aria-hidden="true"
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* En-tête de section - Mobile responsive */}
        <header className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2
            id="pricing-title"
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight px-2 sm:px-0"
          >
            Nos offres d'abonnement
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Choisissez l'offre qui correspond parfaitement à vos besoins
            professionnels et développez votre activité médicale
          </p>

          {/* Bannière Promo WELCOME100 */}
          <div className="relative max-w-2xl mx-auto mb-8">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl p-6 shadow-xl border border-blue-200 overflow-hidden">
              {/* Motif de fond */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundSize: '30px 30px'
                }} />
              </div>
              
              <div className="relative z-10 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="bg-yellow-400 text-blue-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                    🎉 OFFRE DE BIENVENUE
                  </div>
                </div>
                
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  Premier mois <span className="text-yellow-300">100% GRATUIT</span>
                </h3>
                
                <p className="text-blue-100 text-lg mb-4">
                  Utilisez le code promo lors de votre inscription
                </p>
                
                <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/30">
                  <span className="text-yellow-300 font-mono text-xl font-bold mr-3">
                    WELCOME100
                  </span>
                  <div className="w-px h-6 bg-white/30 mr-3"></div>
                  <span className="text-white text-sm font-medium">
                    Code à copier-coller
                  </span>
                </div>
                
                <p className="text-xs text-blue-200 mt-3">
                  * Valable pour tous les nouveaux abonnements • Sans engagement
                </p>
              </div>
            </div>
          </div>

          {/* Toggle Mensuel/Annuel */}
          <div className="flex items-center justify-center gap-4 mb-2">
            <span
              className={`font-medium transition-colors ${
                !isYearly ? "text-gray-900" : "text-gray-500"
              }`}
            >
              Mensuel
            </span>
            <button
              onClick={handlePlanToggle}
              disabled={isLoading}
              className={`
                relative w-16 h-8 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-medical-blue/30
                ${isYearly ? "bg-medical-blue" : "bg-gray-300"}
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              role="switch"
              aria-checked={isYearly}
              aria-label="Basculer entre facturation mensuelle et annuelle"
            >
              <div
                className={`
                absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300
                ${isYearly ? "translate-x-9" : "translate-x-1"}
              `}
              />
            </button>
            <span
              className={`font-medium transition-colors ${
                isYearly ? "text-gray-900" : "text-gray-500"
              }`}
            >
              Annuel
            </span>
          </div>
          <p className="text-sm text-medical-green font-medium">
            💰 Économisez jusqu'à 20% avec la facturation annuelle
          </p>
        </header>

        {/* Grille des prix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
          {pricingPlans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isYearly={isYearly}
              isLoading={loading || isLoading}
              onSubscribe={onSubscribe}
            />
          ))}
        </div>

        {/* Section d'aide */}
        <footer className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              to="/faq"
              className={`
                inline-flex items-center gap-2 ${THEME_COLORS.accent} font-medium
                hover:underline focus:outline-none focus:ring-2 focus:ring-medical-blue/30 rounded-lg px-3 py-2
                transition-all duration-200
              `}
              aria-label="Consulter la FAQ sur la facturation et l'annulation"
            >
              <HelpCircle className="w-5 h-5" aria-hidden="true" />
              Questions sur la facturation ?
            </Link>
            <Link
              to="/contact"
              className={`
                inline-flex items-center gap-2 ${THEME_COLORS.accent} font-medium
                hover:underline focus:outline-none focus:ring-2 focus:ring-medical-blue/30 rounded-lg px-3 py-2
                transition-all duration-200
              `}
              aria-label="Contacter notre équipe commerciale"
            >
              <Star className="w-5 h-5" aria-hidden="true" />
              Besoin d'un devis personnalisé ?
            </Link>
          </div>
          <p className="text-sm text-gray-500 max-w-2xl mx-auto">
            🔒 Paiement sécurisé • ✨ Essai gratuit 30 jours • 🚀 Annulation à
            tout moment
          </p>
        </footer>
      </div>
    </section>
  );
}
