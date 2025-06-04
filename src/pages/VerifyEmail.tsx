console.log("Component state:", {
  verificationStatus,
  isResending,
  resendCooldown,
  email,
});
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Shield,
  Clock,
} from "lucide-react";

// Composant Button simple pour éviter les problèmes
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
  };

  // Gestion du clic avec debug minimal
  const handleClick = (e) => {
    e.preventDefault();

    if (!disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} px-6 py-3 ${className}`}
      disabled={disabled}
      onClick={handleClick}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
};

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Charger les hooks
  let user, redirectToDashboard, toast;

  try {
    const authHook = useAuth();
    user = authHook?.user;
    redirectToDashboard = authHook?.redirectToDashboard;
  } catch (error) {
    console.error("Error loading auth hook:", error);
  }

  try {
    const toastHook = useToast();
    toast = toastHook?.toast;
  } catch (error) {
    console.error("Error loading toast hook:", error);
  }

  // États de la page
  const [verificationStatus, setVerificationStatus] = useState("pending");
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  // Récupérer les paramètres de l'URL
  const token = searchParams.get("token");
  const type = searchParams.get("type");
  const email = searchParams.get("email") || user?.email || "";

  // États de la page
  const [verificationStatus, setVerificationStatus] = useState("pending");
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  // Gestion du cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Fonction pour naviguer vers auth
  const handleNavigateToAuth = () => {
    try {
      navigate("/auth");
    } catch (error) {
      console.error("Navigation error:", error);
      // Fallback - redirection manuelle
      window.location.href = "/auth";
    }
  };

  // Fonction pour renvoyer l'email
  const handleResendEmail = async () => {
    if (!email || isResending || resendCooldown > 0) {
      return;
    }

    try {
      setIsResending(true);

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (error) {
        console.error("Supabase resend error:", error);
        throw error;
      }

      // Toast de succès
      if (toast) {
        toast({
          title: "Email envoyé !",
          description:
            "Un nouveau lien de vérification a été envoyé à votre adresse email.",
          variant: "default",
        });
      } else {
        // Fallback si toast ne fonctionne pas
        alert("Email de vérification envoyé !");
      }

      setResendCooldown(60);
    } catch (error) {
      console.error("Erreur lors du renvoi:", error);

      if (toast) {
        toast({
          title: "Erreur",
          description:
            "Impossible d'envoyer l'email de vérification. Veuillez réessayer plus tard.",
          variant: "destructive",
        });
      } else {
        // Fallback si toast ne fonctionne pas
        alert(
          "Erreur lors de l'envoi de l'email. Veuillez réessayer plus tard."
        );
      }
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-yellow-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Vérifiez votre adresse email
        </h2>
        <p className="text-gray-600 mb-6">
          Nous avons envoyé un lien de vérification à <strong>{email}</strong>.
          Cliquez sur le lien dans l'email pour activer votre compte.
        </p>

        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <div className="flex items-start">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Vous ne trouvez pas l'email ?</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Vérifiez votre dossier spam/courrier indésirable</li>
                <li>• Assurez-vous que l'adresse email est correcte</li>
                <li>• L'email peut prendre quelques minutes à arriver</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleResendEmail}
            disabled={isResending || resendCooldown > 0}
            className="w-full"
          >
            {isResending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : resendCooldown > 0 ? (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Renvoyer dans {resendCooldown}s
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Renvoyer l'email de vérification
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleNavigateToAuth}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la connexion
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
      <div
        className="absolute bottom-20 right-10 w-64 h-64 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 px-8 py-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 animate-pulse"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center">
                  <span className="text-blue-600 font-bold">C</span>
                </div>
                <span className="text-xl font-bold text-white">Cureliah</span>
              </div>
              <h1 className="text-xl font-bold text-white">
                Vérification de votre email
              </h1>
            </div>
          </div>

          <div className="p-8">{renderContent()}</div>
        </div>

        <div className="text-center mt-6 text-sm text-gray-500">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-1" />
              <span>Sécurisé SSL</span>
            </div>
            <div className="flex items-center">
              <Mail className="w-4 h-4 mr-1" />
              <span>Email sécurisé</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
