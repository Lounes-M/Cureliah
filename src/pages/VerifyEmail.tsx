import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLogger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client.browser";
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

// Composant Button simplifié
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
      "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl focus:ring-green-500",
  };

  const handleClick = (e) => {
    e.preventDefault();
    if (!disabled && onClick) onClick(e);
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
  const { user, redirectToDashboard } = useAuth();
  const { toast } = useToast();
  const logger = useLogger();

  const [verificationStatus, setVerificationStatus] = useState("pending");
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const token = searchParams.get("token");
  const type = searchParams.get("type");
  const email = searchParams.get("email") || user?.email || "";

  // Vérification automatique du token au chargement
  useEffect(() => {
    if (token && type) {
      verifyToken();
    }
  }, [token, type]);

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

  // Vérification du token
  const verifyToken = async () => {
    if (!token || !type) return;

    try {
      setIsVerifying(true);
      setVerificationStatus("verifying");

      let result;

      if (type === "signup") {
        result = await supabase.auth.verifyOtp({
          token_hash: token,
          type: "signup",
        });
      } else if (type === "email_change") {
        result = await supabase.auth.verifyOtp({
          token_hash: token,
          type: "email_change",
        });
      } else if (type === "recovery") {
        result = await supabase.auth.verifyOtp({
          token_hash: token,
          type: "recovery",
        });
      } else {
        throw new Error("Type de vérification non reconnu");
      }

      if (result.error) throw result.error;

      setVerificationStatus("success");

      toast({
        title: "Email vérifié !",
        description: "Votre adresse email a été confirmée avec succès.",
        variant: "default",
      });

      // Redirection après 2 secondes
      setTimeout(() => {
        if (user) {
          redirectToDashboard();
        } else {
          navigate("/auth");
        }
      }, 2000);
    } catch (error) {
      logger.error("Erreur lors de la vérification", error as Error, { token, userId: user?.id }, 'VerifyEmail', 'verification_error');
      setVerificationStatus("error");

      let errorMsg = "Une erreur est survenue lors de la vérification.";

      if (error.message.includes("Token has expired")) {
        errorMsg =
          "Le lien de vérification a expiré. Veuillez en demander un nouveau.";
      } else if (error.message.includes("Invalid token")) {
        errorMsg = "Le lien de vérification est invalide.";
      } else if (error.message.includes("Email already confirmed")) {
        errorMsg = "Cette adresse email est déjà confirmée.";
        setVerificationStatus("already_verified");
      }

      setErrorMessage(errorMsg);

      toast({
        title: "Erreur de vérification",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Navigation vers login
  const handleNavigateToAuth = () => {
    try {
      navigate("/auth");
    } catch (error) {
      logger.error("Navigation error", error as Error, { targetPath: "/auth" }, 'VerifyEmail', 'navigation_error');
      window.location.href = "/auth";
    }
  };

  // Renvoyer l'email de vérification
  const handleResendEmail = async () => {
    if (!email || isResending || resendCooldown > 0) return;

    try {
      setIsResending(true);
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (error) throw error;

      toast({
        title: "Email envoyé !",
        description:
          "Un nouveau lien de vérification a été envoyé à votre adresse email.",
        variant: "default",
      });

      setResendCooldown(60);
      setVerificationStatus("pending"); // Reset status après renvoi
      setErrorMessage("");
    } catch (error) {
      logger.error("Erreur lors du renvoi", error as Error, { email }, 'VerifyEmail', 'resend_error');

      let errorMsg =
        "Impossible d'envoyer l'email. Veuillez réessayer plus tard.";

      if (error.message.includes("Email rate limit exceeded")) {
        errorMsg =
          "Trop d'emails envoyés. Veuillez attendre avant de réessayer.";
        setResendCooldown(300); // 5 minutes de cooldown
      }

      toast({
        title: "Erreur",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  // Rendu du contenu selon le statut
  const renderContent = () => {
    // Statut de vérification en cours
    if (verificationStatus === "verifying" || isVerifying) {
      return (
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Vérification en cours...
          </h2>
          <p className="text-gray-600 mb-6">
            Nous vérifions votre adresse email. Veuillez patienter.
          </p>
        </div>
      );
    }

    // Statut de succès
    if (verificationStatus === "success") {
      return (
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Email vérifié avec succès !
          </h2>
          <p className="text-gray-600 mb-6">
            Votre adresse email a été confirmée. Vous allez être redirigé
            automatiquement.
          </p>
          <Button
            variant="success"
            onClick={() =>
              user ? redirectToDashboard() : handleNavigateToAuth()
            }
            className="w-full"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Continuer
          </Button>
        </div>
      );
    }

    // Statut déjà vérifié
    if (verificationStatus === "already_verified") {
      return (
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Email déjà vérifié
          </h2>
          <p className="text-gray-600 mb-6">
            Cette adresse email est déjà confirmée. Vous pouvez vous connecter.
          </p>
          <Button onClick={handleNavigateToAuth} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Aller à la connexion
          </Button>
        </div>
      );
    }

    // Statut d'erreur
    if (verificationStatus === "error") {
      return (
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Erreur de vérification
          </h2>
          <p className="text-gray-600 mb-6">
            {errorMessage ||
              "Une erreur est survenue lors de la vérification de votre email."}
          </p>

          <div className="space-y-4">
            {email && (
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
            )}

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
    }

    // Statut par défaut (en attente)
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
          Cliquez dessus pour activer votre compte.
        </p>

        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <div className="flex items-start">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Vous ne trouvez pas l'email ?</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Vérifiez votre dossier spam/courrier indésirable</li>
                <li>• Confirmez que l'adresse email est correcte</li>
                <li>• L'email peut prendre quelques minutes à arriver</li>
                <li>• Vérifiez que votre boîte mail n'est pas pleine</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleResendEmail}
            disabled={isResending || resendCooldown > 0 || !email}
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
