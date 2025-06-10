import { useState, useEffect } from "react";
import {
  Shield,
  Award,
  Users,
  CheckCircle,
  Star,
  TrendingUp,
  Clock,
  Heart,
  Building2,
  UserCheck,
  Lock,
  Globe,
} from "lucide-react";

const TrustSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({
    doctors: 0,
    establishments: 0,
    consultations: 0,
    satisfaction: 0,
  });

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

    const section = document.getElementById("trust-section");
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  // Animation des statistiques
  useEffect(() => {
    if (!isVisible) return;

    const targets = {
      doctors: 500,
      establishments: 120,
      consultations: 2800,
      satisfaction: 4.9,
    };

    const animateStats = () => {
      let frame = 0;
      const duration = 2000; // 2 secondes
      const fps = 60;
      const totalFrames = (duration / 1000) * fps;

      const interval = setInterval(() => {
        frame++;
        const progress = Math.min(frame / totalFrames, 1);

        // Fonction d'easing pour une animation plus naturelle
        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
        const easedProgress = easeOutCubic(progress);

        setAnimatedStats({
          doctors: Math.floor(targets.doctors * easedProgress),
          establishments: Math.floor(targets.establishments * easedProgress),
          consultations: Math.floor(targets.consultations * easedProgress),
          satisfaction: Math.min(
            targets.satisfaction * easedProgress,
            targets.satisfaction
          ),
        });

        if (progress >= 1) {
          clearInterval(interval);
        }
      }, 1000 / fps);

      return () => clearInterval(interval);
    };

    const timer = setTimeout(animateStats, 500);
    return () => clearTimeout(timer);
  }, [isVisible]);

  // Données des partenaires (logos simulés)
  const partners = [
    { name: "CHU Paris", type: "hospital", logo: "🏥" },
    { name: "Clinique Sainte-Marie", type: "clinic", logo: "🏥" },
    { name: "APHP", type: "public", logo: "🏥" },
    { name: "Groupe Ramsay", type: "private", logo: "🏥" },
    { name: "Korian", type: "care", logo: "🏥" },
    { name: "DomusVi", type: "care", logo: "🏥" },
  ];

  // Certifications et labels
  const certifications = [
    {
      icon: Shield,
      title: "RGPD Conforme",
      description: "Protection maximale de vos données",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      icon: Lock,
      title: "SSL 256-bit",
      description: "Chiffrement de niveau bancaire",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      icon: Award,
      title: "ISO 27001",
      description: "Certification sécurité internationale",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      icon: UserCheck,
      title: "Ordre des Médecins",
      description: "Validation des compétences",
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  // Statistiques de confiance
  const trustStats = [
    {
      icon: Users,
      value: animatedStats.doctors,
      suffix: "+",
      label: "Médecins vérifiés",
      color: "text-blue-600",
      description: "Profils validés par notre équipe",
    },
    {
      icon: Building2,
      value: animatedStats.establishments,
      suffix: "+",
      label: "Établissements partenaires",
      color: "text-emerald-600",
      description: "Hôpitaux et cliniques de confiance",
    },
    {
      icon: Heart,
      value: animatedStats.consultations,
      suffix: "+",
      label: "Consultations réalisées",
      color: "text-red-500",
      description: "Missions accomplies avec succès",
    },
    {
      icon: Star,
      value: animatedStats.satisfaction,
      suffix: "/5",
      label: "Satisfaction moyenne",
      color: "text-yellow-500",
      description: "Note attribuée par nos utilisateurs",
    },
  ];

  const StatCard = ({ stat, index }) => {
    const Icon = stat.icon;
    return (
      <div
        className={`
          bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center
          transform transition-all duration-700 hover:shadow-xl hover:-translate-y-1
          ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}
        `}
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <div
          className={`inline-flex p-3 rounded-2xl ${stat.color
            .replace("text-", "bg-")
            .replace("600", "100")} mb-4`}
        >
          <Icon className={`w-6 h-6 ${stat.color}`} />
        </div>
        <div className={`text-3xl font-bold ${stat.color} mb-2 tabular-nums`}>
          {stat.suffix === "/5"
            ? stat.value.toFixed(1)
            : stat.value.toLocaleString()}
          {stat.suffix}
        </div>
        <div className="text-gray-900 font-semibold mb-2">{stat.label}</div>
        <div className="text-sm text-gray-500">{stat.description}</div>
      </div>
    );
  };

  const CertificationBadge = ({ cert, index }) => {
    const Icon = cert.icon;
    return (
      <div
        className={`
          ${cert.bg} rounded-2xl p-6 text-center border border-gray-100
          transform transition-all duration-500 hover:scale-105
          ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}
        `}
        style={{ animationDelay: `${600 + index * 100}ms` }}
      >
        <div className="flex justify-center mb-4">
          <div className={`p-3 rounded-xl bg-white shadow-md`}>
            <Icon className={`w-6 h-6 ${cert.color}`} />
          </div>
        </div>
        <h4 className={`font-bold ${cert.color} mb-2`}>{cert.title}</h4>
        <p className="text-sm text-gray-600">{cert.description}</p>
      </div>
    );
  };

  return (
    <section
      id="trust-section"
      className="py-16 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 relative overflow-hidden"
      aria-labelledby="trust-title"
    >
      {/* Éléments décoratifs de fond */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Badge de confiance */}
        <div className="text-center mb-12">
          <div
            className={`
              inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white 
              px-6 py-3 rounded-full text-sm font-semibold mb-6 shadow-lg
              transition-all duration-1000 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }
            `}
          >
            <Shield className="w-4 h-4" />
            Plus de 500 professionnels nous font confiance
            <TrendingUp className="w-4 h-4" />
          </div>

          <h2
            id="trust-title"
            className={`
              text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight
              transition-all duration-1000 delay-200 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }
            `}
          >
            Une plateforme de
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              {" "}
              confiance{" "}
            </span>
            reconnue
          </h2>

          <p
            className={`
              text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed
              transition-all duration-1000 delay-300 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }
            `}
          >
            Sécurité maximale, transparence totale et résultats prouvés.
            Découvrez pourquoi les professionnels de santé choisissent Cureliah.
          </p>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {trustStats.map((stat, index) => (
            <StatCard key={index} stat={stat} index={index} />
          ))}
        </div>

        {/* Certifications et sécurité */}
        <div
          className={`
            transition-all duration-1000 delay-700 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }
          `}
        >
          <h3 className="text-xl font-semibold text-gray-900 text-center mb-8">
            Sécurité et certifications
          </h3>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {certifications.map((cert, index) => (
              <CertificationBadge key={index} cert={cert} index={index} />
            ))}
          </div>
        </div>

        {/* Section témoignage rapide */}
        <div
          className={`
            bg-gradient-to-r from-blue-50 via-white to-emerald-50 rounded-3xl p-8 md:p-12 
            border-2 border-gray-100 shadow-xl text-center relative overflow-hidden
            transition-all duration-1000 delay-900 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }
          `}
        >
          {/* Gradient décoratif */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-emerald-600/5 pointer-events-none"></div>

          <div className="relative z-10">
            {/* Étoiles */}
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-6 h-6 text-yellow-500 fill-current"
                />
              ))}
            </div>

            <blockquote className="text-lg md:text-xl text-gray-700 font-medium mb-6 italic leading-relaxed">
              "Cureliah a révolutionné notre façon de gérer les vacations. Gain
              de temps considérable et qualité de service exceptionnelle."
            </blockquote>

            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                Dr
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">
                  Dr. Sarah Martin
                </div>
                <div className="text-sm text-gray-600">
                  Directrice médicale, CHU Paris
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Indicateurs de mise à jour en temps réel */}
        <div
          className={`
            flex justify-center mt-8 transition-all duration-1000 delay-1000 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }
          `}
        >
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-md border border-gray-100">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">
              Données mises à jour en temps réel
            </span>
            <Clock className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
