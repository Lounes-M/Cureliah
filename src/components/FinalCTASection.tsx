import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  Rocket,
  Star,
  CheckCircle,
  Zap,
  Crown,
  Sparkles,
  TrendingUp,
  Users,
  Timer,
  Award,
  Target,
  Heart,
  Flame,
  ChevronRight,
  User,
  Building2,
  Shield,
  Clock,
  Euro,
  Gift,
  Phone,
  MessageCircle,
  Mail,
  Calendar,
  Play,
  Download,
  FileText,
  Megaphone,
  PartyPopper,
} from "lucide-react";

const FinalCTASection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [rippleEffect, setRippleEffect] = useState({
    x: 0,
    y: 0,
    active: false,
  });
  const [hoveredAction, setHoveredAction] = useState(null);
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

  // Rotation des témoignages
  const testimonials = [
    {
      text: "Cureliah a transformé ma façon de travailler. Fini les heures perdues en démarches !",
      author: "Dr. Sarah Martin",
      role: "Cardiologue",
      location: "Paris",
      rating: 5,
    },
    {
      text: "Une solution révolutionnaire. Nos urgences sont maintenant couvertes 24h/24.",
      author: "CHU Bordeaux",
      role: "Directeur médical",
      location: "Bordeaux",
      rating: 5,
    },
    {
      text: "Interface intuitive, processus simplifié. Exactement ce dont on avait besoin.",
      author: "Dr. Thomas Durand",
      role: "Urgentiste",
      location: "Lyon",
      rating: 5,
    },
  ];

  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [isVisible, testimonials.length]);

  // Gestion de l'effet ripple
  const handleRippleClick = (e, callback) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setRippleEffect({ x, y, active: true });

    setTimeout(() => {
      setRippleEffect({ x: 0, y: 0, active: false });
      callback();
    }, 300);
  };

  const handleDoctorSignup = () => {
    console.log("Navigation finale vers inscription médecin");
    window.location.href = "/auth?type=doctor&source=final-cta";
  };

  const handleEstablishmentSignup = () => {
    console.log("Navigation finale vers inscription établissement");
    window.location.href = "/auth?type=establishment&source=final-cta";
  };

  const handleScheduleDemo = () => {
    console.log("Planification d'une démo");
    window.location.href = "/schedule-demo";
  };

  const handleCallSales = () => {
    console.log("Appel équipe commerciale");
    window.location.href = "tel:+33123456789";
  };

  const handleDownloadBrochure = () => {
    console.log("Téléchargement brochure");
    window.location.href = "/download-brochure";
  };

  // Composant bouton principal avec effet ripple
  const PrimaryButton = ({
    icon: Icon,
    title,
    subtitle,
    badge,
    onClick,
    className = "",
    gradient = "from-blue-600 to-emerald-600",
  }) => (
    <button
      onClick={(e) => handleRippleClick(e, onClick)}
      className={`
        group relative overflow-hidden bg-gradient-to-r ${gradient} text-white 
        rounded-3xl p-8 shadow-2xl hover:shadow-3xl transform hover:-translate-y-3 
        transition-all duration-500 border-2 border-white/20 hover:border-white/40
        ${className}
      `}
    >
      {/* Effet ripple */}
      {rippleEffect.active && (
        <div
          className="absolute bg-white/30 rounded-full animate-ping"
          style={{
            left: rippleEffect.x - 20,
            top: rippleEffect.y - 20,
            width: 40,
            height: 40,
          }}
        ></div>
      )}

      {/* Gradient animé au hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

      {/* Badge */}
      {badge && (
        <div className="absolute -top-3 -right-3 bg-yellow-400 text-yellow-900 rounded-full px-4 py-2 text-sm font-bold animate-bounce">
          {badge}
        </div>
      )}

      <div className="relative z-10 flex items-center gap-6">
        {/* Icône avec animation */}
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
          <Icon className="w-8 h-8 text-white" />
        </div>

        <div className="flex-1 text-left">
          <h3 className="text-2xl md:text-3xl font-bold mb-2 group-hover:text-yellow-200 transition-colors">
            {title}
          </h3>
          <p className="text-blue-100 text-lg leading-relaxed">{subtitle}</p>
        </div>

        <ArrowRight className="w-8 h-8 text-white group-hover:translate-x-2 group-hover:scale-125 transition-all duration-300" />
      </div>
    </button>
  );

  // Composant action secondaire
  const SecondaryAction = ({ icon: Icon, title, description, onClick, id }) => (
    <button
      onClick={onClick}
      onMouseEnter={() => setHoveredAction(id)}
      onMouseLeave={() => setHoveredAction(null)}
      className="group bg-white/10 backdrop-blur-sm border border-white/30 rounded-2xl p-6 text-white hover:bg-white/20 hover:border-white/50 transition-all duration-300 text-left"
    >
      <div className="flex items-center gap-4">
        <div
          className={`
          w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center transition-all duration-300
          ${hoveredAction === id ? "scale-110 bg-white/30" : ""}
        `}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold mb-1">{title}</h4>
          <p className="text-blue-200 text-sm">{description}</p>
        </div>
        <ChevronRight
          className={`
          w-5 h-5 transition-all duration-300
          ${hoveredAction === id ? "translate-x-1 scale-110" : ""}
        `}
        />
      </div>
    </button>
  );

  const currentTestim = testimonials[currentTestimonial];

  return (
    <section
      ref={sectionRef}
      id="final-cta-section"
      className="py-24 bg-gradient-to-br from-gray-900 via-blue-900 to-emerald-900 relative overflow-hidden"
      aria-labelledby="final-cta-title"
    >
      {/* Éléments décoratifs avancés */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>

        {/* Particules flottantes */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          ></div>
        ))}

        {/* Lignes de connexion */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" viewBox="0 0 800 600">
            <defs>
              <linearGradient
                id="lineGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.5" />
              </linearGradient>
            </defs>
            <path
              d="M0,300 Q200,100 400,300 T800,300"
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="2"
              className="animate-pulse"
            />
            <path
              d="M0,200 Q300,400 600,200 T800,200"
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="1"
              className="animate-pulse"
              style={{ animationDelay: "1s" }}
            />
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header spectaculaire */}
        <div className="text-center mb-20">
          {/* Badge avec animation */}
          <div
            className={`
              inline-flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-orange-400 
              text-gray-900 px-8 py-4 rounded-full text-lg font-bold mb-8 shadow-2xl
              transition-all duration-1000 animate-bounce
              ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }
            `}
          >
            <PartyPopper className="w-6 h-6" />
            C'est le moment ou jamais !
            <Rocket className="w-6 h-6" />
          </div>

          <h2
            id="final-cta-title"
            className={`
              text-5xl md:text-7xl font-bold text-white mb-8 leading-tight
              transition-all duration-1000 delay-200 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }
            `}
          >
            Révolutionnez
            <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              {" "}
              dès aujourd'hui{" "}
            </span>
            vos vacations médicales
          </h2>

          <p
            className={`
              text-2xl text-blue-200 max-w-4xl mx-auto leading-relaxed mb-12
              transition-all duration-1000 delay-300 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }
            `}
          >
            Rejoignez la révolution médicale. Votre futur professionnel commence
            maintenant.
          </p>

          {/* Statistiques impressionnantes */}
          <div
            className={`
              grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 transition-all duration-1000 delay-500 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }
            `}
          >
            {[
              { icon: Users, value: "500+", label: "Professionnels conquis" },
              { icon: Clock, value: "78%", label: "Temps économisé" },
              { icon: Euro, value: "2.3M€", label: "Économies générées" },
              { icon: Star, value: "4.9/5", label: "Satisfaction client" },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 group"
                >
                  <Icon className="w-8 h-8 text-yellow-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <div className="text-3xl font-bold text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-blue-200 text-sm">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA principaux - Design premium */}
        <div
          className={`
            grid lg:grid-cols-2 gap-8 mb-16 transition-all duration-1000 delay-700 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }
          `}
        >
          <PrimaryButton
            icon={User}
            title="Je suis médecin"
            subtitle="Multipliez vos opportunités et optimisez votre planning"
            badge="🔥 HOT"
            onClick={handleDoctorSignup}
            gradient="from-blue-600 via-blue-500 to-emerald-500"
          />

          <PrimaryButton
            icon={Building2}
            title="Je suis un établissement"
            subtitle="Trouvez le médecin parfait en moins de 2 minutes"
            badge="⚡ FAST"
            onClick={handleEstablishmentSignup}
            gradient="from-emerald-600 via-emerald-500 to-blue-500"
          />
        </div>

        {/* Actions secondaires */}
        <div
          className={`
            grid md:grid-cols-3 gap-6 mb-16 transition-all duration-1000 delay-900 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }
          `}
        >
          <SecondaryAction
            icon={Calendar}
            title="Planifier une démo"
            description="Démonstration personnalisée en 15 min"
            onClick={handleScheduleDemo}
            id="demo"
          />

          <SecondaryAction
            icon={Phone}
            title="Appeler un expert"
            description="Discussion directe avec notre équipe"
            onClick={handleCallSales}
            id="call"
          />

          <SecondaryAction
            icon={Download}
            title="Télécharger la brochure"
            description="Guide complet PDF (12 pages)"
            onClick={handleDownloadBrochure}
            id="download"
          />
        </div>

        {/* Témoignage rotatif */}
        <div
          className={`
            bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-12 
            border border-white/30 text-center mb-16 relative overflow-hidden
            transition-all duration-1000 delay-1000 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }
          `}
        >
          {/* Effet de brillance */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 animate-pulse"></div>

          <div className="relative z-10">
            {/* Étoiles */}
            <div className="flex justify-center mb-6">
              {[...Array(currentTestim.rating)].map((_, i) => (
                <Star
                  key={i}
                  className="w-8 h-8 text-yellow-400 fill-current animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>

            <blockquote className="text-2xl md:text-3xl text-white font-medium mb-8 italic leading-relaxed">
              "{currentTestim.text}"
            </blockquote>

            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {currentTestim.author.includes("Dr.") ? "👨‍⚕️" : "🏥"}
              </div>
              <div className="text-left">
                <div className="text-white font-bold text-lg">
                  {currentTestim.author}
                </div>
                <div className="text-blue-200">{currentTestim.role}</div>
                <div className="text-blue-300 text-sm">
                  {currentTestim.location}
                </div>
              </div>
            </div>

            {/* Indicateurs de témoignage */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial
                      ? "bg-yellow-400 scale-125"
                      : "bg-white/30"
                  }`}
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* Urgence finale avec countdown */}
        <div
          className={`
            bg-gradient-to-r from-red-600 to-orange-600 rounded-3xl p-8 text-center text-white 
            shadow-2xl border-2 border-yellow-400 relative overflow-hidden
            transition-all duration-1000 delay-1200 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }
          `}
        >
          {/* Effet de pulsation */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 animate-pulse"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Flame className="w-8 h-8 text-yellow-300 animate-bounce" />
              <h3 className="text-2xl font-bold">Dernière chance !</h3>
              <Flame className="w-8 h-8 text-yellow-300 animate-bounce" />
            </div>

            <p className="text-xl mb-6">
              Profitez de conditions privilégiées pour les 50 premiers inscrits.
              <br />
              <span className="font-bold text-yellow-300">
                Cette opportunité ne se représentera pas.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-2 text-yellow-300 font-bold">
                <Timer className="w-5 h-5" />
                <span>Offre limitée</span>
              </div>
              <div className="flex items-center gap-2 text-yellow-300 font-bold">
                <Crown className="w-5 h-5" />
                <span>Accès VIP</span>
              </div>
              <div className="flex items-center gap-2 text-yellow-300 font-bold">
                <Gift className="w-5 h-5" />
                <span>Bonus exclusifs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Message final inspirant */}
        <div
          className={`
            text-center mt-16 transition-all duration-1000 delay-1400 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }
          `}
        >
          <div className="inline-flex items-center gap-3 text-blue-200 text-lg">
            <Heart className="w-6 h-6 text-red-400 animate-pulse" />
            <span className="italic">
              "L'avenir de la médecine se construit aujourd'hui. Soyez-en les
              acteurs."
            </span>
            <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
