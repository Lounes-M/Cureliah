import { useState, useEffect, useRef } from "react";
import {
  Clock,
  TrendingUp,
  Users,
  Zap,
  Star,
  Timer,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Flame,
  Target,
  Gift,
  Crown,
  Sparkles,
  Calendar,
  Euro,
  Award,
  UserPlus,
  Building2,
} from "lucide-react";
import Logger from '@/utils/logger';

const logger = Logger.getInstance();

const UrgencySection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 7,
    hours: 14,
    minutes: 23,
    seconds: 45,
  });
  const [spotsLeft, setSpotsLeft] = useState(47);
  const [recentSignups, setRecentSignups] = useState([
    {
      name: "Dr. Martin L.",
      type: "Cardiologue",
      location: "Paris",
      time: "il y a 3 min",
    },
    {
      name: "Clinique Saint-Jean",
      type: "Établissement",
      location: "Lyon",
      time: "il y a 7 min",
    },
    {
      name: "Dr. Sophie K.",
      type: "Pédiatre",
      location: "Marseille",
      time: "il y a 12 min",
    },
  ]);
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

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev;

        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
          if (minutes < 0) {
            minutes = 59;
            hours--;
            if (hours < 0) {
              hours = 23;
              days--;
              if (days < 0) {
                // Reset or handle end of offer
                return { days: 0, hours: 0, minutes: 0, seconds: 0 };
              }
            }
          }
        }

        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Simulation de diminution des places
  useEffect(() => {
    if (!isVisible) return;

    const spotsTimer = setInterval(() => {
      setSpotsLeft((prev) => {
        if (prev > 35 && Math.random() > 0.7) {
          return prev - 1;
        }
        return prev;
      });
    }, 30000); // Diminue toutes les 30 secondes

    return () => clearInterval(spotsTimer);
  }, [isVisible]);

  // Simulation de nouvelles inscriptions
  useEffect(() => {
    if (!isVisible) return;

    const signupTimer = setInterval(() => {
      const newSignups = [
        {
          name: "Dr. Alexandre D.",
          type: "Neurologue",
          location: "Toulouse",
          time: "il y a 2 min",
        },
        {
          name: "CHU Bordeaux",
          type: "Établissement",
          location: "Bordeaux",
          time: "il y a 5 min",
        },
        {
          name: "Dr. Claire M.",
          type: "Dermatologue",
          location: "Nice",
          time: "il y a 8 min",
        },
        {
          name: "Clinique Pasteur",
          type: "Établissement",
          location: "Nantes",
          time: "il y a 11 min",
        },
        {
          name: "Dr. Thomas R.",
          type: "Urgentiste",
          location: "Lille",
          time: "il y a 15 min",
        },
      ];

      setRecentSignups((prev) => {
        const randomSignup =
          newSignups[Math.floor(Math.random() * newSignups.length)];
        return [randomSignup, ...prev.slice(0, 2)];
      });
    }, 45000); // Nouvelle inscription toutes les 45 secondes

    return () => clearInterval(signupTimer);
  }, [isVisible]);

  const handleDoctorSignup = () => {
    logger.info("Navigation vers inscription médecin avec offre spéciale", 
      { offer: 'early-bird', type: 'doctor' }, 
      'UrgencySection', 
      'doctor_signup'
    );
    // Simulation de navigation avec paramètres d'offre
    window.location.href = "/auth?type=doctor&offer=early-bird";
  };

  const handleEstablishmentSignup = () => {
    logger.info("Navigation vers inscription établissement avec offre spéciale", 
      { offer: 'early-bird', type: 'establishment' }, 
      'UrgencySection', 
      'establishment_signup'
    );
    window.location.href = "/auth?type=establishment&offer=early-bird";
  };

  const TimeBlock = ({ value, label }) => (
    <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200 min-w-[80px] text-center group hover:scale-105 transition-transform duration-300">
      <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1 tabular-nums">
        {value.toString().padStart(2, "0")}
      </div>
      <div className="text-sm text-gray-600 font-medium">{label}</div>
    </div>
  );

  const OfferBadge = ({ icon: Icon, title, description, highlight }) => (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center hover:bg-white/20 transition-all duration-300 group">
      <div className="inline-flex p-3 rounded-xl bg-white/20 mb-4 group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-blue-100 text-sm mb-3">{description}</p>
      <div className="bg-yellow-400 text-yellow-900 rounded-full px-3 py-1 text-xs font-bold">
        {highlight}
      </div>
    </div>
  );

  const RecentSignup = ({ signup, index }) => (
    <div
      className={`
        flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20
        transform transition-all duration-500 hover:bg-white/20
        ${isVisible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"}
      `}
      style={{ animationDelay: `${index * 200}ms` }}
    >
      <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
        {signup.type === "Établissement" ? "🏥" : "👨‍⚕️"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white font-medium text-sm truncate">
          {signup.name}
        </div>
        <div className="text-blue-200 text-xs">
          {signup.type} • {signup.location}
        </div>
      </div>
      <div className="text-blue-300 text-xs">{signup.time}</div>
    </div>
  );

  return (
    <section
      ref={sectionRef}
      id="urgency-section"
      className="py-20 bg-gradient-to-br from-red-600 via-red-500 to-orange-500 relative overflow-hidden"
      aria-labelledby="urgency-title"
    >
      {/* Éléments décoratifs animés */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-400/20 rounded-full -translate-x-48 -translate-y-48 blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-pink-400/20 rounded-full translate-x-48 translate-y-48 blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-orange-400/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Particules flottantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Badge d'alerte */}
        <div className="text-center mb-8">
          <div
            className={`
              inline-flex items-center gap-2 bg-yellow-400 text-yellow-900 
              px-6 py-3 rounded-full text-sm font-bold mb-6 shadow-lg animate-bounce
              transition-all duration-1000 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }
            `}
          >
            <Flame className="w-5 h-5" />
            OFFRE LIMITÉE - EARLY BIRD
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        {/* Titre principal */}
        <div className="text-center mb-12">
          <h2
            id="urgency-title"
            className={`
              text-4xl md:text-6xl font-bold text-white mb-6 leading-tight
              transition-all duration-1000 delay-200 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }
            `}
          >
            Rejoignez les
            <span className="text-yellow-300"> 50 premiers </span>
            et économisez
            <span className="text-yellow-300"> 30%</span>
          </h2>

          <p
            className={`
              text-xl text-red-100 max-w-4xl mx-auto leading-relaxed mb-8
              transition-all duration-1000 delay-300 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }
            `}
          >
            Une opportunité unique pour les pionniers qui veulent révolutionner
            leur pratique médicale dès maintenant.
          </p>

          {/* Compteur de places restantes */}
          <div
            className={`
              inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-2xl 
              px-8 py-4 border border-white/30 shadow-lg mb-8
              transition-all duration-1000 delay-400 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }
            `}
          >
            <AlertCircle className="w-6 h-6 text-yellow-300" />
            <span className="text-white font-bold text-lg">
              Plus que{" "}
              <span className="text-yellow-300 text-2xl">{spotsLeft}</span>{" "}
              places disponibles
            </span>
            <TrendingUp className="w-6 h-6 text-yellow-300" />
          </div>
        </div>

        {/* Countdown timer */}
        <div
          className={`
            text-center mb-16 transition-all duration-1000 delay-500 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }
          `}
        >
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center justify-center gap-3">
            <Timer className="w-8 h-8 text-yellow-300" />
            L'offre se termine dans :
          </h3>

          <div className="flex justify-center gap-4 mb-8">
            <TimeBlock value={timeLeft.days} label="Jours" />
            <TimeBlock value={timeLeft.hours} label="Heures" />
            <TimeBlock value={timeLeft.minutes} label="Min" />
            <TimeBlock value={timeLeft.seconds} label="Sec" />
          </div>

          <div className="text-red-200 text-sm">
            ⚠️ Après cette date, retour au tarif normal (+30%)
          </div>
        </div>

        {/* Grille des offres */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <OfferBadge
            icon={Euro}
            title="30% de réduction"
            description="Sur votre première année d'abonnement"
            highlight="ÉCONOMISEZ 180€"
          />
          <OfferBadge
            icon={Crown}
            title="Accès VIP"
            description="Support prioritaire et fonctionnalités exclusives"
            highlight="VALEUR 300€"
          />
          <OfferBadge
            icon={Gift}
            title="Formation gratuite"
            description="Accompagnement personnalisé par nos experts"
            highlight="VALEUR 150€"
          />
        </div>

        {/* CTA principaux */}
        <div
          className={`
            flex flex-col lg:flex-row gap-8 items-center justify-center mb-16
            transition-all duration-1000 delay-700 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }
          `}
        >
          {/* CTA Médecin */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-3xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
            <button
              onClick={handleDoctorSignup}
              className="relative bg-white text-red-600 px-12 py-6 rounded-3xl font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <UserPlus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="text-xl font-bold">Je suis médecin</div>
                  <div className="text-sm text-red-500">
                    Inscription Early Bird
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Badge de réduction */}
              <div className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full px-3 py-1 text-xs font-bold animate-pulse">
                -30%
              </div>
            </button>
          </div>

          {/* CTA Établissement */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-emerald-400 rounded-3xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
            <button
              onClick={handleEstablishmentSignup}
              className="relative bg-white text-medical-blue px-12 py-6 rounded-3xl font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <Building2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="text-xl font-bold">
                    Je suis un établissement
                  </div>
                  <div className="text-sm text-medical-blue-light">Accès privilégié</div>
                </div>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Badge de réduction */}
              <div className="absolute -top-3 -right-3 bg-medical-blue-light text-white rounded-full px-3 py-1 text-xs font-bold animate-pulse">
                -30%
              </div>
            </button>
          </div>
        </div>

        {/* Inscriptions récentes */}
        <div
          className={`
            max-w-md mx-auto transition-all duration-1000 delay-900 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }
          `}
        >
          <h4 className="text-white font-bold text-center mb-6 flex items-center justify-center gap-2">
            <Users className="w-5 h-5 text-yellow-300" />
            Inscriptions récentes
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </h4>

          <div className="space-y-3">
            {recentSignups.map((signup, index) => (
              <RecentSignup
                key={`${signup.name}-${index}`}
                signup={signup}
                index={index}
              />
            ))}
          </div>
        </div>

        {/* Garanties */}
        <div
          className={`
            text-center mt-16 transition-all duration-1000 delay-1000 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }
          `}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-white">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="font-medium">Sans engagement</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="font-medium">Annulation gratuite</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="font-medium">Support 24/7</span>
            </div>
          </div>

          {/* Urgence finale */}
          <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/30 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-yellow-300" />
              <span className="text-yellow-300 font-bold text-lg">
                DERNIÈRE CHANCE
              </span>
              <Zap className="w-6 h-6 text-yellow-300" />
            </div>
            <p className="text-white text-sm">
              Cette offre ne sera pas renouvelée. Une fois les 50 places
              écoulées, le tarif passe immédiatement au prix normal.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UrgencySection;
