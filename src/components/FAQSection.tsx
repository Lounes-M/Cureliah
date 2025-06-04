import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Minus,
  Search,
  DollarSign,
  Shield,
  Calendar,
  CreditCard,
  Building2,
  AlertCircle,
  Lock,
  X,
  HelpCircle,
  MessageCircle,
  Mail,
  Phone,
  ChevronDown,
  Filter,
  Star,
} from "lucide-react";

const FAQSection = () => {
  const [openFAQ, setOpenFAQ] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isVisible, setIsVisible] = useState(false);
  const [visibleItems, setVisibleItems] = useState(new Set());
  const [showAllCategories, setShowAllCategories] = useState(false);
  const sectionRef = useRef(null);

  const categories = [
    { id: "all", name: "Toutes", icon: HelpCircle, color: "gray" },
    { id: "pricing", name: "Tarifs", icon: DollarSign, color: "emerald" },
    { id: "security", name: "Sécurité", icon: Shield, color: "blue" },
    { id: "booking", name: "Réservations", icon: Calendar, color: "purple" },
    { id: "payment", name: "Paiements", icon: CreditCard, color: "orange" },
    {
      id: "establishment",
      name: "Établissements",
      icon: Building2,
      color: "teal",
    },
    { id: "support", name: "Support", icon: AlertCircle, color: "red" },
  ];

  const faqs = [
    {
      id: 1,
      category: "pricing",
      question: "Comment fonctionne l'abonnement médecin ?",
      answer:
        "L'abonnement médecin est de 49€/mois. Il vous donne accès à toutes les fonctionnalités : publication de créneaux illimitée, réception de demandes, messagerie, génération de contrats et facturation automatique. Aucune commission sur vos revenus.",
      tags: ["abonnement", "médecin", "tarif", "commission"],
      popular: true,
    },
    {
      id: 2,
      category: "security",
      question: "Comment la vérification RPPS fonctionne-t-elle ?",
      answer:
        "Lors de votre inscription, vous devez fournir votre numéro RPPS et uploader une copie de votre diplôme. Notre équipe vérifie ces informations auprès des registres officiels sous 24h. Cette validation garantit la sécurité pour tous.",
      tags: ["RPPS", "vérification", "sécurité", "inscription"],
      popular: true,
    },
    {
      id: 3,
      category: "booking",
      question: "Quels types de vacations puis-je proposer ?",
      answer:
        "Vous pouvez proposer tous types de vacations : consultations en présentiel, téléconsultations, gardes, remplacements, missions ponctuelles, interventions esthétiques, etc. Vous définissez vos spécialités et modes d'intervention.",
      tags: ["vacations", "consultations", "spécialités", "missions"],
      popular: false,
    },
    {
      id: 4,
      category: "payment",
      question: "Comment sont gérés les paiements ?",
      answer:
        "Les établissements paient directement sur la plateforme via Stripe. Vous recevez vos paiements sous 48h après validation de la mission. Les factures sont générées automatiquement avec toutes les mentions légales.",
      tags: ["paiement", "Stripe", "factures", "délai"],
      popular: true,
    },
    {
      id: 5,
      category: "establishment",
      question: "Y a-t-il des frais pour les établissements ?",
      answer:
        "Les établissements ne paient que les vacations réservées, sans abonnement. Ils peuvent également souscrire à un forfait entreprise pour des besoins récurrents avec tarifs préférentiels.",
      tags: ["établissement", "frais", "forfait", "entreprise"],
      popular: false,
    },
    {
      id: 6,
      category: "support",
      question: "Que se passe-t-il en cas d'annulation ?",
      answer:
        "Les conditions d'annulation sont définies dans nos CGU. Généralement, une annulation 24h avant est gratuite. En cas d'urgence médicale, des exceptions sont prévues. Un système de notation mutuel encourage le professionnalisme.",
      tags: ["annulation", "CGU", "urgence", "notation"],
      popular: false,
    },
    {
      id: 7,
      category: "security",
      question: "La plateforme est-elle sécurisée ?",
      answer:
        "Oui, nous utilisons un chiffrement SSL, respectons le RGPD et stockons les données de santé selon les normes HDS. Toutes les communications transitent par des serveurs sécurisés en France.",
      tags: ["sécurité", "SSL", "RGPD", "HDS", "données"],
      popular: true,
    },
    {
      id: 8,
      category: "pricing",
      question: "Puis-je annuler mon abonnement à tout moment ?",
      answer:
        "Oui, vous pouvez annuler votre abonnement médecin à tout moment depuis votre espace personnel. L'abonnement reste actif jusqu'à la fin de la période payée.",
      tags: ["annulation", "abonnement", "résiliation"],
      popular: false,
    },
    {
      id: 9,
      category: "booking",
      question: "Comment modifier ou annuler une vacation ?",
      answer:
        "Vous pouvez modifier ou annuler vos vacations directement depuis votre tableau de bord. Pour les modifications moins de 24h avant, contactez directement l'établissement via notre messagerie intégrée.",
      tags: ["modification", "vacation", "tableau de bord", "messagerie"],
      popular: false,
    },
    {
      id: 10,
      category: "payment",
      question: "Quand suis-je payé pour mes vacations ?",
      answer:
        "Le paiement est déclenché automatiquement 24h après la fin de votre vacation, une fois que l'établissement a confirmé sa réalisation. Les fonds arrivent sur votre compte sous 48h ouvrées.",
      tags: ["délai", "paiement", "vacation", "confirmation"],
      popular: true,
    },
  ];

  // Animation d'apparition
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);

            // Animer les éléments avec délai
            setTimeout(() => {
              filteredFAQs.forEach((_, index) => {
                setTimeout(() => {
                  setVisibleItems((prev) => new Set([...prev, index]));
                }, index * 100);
              });
            }, 300);
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

  // Filtrage des FAQs
  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === "all" || faq.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Questions populaires
  const popularFAQs = faqs.filter((faq) => faq.popular).slice(0, 3);

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSelectedCategory("all");
  };

  const getCategoryInfo = (categoryId) => {
    return categories.find((cat) => cat.id === categoryId);
  };

  return (
    <section
      id="faq"
      className="py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden"
      ref={sectionRef}
      role="region"
      aria-label="Questions fréquentes"
    >
      {/* Éléments décoratifs */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div
        className="absolute bottom-20 right-10 w-64 h-64 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* En-tête */}
        <div
          className={`text-center mb-16 transition-all duration-1000 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="inline-flex items-center bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 shadow-lg">
            <HelpCircle className="w-4 h-4 mr-2" />
            Support client premium
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Questions
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              {" "}
              fréquentes
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Trouvez rapidement les réponses à vos questions ou contactez notre
            équipe support
          </p>
        </div>

        {/* Questions populaires */}
        <div
          className={`mb-12 transition-all duration-1000 delay-200 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Star className="w-5 h-5 text-yellow-500 mr-2" />
            Questions populaires
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {popularFAQs.map((faq, index) => {
              const categoryInfo = getCategoryInfo(faq.category);
              const Icon = categoryInfo.icon;

              return (
                <button
                  key={faq.id}
                  onClick={() => {
                    setSelectedCategory(faq.category);
                    const faqIndex = filteredFAQs.findIndex(
                      (f) => f.id === faq.id
                    );
                    setOpenFAQ(faqIndex);
                  }}
                  className="bg-white p-4 rounded-xl border border-gray-200 text-left hover:shadow-lg hover:border-blue-300 transition-all duration-300 group"
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-8 h-8 bg-${categoryInfo.color}-100 text-${categoryInfo.color}-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm leading-tight group-hover:text-blue-600 transition-colors">
                        {faq.question}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div
          className={`mb-8 transition-all duration-1000 delay-300 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            {/* Recherche */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher dans les questions fréquentes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                aria-label="Rechercher dans les FAQ"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Effacer la recherche"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Filtres par catégorie */}
            <div className="flex items-center space-x-2 flex-wrap">
              <div className="flex items-center text-sm text-gray-600 mr-4">
                <Filter className="w-4 h-4 mr-2" />
                Filtrer par:
              </div>

              {categories
                .slice(0, showAllCategories ? categories.length : 4)
                .map((category) => {
                  const Icon = category.icon;
                  const isActive = selectedCategory === category.id;
                  const count =
                    category.id === "all"
                      ? faqs.length
                      : faqs.filter((faq) => faq.category === category.id)
                          .length;

                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? `bg-${category.color}-100 text-${category.color}-700 border-2 border-${category.color}-300`
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent"
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {category.name}
                      <span className="ml-2 bg-white/80 text-xs px-2 py-0.5 rounded-full">
                        {count}
                      </span>
                    </button>
                  );
                })}

              {categories.length > 4 && (
                <button
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className="flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {showAllCategories ? "Moins" : "Plus"}
                  <ChevronDown
                    className={`w-4 h-4 ml-1 transition-transform ${
                      showAllCategories ? "rotate-180" : ""
                    }`}
                  />
                </button>
              )}
            </div>

            {/* Résultats de recherche */}
            {searchTerm && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  {filteredFAQs.length} résultat
                  {filteredFAQs.length !== 1 ? "s" : ""} trouvé
                  {filteredFAQs.length !== 1 ? "s" : ""} pour "{searchTerm}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Liste des FAQs */}
        <div className="space-y-4 mb-16">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq, index) => {
              const categoryInfo = getCategoryInfo(faq.category);
              const Icon = categoryInfo.icon;
              const isOpen = openFAQ === index;
              const isItemVisible = visibleItems.has(index);

              return (
                <div
                  key={faq.id}
                  className={`bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 ${
                    isItemVisible
                      ? "translate-y-0 opacity-100"
                      : "translate-y-4 opacity-0"
                  } ${isOpen ? "ring-2 ring-blue-500 ring-opacity-20" : ""}`}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <button
                    className="w-full px-6 py-5 text-left flex items-center justify-between focus:outline-none focus:bg-gray-50 transition-colors duration-200"
                    onClick={() => toggleFAQ(index)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${faq.id}`}
                  >
                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                      <div
                        className={`w-10 h-10 bg-${categoryInfo.color}-100 text-${categoryInfo.color}-600 rounded-xl flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-gray-900 text-lg">
                            {faq.question}
                          </span>
                          {faq.popular && (
                            <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full bg-${categoryInfo.color}-100 text-${categoryInfo.color}-700`}
                          >
                            {categoryInfo.name}
                          </span>
                          {faq.tags.slice(0, 2).map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`flex-shrink-0 ml-4 transform transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full bg-${categoryInfo.color}-100 flex items-center justify-center`}
                      >
                        {isOpen ? (
                          <Minus
                            className={`w-4 h-4 text-${categoryInfo.color}-600`}
                          />
                        ) : (
                          <Plus
                            className={`w-4 h-4 text-${categoryInfo.color}-600`}
                          />
                        )}
                      </div>
                    </div>
                  </button>

                  <div
                    id={`faq-answer-${faq.id}`}
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${
                      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-6 pb-6">
                      <div className="pl-14 pt-2 border-t border-gray-100">
                        <p className="text-gray-600 leading-relaxed mt-4">
                          {faq.answer}
                        </p>

                        {/* Tags complets */}
                        <div className="flex flex-wrap gap-2 mt-4">
                          {faq.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                              onClick={() => setSearchTerm(tag)}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucune question trouvée
              </h3>
              <p className="text-gray-600 mb-4">
                Essayez de modifier vos critères de recherche ou parcourez
                toutes les catégories.
              </p>
              <button
                onClick={clearSearch}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Effacer les filtres
              </button>
            </div>
          )}
        </div>

        {/* Section contact améliorée */}
        <div
          className={`transition-all duration-1000 delay-500 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 rounded-3xl p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 animate-pulse"></div>

            <div className="relative z-10">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Vous ne trouvez pas votre réponse ?
              </h3>
              <p className="text-blue-100 mb-8 text-lg">
                Notre équipe support est disponible 7j/7 pour vous accompagner
              </p>

              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/20 transition-colors duration-300">
                  <MessageCircle className="w-8 h-8 text-white mx-auto mb-3" />
                  <h4 className="font-semibold text-white mb-2">
                    Chat en direct
                  </h4>
                  <p className="text-blue-100 text-sm mb-4">
                    Réponse immédiate 9h-18h
                  </p>
                  <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                    Démarrer
                  </button>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/20 transition-colors duration-300">
                  <Mail className="w-8 h-8 text-white mx-auto mb-3" />
                  <h4 className="font-semibold text-white mb-2">Email</h4>
                  <p className="text-blue-100 text-sm mb-4">
                    Réponse sous 2h ouvrées
                  </p>
                  <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                    Écrire
                  </button>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/20 transition-colors duration-300">
                  <Phone className="w-8 h-8 text-white mx-auto mb-3" />
                  <h4 className="font-semibold text-white mb-2">Téléphone</h4>
                  <p className="text-blue-100 text-sm mb-4">
                    Support prioritaire
                  </p>
                  <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                    Appeler
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
