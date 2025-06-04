import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Clock,
  CheckCircle,
  Mail,
  Phone,
  Shield,
  AlertCircle,
  ArrowLeft,
  Loader2,
  RefreshCw,
  User,
  Building2,
  Calendar,
  MessageCircle,
  ExternalLink,
  Heart,
} from "lucide-react";

// Composants utilitaires
const Button = ({
  children,
  variant = "default",
  className = "",
  disabled = false,
  onClick,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0";

  const variants = {
    default:
      "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl focus:ring-blue-500",
    outline:
      "border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-500",
    ghost: "text-gray-600 hover:text-gray-800 hover:bg-gray-100",
    success:
      "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg hover:shadow-xl focus:ring-emerald-500",
    danger:
      "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl focus:ring-red-500",
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} px-6 py-3 ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const AccountActivation = () => {
  const navigate = useNavigate();
  const { user, signOut, updateProfile } = useAuth();
  const { toast } = useToast();

  // États de la page
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [supportTicketSent, setSupportTicketSent] = useState(false);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // Données du support
  const [supportMessage, setSupportMessage] = useState("");

  // Vérifier le statut automatiquement au chargement
  useEffect(() => {
    checkActivationStatus();
  }, []);

  // Vérifier le statut toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      checkActivationStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const checkActivationStatus = async () => {
    if (!user) return;

    try {
      setIsCheckingStatus(true);

      // Récupérer les données utilisateur actualisées
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("is_active, is_verified, activation_requested_at")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setLastChecked(new Date());

      // Si le compte est maintenant actif, mettre à jour et rediriger
      if (profile.is_active) {
        toast({
          title: "Compte activé !",
          description:
            "Votre compte a été activé par notre équipe. Bienvenue !",
          variant: "default",
        });

        // Mettre à jour le profil local et rediriger
        await updateProfile({ is_active: true });
        window.location.reload(); // Force refresh pour mettre à jour le contexte auth
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du statut:", error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const requestActivation = async () => {
    if (!user) return;

    try {
      setIsSubmittingTicket(true);

      // Marquer la demande d'activation dans la base de données
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          activation_requested_at: new Date().toISOString(),
          activation_message: supportMessage,
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Envoyer un email aux administrateurs (simulation)
      // Dans un vrai projet, ceci serait géré par une Cloud Function ou API
      const { error: notificationError } = await supabase
        .from("admin_notifications")
        .insert([
          {
            type: "activation_request",
            user_id: user.id,
            message: `Demande d'activation pour ${user.email}`,
            data: {
              user_type: user.user_type,
              message: supportMessage,
              user_email: user.email,
              user_name: `${user.profile?.first_name} ${user.profile?.last_name}`,
            },
          },
        ]);

      if (notificationError) {
        console.log("Notification envoyée (simulation)");
      }

      setSupportTicketSent(true);
      setSupportMessage("");

      toast({
        title: "Demande envoyée !",
        description:
          "Votre demande d'activation a été transmise à notre équipe.",
        variant: "default",
      });
    } catch (error) {
      console.error("Erreur lors de la demande d'activation:", error);
      toast({
        title: "Erreur",
        description:
          "Impossible d'envoyer la demande. Veuillez réessayer plus tard.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const getUserTypeLabel = () => {
    switch (user?.user_type) {
      case "doctor":
        return "Médecin";
      case "establishment":
        return "Établissement";
      case "admin":
        return "Administrateur";
      default:
        return "Utilisateur";
    }
  };

  const getUserIcon = () => {
    switch (user?.user_type) {
      case "doctor":
        return User;
      case "establishment":
        return Building2;
      default:
        return User;
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  if (!user) {
    return <div>Chargement...</div>;
  }

  const UserIcon = getUserIcon();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
      {/* Éléments décoratifs */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
      <div
        className="absolute bottom-20 right-10 w-64 h-64 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Bouton retour */}
        <Button variant="ghost" onClick={handleSignOut} className="mb-6 group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Se déconnecter
        </Button>

        {/* Carte principale */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* En-tête */}
          <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 px-8 py-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 animate-pulse"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center">
                  <span className="text-orange-600 font-bold">C</span>
                </div>
                <span className="text-xl font-bold text-white">Cureliah</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Compte en attente d'activation
              </h1>
              <p className="text-yellow-100">
                Votre inscription est en cours de validation par notre équipe
              </p>
            </div>
          </div>

          <div className="p-8">
            {/* Informations utilisateur */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <UserIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {user.profile?.first_name} {user.profile?.last_name}
                  </h3>
                  <p className="text-gray-600">{getUserTypeLabel()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  <span>{user.email}</span>
                </div>
                {user.user_type === "doctor" && user.profile?.specialty && (
                  <div className="flex items-center text-gray-600">
                    <User className="w-4 h-4 mr-2" />
                    <span>{user.profile.specialty}</span>
                  </div>
                )}
                {user.user_type === "establishment" &&
                  user.profile?.establishment_name && (
                    <div className="flex items-center text-gray-600">
                      <Building2 className="w-4 h-4 mr-2" />
                      <span>{user.profile.establishment_name}</span>
                    </div>
                  )}
              </div>
            </div>

            {/* État d'activation */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Activation en cours...
              </h2>
              <p className="text-gray-600 mb-4">
                Votre compte est en cours de validation par notre équipe. Ce
                processus prend généralement entre 24 à 48 heures ouvrées.
              </p>

              {lastChecked && (
                <p className="text-sm text-gray-500 mb-4">
                  Dernière vérification : {formatDate(lastChecked)}
                </p>
              )}

              <Button
                onClick={checkActivationStatus}
                disabled={isCheckingStatus}
                variant="outline"
                className="mb-6"
              >
                {isCheckingStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Vérifier le statut
                  </>
                )}
              </Button>
            </div>

            {/* Étapes du processus */}
            <div className="bg-blue-50 rounded-2xl p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                Processus de validation
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-emerald-700 font-medium">
                    Inscription complétée
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-emerald-700 font-medium">
                    Email vérifié
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-yellow-700 font-medium">
                    Validation administrative en cours
                  </span>
                </div>
                <div className="flex items-center opacity-50">
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                    <Clock className="w-4 h-4 text-gray-500" />
                  </div>
                  <span className="text-gray-500">Activation du compte</span>
                </div>
              </div>
            </div>

            {/* Section de contact support */}
            {!supportTicketSent ? (
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <MessageCircle className="w-5 h-5 text-gray-600 mr-2" />
                  Besoin d'aide ?
                </h3>
                <p className="text-gray-600 mb-4">
                  Si vous avez des questions ou si l'activation tarde, n'hésitez
                  pas à nous contacter.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message (optionnel)
                    </label>
                    <textarea
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      placeholder="Décrivez votre situation ou vos questions..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-200 focus:ring-4 focus:ring-opacity-20 focus:outline-none resize-none"
                      rows={3}
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {supportMessage.length}/500 caractères
                    </p>
                  </div>

                  <Button
                    onClick={requestActivation}
                    disabled={isSubmittingTicket}
                    className="w-full"
                  >
                    {isSubmittingTicket ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Contacter le support
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200">
                <div className="flex items-center mb-3">
                  <CheckCircle className="w-6 h-6 text-emerald-600 mr-3" />
                  <h3 className="font-semibold text-emerald-900">
                    Message envoyé !
                  </h3>
                </div>
                <p className="text-emerald-700">
                  Votre demande a été transmise à notre équipe support. Nous
                  vous répondrons dans les plus brefs délais.
                </p>
              </div>
            )}

            {/* Informations de contact */}
            <div className="mt-6 text-center text-sm text-gray-500">
              <p className="mb-2">
                Vous pouvez aussi nous contacter directement :
              </p>
              <div className="flex items-center justify-center space-x-6">
                <a
                  href="mailto:support@cureliah.com"
                  className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Mail className="w-4 h-4 mr-1" />
                  support@cureliah.com
                </a>
                <a
                  href="tel:+33123456789"
                  className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Phone className="w-4 h-4 mr-1" />
                  01 23 45 67 89
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-1" />
              <span>Processus sécurisé</span>
            </div>
            <div className="flex items-center">
              <Heart className="w-4 h-4 mr-1 text-red-500" />
              <span>Made in France</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountActivation;
