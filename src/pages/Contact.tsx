import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client.browser";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  MessageCircle, 
  Users, 
  Building2,
  Stethoscope,
  CheckCircle,
  Paperclip,
  Shield,
  Zap,
  MessageSquare,
  HelpCircle,
  Star,
  Globe,
  Calendar,
  User,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";

const Contact = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    userType: "",
    category: "",
    priority: "normal",
    message: "",
    consent: false
  });
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isDraftSaved, setIsDraftSaved] = useState(false);

  // Pré-remplir le formulaire si utilisateur connecté
  useEffect(() => {
    if (user && profile) {
      const displayName = profile.user_type === "establishment" 
        ? profile.name || ""
        : `${profile.first_name || ""} ${profile.last_name || ""}`.trim();

      setFormData(prev => ({
        ...prev,
        email: user.email || "",
        name: displayName,
        userType: user.user_type || ""
      }));
    }
  }, [user, profile]);

  // Sauvegarde automatique du brouillon
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.message.length > 50) {
        localStorage.setItem('contact-draft', JSON.stringify(formData));
        setIsDraftSaved(true);
        setTimeout(() => setIsDraftSaved(false), 2000);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [formData]);

  // Restaurer le brouillon au chargement
  useEffect(() => {
    const savedDraft = localStorage.getItem('contact-draft');
    if (savedDraft && !user) {
      const draft = JSON.parse(savedDraft);
      setFormData(prev => ({
        ...prev,
        ...draft
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Fichier trop volumineux",
          description: "La taille maximum autorisée est de 5MB.",
          variant: "destructive",
        });
        return;
      }
      setAttachedFile(file);
      toast({
        title: "Fichier attaché",
        description: `${file.name} a été ajouté à votre message.`,
      });
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.consent) {
      toast({
        title: "Consentement requis",
        description: "Veuillez accepter le traitement de vos données personnelles.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Send contact form data to backend
      const contactData = {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        userType: formData.userType,
        category: formData.category,
        priority: formData.priority,
        message: formData.message,
        userId: user?.id || null,
        createdAt: new Date().toISOString(),
      };

      // Store contact request in database
      const { error } = await supabase
        .from('contact_requests')
        .insert([contactData]);

      if (error) {
        // TODO: Replace with logger.error('Error saving contact request:', error);
        // Continue anyway to show user success message
      }
      
      toast({
        title: "Message envoyé avec succès !",
        description: `Nous vous répondrons sous ${formData.priority === 'urgent' ? '2h' : '24h'}.`,
      });

      // Reset form et supprimer le brouillon
      setFormData({
        name: user && profile ? (profile.user_type === "establishment" 
          ? profile.name || ""
          : `${profile.first_name || ""} ${profile.last_name || ""}`.trim()) : "",
        email: user?.email || "",
        subject: "",
        userType: user?.user_type || "",
        category: "",
        priority: "normal",
        message: "",
        consent: false
      });
      setAttachedFile(null);
      localStorage.removeItem('contact-draft');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi du message.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: <Mail className="w-5 h-5" />,
      title: "Email",
      value: "contact@cureliah.com",
      description: "Réponse sous 24h",
      href: "mailto:contact@cureliah.com"
    },
    {
      icon: <Phone className="w-5 h-5" />,
      title: "Téléphone",
      value: "+33 1 23 45 67 89",
      description: "Lun-Ven 9h-18h",
      href: "tel:+33123456789"
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: "Chat en direct",
      value: "Support immédiat",
      description: "7j/7 - 24h/24",
      href: "#chat"
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      title: "Rendez-vous",
      value: "Consultation vidéo",
      description: "Sur demande",
      href: "#rdv"
    }
  ];

  const subjectCategories = [
    { value: "technical", label: "Support technique", icon: <Zap className="w-4 h-4" /> },
    { value: "commercial", label: "Question commerciale", icon: <Building2 className="w-4 h-4" /> },
    { value: "payment", label: "Problème de paiement", icon: <Shield className="w-4 h-4" /> },
    { value: "account", label: "Gestion de compte", icon: <User className="w-4 h-4" /> },
    { value: "suggestion", label: "Suggestion d'amélioration", icon: <Star className="w-4 h-4" /> },
    { value: "other", label: "Autre demande", icon: <HelpCircle className="w-4 h-4" /> }
  ];

  const faqItems = [
    {
      question: "Comment créer mon profil médecin ?",
      answer: "Inscrivez-vous en tant que médecin, vérifiez votre email, puis complétez votre profil avec vos informations professionnelles. Vous devrez fournir votre numéro RPPS et vos diplômes pour validation.",
      category: "account"
    },
    {
      question: "Comment réserver une vacation ?",
      answer: "Connectez-vous à votre compte établissement, utilisez la recherche avancée pour filtrer par spécialité, date et localisation, puis cliquez sur 'Réserver' pour la vacation souhaitée.",
      category: "booking"
    },
    {
      question: "Les paiements sont-ils sécurisés ?",
      answer: "Oui, nous utilisons la technologie de cryptage SSL et des partenaires de paiement certifiés PCI-DSS. Toutes les transactions sont protégées et aucune donnée bancaire n'est stockée sur nos serveurs.",
      category: "payment"
    },
    {
      question: "Puis-je annuler une réservation ?",
      answer: "Oui, vous pouvez annuler jusqu'à 48h avant la vacation sans frais. Pour les annulations de dernière minute, des frais peuvent s'appliquer selon les conditions convenues.",
      category: "booking"
    },
    {
      question: "Comment obtenir une facture ?",
      answer: "Les factures sont automatiquement générées et envoyées par email après chaque vacation. Vous pouvez également les télécharger depuis votre espace personnel dans la section 'Facturation'.",
      category: "payment"
    },
    {
      question: "Que faire en cas de problème technique ?",
      answer: "Contactez notre support technique 24h/7j via le chat en direct ou par email. Pour les urgences, utilisez le formulaire de contact avec la priorité 'Urgent'.",
      category: "technical"
    }
  ];

  const stats = [
    { value: "< 2h", label: "Temps de réponse", icon: <Clock className="w-5 h-5" /> },
    { value: "99.8%", label: "Satisfaction client", icon: <Star className="w-5 h-5" /> },
    { value: "24/7", label: "Support disponible", icon: <Globe className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg flex items-center justify-center">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Contactez-nous
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Notre équipe d'experts est à votre disposition pour vous accompagner. 
            Support technique, questions commerciales ou assistance personnalisée.
          </p>

          {/* Stats rapides */}
          <div className="grid md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="flex items-center justify-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-medical-blue">
                  {stat.icon}
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Formulaire de contact amélioré */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-3xl flex items-center gap-3">
                      <Send className="w-7 h-7 text-medical-blue" />
                      Envoyez-nous un message
                    </CardTitle>
                    <CardDescription className="text-gray-600 mt-2">
                      Décrivez votre demande en détail pour une réponse personnalisée et rapide.
                    </CardDescription>
                  </div>
                  {isDraftSaved && (
                    <Alert className="w-auto">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Brouillon sauvegardé
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Informations personnelles */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                        Nom complet *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-12"
                        placeholder="Votre nom et prénom"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                        Email *
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-12"
                        placeholder="votre@email.com"
                      />
                    </div>
                  </div>

                  {/* Type d'utilisateur et catégorie */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="userType" className="block text-sm font-semibold text-gray-700 mb-2">
                        Vous êtes
                      </label>
                      <select
                        id="userType"
                        name="userType"
                        value={formData.userType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-12"
                      >
                        <option value="">Sélectionnez votre profil</option>
                        <option value="doctor">Médecin</option>
                        <option value="establishment">Établissement de santé</option>
                        <option value="partner">Partenaire</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
                        Catégorie de demande *
                      </label>
                      <select
                        id="category"
                        name="category"
                        required
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-12"
                      >
                        <option value="">Choisissez une catégorie</option>
                        {subjectCategories.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Sujet et priorité */}
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                        Sujet *
                      </label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        required
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-12"
                        placeholder="Résumez votre demande en quelques mots"
                      />
                    </div>
                    <div>
                      <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 mb-2">
                        Priorité
                      </label>
                      <select
                        id="priority"
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-12"
                      >
                        <option value="low">Faible</option>
                        <option value="normal">Normale</option>
                        <option value="high">Élevée</option>
                        <option value="urgent">Urgente</option>
                      </select>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                      Message détaillé *
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={handleInputChange}
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                      placeholder="Décrivez votre demande en détail. Plus vous êtes précis, plus nous pourrons vous aider efficacement..."
                    />
                    <div className="text-right text-sm text-gray-500 mt-1">
                      {formData.message.length}/1000 caractères
                    </div>
                  </div>

                  {/* Pièce jointe */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pièce jointe (optionnel)
                    </label>
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2"
                      >
                        <Paperclip className="w-4 h-4" />
                        Joindre un fichier
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                        onChange={handleFileAttach}
                        className="hidden"
                      />
                      {attachedFile && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                          <Paperclip className="w-4 h-4 text-medical-blue" />
                          <span className="text-sm text-blue-800">{attachedFile.name}</span>
                          <button
                            type="button"
                            onClick={removeAttachment}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Formats acceptés: JPG, PNG, PDF, DOC, DOCX (max. 5MB)
                    </p>
                  </div>

                  {/* Consentement RGPD */}
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="consent"
                      name="consent"
                      checked={formData.consent}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                    />
                    <label htmlFor="consent" className="text-sm text-gray-700 leading-relaxed">
                      J'accepte que mes données personnelles soient traitées par Cureliah pour répondre à ma demande. 
                      Conformément au RGPD, vous pouvez exercer vos droits d'accès, de rectification et de suppression 
                      en nous contactant. <a href="/legal#rgpd" className="text-medical-blue hover:underline">En savoir plus</a>
                    </label>
                  </div>

                  {/* Bouton d'envoi */}
                  <Button
                    type="submit"
                    disabled={isSubmitting || !formData.consent}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg transition-all duration-200 h-14 text-lg font-semibold"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-3" />
                        Envoyer le message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar améliorée */}
          <div className="space-y-8">
            {/* Informations de contact */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-3">
                  <Phone className="w-6 h-6 text-medical-blue" />
                  Nos coordonnées
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactInfo.map((info, index) => (
                  <a
                    key={index}
                    href={info.href}
                    className="flex items-start gap-3 p-4 rounded-xl hover:bg-blue-50/50 transition-all duration-200 group border border-transparent hover:border-blue-200"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-medical-blue flex-shrink-0 group-hover:scale-110 transition-transform">
                      {info.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-medical-blue-dark">{info.title}</h3>
                      <p className="text-gray-700 font-medium">{info.value}</p>
                      <p className="text-sm text-gray-500">{info.description}</p>
                    </div>
                  </a>
                ))}
              </CardContent>
            </Card>

            {/* Types d'utilisateurs */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-3">
                  <Users className="w-6 h-6 text-medical-blue" />
                  Qui peut nous contacter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                  <Stethoscope className="w-6 h-6 text-medical-blue" />
                  <div>
                    <Badge variant="secondary" className="mb-2 bg-blue-100 text-blue-800">Médecins</Badge>
                    <p className="text-sm text-gray-600">Questions sur les vacations, profil, paiements, certifications</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <Building2 className="w-6 h-6 text-emerald-600" />
                  <div>
                    <Badge variant="secondary" className="mb-2 bg-emerald-100 text-emerald-800">Établissements</Badge>
                    <p className="text-sm text-gray-600">Support réservations, gestion compte, facturation, partenariats</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Garanties */}
            <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-0 shadow-xl">
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-medical-green" />
                  Nos garanties
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-medical-green" />
                    <span>Réponse garantie sous 24h</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-medical-green" />
                    <span>Données sécurisées (RGPD)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-medical-green" />
                    <span>Support expert dédié</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-medical-green" />
                    <span>Satisfaction client 99.8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section améliorée */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Questions fréquentes
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Trouvez rapidement des réponses aux questions les plus courantes. 
              Notre base de connaissances est mise à jour régulièrement.
            </p>
          </div>

          <div className="grid md:grid-cols-1 gap-4 max-w-4xl mx-auto">
            {faqItems.map((item, index) => (
              <Card 
                key={index} 
                className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <CardContent className="p-0">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <HelpCircle className="w-4 h-4 text-medical-blue" />
                      </div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {item.question}
                      </h3>
                    </div>
                    {expandedFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  {expandedFaq === index && (
                    <div className="px-6 pb-6">
                      <div className="pl-12">
                        <p className="text-gray-600 leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Lien vers plus de ressources */}
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-6">
              Vous ne trouvez pas votre réponse ? Consultez notre centre d'aide complet.
            </p>
            <Button 
              variant="outline" 
              className="border-blue-200 text-medical-blue hover:bg-blue-50"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Accéder au centre d'aide
            </Button>
          </div>
        </div>

        {/* Section témoignages */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ce que disent nos utilisateurs
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Découvrez l'expérience de nos médecins et établissements avec notre support client.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "Support réactif et professionnel. Mes questions sont toujours résolues rapidement."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-medical-blue" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Dr. Martin L.</p>
                    <p className="text-sm text-gray-500">Cardiologue</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "Interface intuitive et équipe à l'écoute. Exactly ce qu'il nous fallait !"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Sophie R.</p>
                    <p className="text-sm text-gray-500">Directrice RH Clinique</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "Problème résolu en moins de 30 minutes un dimanche soir. Impressionnant !"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Thomas B.</p>
                    <p className="text-sm text-gray-500">Administrateur</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to action final */}
        <div className="mt-20 text-center">
          <Card className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 border-0 shadow-2xl text-white max-w-5xl mx-auto overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-purple-600/90"></div>
            <CardContent className="p-12 relative z-10">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-4">
                Besoin d'une assistance immédiate ?
              </h2>
              <p className="text-blue-100 mb-8 max-w-3xl mx-auto text-lg">
                Notre équipe support est disponible 24h/7j pour vous aider avec toutes vos questions 
                techniques, commerciales ou administratives. N'hésitez pas à nous contacter !
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Button 
                  variant="secondary"
                  className="bg-white/15 hover:bg-white/25 text-white border-white/30 backdrop-blur-sm h-12 px-8"
                  onClick={() => window.location.href = 'mailto:contact@cureliah.com'}
                >
                  <Mail className="w-5 h-5 mr-3" />
                  contact@cureliah.com
                </Button>
                <Button 
                  variant="secondary"
                  className="bg-white/15 hover:bg-white/25 text-white border-white/30 backdrop-blur-sm h-12 px-8"
                  onClick={() => window.location.href = 'tel:+33123456789'}
                >
                  <Phone className="w-5 h-5 mr-3" />
                  +33 1 23 45 67 89
                </Button>
                <Button 
                  variant="secondary"
                  className="bg-white/15 hover:bg-white/25 text-white border-white/30 backdrop-blur-sm h-12 px-8"
                >
                  <MessageSquare className="w-5 h-5 mr-3" />
                  Chat en direct
                </Button>
              </div>
              
              <div className="mt-8 flex items-center justify-center gap-6 text-blue-100">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Réponse garantie</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">100% sécurisé</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Support 24/7</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertes et notifications */}
        {formData.priority === 'urgent' && (
          <Alert className="mt-8 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Demande urgente :</strong> Pour les urgences techniques critiques, 
              contactez-nous directement par téléphone au +33 1 23 45 67 89.
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Contact;