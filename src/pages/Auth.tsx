import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth"; // ✅ Import absolu au lieu de relatif
import { useToast } from "@/components/ui/use-toast"; // ✅ Import absolu
import { useLogger } from "@/utils/logger";
import Logger from "@/utils/logger";
import { announceToScreenReader } from "@/utils/accessibility";
import { supabase } from "@/integrations/supabase/client.browser";
import { useLocation, useNavigate } from "react-router-dom";
import {
  User,
  Building2,
  ArrowLeft,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  Zap,
  Star,
  Heart,
  Chrome,
  Linkedin,
  Github,
  Apple,
  ArrowRight,
  Loader2,
  Check,
} from "lucide-react";

// Type definitions
interface ButtonProps {
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost" | "social";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  [key: string]: any;
}

interface InputProps {
  label?: string;
  error?: string;
  icon?: React.ComponentType<{ className?: string }>;
  type?: string;
  className?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  [key: string]: any;
}

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
  showToggle?: boolean;
}

interface SocialButtonProps {
  provider: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

interface SignUpData {
  email: string;
  password: string;
  confirmPassword: string;
  userType: "doctor" | "establishment";
  firstName: string;
  lastName: string;
  establishmentName: string;
  specialty: string;
  establishmentType: string;
}

interface SignInData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  establishmentName?: string;
  resetEmail?: string;
}

interface PasswordValidation {
  isValid: boolean;
  message: string;
}

