import { useState, useEffect, useRef } from "react";
import {
  DollarSign,
  Clock,
  Shield,
  Zap,
  Users,
  BarChart3,
  Star,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Quote,
  Award,
  Heart,
} from "lucide-react";

const BenefitsSection = () => {
  const [visibleItems, setVisibleItems] = useState(new Set());
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isComparisonVisible, setIsComparisonVisible] = useState(false);
  const sectionRef = useRef(null);

  // Animation d'apparition au scroll
  useEffect(() => {
    // Afficher tous les éléments immédiatement pour éviter les problèmes d'observer
    const timer = setTimeout(() => {
      const allItems = [
        "doctor-0",
        "doctor-1",
        "doctor-2",
        "facility-0",
        "facility-1",
        "facility-2",
      ];
      setVisibleItems(new Set(allItems));
      setIsComparisonVisible(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Rotation automatique des témoignages
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const testimonials = [
    {
      text: "Cette plateforme nous a permis d'optimiser notre planning et d'augmenter significativement nos revenus grâce à une meilleure gestion des vacations.",
      author: "Dr. Antoine Blanc",
      role: "Médecin généraliste",
      avatar: "�‍⚕️",
      rating: 5,
    },
    {
      text: "Excellent outil pour les établissements de santé ! La réservation est instantanée et nous trouvons toujours des médecins compétents et disponibles.",
      author: "Claire Rousseau",
      role: "Directrice - Centre Médical Voltaire",
      avatar: "👩‍💼",
      rating: 5,
    },
    {
      text: "Très satisfait de cette solution qui nous fait gagner un temps précieux dans la recherche de spécialistes pour nos services.",
      author: "Dr. Paul Legrand",
      role: "Chef de service - Hôpital Saint-Antoine",
      avatar: "👨‍💼",
      rating: 5,
    },
  ];

  const doctorBenefits = [
    {
      icon: DollarSign,
      title: "Revenus optimisés",
      description:
        "Fixez vos tarifs librement et optimisez votre planning. Plus de négociations, revenus prévisibles.",
      highlight: "+25% de revenus en moyenne",
      color: "emerald",
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      icon: Clock,
      title: "Liberté totale",
      description:
        "Travaillez quand vous voulez, où vous voulez. Gérez votre planning en toute autonomie.",
      highlight: "Flexibilité maximale",
      color: "blue",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      icon: BarChart3,
      title: "Visibilité accrue",
      description:
        "Votre profil est visible par tous les établissements. Développez votre réseau professionnel.",
      highlight: "500+ établissements partenaires",
      color: "purple",
      gradient: "from-purple-500 to-purple-600",
    },
  ];

  const facilityBenefits = [
    {
      icon: Zap,
      title: "Réactivité maximale",
      description:
        "Trouvez un médecin en moins de 2 minutes. Idéal pour les urgences et remplacements de dernière minute.",
      highlight: "2min chrono",
      color: "red",
      gradient: "from-red-500 to-red-600",
    },
    {
      icon: Shield,
      title: "Sécurité garantie",
      description:
        "Tous les médecins sont vérifiés (RPPS, diplômes). Contrats conformes, assurances validées.",
      highlight: "100% vérifiés",
      color: "emerald",
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      icon: DollarSign,
      title: "Tarifs transparents",
      description:
        "Comparez les tarifs en temps réel. Aucune négociation, prix fixés à l'avance.",
      highlight: "Zéro surprise",
      color: "blue",
      gradient: "from-blue-500 to-blue-600",
    },
  ];

  const BenefitCard = ({ benefit, index, type, isVisible }) => {
    const Icon = benefit.icon;

    return (
      <div
        data-item={`${type}-${index}`}
        className={`transform transition-all duration-700 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <div className="group bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-gray-200 transition-all duration-300 relative overflow-hidden">
          {/* Effet de brillance au hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

          {/* Badge highlight */}
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-4 ${
              benefit.color === "emerald"
                ? "bg-emerald-50 text-emerald-700"
                : benefit.color === "blue"
                ? "bg-blue-50 text-blue-700"
                : benefit.color === "purple"
                ? "bg-purple-50 text-purple-700"
                : benefit.color === "red"
                ? "bg-red-50 text-red-700"
                : "bg-gray-50 text-gray-700"
            }`}
          >
            <Star className="w-3 h-3 mr-1" />
            {benefit.highlight}
          </div>

          <div className="flex items-start space-x-4 relative z-10">
            <div
              className={`bg-gradient-to-r ${benefit.gradient} p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}
            >
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                {benefit.title}
              </h4>
              <p className="text-gray-600 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          </div>

          {/* Indicateur de performance */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Impact:</span>
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 text-emerald-600 mr-1" />
                <span className="text-emerald-600 font-semibold">
                  Très élevé
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleCTAClick = (userType) => {
    console.log(`CTA clicked for ${userType}`);
    // Simulation de navigation
    window.location.href = `/auth?type=${userType}`;
  };

  return (
    <section
      id="avantages"
      className="py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden"
      ref={sectionRef}
      role="region"
      aria-label="Avantages de Cureliah"
    >
      {/* Éléments décoratifs */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div
        className="absolute bottom-20 right-10 w-64 h-64 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* En-tête avec animation */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 shadow-lg">
            <Award className="w-4 h-4 mr-2" />
            Solution certifiée et approuvée
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Pourquoi choisir
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              {" "}
              Cureliah
            </span>{" "}
            ?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Une plateforme conçue pour répondre aux besoins spécifiques de
            chaque acteur du secteur médical
          </p>

          {/* Statistiques rapides */}
          <div className="flex justify-center gap-8 mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">98%</div>
              <div className="text-sm text-gray-500">Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">24h/24</div>
              <div className="text-sm text-gray-500">Disponible</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">500+</div>
              <div className="text-sm text-gray-500">Médecins actifs</div>
            </div>
          </div>
        </div>

        {/* Section témoignages rotative */}
        <div className="mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-emerald-600"></div>

              <div className="text-center">
                <Quote className="w-12 h-12 text-blue-600 mx-auto mb-4 opacity-20" />

                <div className="transition-all duration-500">
                  <p className="text-xl text-gray-700 italic mb-6 leading-relaxed">
                    "{testimonials[activeTestimonial].text}"
                  </p>

                  <div className="flex items-center justify-center space-x-4">
                    <div className="text-4xl">
                      {testimonials[activeTestimonial].avatar}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">
                        {testimonials[activeTestimonial].author}
                      </div>
                      <div className="text-gray-600 text-sm">
                        {testimonials[activeTestimonial].role}
                      </div>
                      <div className="flex items-center mt-1">
                        {[...Array(testimonials[activeTestimonial].rating)].map(
                          (_, i) => (
                            <Star
                              key={i}
                              className="w-4 h-4 text-yellow-500 fill-current"
                            />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Indicateurs de pagination */}
                <div className="flex justify-center space-x-2 mt-6">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveTestimonial(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === activeTestimonial
                          ? "bg-blue-600 scale-125"
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                      aria-label={`Témoignage ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 mb-20">
          {/* Avantages médecins */}
          <div>
            <div className="flex items-center mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-2xl mr-4 shadow-lg">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Avantages pour les médecins
                </h3>
                <p className="text-gray-600">
                  Optimisez votre pratique libérale
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {doctorBenefits.map((benefit, index) => (
                <BenefitCard
                  key={index}
                  benefit={benefit}
                  index={index}
                  type="doctor"
                  isVisible={visibleItems.has(`doctor-${index}`)}
                />
              ))}
            </div>

            {/* CTA médecin */}
            <div className="mt-8">
              <button
                onClick={() => handleCTAClick("doctor")}
                className="group w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-2xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center"
                aria-label="Rejoindre en tant que médecin"
              >
                <Users className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Rejoindre en tant que médecin
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Avantages établissements */}
          <div>
            <div className="flex items-center mb-8">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 rounded-2xl mr-4 shadow-lg">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Avantages pour les établissements
                </h3>
                <p className="text-gray-600">Simplifiez vos recrutements</p>
              </div>
            </div>

            <div className="space-y-6">
              {facilityBenefits.map((benefit, index) => (
                <BenefitCard
                  key={index}
                  benefit={benefit}
                  index={index}
                  type="facility"
                  isVisible={visibleItems.has(`facility-${index}`)}
                />
              ))}
            </div>

            {/* CTA établissement */}
            <div className="mt-8">
              <button
                onClick={() => handleCTAClick("establishment")}
                className="group w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-4 rounded-2xl font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center"
                aria-label="Rejoindre en tant qu'établissement"
              >
                <Shield className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Rejoindre en tant qu'établissement
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Comparaison avant/après améliorée */}
        <div className="mt-20" data-comparison="true">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Transformez votre façon de travailler
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Découvrez comment Cureliah révolutionne l'organisation des
              vacations médicales
            </p>
          </div>

          <div
            className={`bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 transform transition-all duration-1000 relative ${
              isComparisonVisible
                ? "translate-y-0 opacity-100 scale-100"
                : "translate-y-8 opacity-0 scale-95"
            }`}
          >
            <div className="grid md:grid-cols-2">
              {/* Avant */}
              <div className="p-8 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>

                <div className="text-center mb-6">
                  <div className="bg-red-100 text-red-700 px-6 py-3 rounded-2xl inline-block font-semibold">
                    😤 AVANT
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    "Recrutement de 2-3 semaines",
                    "Négociations complexes",
                    "Contrats papier",
                    "Facturation manuelle",
                    "Réseau limité",
                    "Stress et incertitudes",
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 group"
                    >
                      <div className="w-3 h-3 bg-red-400 rounded-full group-hover:scale-125 transition-transform"></div>
                      <span className="text-gray-600 group-hover:text-gray-800 transition-colors">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-red-50 rounded-xl">
                  <div className="text-center text-red-700">
                    <Clock className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-bold">Temps perdu:</div>
                    <div className="text-2xl font-bold">15h/semaine</div>
                  </div>
                </div>
              </div>

              {/* Après */}
              <div className="p-8 bg-gradient-to-br from-blue-50 via-emerald-50 to-blue-50 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-emerald-600"></div>

                <div className="text-center mb-6">
                  <div className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-6 py-3 rounded-2xl inline-block font-semibold shadow-lg">
                    😊 AVEC CURELIAH
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    "Réservation en 2 minutes",
                    "Tarifs transparents",
                    "Contrats automatiques",
                    "Facturation intégrée",
                    "Accès à tous les médecins",
                    "Sérénité et efficacité",
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 group"
                    >
                      <CheckCircle className="w-5 h-5 text-emerald-600 group-hover:scale-125 transition-transform" />
                      <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-blue-100 to-emerald-100 rounded-xl">
                  <div className="text-center text-emerald-700">
                    <Heart className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-bold">Temps économisé:</div>
                    <div className="text-2xl font-bold">13h/semaine</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Flèche de transformation */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden md:block z-10">
              <div className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white p-3 rounded-full shadow-xl animate-pulse">
                <ArrowRight className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* CTA final */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 text-white rounded-3xl p-12 max-w-4xl mx-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 animate-pulse"></div>

            <div className="relative z-10">
              <h3 className="text-3xl font-bold mb-4">
                Prêt à transformer votre pratique ?
              </h3>
              <p className="text-blue-100 mb-8 text-lg">
                Rejoignez les milliers de professionnels qui ont déjà choisi
                Cureliah
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => handleCTAClick("demo")}
                  className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Demander une démo
                </button>
                <button
                  onClick={() => handleCTAClick("trial")}
                  className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Essai gratuit 30 jours
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
