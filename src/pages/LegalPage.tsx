import { useState, useEffect, useRef } from "react";
import {
  Shield,
  Scale,
  Users,
  Lock,
  Cookie,
  FileText,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Info,
  Eye,
  Database,
  Server,
  UserCheck,
  Settings,
  Download,
  Trash2,
  Edit3
} from "lucide-react";

const LegalPage = () => {
  const [activeSection, setActiveSection] = useState("mentions");
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [isVisible, setIsVisible] = useState(false);
  const pageRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
    // Gestion du hash dans l'URL
    if (window.location.hash) {
      const section = window.location.hash.substring(1);
      if (sections.find(s => s.id === section)) {
        setActiveSection(section);
      }
    }
  }, []);

  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sections = [
    {
      id: "mentions",
      title: "Mentions légales",
      icon: Scale,
      color: "blue",
      description: "Informations légales et éditoriales"
    },
    {
      id: "cgv",
      title: "Conditions Générales de Vente",
      icon: FileText,
      color: "emerald",
      description: "Conditions commerciales et tarifaires"
    },
    {
      id: "cgu",
      title: "Conditions Générales d'Utilisation",
      icon: Users,
      color: "purple",
      description: "Règles d'utilisation de la plateforme"
    },
    {
      id: "confidentialite",
      title: "Politique de Confidentialité",
      icon: Lock,
      color: "red",
      description: "Protection de vos données personnelles"
    },
    {
      id: "rgpd",
      title: "RGPD",
      icon: Shield,
      color: "orange",
      description: "Vos droits sur vos données"
    },
    {
      id: "cookies",
      title: "Politique des Cookies",
      icon: Cookie,
      color: "pink",
      description: "Gestion des cookies et traceurs"
    }
  ];

  const renderMentionsLegales = () => (
    <div className="space-y-8">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <Scale className="w-6 h-6 text-medical-blue mr-2" />
          <h3 className="text-xl font-bold text-blue-900">Informations légales</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Éditeur du site</h4>
            <p><strong>Raison sociale :</strong> Cureliah SAS</p>
            <p><strong>Siège social :</strong> 123 Avenue de la République, 75011 Paris</p>
            <p><strong>SIRET :</strong> 123 456 789 00010</p>
            <p><strong>RCS :</strong> Paris B 123 456 789</p>
            <p><strong>Capital social :</strong> 50 000 €</p>
            <p><strong>TVA :</strong> FR12 123456789</p>
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Contact</h4>
            <p className="flex items-center mb-1">
              <Mail className="w-4 h-4 mr-2" />
              contact@cureliah.com
            </p>
            <p className="flex items-center mb-1">
              <Phone className="w-4 h-4 mr-2" />
              06 81 04 80 54
            </p>
            <p className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Paris, France
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Directeur de publication</h3>
        <p>M. Jean Dupont, Président de Cureliah SAS</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Hébergement</h3>
        <p><strong>Hébergeur :</strong> OVH SAS</p>
        <p><strong>Adresse :</strong> 2 rue Kellermann, 59100 Roubaix</p>
        <p><strong>Téléphone :</strong> 09 72 10 10 07</p>
        <p className="mt-2 text-sm text-gray-600">
          Hébergement certifié HDS (Hébergement de Données de Santé) pour garantir 
          la sécurité de vos informations médicales.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Propriété intellectuelle</h3>
        <p className="text-gray-700 leading-relaxed">
          Le site Cureliah et l'ensemble de son contenu (textes, images, vidéos, logos, etc.) 
          sont protégés par le droit de la propriété intellectuelle. Toute reproduction, 
          représentation, modification, publication, adaptation de tout ou partie des éléments 
          du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation 
          écrite préalable de Cureliah SAS.
        </p>
      </div>
    </div>
  );

  const renderCGV = () => (
    <div className="space-y-8">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <FileText className="w-6 h-6 text-emerald-600 mr-2" />
          <h3 className="text-xl font-bold text-emerald-900">Conditions Générales de Vente</h3>
        </div>
        <p className="text-emerald-700">
          Dernière mise à jour : 1er janvier 2025
        </p>
      </div>

      {[
        {
          id: "cgv-1",
          title: "Article 1 - Objet",
          content: "Les présentes Conditions Générales de Vente définissent les conditions dans lesquelles Cureliah SAS fournit ses services de mise en relation entre professionnels de santé et établissements de soins."
        },
        {
          id: "cgv-2", 
          title: "Article 2 - Services proposés",
          content: "Cureliah propose une plateforme numérique permettant aux médecins de publier leurs disponibilités pour des vacations médicales et aux établissements de santé de rechercher et réserver ces prestations."
        },
        {
          id: "cgv-3",
          title: "Article 3 - Tarification",
          content: "L'utilisation de la plateforme Cureliah est gratuite pour les médecins. Les établissements de santé acquittent une commission de 5% sur le montant des vacations réservées via la plateforme."
        },
        {
          id: "cgv-4",
          title: "Article 4 - Modalités de paiement",
          content: "Les paiements s'effectuent par virement bancaire ou carte bancaire. La facturation intervient après confirmation de la vacation par l'établissement."
        },
        {
          id: "cgv-5",
          title: "Article 5 - Annulation et remboursement",
          content: "Les annulations doivent être signalées au moins 48h à l'avance. Les remboursements sont traités sous 7 jours ouvrés selon les conditions définies dans nos CGV complètes."
        }
      ].map((item) => (
        <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleExpanded(item.id)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold text-gray-900">{item.title}</h3>
            {expandedItems.has(item.id) ? 
              <ChevronUp className="w-5 h-5 text-gray-500" /> : 
              <ChevronDown className="w-5 h-5 text-gray-500" />
            }
          </button>
          {expandedItems.has(item.id) && (
            <div className="px-6 pb-4 text-gray-700 leading-relaxed">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderCGU = () => (
    <div className="space-y-8">
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <Users className="w-6 h-6 text-purple-600 mr-2" />
          <h3 className="text-xl font-bold text-purple-900">Conditions Générales d'Utilisation</h3>
        </div>
        <p className="text-purple-700">
          En utilisant Cureliah, vous acceptez les présentes conditions d'utilisation.
        </p>
      </div>

      {[
        {
          id: "cgu-1",
          title: "Acceptation des conditions",
          content: "L'utilisation de la plateforme Cureliah implique l'acceptation pleine et entière des présentes Conditions Générales d'Utilisation."
        },
        {
          id: "cgu-2",
          title: "Inscription et compte utilisateur",
          content: "L'inscription nécessite la fourniture d'informations exactes et à jour. Chaque utilisateur est responsable de la confidentialité de ses identifiants."
        },
        {
          id: "cgu-3", 
          title: "Utilisation de la plateforme",
          content: "Les utilisateurs s'engagent à utiliser la plateforme conformément à sa destination et aux réglementations en vigueur, notamment en matière de santé publique."
        },
        {
          id: "cgu-4",
          title: "Obligations des médecins",
          content: "Les médecins s'engagent à maintenir leurs qualifications à jour et à respecter le code de déontologie médicale dans l'exercice de leurs fonctions."
        },
        {
          id: "cgu-5",
          title: "Obligations des établissements",
          content: "Les établissements s'engagent à fournir des informations exactes sur leurs besoins et à respecter les conditions de travail légales."
        }
      ].map((item) => (
        <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleExpanded(item.id)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold text-gray-900">{item.title}</h3>
            {expandedItems.has(item.id) ? 
              <ChevronUp className="w-5 h-5 text-gray-500" /> : 
              <ChevronDown className="w-5 h-5 text-gray-500" />
            }
          </button>
          {expandedItems.has(item.id) && (
            <div className="px-6 pb-4 text-gray-700 leading-relaxed">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderConfidentialite = () => (
    <div className="space-y-8">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <Lock className="w-6 h-6 text-red-600 mr-2" />
          <h3 className="text-xl font-bold text-red-900">Politique de Confidentialité</h3>
        </div>
        <p className="text-red-700">
          Nous attachons une importance particulière à la protection de vos données personnelles.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center mb-3">
            <Database className="w-5 h-5 text-medical-blue mr-2" />
            <h4 className="font-semibold text-gray-900">Données collectées</h4>
          </div>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Informations d'identification</li>
            <li>• Données de contact</li>
            <li>• Informations professionnelles</li>
            <li>• Données de navigation</li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center mb-3">
            <Eye className="w-5 h-5 text-emerald-600 mr-2" />
            <h4 className="font-semibold text-gray-900">Finalités</h4>
          </div>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Fourniture du service</li>
            <li>• Support client</li>
            <li>• Amélioration de la plateforme</li>
            <li>• Communication marketing</li>
          </ul>
        </div>
      </div>

      {[
        {
          id: "conf-1",
          title: "Base légale du traitement",
          content: "Le traitement de vos données personnelles repose sur l'exécution du contrat de service, votre consentement, et le respect de nos obligations légales."
        },
        {
          id: "conf-2",
          title: "Durée de conservation",
          content: "Vos données sont conservées pendant la durée nécessaire aux finalités pour lesquelles elles ont été collectées, conformément aux obligations légales."
        },
        {
          id: "conf-3",
          title: "Destinataires des données",
          content: "Vos données peuvent être partagées avec nos partenaires techniques, toujours dans le respect de la confidentialité et de la sécurité."
        }
      ].map((item) => (
        <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleExpanded(item.id)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold text-gray-900">{item.title}</h3>
            {expandedItems.has(item.id) ? 
              <ChevronUp className="w-5 h-5 text-gray-500" /> : 
              <ChevronDown className="w-5 h-5 text-gray-500" />
            }
          </button>
          {expandedItems.has(item.id) && (
            <div className="px-6 pb-4 text-gray-700 leading-relaxed">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderRGPD = () => (
    <div className="space-y-8">
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <Shield className="w-6 h-6 text-orange-600 mr-2" />
          <h3 className="text-xl font-bold text-orange-900">Vos droits RGPD</h3>
        </div>
        <p className="text-orange-700">
          Conformément au RGPD, vous disposez de droits sur vos données personnelles.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {[
          {
            icon: Eye,
            title: "Droit d'accès",
            description: "Obtenir une copie de vos données personnelles",
            color: "blue"
          },
          {
            icon: Edit3,
            title: "Droit de rectification", 
            description: "Corriger des données inexactes ou incomplètes",
            color: "emerald"
          },
          {
            icon: Trash2,
            title: "Droit à l'effacement",
            description: "Supprimer vos données dans certains cas",
            color: "red"
          },
          {
            icon: Settings,
            title: "Droit à la limitation",
            description: "Limiter le traitement de vos données",
            color: "purple"
          },
          {
            icon: Download,
            title: "Droit à la portabilité",
            description: "Récupérer vos données dans un format lisible",
            color: "pink"
          },
          {
            icon: UserCheck,
            title: "Droit d'opposition",
            description: "Vous opposer au traitement de vos données",
            color: "orange"
          }
        ].map((right, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-3">
              <div className={`w-10 h-10 bg-${right.color}-100 rounded-lg flex items-center justify-center mr-3`}>
                <right.icon className={`w-5 h-5 text-${right.color}-600`} />
              </div>
              <h4 className="font-semibold text-gray-900">{right.title}</h4>
            </div>
            <p className="text-sm text-gray-600">{right.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Comment exercer vos droits ?</h3>
        <div className="space-y-4">
          <div className="flex items-start">
            <Mail className="w-5 h-5 text-medical-blue mr-3 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Par email</p>
              <p className="text-gray-600">contact@cureliah.com</p>
            </div>
          </div>
          <div className="flex items-start">
            <MapPin className="w-5 h-5 text-emerald-600 mr-3 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Par courrier</p>
              <p className="text-gray-600">Cureliah - DPO<br />123 Avenue de la République<br />75011 Paris</p>
            </div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <Info className="w-4 h-4 inline mr-2" />
            Nous répondons à vos demandes dans un délai maximum de 30 jours.
          </p>
        </div>
      </div>
    </div>
  );

  const renderCookies = () => (
    <div className="space-y-8">
      <div className="bg-pink-50 border border-pink-200 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <Cookie className="w-6 h-6 text-pink-600 mr-2" />
          <h3 className="text-xl font-bold text-pink-900">Politique des Cookies</h3>
        </div>
        <p className="text-pink-700">
          Nous utilisons des cookies pour améliorer votre expérience sur notre plateforme.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {[
          {
            type: "Essentiels",
            description: "Nécessaires au fonctionnement du site",
            color: "emerald",
            required: true,
            examples: ["Session", "Sécurité", "Authentification"]
          },
          {
            type: "Fonctionnels", 
            description: "Améliorent l'expérience utilisateur",
            color: "blue",
            required: false,
            examples: ["Préférences", "Langue", "Localisation"]
          },
          {
            type: "Analytiques",
            description: "Nous aident à comprendre l'usage",
            color: "purple",
            required: false,
            examples: ["Google Analytics", "Statistiques", "Performance"]
          }
        ].map((category, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className={`font-semibold text-${category.color}-600`}>{category.type}</h4>
              {category.required && (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                  Obligatoire
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-3">{category.description}</p>
            <div className="space-y-1">
              {category.examples.map((example, i) => (
                <span key={i} className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded mr-2">
                  {example}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Gestion des cookies</h3>
        <div className="space-y-4">
          <p className="text-gray-700">
            Vous pouvez à tout moment modifier vos préférences de cookies via les paramètres 
            de votre navigateur ou en utilisant notre centre de préférences.
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-medical-blue text-white rounded-lg hover:bg-medical-blue-dark transition-colors">
              <Settings className="w-4 h-4 inline mr-2" />
              Gérer les préférences
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Tout accepter
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Tout refuser
            </button>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-800 mb-2">Important</h4>
            <p className="text-yellow-700 text-sm">
              Le refus de certains cookies peut affecter le bon fonctionnement de la plateforme 
              et limiter l'accès à certaines fonctionnalités.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "mentions": return renderMentionsLegales();
      case "cgv": return renderCGV();
      case "cgu": return renderCGU(); 
      case "confidentialite": return renderConfidentialite();
      case "rgpd": return renderRGPD();
      case "cookies": return renderCookies();
      default: return renderMentionsLegales();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50" ref={pageRef}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => window.history.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Retour
            </button>
            
            <h1 className="text-2xl font-bold text-gray-900">
              Informations Légales
            </h1>
            
            <button 
              onClick={scrollToTop}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Navigation latérale */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <nav className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h2 className="font-semibold text-gray-900 mb-4">Sections</h2>
                <ul className="space-y-2">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <li key={section.id}>
                        <button
                          onClick={() => {
                            setActiveSection(section.id);
                            window.history.replaceState(null, null, `#${section.id}`);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center ${
                            activeSection === section.id
                              ? `bg-${section.color}-50 text-${section.color}-700 border border-${section.color}-200`
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className={`w-4 h-4 mr-3 ${
                            activeSection === section.id ? `text-${section.color}-600` : 'text-gray-400'
                          }`} />
                          <div>
                            <div className="font-medium text-sm">{section.title}</div>
                            <div className="text-xs opacity-75">{section.description}</div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-3">
            <div className={`transition-all duration-500 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}>
              {renderContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Contact rapide */}
      <div className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-4">Une question sur nos conditions ?</h3>
            <p className="text-gray-300 mb-6">
              Notre équipe juridique est à votre disposition pour toute clarification.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:contact@cureliah.com"
                className="inline-flex items-center px-6 py-3 bg-medical-blue text-white rounded-lg hover:bg-medical-blue-dark transition-colors"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact juridique
              </a>
              <a 
                href="tel:0123456789"
                className="inline-flex items-center px-6 py-3 border border-gray-600 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Phone className="w-4 h-4 mr-2" />
                06 81 04 80 54
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;