// Composants en dehors du composant principal pour éviter les re-créations
const Button = ({
  children,
  variant = "default",
  className = "",
  disabled = false,
  onClick,
  type = "button",
  ...props
}: ButtonProps) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0";

  const variants = {
    default:
      "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl focus:ring-blue-500",
    outline:
      "border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-500",
    ghost: "text-gray-600 hover:text-gray-800 hover:bg-gray-100",
    social:
      "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg",
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variants[variant]} px-6 py-3 ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({
  label,
  error = "",
  icon: Icon,
  type = "text",
  className = "",
  value,
  onChange,
  placeholder,
  required = false,
  ...props
}: InputProps) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700 flex items-center">
          {Icon && <Icon className="w-4 h-4 mr-2" />}
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-200"
              : "border-gray-200 focus:border-blue-500 focus:ring-blue-200"
          } focus:ring-4 focus:ring-opacity-20 ${className}`}
          {...props}
        />
      </div>
      {error && (
        <div className="flex items-center text-red-600 text-sm">
          <XCircle className="w-4 h-4 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
};

const PasswordInput = ({
  label,
  value,
  onChange,
  error = "",
  placeholder,
  showToggle = true,
}: PasswordInputProps) => {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 flex items-center">
        <Lock className="w-4 h-4 mr-2" />
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full px-4 py-3 pr-12 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-200"
              : "border-gray-200 focus:border-blue-500 focus:ring-blue-200"
          } focus:ring-4 focus:ring-opacity-20`}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {show ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      {error && (
        <div className="flex items-center text-red-600 text-sm">
          <XCircle className="w-4 h-4 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
};

const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  if (!password) return null;

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid:
        password.length >= minLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumbers &&
        hasSpecialChar,
      strength: [
        { label: "Au moins 8 caractères", valid: password.length >= minLength },
        { label: "Une majuscule", valid: hasUpperCase },
        { label: "Une minuscule", valid: hasLowerCase },
        { label: "Un chiffre", valid: hasNumbers },
        { label: "Un caractère spécial", valid: hasSpecialChar },
      ],
    };
  };

  const getPasswordStrength = (password: string) => {
    const validation = validatePassword(password);
    const validCount = validation.strength.filter((rule) => rule.valid).length;

    if (validCount <= 2) return { label: "Faible", color: "red", width: "25%" };
    if (validCount <= 3)
      return { label: "Moyen", color: "orange", width: "50%" };
    if (validCount <= 4) return { label: "Bon", color: "blue", width: "75%" };
    return { label: "Excellent", color: "emerald", width: "100%" };
  };

  const strength = getPasswordStrength(password);
  const validation = validatePassword(password);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Force du mot de passe:</span>
        <span className={`font-medium text-${strength.color}-600`}>
          {strength.label}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`bg-${strength.color}-500 h-2 rounded-full transition-all duration-300`}
          style={{ width: strength.width }}
        ></div>
      </div>
      <div className="space-y-1">
        {validation.strength.map((rule, index) => (
          <div key={index} className="flex items-center text-xs">
            {rule.valid ? (
              <CheckCircle className="w-3 h-3 text-emerald-500 mr-2" />
            ) : (
              <XCircle className="w-3 h-3 text-gray-400 mr-2" />
            )}
            <span className={rule.valid ? "text-emerald-600" : "text-gray-500"}>
              {rule.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SocialButton = ({
  provider,
  icon: Icon,
  children,
}: SocialButtonProps) => {
  const { toast } = useToast();
  
  const handleSocialLogin = async () => {
    try {
      let providerName = provider.toLowerCase();
      if (providerName === 'linkedin') providerName = 'linkedin_oidc';
      if (providerName === 'github') providerName = 'github';
      if (providerName === 'apple') providerName = 'apple';
      if (providerName === 'google') providerName = 'google';

      const { error } = await supabase.auth.signInWithOAuth({
        provider: providerName as any,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      Logger.getInstance().error(`OAuth connection error`, error, { provider }, 'Auth', 'oauth_error');
      toast({
        title: "Erreur de connexion",
        description: `Impossible de se connecter avec ${provider}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="social"
      className="w-full justify-center"
      onClick={handleSocialLogin}
    >
      <Icon className="w-5 h-5 mr-3" />
      {children}
    </Button>
  );
};

const Auth = () => {
  // Hooks d'authentification
  const { signIn, signUp, loading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const logger = useLogger();
  const location = useLocation();
  const navigate = useNavigate();

  // Récupération du paramètre tab depuis l'URL
  const searchParams = new URLSearchParams(location.search);
  const tabFromUrl = searchParams.get('tab');
  const initialTab = (tabFromUrl === 'signup' || tabFromUrl === 'signin') ? tabFromUrl : 'signin';

  // États principaux
  const [currentTab, setCurrentTab] = useState<"signin" | "signup">(initialTab);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // États de validation et erreurs
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Monitor auth state changes
  useEffect(() => {
    // Auth state monitoring - can be enabled for debugging if needed
    // console.log("Auth State:", { user, authLoading, isVisible });
  }, [user, authLoading, isVisible]);

  // Données de formulaire
  const [signUpData, setSignUpData] = useState<SignUpData>({
    email: "",
    password: "",
    confirmPassword: "",
    userType: "doctor",
    firstName: "",
    lastName: "",
    establishmentName: "",
    specialty: "",
    establishmentType: "",
  });

  const [signInData, setSignInData] = useState<SignInData>({
    email: "",
    password: "",
  });

  const [resetEmail, setResetEmail] = useState("");

  // Animation d'apparition
  useEffect(() => {
    // Délai pour éviter le flash pendant les redirections
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Si l'utilisateur est déjà connecté et email confirmé, redirection automatique
  if (user && user.email_confirmed_at && !authLoading) {
    // DEBUG: Voir les données exactes du profil
    logger.debug("User profile debug info", {
      userId: user?.id,
      email: user?.email,
      profile: user.profile,
      is_verified: user.profile?.is_verified,
      is_active: user.profile?.is_active,
      email_confirmed_at: user.email_confirmed_at,
    });

    // Redirection automatique
    useEffect(() => {
      const timer = setTimeout(() => {
        const dashboardRoute =
          user.user_type === "doctor"
            ? "/doctor/dashboard"
            : user.user_type === "establishment"
            ? "/establishment/dashboard"
            : "/dashboard";

        logger.info("Auto-redirect initiated", {
          dashboardRoute,
          userType: user.user_type,
          component: 'Auth'
        });
        window.location.href = dashboardRoute;
      }, 1500); // Délai de 1.5s pour laisser voir le message

      return () => clearTimeout(timer);
    }, []);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-3xl shadow-xl max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Déjà connecté
          </h2>
          <p className="text-gray-600 mb-4">
            Bonjour <strong>{user.email}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Type de compte : <strong>{user.user_type}</strong>
          </p>

          {/* DEBUG INFO */}
          <div className="text-xs bg-gray-100 p-3 rounded mb-4 text-left">
            <p>
              <strong>Email confirmé:</strong>{" "}
              {user.email_confirmed_at ? "✅" : "❌"}
            </p>
            <p>
              <strong>Profile verified:</strong>{" "}
              {user.profile?.is_verified ? "✅" : "❌"}
            </p>
            <p>
              <strong>Profile active:</strong>{" "}
              {user.profile?.is_active ? "✅" : "❌"}
            </p>
          </div>

          <div className="flex items-center justify-center mb-4">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
            <span className="text-blue-600">Redirection en cours...</span>
          </div>

          <button
            onClick={() => {
              const dashboardRoute =
                user.user_type === "doctor"
                  ? "/doctor/dashboard"
                  : user.user_type === "establishment"
                  ? "/establishment/dashboard"
                  : "/dashboard";
              logger.info("Manual redirect initiated", {
                dashboardRoute,
                userType: user.user_type,
                component: 'Auth',
                trigger: 'manual'
              });
              window.location.href = dashboardRoute;
            }}
            className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold"
          >
            Aller au tableau de bord maintenant
          </button>
        </div>
      </div>
    );
  }

  // Affichage d'un loader pendant le chargement initial
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Fonctions de validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): PasswordValidation => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid:
        password.length >= minLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumbers &&
        hasSpecialChar,
      message:
        password.length < minLength
          ? "Le mot de passe doit contenir au moins 8 caractères"
          : !hasUpperCase
          ? "Le mot de passe doit contenir au moins une majuscule"
          : !hasLowerCase
          ? "Le mot de passe doit contenir au moins une minuscule"
          : !hasNumbers
          ? "Le mot de passe doit contenir au moins un chiffre"
          : !hasSpecialChar
          ? "Le mot de passe doit contenir au moins un caractère spécial"
          : "",
    };
  };

  const validateSignInForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!signInData.email) {
      newErrors.email = "L'email est requis";
    } else if (!validateEmail(signInData.email)) {
      newErrors.email = "Format d'email invalide";
    }

    if (!signInData.password) {
      newErrors.password = "Le mot de passe est requis";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignUpForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validation email
    if (!signUpData.email) {
      newErrors.email = "L'email est requis";
    } else if (!validateEmail(signUpData.email)) {
      newErrors.email = "Format d'email invalide";
    }

    // Validation mot de passe
    if (!signUpData.password) {
      newErrors.password = "Le mot de passe est requis";
    } else {
      const passwordValidation = validatePassword(signUpData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.message;
      }
    }

    // Validation confirmation mot de passe
    if (!signUpData.confirmPassword) {
      newErrors.confirmPassword = "La confirmation du mot de passe est requise";
    } else if (signUpData.password !== signUpData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    // Validation champs spécifiques au type d'utilisateur
    if (signUpData.userType === "doctor") {
      if (!signUpData.firstName.trim()) {
        newErrors.firstName = "Le prénom est requis";
      }
      if (!signUpData.lastName.trim()) {
        newErrors.lastName = "Le nom est requis";
      }
    } else if (signUpData.userType === "establishment") {
      if (!signUpData.establishmentName.trim()) {
        newErrors.establishmentName = "Le nom de l'établissement est requis";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSignInForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signIn(signInData.email, signInData.password);

      // The toast and redirection are handled in the useAuth hook
      if (result && !result.error) {
        // Success - AuthProvider will handle redirection
        announceToScreenReader("Connexion réussie, redirection en cours", "polite");
      }
    } catch (error) {
      logger.error("Sign in error", error as Error, { email: signInData.email }, 'Auth', 'signin_error');
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSignUpForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      logger.info("Sign up attempt", {
        email: signUpData.email,
        userType: signUpData.userType,
        component: 'Auth'
      });

      // Préparer les données du profil selon le type d'utilisateur
      const profileData = {
        firstName: signUpData.firstName,
        lastName: signUpData.lastName,
        establishmentName: signUpData.establishmentName,
        specialty: signUpData.specialty,
        establishmentType: signUpData.establishmentType,
      };

      const result = await signUp(
        signUpData.email,
        signUpData.password,
        signUpData.userType,
        profileData
      );

      logger.info("Sign up result", {
        success: !!result,
        email: signUpData.email,
        userType: signUpData.userType,
        component: 'Auth'
      });

      // Le toast est déjà géré dans le hook useAuth
      if (result && !result.error) {
        // Succès - réinitialiser le formulaire et basculer vers connexion
        setSignUpData({
          email: "",
          password: "",
          confirmPassword: "",
          userType: "doctor",
          firstName: "",
          lastName: "",
          establishmentName: "",
          specialty: "",
          establishmentType: "",
        });

        // Basculer vers l'onglet connexion
        setCurrentTab("signin");
        setErrors({});
      }
    } catch (error) {
      logger.error("Sign up error", error as Error, { email: signUpData.email, userType: signUpData.userType }, 'Auth', 'signup_error');
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail || !validateEmail(resetEmail)) {
      setErrors({ resetEmail: "Veuillez entrer une adresse email valide" });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Email envoyé",
        description:
          "Un lien de réinitialisation a été envoyé à votre adresse email",
        variant: "default",
      });

      setIsResetPassword(false);
      setResetEmail("");
      setErrors({});
    } catch (error) {
      console.error("Erreur lors de la réinitialisation:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi de l'email",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormLoading = authLoading || isSubmitting;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Éléments décoratifs */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
      <div
        className="absolute bottom-20 right-10 w-64 h-64 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      <div
        className={`w-full max-w-md relative z-10 transition-all duration-1000 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        {/* Bouton retour */}
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Retour
        </Button>

        {/* Carte principale */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* En-tête avec gradient */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 px-8 py-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 animate-pulse"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center">
                  <span className="text-blue-600 font-bold">C</span>
                </div>
                <span className="text-xl font-bold text-white">Cureliah</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {isResetPassword
                  ? "Réinitialiser votre mot de passe"
                  : "Rejoignez la révolution médicale"}
              </h1>
              <p className="text-blue-100">
                {isResetPassword
                  ? "Recevez un lien de réinitialisation par email"
                  : "La plateforme qui connecte médecins et établissements"}
              </p>
            </div>
          </div>

          <div className="p-8">
            {!isResetPassword ? (
              <div>
                {/* Tabs */}
                <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
                  <button
                    onClick={() => {
                      setCurrentTab("signin");
                      setErrors({});
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                      currentTab === "signin"
                        ? "bg-white text-blue-600 shadow-md"
                        : "text-gray-600 hover:text-blue-600"
                    }`}
                  >
                    Connexion
                  </button>
                  <button
                    onClick={() => {
                      setCurrentTab("signup");
                      setErrors({});
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                      currentTab === "signup"
                        ? "bg-white text-emerald-600 shadow-md"
                        : "text-gray-600 hover:text-emerald-600"
                    }`}
                  >
                    Inscription
                  </button>
                </div>

                {/* Formulaire de connexion */}
                {currentTab === "signin" && (
                  <form onSubmit={handleSignIn} className="space-y-6">
                    <Input
                      label="Adresse email"
                      type="email"
                      value={signInData.email}
                      onChange={(e) => {
                        setSignInData({ ...signInData, email: e.target.value });
                        if (errors.email) {
                          setErrors({ ...errors, email: "" });
                        }
                      }}
                      placeholder="votre@email.com"
                      icon={Mail}
                      error={errors.email}
                      required
                    />

                    <PasswordInput
                      label="Mot de passe"
                      value={signInData.password}
                      onChange={(e) => {
                        setSignInData({
                          ...signInData,
                          password: e.target.value,
                        });
                        if (errors.password) {
                          setErrors({ ...errors, password: "" });
                        }
                      }}
                      placeholder="••••••••"
                      error={errors.password}
                      showToggle={true}
                    />

                    <Button
                      type="submit"
                      className="w-full py-4 text-lg"
                      disabled={isFormLoading}
                    >
                      {isFormLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Connexion en cours...
                        </>
                      ) : (
                        <>
                          Se connecter
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setIsResetPassword(true);
                          setResetEmail(signInData.email);
                          setErrors({});
                        }}
                        className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>

                    {/* Séparateur */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">
                          Ou continuer avec
                        </span>
                      </div>
                    </div>

                    {/* Connexions sociales */}
                    <div className="grid grid-cols-2 gap-3">
                      <SocialButton provider="Google" icon={Chrome}>
                        Google
                      </SocialButton>
                      <SocialButton provider="LinkedIn" icon={Linkedin}>
                        LinkedIn
                      </SocialButton>
                    </div>
                  </form>
                )}

                {/* Formulaire d'inscription */}
                {currentTab === "signup" && (
                  <form onSubmit={handleSignUp} className="space-y-6">
                    {/* Choix du type de compte */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700">
                        Type de compte
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSignUpData({
                              ...signUpData,
                              userType: "doctor",
                            });
                            setErrors({});
                          }}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            signUpData.userType === "doctor"
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <User className="w-8 h-8 mx-auto mb-2" />
                          <div className="text-sm font-semibold">Médecin</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSignUpData({
                              ...signUpData,
                              userType: "establishment",
                            });
                            setErrors({});
                          }}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            signUpData.userType === "establishment"
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <Building2 className="w-8 h-8 mx-auto mb-2" />
                          <div className="text-sm font-semibold">
                            Établissement
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Champs conditionnels */}
                    {signUpData.userType === "doctor" ? (
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Prénom"
                          value={signUpData.firstName}
                          onChange={(e) => {
                            setSignUpData({
                              ...signUpData,
                              firstName: e.target.value,
                            });
                            if (errors.firstName) {
                              setErrors({ ...errors, firstName: "" });
                            }
                          }}
                          placeholder="Jean"
                          error={errors.firstName}
                          required
                        />
                        <Input
                          label="Nom"
                          value={signUpData.lastName}
                          onChange={(e) => {
                            setSignUpData({
                              ...signUpData,
                              lastName: e.target.value,
                            });
                            if (errors.lastName) {
                              setErrors({ ...errors, lastName: "" });
                            }
                          }}
                          placeholder="Dupont"
                          error={errors.lastName}
                          required
                        />
                      </div>
                    ) : (
                      <Input
                        label="Nom de l'établissement"
                        value={signUpData.establishmentName}
                        onChange={(e) => {
                          setSignUpData({
                            ...signUpData,
                            establishmentName: e.target.value,
                          });
                          if (errors.establishmentName) {
                            setErrors({ ...errors, establishmentName: "" });
                          }
                        }}
                        placeholder="Clinique Saint-Louis"
                        icon={Building2}
                        error={errors.establishmentName}
                        required
                      />
                    )}

                    <Input
                      label="Adresse email"
                      type="email"
                      value={signUpData.email}
                      onChange={(e) => {
                        setSignUpData({ ...signUpData, email: e.target.value });
                        if (errors.email) {
                          setErrors({ ...errors, email: "" });
                        }
                      }}
                      placeholder="votre@email.com"
                      icon={Mail}
                      error={errors.email}
                      required
                    />

                    <div className="space-y-4">
                      <PasswordInput
                        label="Mot de passe"
                        value={signUpData.password}
                        onChange={(e) => {
                          setSignUpData({
                            ...signUpData,
                            password: e.target.value,
                          });
                          if (errors.password) {
                            setErrors({ ...errors, password: "" });
                          }
                        }}
                        placeholder="••••••••"
                        error={errors.password}
                      />

                      <PasswordStrengthIndicator
                        password={signUpData.password}
                      />
                    </div>

                    <PasswordInput
                      label="Confirmer le mot de passe"
                      value={signUpData.confirmPassword}
                      onChange={(e) => {
                        setSignUpData({
                          ...signUpData,
                          confirmPassword: e.target.value,
                        });
                        if (errors.confirmPassword) {
                          setErrors({ ...errors, confirmPassword: "" });
                        }
                      }}
                      placeholder="••••••••"
                      error={errors.confirmPassword}
                      showToggle={false}
                    />

                    <Button
                      type="submit"
                      className="w-full py-4 text-lg"
                      disabled={isFormLoading}
                    >
                      {isFormLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Création en cours...
                        </>
                      ) : (
                        <>
                          Créer mon compte
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>

                    {/* Avantages */}
                    <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl p-4">
                      <div className="flex items-center mb-2">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="text-sm font-semibold text-gray-700">
                          Pourquoi nous choisir ?
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center">
                          <Check className="w-3 h-3 text-emerald-500 mr-2" />
                          Plateforme 100% sécurisée et conforme RGPD
                        </div>
                        <div className="flex items-center">
                          <Check className="w-3 h-3 text-emerald-500 mr-2" />
                          Support 24/7 et équipe dédiée
                        </div>
                        <div className="flex items-center">
                          <Check className="w-3 h-3 text-emerald-500 mr-2" />
                          Aucune commission sur vos revenus
                        </div>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-gray-600">
                    Entrez votre adresse email et nous vous enverrons un lien
                    pour réinitialiser votre mot de passe.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-6">
                  <Input
                    label="Adresse email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => {
                      setResetEmail(e.target.value);
                      if (errors.resetEmail) {
                        setErrors({ ...errors, resetEmail: "" });
                      }
                    }}
                    placeholder="votre@email.com"
                    icon={Mail}
                    error={errors.resetEmail}
                    required
                  />

                  <Button
                    type="submit"
                    className="w-full py-4"
                    disabled={
                      isFormLoading || !resetEmail || !validateEmail(resetEmail)
                    }
                  >
                    {isFormLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      "Envoyer le lien de réinitialisation"
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => {
                      setIsResetPassword(false);
                      setErrors({});
                    }}
                    className="w-full"
                  >
                    Retour à la connexion
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Footer avec sécurité */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-1" />
              <span>Sécurisé SSL</span>
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

export default Auth;
