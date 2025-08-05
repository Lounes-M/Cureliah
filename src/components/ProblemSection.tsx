import {
  AlertCircle,
  Clock,
  UserX,
  Building,
  TrendingDown,
  Users,
  DollarSign,
  Timer,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { useState, useEffect } from "react";

// Données statistiques pour l'impact
const impactStats = [
  {
    value: "73%",
    label: "des médecins perdent du temps en recherche",
    color: "text-red-600",
  },
  {
    value: "2.5h",
    label: "temps moyen pour trouver une mission",
    color: "text-orange-600",
  },
  {
    value: "41%",
    label: "des postes urgents non pourvus",
    color: "text-red-600",
  },
  {
    value: "2.3 M€",
    label: "pertes annuelles par établissement",
    color: "text-orange-600",
  },
];

// Configuration des problèmes pour éviter la répétition
const problemsConfig = {
  medecins: {
    title: "Pour les médecins",
    icon: UserX,
    bgColor: "bg-red-50",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    accentColor: "text-red-500",
    borderColor: "border-red-200",
    problems: [
      {
        icon: AlertCircle,
        titre: "Manque de visibilité",
        description:
          "Faire connaître ses disponibilités aux établissements pertinents",
        impact: "Perte de 40% d'opportunités",
      },
      {
        icon: Clock,
        titre: "Processus administratifs longs",
        description:
          "Contrats complexes et démarches bureaucratiques interminables",
        impact: "2-3 semaines par mission",
      },
      {
        icon: DollarSign,
        titre: "Revenus imprévisibles",
        description:
          "Difficile de planifier ses revenus et optimiser son planning",
        impact: "Fluctuations de ±30%",
      },
    ],
  },
  etablissements: {
    title: "Pour les établissements",
    icon: Building,
    bgColor: "bg-orange-50",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    accentColor: "text-orange-500",
    borderColor: "border-orange-200",
    problems: [
      {
        icon: Timer,
        titre: "Urgences non couvertes",
        description:
          "Besoin immédiat de médecins sans solution rapide disponible",
        impact: "Services fermés 15% du temps",
      },
      {
        icon: Users,
        titre: "Recrutement complexe",
        description: "Réseau limité, validation des compétences chronophage",
        impact: "6 mois de recrutement moyen",
      },
      {
        icon: TrendingDown,
        titre: "Coûts cachés élevés",
        description:
          "Tarifs opaques, frais d'agence et disponibilités inconnues",
        impact: "Surcoût de 25-40%",
      },
    ],
  },
};

// Composant pour une carte de problème - Mobile responsive
function ProblemCard({ config, isVisible }) {
  const IconComponent = config.icon;

  return (
    <div
      className={`
      relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border-2 transition-all duration-700 hover:shadow-2xl
      ${config.borderColor} hover:scale-105 transform
      ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}
    `}
    >
      {/* Gradient decoratif */}
      <div
        className={`absolute inset-0 ${config.bgColor} rounded-xl sm:rounded-2xl opacity-30`}
      />

      <div className="relative z-10">
        {/* Header avec icône - Responsive */}
        <div className="flex items-center mb-4 sm:mb-6 lg:mb-8">
          <div className={`${config.iconBg} p-2 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl mr-3 sm:mr-4 lg:mr-6 shadow-lg`}>
            <IconComponent className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 ${config.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 truncate">
              {config.title}
            </h3>
            <div
              className={`w-8 sm:w-10 lg:w-12 h-0.5 sm:h-1 ${config.iconColor.replace(
                "text-",
                "bg-"
              )} rounded-full`}
            />
          </div>
        </div>

        {/* Liste des problèmes - Mobile optimized */}
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          {config.problems.map((problem, index) => {
            const ProblemIcon = problem.icon;
            return (
              <div
                key={index}
                className="group hover:bg-white/80 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 -m-2 sm:-m-3 lg:-m-4 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start space-x-2 sm:space-x-3 lg:space-x-4">
                  <div
                    className={`${config.iconBg} p-1.5 sm:p-2 rounded-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}
                  >
                    <ProblemIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${config.accentColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm sm:text-base lg:text-lg text-gray-900 mb-1 sm:mb-2 group-hover:text-gray-800 transition-colors">
                      {problem.titre}
                    </h4>
                    <p className="text-xs sm:text-sm lg:text-base text-gray-600 leading-relaxed mb-1 sm:mb-2">
                      {problem.description}
                    </p>
                    <div
                      className={`text-xs sm:text-sm font-semibold ${config.accentColor} bg-white rounded-full px-2 sm:px-3 py-0.5 sm:py-1 inline-block`}
                    >
                      📊 {problem.impact}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Composant pour les statistiques animées - Mobile responsive
function AnimatedStat({ stat, delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`
      text-center p-3 sm:p-4 lg:p-6 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-gray-200
      transition-all duration-700 hover:scale-105 hover:shadow-xl
      ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}
    `}
    >
      <div className={`text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-1 sm:mb-2 ${stat.color}`}>
        {stat.value}
      </div>
      <div className="text-xs sm:text-sm text-gray-600 leading-tight">{stat.label}</div>
    </div>
  );
}

export default function ProblemSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    const section = document.getElementById("problem-section");
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="problem-section"
      className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/30 relative overflow-hidden"
      aria-labelledby="problem-title"
    >
      {/* Éléments décoratifs de fond - Adaptés pour mobile */}
      <div
        className="absolute inset-0 bg-grid-pattern opacity-5"
        aria-hidden="true"
      />
      <div
        className="absolute top-0 left-0 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-red-200/20 rounded-full -translate-x-24 sm:-translate-x-36 lg:-translate-x-48 -translate-y-24 sm:-translate-y-36 lg:-translate-y-48 blur-3xl animate-pulse"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 right-0 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-orange-200/20 rounded-full translate-x-24 sm:translate-x-36 lg:translate-x-48 translate-y-24 sm:translate-y-36 lg:translate-y-48 blur-3xl animate-pulse"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* En-tête avec animation - Mobile responsive */}
        <header
          className={`text-center mb-8 sm:mb-12 lg:mb-16 transition-all duration-1000 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
            <AlertCircle className="w-3 sm:w-4 h-3 sm:h-4" />
            Problématiques actuelles
          </div>

          <h2
            id="problem-title"
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight px-2 sm:px-0"
          >
            Les défis majeurs du
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
              {" "}
              secteur médical
            </span>
          </h2>

          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8 sm:mb-12 px-4 sm:px-0">
            Le système traditionnel de recrutement médical présente des
            inefficacités majeures qui impactent directement la qualité des
            soins et la satisfaction des professionnels.
          </p>

          {/* Statistiques d'impact - Mobile grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 max-w-5xl mx-auto mb-6 sm:mb-8 px-2 sm:px-0">
            {impactStats.map((stat, index) => (
              <AnimatedStat key={index} stat={stat} delay={index * 200} />
            ))}
          </div>
        </header>

        {/* Grille des problèmes - Mobile stacked */}
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-start mb-8 sm:mb-12 lg:mb-16">
          <ProblemCard config={problemsConfig.medecins} isVisible={isVisible} />
          <ProblemCard
            config={problemsConfig.etablissements}
            isVisible={isVisible}
          />
        </div>

        {/* Section de conséquences - Mobile responsive */}
        <div
          className={`
          bg-gradient-to-r from-red-50 via-white to-orange-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 xl:p-12 mb-8 sm:mb-12 border-2 border-gray-100 shadow-xl
          transition-all duration-1000 delay-500 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }
        `}
        >
          <div className="text-center mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 px-2 sm:px-0">
              Les conséquences de ces dysfonctionnements
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              <div className="text-center">
                <div className="bg-red-100 w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4">
                  <TrendingDown className="w-6 sm:w-7 lg:w-8 h-6 sm:h-7 lg:h-8 text-red-600" />
                </div>
                <h4 className="font-bold text-sm sm:text-base lg:text-lg text-gray-900 mb-1 sm:mb-2">
                  Qualité des soins
                </h4>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Services fermés, surcharge du personnel, stress accru
                </p>
              </div>

              <div className="text-center">
                <div className="bg-orange-100 w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4">
                  <DollarSign className="w-6 sm:w-7 lg:w-8 h-6 sm:h-7 lg:h-8 text-orange-600" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Coûts élevés</h4>
                <p className="text-gray-600 text-sm">
                  Intérim coûteux, temps perdu, inefficacité
                </p>
              </div>

              <div className="text-center">
                <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserX className="w-8 h-8 text-red-600" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Frustration</h4>
                <p className="text-gray-600 text-sm">
                  Médecins démotivés, RH débordées, patients impactés
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to action amélioré */}
        <div
          className={`
          text-center transition-all duration-1000 delay-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }
        `}
        >
          <div className="bg-gradient-to-r from-medical-blue to-medical-green p-1 rounded-3xl inline-block shadow-2xl">
            <div className="bg-white rounded-3xl px-12 py-8">
              <div className="flex items-center justify-center gap-4 mb-6">
                <CheckCircle className="w-8 h-8 text-medical-green" />
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Il est temps de changer la donne
                </h3>
                <CheckCircle className="w-8 h-8 text-medical-blue" />
              </div>

              <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                <strong>Projet Med</strong> apporte une solution moderne,
                digitale et efficace qui révolutionne la mise en relation entre
                médecins et établissements de santé.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="flex items-center gap-2 text-medical-green font-semibold">
                  <CheckCircle className="w-5 h-5" />
                  <span>Solution immédiate</span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 rotate-90 sm:rotate-0" />
                <div className="flex items-center gap-2 text-medical-blue font-semibold">
                  <CheckCircle className="w-5 h-5" />
                  <span>Résultats mesurables</span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 rotate-90 sm:rotate-0" />
                <div className="flex items-center gap-2 text-medical-green font-semibold">
                  <CheckCircle className="w-5 h-5" />
                  <span>Impact durable</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
