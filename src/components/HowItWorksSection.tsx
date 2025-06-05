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

  // Animation d'apparition progressive
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const stepIndex = element.dataset.step;
            if (stepIndex) {
              setTimeout(() => {
                setVisibleSteps((prev) => new Set([...prev, stepIndex]));
              }, parseInt(stepIndex.split("-")[1]) * 200);
            }
          }
        });
      },
      { threshold: 0.2 }
    );

    const stepElements = document.querySelectorAll("[data-step]");
    stepElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
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
        <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-gray-200">
          {/* Numéro d'étape */}
          <div
            className={`absolute -top-4 -left-4 w-8 h-8 rounded-full bg-gradient-to-r ${step.color} text-white text-sm font-bold flex items-center justify-center shadow-lg`}
          >
            {index + 1}
          </div>

          {/* Badge highlight */}
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-4 ${
              isDoctor
                ? "bg-blue-50 text-blue-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            <Star className="w-3 h-3 mr-1" />
            {step.highlight}
          </div>

          {/* Icône */}
          <div
            className={`relative mb-6 group-hover:scale-110 transition-transform duration-300`}
          >
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${step.color} p-4 shadow-lg`}
            >
              <Icon className="w-8 h-8 text-white" />
            </div>
            <div
              className={`absolute inset-0 w-16 h-16 rounded-2xl bg-gradient-to-r ${step.color} opacity-20 scale-110 group-hover:scale-125 transition-transform duration-300`}
            ></div>
          </div>

          {/* Contenu */}
          <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors">
            {step.title}
          </h4>
          <p className="text-gray-600 leading-relaxed mb-4">
            {step.description}
          </p>

          {/* Flèche de progression */}
          {index <
            (isDoctor ? doctorSteps.length - 1 : facilitySteps.length - 1) && (
            <div className="hidden md:block absolute -right-8 top-1/2 transform -translate-y-1/2">
              <ArrowRight
                className={`w-6 h-6 ${
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
      className="py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50"
      ref={sectionRef}
      role="region"
      aria-label="Comment fonctionne Cureliah"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Comment fonctionne
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              {" "}
              Cureliah
            </span>{" "}
            ?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Un processus simple et efficace en 3 étapes pour connecter médecins
            et établissements
          </p>

          {/* Statistiques */}
          <div className="flex justify-center gap-8 mt-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">24h</div>
              <div className="text-sm text-gray-500">Validation</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">100%</div>
              <div className="text-sm text-gray-500">Automatisé</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">0€</div>
              <div className="text-sm text-gray-500">Frais cachés</div>
            </div>
          </div>
        </div>

        {/* Sélecteur de tabs */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-100">
            <button
              onClick={() => {
                setActiveTab("doctors");
                setVisibleSteps(new Set());
              }}
              className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === "doctors"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                  : "text-gray-600 hover:text-blue-600"
              }`}
              aria-pressed={activeTab === "doctors"}
            >
              👨‍⚕️ Pour les médecins
            </button>
            <button
              onClick={() => {
                setActiveTab("facilities");
                setVisibleSteps(new Set());
              }}
              className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === "facilities"
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg"
                  : "text-gray-600 hover:text-emerald-600"
              }`}
              aria-pressed={activeTab === "facilities"}
            >
              🏥 Pour les établissements
            </button>
          </div>
        </div>

        {/* Contenu des étapes */}
        <div className="relative">
          {activeTab === "doctors" && (
            <div className="grid md:grid-cols-3 gap-8 relative">
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
            <div className="grid md:grid-cols-3 gap-8 relative">
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

        {/* Section avantages */}
        <div className="mt-20 text-center">
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <Shield className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">
                100% Sécurisé
              </h3>
              <p className="text-gray-600 text-sm">
                Données chiffrées et conformité RGPD
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <Clock className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">
                Gain de temps
              </h3>
              <p className="text-gray-600 text-sm">
                Processus automatisé de A à Z
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <Star className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Support 24/7</h3>
              <p className="text-gray-600 text-sm">
                Équipe dédiée à votre service
              </p>
            </div>
          </div>
        </div>

        {/* CTA final amélioré */}
        <div className="text-center mt-16">
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 text-white rounded-3xl p-12 max-w-4xl mx-auto overflow-hidden">
            {/* Effet de brillance */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full animate-pulse"></div>

            <div className="relative z-10">
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                Prêt à révolutionner vos vacations médicales ?
              </h3>
              <p className="text-blue-100 mb-8 text-lg">
                Rejoignez dès maintenant la communauté Cureliah et découvrez une
                nouvelle façon de travailler
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => handleAuthNavigation("doctor")}
                  className="group bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  aria-label="S'inscrire en tant que médecin"
                >
                  <span className="flex items-center justify-center">
                    👨‍⚕️ Inscription médecin
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
                <button
                  onClick={() => handleAuthNavigation("facility")}
                  className="group border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  aria-label="S'inscrire en tant qu'établissement"
                >
                  <span className="flex items-center justify-center">
                    🏥 Inscription établissement
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </div>

              {/* Témoignage rapide */}
              <div className="mt-8 opacity-80">
                <p className="text-sm italic">
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
