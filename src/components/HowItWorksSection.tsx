import {
  UserPlus,
  Calendar,
  CheckCircle,
  Search,
  MessageCircle,
  FileText,
  ArrowRight,
  Shield,
  Clock,
  Star,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

const HowItWorksSection = () => {
  const [visibleSteps, setVisibleSteps] = useState(new Set());
  const [activeTab, setActiveTab] = useState("doctors");
  const sectionRef = useRef(null);

  // Animation d'apparition progressive - Version corrigée
  useEffect(() => {
    // Rendre les steps visibles en fonction de l'onglet actif
    if (activeTab === "doctors") {
      setVisibleSteps(new Set(["doctors-0", "doctors-1", "doctors-2"]));
    } else if (activeTab === "facilities") {
      setVisibleSteps(new Set(["facilities-0", "facilities-1", "facilities-2"]));
    }
  }, [activeTab]);

  const handleAuthNavigation = (userType) => {
    console.log(`Navigation vers inscription ${userType}`);
    // Simulation de navigation - remplacer par votre logique
    window.location.href = `/auth?type=${userType}`;
  };

  const doctorSteps = [
    {
      icon: UserPlus,
      title: "Inscription et validation",
      description:
        "Créez votre profil, uploadez vos diplômes et votre numéro RPPS. Notre équipe valide votre profil sous 24h.",
      highlight: "Validation rapide",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Calendar,
      title: "Publiez vos créneaux",
      description:
        "Ajoutez vos disponibilités sur notre calendrier intégré. Définissez vos tarifs et zones d'intervention.",
      highlight: "Calendrier intelligent",
      color: "from-blue-600 to-blue-700",
    },
    {
      icon: CheckCircle,
      title: "Acceptez les missions",
      description:
        "Recevez les demandes d'établissements, validez ou refusez. Le contrat et la facturation sont automatiques.",
      highlight: "Processus automatisé",
      color: "from-blue-700 to-blue-800",
    },
  ];

  const facilitySteps = [
    {
      icon: Search,
      title: "Recherchez un médecin",
      description:
        "Filtrez par spécialité, zone géographique, tarif et disponibilité. Consultez les profils détaillés.",
      highlight: "Recherche avancée",
      color: "from-emerald-500 to-emerald-600",
    },
    {
      icon: MessageCircle,
      title: "Réservez instantanément",
      description:
        "Sélectionnez le créneau qui vous convient. Échangez avec le médecin via notre chat intégré.",
      highlight: "Réservation immédiate",
      color: "from-emerald-600 to-emerald-700",
    },
    {
      icon: FileText,
      title: "Contrat automatique",
      description:
        "Le contrat est généré automatiquement et signable électroniquement. Recevez votre facture après la mission.",
      highlight: "Signature électronique",
      color: "from-emerald-700 to-emerald-800",
    },
  ];

  const StepCard = ({ step, index, isVisible, userType }) => {
    const Icon = step.icon;
    const isDoctor = userType === "doctors";

    return (
      <div
        data-step={`${userType}-${index}`}
        className={`relative transform transition-all duration-700 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <div className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-gray-200">
          {/* Numéro d'étape - Mobile responsive */}
          <div
            className={`absolute -top-3 sm:-top-4 -left-3 sm:-left-4 w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-gradient-to-r ${step.color} text-white text-sm font-bold flex items-center justify-center shadow-lg`}
          >
            {index + 1}
          </div>

          {/* Badge highlight - Mobile responsive */}
          <div
            className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium mb-3 sm:mb-4 ${
              isDoctor
                ? "bg-blue-50 text-blue-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            <Star className="w-3 h-3 mr-1" />
            {step.highlight}
          </div>

          {/* Icône - Mobile responsive */}
          <div
            className={`relative mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}
          >
            <div
              className={`w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-r ${step.color} p-3 sm:p-4 shadow-lg`}
            >
              <Icon className="w-6 sm:w-7 lg:w-8 h-6 sm:h-7 lg:h-8 text-white" />
            </div>
            <div
              className={`absolute inset-0 w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-r ${step.color} opacity-20 scale-110 group-hover:scale-125 transition-transform duration-300`}
            ></div>
          </div>

          {/* Contenu - Mobile responsive */}
          <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 group-hover:text-gray-700 transition-colors">
            {step.title}
          </h4>
          <p className="text-gray-600 leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base">
            {step.description}
          </p>

          {/* Flèche de progression - Masquée sur mobile */}
          {index <
            (isDoctor ? doctorSteps.length - 1 : facilitySteps.length - 1) && (
            <div className="hidden lg:block absolute -right-6 xl:-right-8 top-1/2 transform -translate-y-1/2">
              <ArrowRight
                className={`w-5 xl:w-6 h-5 xl:h-6 ${
                  isDoctor ? "text-blue-400" : "text-emerald-400"
                }`}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section
      id="fonctionnement"
      className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50"
      ref={sectionRef}
      role="region"
      aria-label="Comment fonctionne Cureliah"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête - Mobile responsive */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 px-2 sm:px-0">
            Comment fonctionne
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              {" "}
              Cureliah
            </span>{" "}
            ?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
            Un processus simple et efficace en 3 étapes pour connecter médecins
            et établissements
          </p>

          {/* Statistiques - Mobile responsive */}
          <div className="flex justify-center gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8">
            <div className="text-center">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">24h</div>
              <div className="text-xs sm:text-sm text-gray-500">Validation</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-600">100%</div>
              <div className="text-xs sm:text-sm text-gray-500">Automatisé</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">0€</div>
              <div className="text-xs sm:text-sm text-gray-500">Frais cachés</div>
            </div>
          </div>
        </div>

        {/* Sélecteur de tabs - Mobile responsive */}
        <div className="flex justify-center mb-8 sm:mb-10 lg:mb-12">
          <div className="bg-white rounded-xl sm:rounded-2xl p-1.5 sm:p-2 shadow-lg border border-gray-100 w-full max-w-lg sm:max-w-2xl">
            <button
              onClick={() => setActiveTab("doctors")}
              className={`w-1/2 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base ${
                activeTab === "doctors"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                  : "text-gray-600 hover:text-blue-600"
              }`}
              aria-pressed={activeTab === "doctors"}
            >
              <span className="hidden sm:inline">👨‍⚕️ Pour les médecins</span>
              <span className="sm:hidden">👨‍⚕️ Médecins</span>
            </button>
            <button
              onClick={() => setActiveTab("facilities")}
              className={`w-1/2 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base ${
                activeTab === "facilities"
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg"
                  : "text-gray-600 hover:text-emerald-600"
              }`}
              aria-pressed={activeTab === "facilities"}
            >
              <span className="hidden sm:inline">🏥 Pour les établissements</span>
              <span className="sm:hidden">🏥 Établissements</span>
            </button>
          </div>
        </div>

        {/* Contenu des étapes - Mobile responsive */}
        <div className="relative">
          {activeTab === "doctors" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative">
              {doctorSteps.map((step, index) => (
                <StepCard
                  key={`doctor-${index}`}
                  step={step}
                  index={index}
                  isVisible={visibleSteps.has(`doctors-${index}`)}
                  userType="doctors"
                />
              ))}
            </div>
          )}

          {activeTab === "facilities" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative">
              {facilitySteps.map((step, index) => (
                <StepCard
                  key={`facility-${index}`}
                  step={step}
                  index={index}
                  isVisible={visibleSteps.has(`facilities-${index}`)}
                  userType="facilities"
                />
              ))}
            </div>
          )}
        </div>

        {/* Section avantages - Mobile responsive */}
        <div className="mt-12 sm:mt-16 lg:mt-20 text-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
            <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
              <Shield className="w-6 sm:w-8 h-6 sm:h-8 text-blue-600 mx-auto mb-2 sm:mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">
                100% Sécurisé
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Données chiffrées et conformité RGPD
              </p>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
              <Clock className="w-6 sm:w-8 h-6 sm:h-8 text-emerald-600 mx-auto mb-2 sm:mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">
                Gain de temps
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Processus automatisé de A à Z
              </p>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100 sm:col-span-2 lg:col-span-1">
              <Star className="w-6 sm:w-8 h-6 sm:h-8 text-purple-600 mx-auto mb-2 sm:mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Support 24/7</h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Équipe dédiée à votre service
              </p>
            </div>
          </div>
        </div>

        {/* CTA final amélioré - Mobile responsive */}
        <div className="text-center mt-8 sm:mt-12 lg:mt-16">
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 max-w-4xl mx-auto overflow-hidden">
            {/* Effet de brillance */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full animate-pulse"></div>

            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 px-2 sm:px-0">
                Prêt à révolutionner vos vacations médicales ?
              </h3>
              <p className="text-blue-100 mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg px-2 sm:px-0">
                Rejoignez dès maintenant la communauté Cureliah et découvrez une
                nouvelle façon de travailler
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  onClick={() => handleAuthNavigation("doctor")}
                  className="group bg-white text-blue-600 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-sm sm:text-base"
                  aria-label="S'inscrire en tant que médecin"
                >
                  <span className="flex items-center justify-center">
                    👨‍⚕️ <span className="hidden xs:inline ml-1">Inscription médecin</span><span className="xs:hidden ml-1">Médecin</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
                <button
                  onClick={() => handleAuthNavigation("facility")}
                  className="group border-2 border-white text-white px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-sm sm:text-base"
                  aria-label="S'inscrire en tant qu'établissement"
                >
                  <span className="flex items-center justify-center">
                    🏥 <span className="hidden xs:inline ml-1">Inscription établissement</span><span className="xs:hidden ml-1">Établissement</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </div>

              {/* Témoignage rapide - Mobile responsive */}
              <div className="mt-6 sm:mt-8 opacity-80">
                <p className="text-xs sm:text-sm italic px-4 sm:px-0">
                  "Une solution qui change vraiment la donne dans le secteur
                  médical"
                </p>
                <p className="text-xs mt-1">— Dr. Martin, Cardiologue</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
