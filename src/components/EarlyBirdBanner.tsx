import { useState, useEffect } from "react";
import {
  X,
  Flame,
  Clock,
  Star,
  ArrowRight,
  Zap,
  Crown,
  Timer,
  Users,
  Sparkles,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

const EarlyBirdBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    days: 6,
    hours: 23,
    minutes: 42,
    seconds: 15,
  });
  const [spotsLeft, setSpotsLeft] = useState(47);
  const [isAnimating, setIsAnimating] = useState(false);

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

  // Diminution occasionnelle des places
  useEffect(() => {
    const spotsTimer = setInterval(() => {
      if (spotsLeft > 35 && Math.random() > 0.85) {
        setSpotsLeft((prev) => prev - 1);
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 500);
      }
    }, 30000);

    return () => clearInterval(spotsTimer);
  }, [spotsLeft]);

  const handleCTAClick = () => {
    // TODO: Replace with logger.info("Navigation vers inscription Early Bird");
    window.location.href = "/auth?offer=early-bird&source=top-banner";
  };

  const handleClose = () => {
    setIsVisible(false);
    // Optionnel : stocker en localStorage pour ne pas réafficher
    localStorage.setItem("earlyBirdBannerDismissed", "true");
  };

  if (!isVisible) return null;

  const TimeUnit = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1 min-w-[32px] text-center">
        <span className="text-white font-bold text-sm tabular-nums">
          {value.toString().padStart(2, "0")}
        </span>
      </div>
      <span className="text-orange-200 text-xs font-medium mt-1">{label}</span>
    </div>
  );

  return (
    <div className="relative z-50">
      {/* Bandeau principal */}
      <div className="bg-gradient-to-r from-red-600 via-orange-500 to-red-600 text-white relative overflow-hidden">
        {/* Animations de fond */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>

        {/* Particules flottantes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-pulse"
              style={{
                left: `${20 + i * 8}%`,
                top: `${30 + Math.sin(i) * 20}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: `${1.5 + Math.random()}s`,
              }}
            ></div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 relative z-10">
          <div className="flex items-center justify-between gap-4">
            {/* Mobile: Version simplifiée */}
            <div className="flex md:hidden items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-yellow-300 animate-bounce" />
                <span className="font-bold text-sm">EARLY BIRD -30%</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  <span className="text-xs font-medium">
                    {timeLeft.days}j {timeLeft.hours}h {timeLeft.minutes}m
                  </span>
                </div>
                <button
                  onClick={handleCTAClick}
                  className="bg-white text-red-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-gray-100 transition-colors"
                >
                  J'en profite
                </button>
              </div>
            </div>

            {/* Desktop: Version complète */}
            <div className="hidden md:flex items-center justify-between w-full">
              {/* Section gauche: Offre */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="bg-yellow-400 text-yellow-900 rounded-full p-1">
                    <Flame className="w-4 h-4 animate-bounce" />
                  </div>
                  <span className="font-bold text-lg">OFFRE EARLY BIRD</span>
                  <div className="bg-yellow-400 text-yellow-900 rounded-full px-2 py-1 text-xs font-bold animate-pulse">
                    -30%
                  </div>
                </div>

                <div className="h-6 w-px bg-white/30"></div>

                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-200" />
                  <span className="text-sm">Plus que</span>
                  <span
                    className={`font-bold text-yellow-300 transition-all duration-500 ${
                      isAnimating ? "scale-125" : "scale-100"
                    }`}
                  >
                    {spotsLeft}
                  </span>
                  <span className="text-sm">places</span>
                </div>
              </div>

              {/* Section centre: Countdown */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-orange-200">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Se termine dans:</span>
                </div>

                <div className="flex items-center gap-2">
                  <TimeUnit value={timeLeft.days} label="j" />
                  <span className="text-white/60">:</span>
                  <TimeUnit value={timeLeft.hours} label="h" />
                  <span className="text-white/60">:</span>
                  <TimeUnit value={timeLeft.minutes} label="m" />
                  <span className="text-white/60">:</span>
                  <TimeUnit value={timeLeft.seconds} label="s" />
                </div>
              </div>

              {/* Section droite: CTA */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium">Économisez 180€</div>
                  <div className="text-xs text-orange-200">
                    sur votre première année
                  </div>
                </div>

                <button
                  onClick={handleCTAClick}
                  className="group bg-white text-red-600 px-6 py-2 rounded-full font-bold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Crown className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  <span>J'en profite !</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Bouton fermer */}
            <button
              onClick={handleClose}
              className="absolute top-1/2 right-4 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors p-1"
              aria-label="Fermer le bandeau"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barre de progression (optionnelle) */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-800">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-1000"
            style={{
              width: `${((50 - spotsLeft) / 50) * 100}%`,
            }}
          ></div>
        </div>
      </div>

      {/* Bandeau secondaire avec preuves sociales (optionnel) */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-2 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-gray-300">
                🩺 Dr. Martin vient de s'inscrire
              </span>
            </div>

            <div className="hidden sm:block h-4 w-px bg-gray-600"></div>

            <div className="hidden sm:flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-gray-300">
                +23 inscriptions aujourd'hui
              </span>
            </div>

            <div className="hidden md:block h-4 w-px bg-gray-600"></div>

            <div className="hidden md:flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-gray-300">4.9/5 - 847 avis</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarlyBirdBanner;
