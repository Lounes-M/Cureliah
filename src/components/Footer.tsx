import { useState, useEffect, useRef } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  ArrowRight,
  Heart,
  Shield,
  Award,
  Users,
  TrendingUp,
  CheckCircle,
  ExternalLink,
  Send,
  Star,
  Clock,
} from "lucide-react";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const [currentYear] = useState(new Date().getFullYear());
  const footerRef = useRef(null);

  // Animation d'apparition
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);

            // Animer les sections avec délai
            const sections = [
              "logo",
              "newsletter",
              "links",
              "legal",
              "stats",
              "contact",
            ];
            sections.forEach((section, index) => {
              setTimeout(() => {
                setVisibleSections((prev) => new Set([...prev, section]));
              }, index * 150);
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleNewsletterSubmit = () => {
    if (email) {
      setIsSubscribed(true);
      setEmail("");
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  const socialLinks = [
    {
      icon: Twitter,
      href: "#",
      label: "Twitter",
      color: "hover:text-blue-400",
    },
    {
      icon: Linkedin,
      href: "#",
      label: "LinkedIn",
      color: "hover:text-blue-500",
    },
    {
      icon: Facebook,
      href: "#",
      label: "Facebook",
      color: "hover:text-blue-600",
    },
    {
      icon: Instagram,
      href: "#",
      label: "Instagram",
      color: "hover:text-pink-500",
    },
  ];

  const quickLinks = [
    { name: "Fonctionnement", href: "#fonctionnement" },
    { name: "Avantages", href: "#avantages" },
    { name: "Témoignages", href: "#temoignages" },
    { name: "FAQ", href: "#faq" },
    { name: "Espace Médecin", href: "/medecin" },
    { name: "Espace Établissement", href: "/etablissement" },
  ];

  const legalLinks = [
    { name: "Mentions légales", href: "/mentions-legales" },
    { name: "CGV", href: "/cgv" },
    { name: "CGU", href: "/cgu" },
    { name: "Confidentialité", href: "/confidentialite" },
    { name: "RGPD", href: "/rgpd" },
    { name: "Cookies", href: "/cookies" },
  ];

  const stats = [
    { value: "500+", label: "Médecins actifs", icon: Users },
    { value: "98%", label: "Satisfaction", icon: Star },
    { value: "2min", label: "Temps moyen", icon: Clock },
  ];

  const certifications = [
    { name: "HDS", description: "Hébergement de Données de Santé" },
    { name: "RGPD", description: "Conforme RGPD" },
    { name: "ISO 27001", description: "Sécurité informatique" },
  ];

  return (
    <footer
      className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden"
      ref={footerRef}
      role="contentinfo"
    >
      {/* Éléments décoratifs */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600"></div>
      <div className="absolute top-10 left-10 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-10"></div>
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-emerald-600 rounded-full mix-blend-multiply filter blur-xl opacity-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        {/* Section principale */}
        <div className="grid lg:grid-cols-4 gap-12 mb-12">
          {/* Logo et description */}
          <div
            className={`lg:col-span-2 transition-all duration-1000 ${
              visibleSections.has("logo")
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          >
            <div className="flex items-center space-x-2 mb-6">
              <img
                src="/logo.png"
                alt="Cureliah"
                style={{ height: "200px" }}
                className="w-auto object-contain"
              />
            </div>

            <p className="text-gray-300 mb-6 leading-relaxed text-lg">
              La plateforme qui révolutionne les vacations médicales en France.
              Connectons les médecins et les établissements de santé pour un
              système plus efficace et moderne.
            </p>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="text-center p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-blue-500 transition-all duration-300 group"
                  >
                    <Icon className="w-6 h-6 text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-xl font-bold text-white">
                      {stat.value}
                    </div>
                    <div className="text-xs text-gray-400">{stat.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Réseaux sociaux */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm">Suivez-nous:</span>
              <div className="flex space-x-3">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={index}
                      href={social.href}
                      aria-label={social.label}
                      className={`w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 ${social.color} transition-all duration-300 hover:scale-110 hover:bg-gray-700`}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div
            className={`transition-all duration-1000 delay-200 ${
              visibleSections.has("newsletter")
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          >
            <h3 className="font-bold text-xl mb-6 flex items-center">
              <Mail className="w-5 h-5 mr-2 text-blue-400" />
              Newsletter
            </h3>

            <p className="text-gray-300 mb-6 leading-relaxed">
              Recevez les dernières actualités et conseils pour optimiser vos
              vacations médicales.
            </p>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre adresse email"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-200"
                />
                <button
                  onClick={handleNewsletterSubmit}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white p-2 rounded-lg hover:from-blue-700 hover:to-emerald-700 transition-all duration-200 group"
                  aria-label="S'abonner à la newsletter"
                >
                  <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {isSubscribed && (
                <div className="flex items-center text-emerald-400 text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Merci pour votre inscription !
                </div>
              )}
            </div>

            {/* Certifications */}
            <div className="mt-8">
              <h4 className="font-semibold text-gray-300 mb-4 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Certifications
              </h4>
              <div className="space-y-2">
                {certifications.map((cert, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <Award className="w-4 h-4 text-emerald-400 mr-2" />
                    <span className="text-white font-medium">{cert.name}</span>
                    <span className="text-gray-400 ml-2">
                      - {cert.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Liens rapides */}
          <div
            className={`transition-all duration-1000 delay-300 ${
              visibleSections.has("links")
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          >
            <h3 className="font-bold text-xl mb-6 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-emerald-400" />
              Navigation
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center group"
                  >
                    <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
                    <span className="group-hover:translate-x-1 transition-transform duration-200">
                      {link.name}
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            {/* Support */}
            <div className="mt-8 p-4 bg-gradient-to-r from-blue-900/50 to-emerald-900/50 rounded-xl border border-gray-700">
              <h4 className="font-semibold text-white mb-2 flex items-center">
                <Heart className="w-4 h-4 mr-2 text-red-400" />
                Support 24/7
              </h4>
              <p className="text-gray-300 text-sm mb-3">
                Notre équipe est là pour vous accompagner
              </p>
              <a
                href="#contact"
                className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center transition-colors"
              >
                Nous contacter
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          </div>
        </div>

        {/* Section légal */}
        <div
          className={`mb-12 transition-all duration-1000 delay-400 ${
            visibleSections.has("legal")
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
        >
          <h3 className="font-bold text-xl mb-6 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-purple-400" />
            Informations légales
          </h3>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            {legalLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="text-gray-400 hover:text-white transition-colors duration-200 text-sm hover:underline"
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div
          className={`border-t border-gray-700 pt-8 mb-8 transition-all duration-1000 delay-500 ${
            visibleSections.has("contact")
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
        >
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-blue-500 transition-all duration-300">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-gray-400 text-xs">Email</div>
                <a
                  href="mailto:contact@cureliah.fr"
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  contact@cureliah.fr
                </a>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-emerald-500 transition-all duration-300">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-gray-400 text-xs">Téléphone</div>
                <a
                  href="tel:0123456789"
                  className="text-white hover:text-emerald-400 transition-colors"
                >
                  01 23 45 67 89
                </a>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-purple-500 transition-all duration-300">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-gray-400 text-xs">Adresse</div>
                <span className="text-white">Paris, France</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright et mentions finales */}
        <div
          className={`border-t border-gray-700 pt-8 transition-all duration-1000 delay-600 ${
            visibleSections.has("stats")
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
              <p className="text-gray-400 text-sm">
                © {currentYear} Cureliah. Tous droits réservés.
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center">
                  <Shield className="w-3 h-3 mr-1" />
                  Conforme HDS
                </span>
                <span className="flex items-center">
                  <Shield className="w-3 h-3 mr-1" />
                  Conforme RGPD
                </span>
                <span className="flex items-center">
                  <Heart className="w-3 h-3 mr-1 text-red-400" />
                  Made in France
                </span>
              </div>
            </div>

            {/* Version et statut */}
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>v2.1.0</span>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                <span>Tous systèmes opérationnels</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
