import { useState, useEffect, useRef, useMemo } from "react";
import {
  User,
  Building2,
  Calendar,
  Clock,
  CheckCircle,
  Star,
  TrendingUp,
  Shield,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const HeroSection = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [currentStats, setCurrentStats] = useState({ doctors: 0, time: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredDay, setHoveredDay] = useState(null);
  const heroRef = useRef(null);
  const navigate = useNavigate();

  // Use real authentication
  const { user: authUser, profile, loading: authLoading } = useAuth();

  // Animation d'apparition
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Animation des statistiques
  useEffect(() => {
    if (!isVisible) return;

    const animateStats = () => {
      const doctorsTarget = 150; // More realistic number for early platform
      const timeTarget = 5; // More realistic response time

      let doctorsCount = 0;
      let timeCount = 0;

      const interval = setInterval(() => {
        if (doctorsCount < doctorsTarget) {
          doctorsCount += Math.ceil(doctorsTarget / 30);
          doctorsCount = Math.min(doctorsCount, doctorsTarget);
        }

        if (timeCount < timeTarget && doctorsCount > doctorsTarget * 0.8) {
          timeCount = timeTarget;
        }

        setCurrentStats({
          doctors: doctorsCount,
          time: timeCount,
        });

        if (doctorsCount >= doctorsTarget && timeCount >= timeTarget) {
          clearInterval(interval);
        }
      }, 50);

      return () => clearInterval(interval);
    };

    const timer = setTimeout(animateStats, 500);
    return () => clearTimeout(timer);
  }, [isVisible]);

  const getUserType = () => {
    if (authLoading) return null;
    return (
      authUser?.user_type ||
      profile?.user_type ||
      authUser?.user_metadata?.user_type
    );
  };

  const handleDoctorClick = () => {
    if (authLoading) return;
    setLoading(true);

    setTimeout(() => {
      if (authUser) {
        const userType = getUserType();

        if (userType === "doctor") {
          navigate("/doctor/dashboard");
        } else {
          navigate("/establishment/dashboard");
        }
      } else {
        navigate("/auth?type=doctor");
      }
      setLoading(false);
    }, 800);
  };

  const handleEstablishmentClick = () => {
    if (authLoading) return;
    setLoading(true);

    setTimeout(() => {
      if (authUser) {
        const userType = getUserType();

        if (userType === "establishment") {
          navigate("/establishment/dashboard");
        } else {
          navigate("/doctor/dashboard");
        }
      } else {
        navigate("/auth?type=establishment");
      }
      setLoading(false);
    }, 800);
  };

  const userType = getUserType();

  // Calendar data with more realistic healthcare scheduling
  const calendarData = useMemo(() => {
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    
    // More realistic availability patterns
    const availableDays = [
      { day: currentDay + 2, rate: "80€", specialty: "Médecin généraliste", urgent: false },
      { day: currentDay + 3, rate: "95€", specialty: "Médecin d'urgence", urgent: true },
      { day: currentDay + 5, rate: "110€", specialty: "Spécialiste", urgent: false },
      { day: currentDay + 7, rate: "85€", specialty: "Médecin généraliste", urgent: false },
      { day: currentDay + 9, rate: "120€", specialty: "Consultant expert", urgent: true },
      { day: currentDay + 12, rate: "90€", specialty: "Médecin référent", urgent: false },
      { day: currentDay + 14, rate: "100€", specialty: "Spécialiste", urgent: false },
      { day: currentDay + 16, rate: "105€", specialty: "Médecin consultant", urgent: false },
    ].filter(day => day.day <= 31); // Keep only valid days

    return Array.from({ length: 35 }, (_, i) => {
      const dayNumber = i < 31 ? i + 1 : null;
      const availableDay = availableDays.find((d) => d.day === dayNumber);

      return {
        day: dayNumber,
        isAvailable: !!availableDay,
        ...availableDay,
      };
    });
  }, []);

  const Button = ({
    children,
    variant = "default",
    size = "default",
    className = "",
    disabled = false,
    onClick,
    ...props
  }) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 active:translate-y-0";

    const variants = {
      default:
        "bg-medical-blue hover:bg-medical-blue-dark text-white shadow-lg hover:shadow-xl focus:ring-blue-500",
      outline:
        "border-2 border-emerald-600 text-emerald-600 hover:bg-medical-green hover:text-white shadow-lg hover:shadow-xl focus:ring-emerald-500",
    };

    const sizes = {
      default: "px-6 py-3",
      lg: "px-8 py-4 text-lg",
    };

    return (
      <button
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled}
        onClick={onClick}
        {...props}
      >
        {children}
      </button>
    );
  };

  return (
    <section
      className="relative bg-gradient-to-br from-blue-50 via-white to-emerald-50 min-h-[90vh] flex items-center overflow-hidden"
      ref={heroRef}
      role="banner"
      aria-label="Section principale de Cureliah"
    >
      {/* Éléments décoratifs en arrière-plan - Adaptés pour mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 sm:top-20 left-5 sm:left-10 w-48 sm:w-72 h-48 sm:h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 sm:opacity-30 animate-pulse"></div>
        <div
          className="absolute top-20 sm:top-40 right-5 sm:right-10 w-48 sm:w-72 h-48 sm:h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 sm:opacity-30 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute -bottom-16 sm:-bottom-32 left-10 sm:left-20 w-48 sm:w-72 h-48 sm:h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 sm:opacity-30 animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left Content */}
          <div
            className={`text-center lg:text-left transition-all duration-1000 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          >
            {/* Badge de nouveauté - Responsif */}
            <div className="inline-flex items-center bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6 shadow-lg">
              <Star className="w-3 sm:w-4 h-3 sm:h-4 mr-2" />
              Simple, rapide, sécurisé.
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight mb-4 sm:mb-6">
              La plateforme qui{" "}
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                révolutionne
              </span>{" "}
              les{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
                vacations médicales
              </span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed px-2 sm:px-0">
              Médecins, publiez vos disponibilités. Établissements, trouvez
              instantanément le praticien qu'il vous faut. 
            </p>

            {/* Points clés - Optimisés pour mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8 px-2 sm:px-0">
              <div className="flex items-center justify-center lg:justify-start">
                <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-600 mr-2 flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-700">Validation 24h</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start">
                <Shield className="w-4 sm:w-5 h-4 sm:h-5 text-medical-blue mr-2 flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-700">100% sécurisé</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start">
                <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5 text-purple-600 mr-2 flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-700">Commission 0%</span>
              </div>
            </div>

            {/* Dual CTA - Empilés sur mobile */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start mb-6 sm:mb-8 px-4 sm:px-0">
              <Button
                size="lg"
                onClick={handleDoctorClick}
                disabled={loading || authLoading}
                className="group relative overflow-hidden w-full sm:w-auto text-sm sm:text-base py-3 sm:py-4"
                aria-label={
                  authUser && userType === "doctor"
                    ? "Accéder à mon tableau de bord médecin"
                    : "S'inscrire en tant que médecin"
                }
              >
                <User className="w-4 sm:w-5 h-4 sm:h-5 mr-2 transition-transform group-hover:scale-110" />
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Chargement...
                  </span>
                ) : authUser && userType === "doctor" ? (
                  "Mon dashboard"
                ) : (
                  "Je suis médecin"
                )}

                {/* Effet de brillance */}
                <div className="absolute inset-0 -top-full bg-gradient-to-b from-transparent via-white/20 to-transparent group-hover:top-full transition-all duration-500"></div>
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={handleEstablishmentClick}
                disabled={loading || authLoading}
                className="group relative overflow-hidden w-full sm:w-auto text-sm sm:text-base py-3 sm:py-4"
                aria-label={
                  authUser && userType === "establishment"
                    ? "Accéder à mon tableau de bord établissement"
                    : "S'inscrire en tant qu'établissement"
                }
              >
                <Building2 className="w-4 sm:w-5 h-4 sm:h-5 mr-2 transition-transform group-hover:scale-110" />
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Chargement...
                  </span>
                ) : authUser && userType === "establishment" ? (
                  "Mon dashboard"
                ) : (
                  "Je suis un établissement"
                )}

                {/* Effet de brillance */}
                <div className="absolute inset-0 -top-full bg-gradient-to-b from-transparent via-emerald-200/20 to-transparent group-hover:top-full transition-all duration-500"></div>
              </Button>
            </div>

            {/* Stats animées - Responsive */}
            <div className="grid grid-cols-2 gap-3 sm:gap-6 pt-6 sm:pt-8 border-t border-gray-200">
              <div className="text-center lg:text-left group">
                <div className="flex items-center justify-center lg:justify-start space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                  <Calendar className="w-4 sm:w-5 h-4 sm:h-5 text-medical-blue group-hover:scale-110 transition-transform" />
                  <span className="text-lg sm:text-2xl font-bold text-gray-900 tabular-nums">
                    {currentStats.doctors}+
                  </span>
                </div>
                <p className="text-xs sm:text-base text-gray-600">Médecins inscrits</p>
              </div>
              <div className="text-center lg:text-left group">
                <div className="flex items-center justify-center lg:justify-start space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                  <Clock className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span className="text-lg sm:text-2xl font-bold text-gray-900 tabular-nums">
                    {currentStats.time}min
                  </span>
                </div>
                <p className="text-xs sm:text-base text-gray-600">Temps de réservation</p>
              </div>
            </div>
          </div>

          {/* Right Content - Illustration interactive - Mobile responsive */}
          <div
            className={`relative transition-all duration-1000 delay-300 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          >
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 border border-gray-100 relative overflow-hidden">
              {/* Gradient de fond */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-emerald-50/50 pointer-events-none"></div>

              <div className="relative z-10 space-y-4 sm:space-y-6">
                {/* En-tête du calendrier - Mobile responsive */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-lg font-semibold text-gray-900 flex items-center">
                    <Calendar className="w-4 sm:w-5 h-4 sm:h-5 mr-1 sm:mr-2 text-medical-blue" />
                    Disponibilités
                  </h3>
                  <div className="flex items-center">
                    <span className="text-xs sm:text-sm text-medical-blue font-medium mr-2">
                      Nov 2024
                    </span>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  </div>
                </div>

                {/* Calendrier interactif - Mobile optimized */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs sm:text-sm">
                  {["L", "M", "M", "J", "V", "S", "D"].map((day, index) => (
                    <div key={index} className="text-gray-500 font-medium py-1 sm:py-2">
                      {day}
                    </div>
                  ))}
                  {calendarData.map((item, i) => (
                    <div
                      key={i}
                      className={`h-6 sm:h-10 flex items-center justify-center text-xs sm:text-sm rounded-md sm:rounded-lg transition-all duration-200 cursor-pointer relative ${
                        item.isAvailable
                          ? `${
                              item.urgent
                                ? "bg-red-500 hover:bg-red-600 focus:bg-red-600"
                                : "bg-emerald-500 hover:bg-medical-green focus:bg-medical-green"
                            } text-white font-medium transform hover:scale-110 focus:scale-110 shadow-lg focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent`
                          : item.day
                          ? "text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:ring-2 focus:ring-gray-300"
                          : ""
                      }`}
                      onMouseEnter={() => item.isAvailable && setHoveredDay(i)}
                      onMouseLeave={() => setHoveredDay(null)}
                      onFocus={() => item.isAvailable && setHoveredDay(i)}
                      onBlur={() => setHoveredDay(null)}
                      onKeyDown={(e) => {
                        if (item.isAvailable && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          // Simulate booking action or navigate to booking
                          // TODO: Replace with actual booking navigation
                        }
                      }}
                      role={item.isAvailable ? "button" : undefined}
                      tabIndex={item.isAvailable ? 0 : -1}
                      aria-label={
                        item.isAvailable
                          ? `${item.day} novembre - ${item.specialty} - ${item.rate}`
                          : undefined
                      }
                    >
                      {item.day}
                      {item.urgent && (
                        <div className="absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Tooltip pour les jours survolés - Mobile friendly */}
                {hoveredDay !== null &&
                  calendarData[hoveredDay]?.isAvailable && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-gray-900 text-white px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm z-20 shadow-xl">
                      <div className="font-medium">
                        {calendarData[hoveredDay].specialty}
                      </div>
                      <div className="text-emerald-400 font-bold">
                        {calendarData[hoveredDay].rate}/vacation
                      </div>
                      {calendarData[hoveredDay].urgent && (
                        <div className="text-red-400 text-xs">🔴 Urgent</div>
                      )}
                    </div>
                  )}

                {/* Profil médecin - Mobile responsive */}
                <div className="border-t pt-3 sm:pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold mr-2 sm:mr-3 text-xs sm:text-sm">
                        Dr
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-gray-900">
                          Dr. Martin
                        </div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <MapPin className="w-2 sm:w-3 h-2 sm:h-3 mr-1" />
                          Paris 15ème
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-medical-blue font-bold text-xs sm:text-sm">
                        120€/vacation
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Star className="w-2 sm:w-3 h-2 sm:h-3 text-yellow-500 mr-1" />
                        4.9 (127)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Indicateurs de statut - Mobile responsive */}
                <div className="flex justify-between text-xs">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                    <span className="text-gray-600">Disponible</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-gray-600">Urgent</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Éléments flottants animés - Mobile responsive */}
            <div
              className="absolute -top-3 sm:-top-6 -right-3 sm:-right-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-2 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl animate-bounce"
              style={{ animationDuration: "3s" }}
            >
              <User className="w-4 sm:w-6 h-4 sm:h-6" />
            </div>
            <div
              className="absolute -bottom-3 sm:-bottom-6 -left-3 sm:-left-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-2 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl animate-bounce"
              style={{ animationDuration: "3s", animationDelay: "1.5s" }}
            >
              <Building2 className="w-4 sm:w-6 h-4 sm:h-6" />
            </div>

            {/* Notification flottante - Mobile responsive */}
            <div className="absolute -top-2 sm:-top-5 -left-4 sm:-left-8 bg-white rounded-lg sm:rounded-xl shadow-lg p-2 sm:p-3 border border-gray-100 animate-pulse z-20">
              <div className="flex items-center text-xs sm:text-sm whitespace-nowrap">
                <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 text-emerald-600 mr-1 sm:mr-2" />
                <span className="text-gray-700">Nouvelle réservation !</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
