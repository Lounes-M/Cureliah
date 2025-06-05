import { useState, useEffect, useRef } from "react";
import {
  TrendingUp,
  Clock,
  Euro,
  Users,
  Calendar,
  Award,
  Target,
  Zap,
  Heart,
  Building2,
  CheckCircle,
  Star,
  ArrowUp,
  Timer,
  Shield,
  Globe,
  BarChart3,
  Activity,
} from "lucide-react";

const StatsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("impact");
  const [animatedStats, setAnimatedStats] = useState({});
  const sectionRef = useRef(null);

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

  // Configuration des statistiques par catégorie
  const statsConfig = {
    impact: {
      title: "Impact sur le secteur",
      subtitle: "Des résultats qui parlent d'eux-mêmes",
      color: "blue",
      stats: [
        {
          icon: Clock,
          value: 78,
          suffix: "%",
          label: "Réduction du temps de recrutement",
          description: "De 6 semaines à 2 jours en moyenne",
          trend: "+23%",
          detail: "vs. méthodes traditionnelles",
        },
        {
          icon: Euro,
          value: 2.3,
          suffix: "M€",
          label: "Économies générées",
          description: "Pour nos établissements partenaires",
          trend: "+156%",
          detail: "économies annuelles",
        },
        {
          icon: Users,
          value: 94,
          suffix: "%",
          label: "Taux de satisfaction",
          description: "Médecins et établissements confondus",
          trend: "+8%",
          detail: "vs. année précédente",
        },
        {
          icon: Target,
          value: 89,
          suffix: "%",
          label: "Missions pourvues en urgence",
          description: "Résolues en moins de 4h",
          trend: "+31%",
          detail: "amélioration continue",
        },
      ],
    },
    performance: {
      title: "Performance de la plateforme",
      subtitle: "Une technologie au service de l'efficacité",
      color: "emerald",
      stats: [
        {
          icon: Zap,
          value: 2.3,
          suffix: "min",
          label: "Temps moyen de réservation",
          description: "De la recherche à la confirmation",
          trend: "-67%",
          detail: "vs. processus manuel",
        },
        {
          icon: Calendar,
          value: 24,
          suffix: "h",
          label: "Validation des profils",
          description: "Médecins vérifiés sous 24h",
          trend: "-75%",
          detail: "plus rapide qu'avant",
        },
        {
          icon: Activity,
          value: 99.8,
          suffix: "%",
          label: "Disponibilité de la plateforme",
          description: "Service fiable 24h/24, 7j/7",
          trend: "+0.3%",
          detail: "amélioration continue",
        },
        {
          icon: Shield,
          value: 0,
          suffix: "",
          label: "Incidents de sécurité",
          description: "Zéro incident depuis le lancement",
          trend: "100%",
          detail: "sécurité garantie",
        },
      ],
    },
    growth: {
      title: "Croissance et adoption",
      subtitle: "Une communauté qui grandit chaque jour",
      color: "purple",
      stats: [
        {
          icon: Users,
          value: 847,
          suffix: "+",
          label: "Médecins inscrits",
          description: "Croissance de +45% ce trimestre",
          trend: "+45%",
          detail: "ce trimestre",
        },
        {
          icon: Building2,
          value: 156,
          suffix: "+",
          label: "Établissements partenaires",
          description: "Hôpitaux et cliniques actifs",
          trend: "+62%",
          detail: "nouveaux partenaires",
        },
        {
          icon: Heart,
          value: 4850,
          suffix: "+",
          label: "Consultations réalisées",
          description: "Missions accomplies avec succès",
          trend: "+89%",
          detail: "vs. mois dernier",
        },
        {
          icon: Globe,
          value: 23,
          suffix: "",
          label: "Régions couvertes",
          description: "Présence nationale en expansion",
          trend: "+5",
          detail: "nouvelles régions",
        },
      ],
    },
  };

  // Animation des statistiques
  useEffect(() => {
    if (!isVisible) return;

    const currentStats = statsConfig[activeTab].stats;
    const animateStats = () => {
      const startTime = Date.now();
      const duration = 2000;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Fonction d'easing pour une animation plus naturelle
        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
        const easedProgress = easeOutCubic(progress);

        const newAnimatedStats = {};
        currentStats.forEach((stat, index) => {
          const delay = index * 200;
          const adjustedElapsed = Math.max(0, elapsed - delay);
          const adjustedProgress = Math.min(adjustedElapsed / duration, 1);
          const adjustedEasedProgress = easeOutCubic(adjustedProgress);

          if (stat.label === "Incidents de sécurité") {
            newAnimatedStats[index] = 0;
          } else {
            newAnimatedStats[index] = stat.value * adjustedEasedProgress;
          }
        });

        setAnimatedStats(newAnimatedStats);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    };

    const timer = setTimeout(animateStats, 300);
    return () => clearTimeout(timer);
  }, [isVisible, activeTab]);

  const getColorClasses = (color, type = "bg") => {
    const colors = {
      blue: {
        bg: "bg-blue-50",
        text: "text-blue-600",
        gradient: "from-blue-500 to-blue-600",
        border: "border-blue-200",
        ring: "ring-blue-500/20",
      },
      emerald: {
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        gradient: "from-emerald-500 to-emerald-600",
        border: "border-emerald-200",
        ring: "ring-emerald-500/20",
      },
      purple: {
        bg: "bg-purple-50",
        text: "text-purple-600",
        gradient: "from-purple-500 to-purple-600",
        border: "border-purple-200",
        ring: "ring-purple-500/20",
      },
    };
    return colors[color]?.[type] || colors.blue[type];
  };

  const StatCard = ({ stat, index, color }) => {
    const Icon = stat.icon;
    const animatedValue = animatedStats[index] || 0;

    const formatValue = (value) => {
      if (stat.label === "Incidents de sécurité") return "0";
      if (stat.suffix === "M€") return value.toFixed(1);
      if (stat.suffix === "min") return value.toFixed(1);
      if (stat.suffix === "%") return Math.floor(value);
      if (stat.suffix === "h") return Math.floor(value);
      return Math.floor(value);
    };

    const getTrendColor = (trend) => {
      if (trend.startsWith("+")) return "text-emerald-600";
      if (trend.startsWith("-") && !stat.description.includes("Réduction"))
        return "text-red-600";
      if (trend.startsWith("-")) return "text-emerald-600"; // Réduction positive
      return "text-blue-600";
    };

    return (
      <div
        className={`
          group bg-white rounded-3xl p-8 shadow-lg border border-gray-100 relative overflow-hidden
          transform transition-all duration-700 hover:shadow-2xl hover:-translate-y-2
          ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}
        `}
        style={{ animationDelay: `${index * 150}ms` }}
      >
        {/* Gradient décoratif */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${getColorClasses(
            color,
            "bg"
          )} opacity-30 group-hover:opacity-40 transition-opacity`}
        ></div>

        {/* Badge de tendance */}
        <div
          className={`absolute top-4 right-4 ${getColorClasses(
            color,
            "bg"
          )} rounded-full px-3 py-1 flex items-center gap-1`}
        >
          <ArrowUp className={`w-3 h-3 ${getTrendColor(stat.trend)}`} />
          <span
            className={`text-xs font-semibold ${getTrendColor(stat.trend)}`}
          >
            {stat.trend}
          </span>
        </div>

        <div className="relative z-10">
          {/* Icône */}
          <div
            className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${getColorClasses(
              color,
              "gradient"
            )} shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}
          >
            <Icon className="w-8 h-8 text-white" />
          </div>

          {/* Valeur principale */}
          <div className="mb-4">
            <div
              className={`text-4xl md:text-5xl font-bold ${getColorClasses(
                color,
                "text"
              )} mb-2 tabular-nums leading-none`}
            >
              {formatValue(animatedValue)}
              <span className="text-2xl ml-1">{stat.suffix}</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
              {stat.label}
            </h3>
          </div>

          {/* Description */}
          <p className="text-gray-600 mb-4 leading-relaxed">
            {stat.description}
          </p>

          {/* Détail de la tendance */}
          <div
            className={`${getColorClasses(
              color,
              "bg"
            )} rounded-xl p-3 border ${getColorClasses(color, "border")}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {stat.detail}
              </span>
              <div
                className={`flex items-center gap-1 ${getTrendColor(
                  stat.trend
                )}`}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm font-semibold">{stat.trend}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TabButton = ({ id, config, isActive }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setAnimatedStats({});
      }}
      className={`
        relative px-6 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:-translate-y-1
        ${
          isActive
            ? `bg-gradient-to-r ${getColorClasses(
                config.color,
                "gradient"
              )} text-white shadow-xl ${getColorClasses(
                config.color,
                "ring"
              )} ring-8`
            : "bg-white text-gray-600 hover:text-gray-900 shadow-md hover:shadow-lg border border-gray-200"
        }
      `}
      aria-pressed={isActive}
    >
      <span className="relative z-10">{config.title}</span>
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-pulse"></div>
      )}
    </button>
  );

  const currentConfig = statsConfig[activeTab];

  return (
    <section
      ref={sectionRef}
      id="stats-section"
      className="py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden"
      aria-labelledby="stats-title"
    >
      {/* Éléments décoratifs de fond */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* En-tête */}
        <div className="text-center mb-16">
          <div
            className={`
              inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white 
              px-6 py-3 rounded-full text-sm font-semibold mb-6 shadow-lg
              transition-all duration-1000 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }
            `}
          >
            <BarChart3 className="w-4 h-4" />
            Résultats mesurables et impact concret
            <TrendingUp className="w-4 h-4" />
          </div>

          <h2
            id="stats-title"
            className={`
              text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight
              transition-all duration-1000 delay-200 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }
            `}
          >
            Des
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}
              statistiques{" "}
            </span>
            qui en disent long
          </h2>

          <p
            className={`
              text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed
              transition-all duration-1000 delay-300 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }
            `}
          >
            Découvrez l'impact réel de Cureliah sur l'écosystème médical
            français. Des chiffres vérifiés qui témoignent de notre efficacité.
          </p>
        </div>

        {/* Sélecteur d'onglets */}
        <div
          className={`
            flex justify-center mb-16 transition-all duration-1000 delay-500 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }
          `}
        >
          <div className="bg-gray-100 rounded-3xl p-2 shadow-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row gap-2">
              {Object.entries(statsConfig).map(([id, config]) => (
                <TabButton
                  key={id}
                  id={id}
                  config={config}
                  isActive={activeTab === id}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Titre et description de la section active */}
        <div
          className={`
            text-center mb-12 transition-all duration-700 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }
          `}
        >
          <h3
            className={`text-2xl font-bold ${getColorClasses(
              currentConfig.color,
              "text"
            )} mb-3`}
          >
            {currentConfig.title}
          </h3>
          <p className="text-lg text-gray-600">{currentConfig.subtitle}</p>
        </div>

        {/* Grille des statistiques */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {currentConfig.stats.map((stat, index) => (
            <StatCard
              key={index}
              stat={stat}
              index={index}
              color={currentConfig.color}
            />
          ))}
        </div>

        {/* Section call-to-action */}
        <div
          className={`
            text-center transition-all duration-1000 delay-700 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }
          `}
        >
          <div
            className={`bg-gradient-to-r ${getColorClasses(
              currentConfig.color,
              "gradient"
            )} p-1 rounded-3xl inline-block shadow-2xl`}
          >
            <div className="bg-white rounded-3xl px-12 py-8">
              <div className="flex items-center justify-center gap-4 mb-6">
                <CheckCircle
                  className={`w-8 h-8 ${getColorClasses(
                    currentConfig.color,
                    "text"
                  )}`}
                />
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Rejoignez ces statistiques
                </h3>
                <Star
                  className={`w-8 h-8 ${getColorClasses(
                    currentConfig.color,
                    "text"
                  )}`}
                />
              </div>

              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Faites partie des professionnels qui transforment déjà le
                secteur médical. Vos résultats pourraient être les prochains à
                figurer ici.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div
                  className={`flex items-center gap-2 ${getColorClasses(
                    currentConfig.color,
                    "text"
                  )} font-semibold`}
                >
                  <TrendingUp className="w-5 h-5" />
                  <span>Croissance garantie</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                </div>
                <div
                  className={`flex items-center gap-2 ${getColorClasses(
                    currentConfig.color,
                    "text"
                  )} font-semibold`}
                >
                  <Shield className="w-5 h-5" />
                  <span>Résultats mesurables</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Indicateur de mise à jour */}
        <div
          className={`
            flex justify-center mt-8 transition-all duration-1000 delay-900 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }
          `}
        >
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-md border border-gray-100">
            <div className="relative">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-3 h-3 bg-emerald-500 rounded-full animate-ping opacity-30"></div>
            </div>
            <span className="text-sm text-gray-600 font-medium">
              Statistiques mises à jour en temps réel
            </span>
            <Timer className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
