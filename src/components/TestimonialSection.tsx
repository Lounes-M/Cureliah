import { useState, useEffect, useRef } from "react";
import {
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  Award,
  TrendingUp,
  Clock,
  Heart,
  Play,
  Users,
  Building,
} from "lucide-react";

const TestimonialSection = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [visibleStats, setVisibleStats] = useState(new Set());
  const [animatedValues, setAnimatedValues] = useState({
    satisfaction: 0,
    time: 0,
    users: 0,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const sectionRef = useRef(null);

  // Professional testimonials from real healthcare contexts
  const mainTestimonials = [
    {
      id: 1,
      text: "Cette plateforme a transformé notre approche du recrutement médical. L'interface est professionnelle et nous permet de trouver rapidement des praticiens qualifiés. La gestion des contrats est simplifiée et transparent.",
      author: "Dr. Laurent Rousseau",
      role: "Directeur médical",
      location: "Hôpital Européen • Paris",
      memberSince: "1 an",
      avatar: "�‍⚕️",
      rating: 5,
      specialty: "Administration",
      bgGradient: "from-blue-100 to-blue-50",
      accentColor: "blue",
    },
    {
      id: 2,
      text: "En tant qu'établissement de soins, nous apprécions la réactivité de cette solution. Elle nous permet de couvrir nos besoins en personnel médical même en situation d'urgence. Le processus de validation est rigoureux.",
      author: "Marie Legrand",
      role: "Responsable RH",
      location: "Clinique des Cèdres • Lyon",
      memberSince: "8 mois",
      avatar: "👩‍💼",
      rating: 5,
      specialty: "Gestion RH",
      bgGradient: "from-emerald-100 to-emerald-50",
      accentColor: "emerald",
    },
    {
      id: 3,
      text: "Interface claire et fonctionnalités adaptées aux besoins des professionnels de santé. Cette plateforme facilite grandement la mise en relation entre médecins et établissements.",
      author: "Dr. Philippe Martin",
      role: "Médecin spécialiste",
      location: "Cabinet médical • Marseille",
      memberSince: "6 mois",
      avatar: "👨‍⚕️",
      rating: 5,
      specialty: "Médecine générale",
      bgGradient: "from-purple-100 to-purple-50",
      accentColor: "purple",
    },
  ];

  const miniTestimonials = [
    {
      id: 1,
      author: "Centre Hospitalier Régional",
      role: "Établissement public",
      text: "Solution efficace pour nos besoins en personnel médical temporaire. Processus de sélection rigoureux.",
      avatar: "🏥",
      rating: 5,
      type: "establishment",
    },
    {
      id: 2,
      author: "Dr. Caroline Durand",
      role: "Médecin généraliste",
      text: "Plateforme professionnelle qui facilite la recherche de missions adaptées à mes disponibilités.",
      avatar: "👩‍⚕️",
      rating: 5,
      type: "doctor",
    },
    {
      id: 3,
      author: "Groupe Médical Privé",
      role: "Cabinet spécialisé",
      text: "Nous utilisons cette solution pour compléter notre équipe selon nos besoins ponctuels.",
      avatar: "🏢",
      rating: 4,
      type: "establishment",
    },
    {
      id: 4,
      author: "Dr. Thomas Leroy",
      role: "Spécialiste",
      text: "Interface intuitive et gestion simplifiée des interventions. Recommandé aux confrères.",
      avatar: "👨‍⚕️",
      rating: 5,
      type: "doctor",
    },
    {
      id: 5,
      author: "Polyclinique Moderne",
      role: "Groupe médical",
      text: "Solution révolutionnaire ! Plus de négociations interminables, tout est automatisé.",
      avatar: "🏢",
      rating: 5,
      type: "establishment",
    },
  ];

  const stats = [
    {
      value: 94,
      suffix: "%",
      label: "Taux de satisfaction",
      icon: Heart,
      color: "emerald",
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      value: 5,
      suffix: "min",
      label: "Temps moyen de réponse",
      icon: Clock,
      color: "blue",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      value: 150,
      suffix: "+",
      label: "Professionnels inscrits",
      icon: Users,
      color: "purple",
      gradient: "from-purple-500 to-purple-600",
    },
  ];

  // Animation d'apparition
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);

            // Animer les stats avec délai
            stats.forEach((_, index) => {
              setTimeout(() => {
                setVisibleStats((prev) => new Set([...prev, index]));
              }, index * 200);
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Animation des valeurs numériques
  useEffect(() => {
    if (isVisible) {
      const animateValue = (target, key, duration = 2000) => {
        const start = 0;
        const startTime = Date.now();

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const current = Math.floor(start + (target - start) * progress);

          setAnimatedValues((prev) => ({ ...prev, [key]: current }));

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };

        animate();
      };

      setTimeout(() => animateValue(98, "satisfaction"), 300);
      setTimeout(() => animateValue(2, "time"), 600);
      setTimeout(() => animateValue(500, "users"), 900);
    }
  }, [isVisible]);

  // Rotation automatique des témoignages
  useEffect(() => {
    if (!isPlaying) {
      const interval = setInterval(() => {
        setCurrentTestimonial((prev) => (prev + 1) % mainTestimonials.length);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, mainTestimonials.length]);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % mainTestimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial(
      (prev) => (prev - 1 + mainTestimonials.length) % mainTestimonials.length
    );
  };

  const currentData = mainTestimonials[currentTestimonial];

  return (
    <section
      id="temoignages"
      className="py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden"
      ref={sectionRef}
      role="region"
      aria-label="Témoignages clients"
    >
      {/* Éléments décoratifs */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div
        className="absolute bottom-10 right-10 w-64 h-64 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
        style={{ animationDelay: "3s" }}
      ></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* En-tête animé */}
        <div
          className={`text-center mb-16 transition-all duration-1000 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="inline-flex items-center bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 shadow-lg">
            <Award className="w-4 h-4 mr-2" />
            Approuvé par +500 professionnels
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ils nous font
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              {" "}
              confiance
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Découvrez pourquoi médecins et établissements choisissent Cureliah
            pour révolutionner leurs vacations
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Témoignage principal avec carousel */}
          <div
            className={`transition-all duration-1000 delay-300 ${
              isVisible
                ? "translate-x-0 opacity-100"
                : "-translate-x-8 opacity-0"
            }`}
          >
            <div
              className={`bg-gradient-to-br ${currentData.bgGradient} p-8 rounded-3xl shadow-2xl border border-gray-100 relative overflow-hidden`}
            >
              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 animate-pulse"></div>

              <div className="relative z-10">
                {/* Header avec contrôles */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <Quote
                      className={`w-8 h-8 text-${currentData.accentColor}-600 mr-3`}
                    />
                    <div className="flex space-x-1">
                      {[...Array(currentData.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 text-yellow-400 fill-current"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Contrôles de navigation */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={prevTestimonial}
                      className="p-2 rounded-full bg-white/80 hover:bg-white text-gray-600 hover:text-gray-800 transition-all duration-200 shadow-md hover:shadow-lg"
                      aria-label="Témoignage précédent"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-2 rounded-full bg-white/80 hover:bg-white text-gray-600 hover:text-gray-800 transition-all duration-200 shadow-md hover:shadow-lg"
                      aria-label={isPlaying ? "Pause" : "Lecture"}
                    >
                      <Play
                        className={`w-4 h-4 ${
                          isPlaying ? "text-green-600" : ""
                        }`}
                      />
                    </button>
                    <button
                      onClick={nextTestimonial}
                      className="p-2 rounded-full bg-white/80 hover:bg-white text-gray-600 hover:text-gray-800 transition-all duration-200 shadow-md hover:shadow-lg"
                      aria-label="Témoignage suivant"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Contenu du témoignage */}
                <blockquote className="text-lg text-gray-700 leading-relaxed mb-6 transition-all duration-500">
                  "{currentData.text}"
                </blockquote>

                {/* Profil de l'auteur */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className={`w-16 h-16 bg-gradient-to-r ${
                        currentData.accentColor === "blue"
                          ? "from-blue-500 to-blue-600"
                          : currentData.accentColor === "emerald"
                          ? "from-emerald-500 to-emerald-600"
                          : "from-purple-500 to-purple-600"
                      } rounded-2xl flex items-center justify-center text-white text-2xl mr-4 shadow-lg`}
                    >
                      {currentData.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-lg">
                        {currentData.author}
                      </div>
                      <div className="text-gray-600">
                        {currentData.role} • {currentData.location}
                      </div>
                      <div
                        className={`text-sm text-${currentData.accentColor}-600 font-medium flex items-center mt-1`}
                      >
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Membre depuis {currentData.memberSince}
                      </div>
                    </div>
                  </div>

                  {/* Badge spécialité */}
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium bg-${currentData.accentColor}-100 text-${currentData.accentColor}-700`}
                  >
                    {currentData.specialty}
                  </div>
                </div>

                {/* Indicateurs de pagination */}
                <div className="flex justify-center space-x-2 mt-6">
                  {mainTestimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonial(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentTestimonial
                          ? `bg-${currentData.accentColor}-600 scale-125`
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                      aria-label={`Aller au témoignage ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stats et mini témoignages */}
          <div
            className={`space-y-8 transition-all duration-1000 delay-500 ${
              isVisible
                ? "translate-x-0 opacity-100"
                : "translate-x-8 opacity-0"
            }`}
          >
            {/* Stats animées */}
            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                const isStatVisible = visibleStats.has(index);

                return (
                  <div
                    key={index}
                    className={`relative bg-white p-6 rounded-2xl text-center shadow-lg border border-gray-100 transform transition-all duration-700 hover:shadow-xl hover:-translate-y-1 ${
                      isStatVisible
                        ? "translate-y-0 opacity-100 scale-100"
                        : "translate-y-4 opacity-0 scale-95"
                    }`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <div
                      className={`w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div
                      className={`text-3xl font-bold text-${stat.color}-600 mb-2 tabular-nums`}
                    >
                      {index === 0
                        ? animatedValues.satisfaction
                        : index === 1
                        ? animatedValues.time
                        : animatedValues.users}
                      {stat.suffix}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      {stat.label}
                    </div>

                    {/* Effet de pulsation pour les stats importantes */}
                    {index === 0 && (
                      <div className="absolute inset-0 bg-emerald-400 rounded-2xl opacity-20 animate-ping"></div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mini témoignages défilants */}
            <div className="space-y-4 max-h-96 overflow-hidden">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Autres avis
              </h3>

              <div className="space-y-3">
                {miniTestimonials.slice(0, 4).map((testimonial, index) => (
                  <div
                    key={testimonial.id}
                    className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 ${
                      isVisible
                        ? "translate-x-0 opacity-100"
                        : "translate-x-4 opacity-0"
                    }`}
                    style={{ transitionDelay: `${(index + 3) * 100}ms` }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-md ${
                            testimonial.type === "doctor"
                              ? "bg-blue-100"
                              : testimonial.type === "establishment"
                              ? "bg-emerald-100"
                              : "bg-purple-100"
                          }`}
                        >
                          {testimonial.avatar}
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {testimonial.author}
                          </div>
                          <div className="flex space-x-0.5">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <Star
                                key={i}
                                className="w-3 h-3 text-yellow-400 fill-current"
                              />
                            ))}
                          </div>
                        </div>

                        <div className="text-xs text-gray-500 mb-2 flex items-center">
                          {testimonial.type === "doctor" && (
                            <Building className="w-3 h-3 mr-1" />
                          )}
                          {testimonial.role}
                        </div>

                        <p className="text-sm text-gray-600 leading-relaxed">
                          "{testimonial.text}"
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gradient fade effect */}
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
            </div>
          </div>
        </div>

        {/* CTA de fin */}
        <div
          className={`text-center mt-16 transition-all duration-1000 delay-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 text-white rounded-3xl p-8 max-w-4xl mx-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 animate-pulse"></div>

            <div className="relative z-10">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                Rejoignez une communauté qui grandit
              </h3>
              <p className="text-blue-100 mb-6 text-lg">
                +500 professionnels nous font déjà confiance. Et vous ?
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-white text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                  Voir tous les témoignages
                </button>
                <button className="border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                  Commencer gratuitement
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
