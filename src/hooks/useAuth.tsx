import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { supabase } from "@/integrations/supabase/client.browser";
import { log } from "@/utils/logging";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { logger } from "@/services/logger";

// Type guard pour vérifier si les données correspondent à un UserProfile
function isUserProfile(data: unknown): data is UserProfile {
  if (!data || typeof data !== 'object') return false;
  const profile = data as Record<string, unknown>;
  return typeof profile.user_type === 'string' && 
         ['doctor', 'establishment', 'admin'].includes(profile.user_type);
}

// Interfaces pour les profils spécialisés
interface DoctorProfile {
  id?: string;
  specialty?: string;
  speciality?: string;
  avatar_url?: string;
  [key: string]: unknown;
}

interface EstablishmentProfile {
  id?: string;
  name?: string;
  establishment_name?: string;
  avatar_url?: string;
  [key: string]: unknown;
}

// Type pour les réponses de base de données
interface DatabaseResponse<T> {
  data: T | null;
  error: { code?: string; message?: string } | null;
}

interface UserProfile {
  first_name?: string;
  last_name?: string;
  specialty?: string;
  speciality?: string;
  establishment_name?: string;
  user_type?: "doctor" | "establishment" | "admin";
  is_verified?: boolean;
  is_active?: boolean;
  avatar_url?: string;
}

interface User {
  id: string;
  email: string;
  user_type: "doctor" | "establishment" | "admin";
  email_confirmed_at?: string;
  user_metadata?: {
    user_type?: "doctor" | "establishment" | "admin";
  };
  profile?: UserProfile;
}

// Accept both SupabaseUser and local User
type FetchableUser = SupabaseUser | User;

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ data: unknown; error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    userType: "doctor" | "establishment",
    profileData: Record<string, unknown>
  ) => Promise<{ data: unknown; error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (profileData: Record<string, unknown>) => Promise<{ data: unknown; error: Error | null }>;
  isAdmin: () => boolean;
  isDoctor: () => boolean;
  isEstablishment: () => boolean;
  isEmailConfirmed: () => boolean;
  getDashboardRoute: () => string;
  redirectToDashboard: () => void;
  isSubscribed: () => boolean;
  refreshSubscription: () => void;
  subscriptionStatus: "active" | "inactive" | "canceled" | "trialing" | "past_due" | null;
  subscriptionLoading: boolean;
  subscriptionPlan: 'essentiel' | 'pro' | 'premium' | null;
  hasFeature: (feature: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<
    'active' | 'inactive' | 'canceled' | 'trialing' | 'past_due' | null
  >(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<'essentiel' | 'pro' | 'premium' | null>(null);

  // Move hooks to top-level (fixes conditional hook call)
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Auth pages configuration
  const authPages = useMemo(
    () => [
      "/auth",
      "/login",
      "/register",
      "/signin",
      "/signup",
      "/reset-password",
    ],
    []
  );

  // Public pages configuration
  const publicPages = useMemo(
    () => ["/", "/about", "/contact", "/pricing", "/features"],
    []
  );

  // Special pages configuration
  const specialPages = useMemo(() => ["/verify-email"], []);

  // Fetch user profile function avec timeout
  const fetchUserProfile = useCallback(
    async (authUser: FetchableUser) => {
      logger.info("🔍 fetchUserProfile started for:", authUser.email);

      try {
        console.log(
          "Fetching profile for user:",
          authUser.id,
          authUser.email,
          "Email confirmed:",
          !!authUser.email_confirmed_at
        );

        // Timeout de sécurité pour la requête Supabase
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Database query timeout")), 5000);
        });

        // Requête vers la base de données avec timeout
        const queryPromise = supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        logger.info("📡 Querying profiles table...");

        let profile: Record<string, unknown> | null = null;
        let profileError: { code?: string; message?: string } | null = null;
        try {
          const result = await Promise.race([queryPromise, timeoutPromise]);
          if (typeof result === 'object' && result !== null && 'data' in result && 'error' in result) {
            const dbResult = result as { data: Record<string, unknown> | null; error: { code?: string; message?: string } | null };
            profile = dbResult.data;
            profileError = dbResult.error;
          } else {
            profile = null;
            profileError = { code: 'TIMEOUT' };
          }
        } catch (timeoutError) {
          profileError = { code: 'TIMEOUT' };
        }

        if (
          profileError &&
          (profileError.code === "PGRST116" || profileError.code === "TIMEOUT")
        ) {
          logger.info("Profile not found or timeout, using auth user metadata");
          const userType = (authUser as User).user_type || authUser.user_metadata?.user_type || "doctor";
          const userData: User = {
            id: authUser.id,
            email: authUser.email || "",
            user_type: userType,
            email_confirmed_at: authUser.email_confirmed_at,
            user_metadata: {
              user_type: userType,
            },
            profile: {
              user_type: userType,
            },
          };

          logger.info("✅ Setting fallback user data:", userData);
          setUser(userData);
          setLoading(false);
          setInitialLoad(false);
          return;
        }

        if (profileError) {
          logger.error("❌ Database error:", profileError);
          throw profileError;
        }

        logger.info("✅ Profile data received:", profile);

        // Vérifier que le profil est valide
        if (!isUserProfile(profile)) {
          logger.error("❌ Invalid profile data:", profile);
          throw new Error("Invalid profile data received from database");
        }

        // Maintenant profile est du type UserProfile
        const validProfile = profile as UserProfile;

        let userData: User = {
          id: authUser.id,
          email: authUser.email,
          user_type: validProfile.user_type!,
          email_confirmed_at: authUser.email_confirmed_at,
          user_metadata: {
            user_type: validProfile.user_type,
          },
          profile: {
            first_name: validProfile.first_name,
            last_name: validProfile.last_name,
            user_type: validProfile.user_type,
          },
        };

        // Get specialized profile avec timeout aussi
        logger.info("📡 Querying specialized profile for:", validProfile.user_type);

        if (profile.user_type === "doctor") {
          try {
            const doctorQueryPromise = supabase
              .from("doctor_profiles")
              .select("*")
              .eq("id", authUser.id)
              .single();
            const doctorResult = await Promise.race([
              doctorQueryPromise,
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Doctor query timeout")), 3000)
              ),
            ]);
            if (typeof doctorResult === 'object' && doctorResult !== null && 'data' in doctorResult && 'error' in doctorResult) {
              const { data: doctorProfile, error: doctorError } = doctorResult as DatabaseResponse<DoctorProfile>;
              if (!doctorError && doctorProfile) {
                userData.profile = {
                  ...userData.profile,
                  specialty: doctorProfile.speciality as string | undefined,
                  speciality: doctorProfile.speciality as string | undefined,
                  avatar_url: doctorProfile.avatar_url as string | undefined,
                };
                logger.info("✅ Doctor profile loaded with avatar:", doctorProfile.avatar_url);
              }
            }
          } catch (error) {
            logger.info("⏰ Doctor profile query timeout, continuing without it");
          }
        } else if (profile.user_type === "establishment") {
          try {
            const establishmentQueryPromise = supabase
              .from("establishment_profiles")
              .select("*")
              .eq("id", authUser.id)
              .single();
            const establishmentResult = await Promise.race([
              establishmentQueryPromise,
              new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error("Establishment query timeout")),
                  3000
                )
              ),
            ]);
            if (typeof establishmentResult === 'object' && establishmentResult !== null && 'data' in establishmentResult && 'error' in establishmentResult) {
              const { data: establishmentProfile, error: establishmentError } = establishmentResult as DatabaseResponse<EstablishmentProfile>;
              if (!establishmentError && establishmentProfile) {
                userData.profile = {
                  ...userData.profile,
                  establishment_name: establishmentProfile.name as string | undefined,
                  avatar_url: establishmentProfile.avatar_url as string | undefined,
                };
                logger.info("✅ Establishment profile loaded with avatar:", establishmentProfile.avatar_url);
              }
            }
          } catch (error) {
            console.log(
              "⏰ Establishment profile query timeout, continuing without it"
            );
          }
        }

        console.log("✅ User data loaded successfully:", {
          id: userData.id,
          email: userData.email,
          user_type: userData.user_type,
          email_confirmed: !!userData.email_confirmed_at,
        });

        setUser(userData);
      } catch (error) {
        logger.error("❌ Error fetching user profile:", error);

        const userType = (authUser as User).user_type || authUser.user_metadata?.user_type || "doctor";
        const fallbackUser: User = {
          id: authUser.id,
          email: authUser.email || "",
          user_type: userType,
          email_confirmed_at: authUser.email_confirmed_at,
          user_metadata: {
            user_type: userType,
          },
          profile: {
            user_type: userType,
          },
        };

        logger.info("⚠️ Using fallback user:", fallbackUser);
        setUser(fallbackUser);
      } finally {
        logger.info("🏁 fetchUserProfile finished, setting loading to false");
        setLoading(false);
        setInitialLoad(false);
      }
    },
    [supabase]
  );

  // Initialize auth session
  useEffect(() => {
    logger.info("🚀 Auth initialization started");
    let mounted = true;

    const initAuth = async () => {
      try {
        logger.info("📡 Getting Supabase session...");
        const {
          data: { session },
        } = await supabase.auth.getSession();

        logger.info("📡 Session result:", session ? "Found" : "None");

        if (mounted) {
          if (session) {
            logger.info("👤 User found in session, fetching profile...");
            await fetchUserProfile(session.user);
          } else {
            logger.info("👤 No user in session, setting loading to false");
            setLoading(false);
            setInitialLoad(false);
          }
        }
      } catch (error) {
        logger.error("❌ Auth initialization error:", error);
        if (mounted) {
          setLoading(false);
          setInitialLoad(false);
        }
      }
    };

    initAuth();

    // Listen for auth state changes
    logger.info("👂 Setting up auth state listener...");
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[useAuth] Auth state changed:', event, session?.user?.email?.substring(0, 3) + '***');

      if (mounted) {
        try {
          switch (event) {
            case 'SIGNED_IN':
            case 'TOKEN_REFRESHED':
              if (session?.user) {
                logger.info('[useAuth] Processing sign-in/refresh for:', session.user.email);
                await fetchUserProfile(session.user);
              }
              break;
              
            case 'SIGNED_OUT':
              logger.info('[useAuth] Processing sign-out');
              setUser(null);
              setSubscriptionStatus(null);
              setSubscriptionPlan(null);
              setLoading(false);
              setInitialLoad(false);
              // Nettoyer le cache de vérification d'abonnement
              Object.keys(localStorage).forEach(key => {
                if (key.startsWith('subscription_check_')) {
                  localStorage.removeItem(key);
                }
              });
              break;
              
            default:
              if (session?.user) {
                await fetchUserProfile(session.user);
              } else {
                setUser(null);
                setLoading(false);
                setInitialLoad(false);
              }
          }
        } catch (error) {
          logger.error(`[useAuth] Error handling auth event ${event}:`, error);
          setLoading(false);
          setInitialLoad(false);
        }
      }
    });

    return () => {
      logger.info("🧹 Cleaning up auth initialization");
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  // SUPPRESSION DE LA LOGIQUE DE NAVIGATION AUTOMATIQUE
  // Cette partie causait potentiellement des boucles infinies

  const getDashboardRoute = useCallback(() => {
    if (!user) return "/";

    switch (user.user_type) {
      case "doctor":
        return "/doctor/dashboard";
      case "establishment":
        return "/establishment/dashboard";
      case "admin":
        return "/admin/dashboard";
      default:
        return "/dashboard";
    }
  }, [user]);

  const redirectToDashboard = useCallback(() => {
    const dashboardRoute = getDashboardRoute();
    logger.info("🚀 Redirecting to dashboard:", dashboardRoute);
    navigate(dashboardRoute);
  }, [getDashboardRoute, navigate]);

  const signIn = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ data: unknown; error: Error | null }> => {
      try {
        logger.info("🔐 Signing in user:", email);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          console.log(
            "✅ User signed in:",
            data.user.email,
            "Email confirmed:",
            !!data.user.email_confirmed_at
          );

          if (data.user.email_confirmed_at) {
            toast({
              title: "Connexion réussie",
              description: "Bienvenue ! Vous êtes maintenant connecté.",
              variant: "default",
            });
          }
        }

        return { data, error: null };
      } catch (error: unknown) {
        let errorMessage = "Une erreur est survenue lors de la connexion";
        if (error instanceof Error) {
          if (error.message.includes("Invalid login credentials")) {
            errorMessage = "Email ou mot de passe incorrect";
          } else if (error.message.includes("Email not confirmed")) {
            errorMessage = "Veuillez confirmer votre email avant de vous connecter";
          } else if (error.message.includes("Too many requests")) {
            errorMessage = "Trop de tentatives de connexion. Veuillez réessayer plus tard";
          }
        }
        toast({
          title: "Erreur de connexion",
          description: errorMessage,
          variant: "destructive",
        });
        return { data: null, error: error instanceof Error ? error : new Error(errorMessage) };
      }
    },
    [supabase, toast]
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      userType: "doctor" | "establishment",
      profileData: Record<string, unknown>
    ): Promise<{ data: unknown; error: Error | null }> => {
      try {
        logger.info("📝 Signing up user:", email, userType);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              user_type: userType,
              first_name: profileData.firstName,
              last_name: profileData.lastName,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          console.log(
            "✅ User signed up:",
            data.user.email,
            "Needs confirmation:",
            !data.user.email_confirmed_at
          );

          toast({
            title: "Inscription réussie",
            description:
              "Votre compte a été créé. Vérifiez votre email pour confirmer votre compte.",
            variant: "default",
          });
        }

        return { data, error: null };
      } catch (error: unknown) {
        toast({
          title: "Erreur d'inscription",
          description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'inscription",
          variant: "destructive",
        });
        return { data: null, error: error instanceof Error ? error : new Error("Unknown error") };
      }
    },
    [supabase, toast]
  );

  const signOut = useCallback(async (): Promise<void> => {
    try {
      logger.info("🚪 Signing out user");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      navigate("/");

      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès",
        variant: "default",
      });
    } catch (error: unknown) {
      toast({
        title: "Erreur de déconnexion",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la déconnexion",
        variant: "destructive",
      });
    }
  }, [navigate, supabase, toast]);

  const updateProfile = useCallback(
    async (profileData: Record<string, unknown>): Promise<{ data: unknown; error: Error | null }> => {
      try {
        if (!user) throw new Error("No user logged in");

        const { error } = await supabase
          .from("profiles")
          .update(profileData)
          .eq("id", user.id);

        if (error) throw error;

        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (authUser) {
          await fetchUserProfile(authUser);
        }

        toast({
          title: "Profil mis à jour",
          description: "Vos informations ont été mises à jour avec succès",
          variant: "default",
        });

        return { data: null, error: null };
      } catch (error: unknown) {
        toast({
          title: "Erreur de mise à jour",
          description: error instanceof Error ? error.message : "Une erreur est survenue lors de la mise à jour du profil",
          variant: "destructive",
        });
        return { data: null, error: error instanceof Error ? error : new Error("Unknown error") };
      }
    },
    [user, fetchUserProfile, supabase, toast]
  );

  // Récupération du statut d'abonnement pour les médecins avec retry automatique
  useEffect(() => {
    const fetchSubscription = async (retryCount = 0) => {
      if (!user?.id || user.user_type !== 'doctor') {
        setSubscriptionStatus(null);
        setSubscriptionPlan(null);
        return;
      }
      
      setSubscriptionLoading(true);
      
      try {
        // Vérifier et renouveler la session avant l'appel
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          logger.warn('[useAuth] Session error, attempting to refresh:', sessionError.message);
          
          // Tenter de renouveler la session
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshedSession) {
            logger.error('[useAuth] Session refresh failed:', refreshError?.message);
            // Session expirée - déconnecter l'utilisateur
            await signOut();
            return;
          }
          
          logger.info('[useAuth] Session refreshed successfully');
        }
        
        if (!session?.access_token) {
          logger.warn('[useAuth] No valid session token available');
          if (retryCount < 2) {
            // Retry après un court délai
            setTimeout(() => fetchSubscription(retryCount + 1), 1000);
            return;
          }
          throw new Error('No valid session token');
        }
        
        // Appel à la fonction Edge avec session valide
        const { data, error } = await supabase.functions.invoke('get-subscription-status');
        
        if (error) {
          logger.warn('[useAuth] Subscription status error:', error);
          
          // Si erreur d'authentification et on n'a pas encore retry
          if (error.message?.includes('401') && retryCount < 2) {
            logger.info('[useAuth] Retrying subscription fetch after auth error');
            setTimeout(() => fetchSubscription(retryCount + 1), 1000);
            return;
          }
          throw error;
        }
        
        if (data?.status) {
          setSubscriptionStatus(data.status);
          
          // Mapping robuste du plan
          let plan = data.plan_type || data.plan || 'essentiel';
          if (data.plan_id && !plan) {
            if (data.plan_id.includes('pro')) plan = 'pro';
            else if (data.plan_id.includes('premium')) plan = 'premium';
            else plan = 'essentiel';
          }
          
          setSubscriptionPlan(plan);
          logger.info('[useAuth] Subscription loaded:', { status: data.status, plan });
        } else {
          logger.info('[useAuth] No active subscription found');
          setSubscriptionStatus('inactive');
          setSubscriptionPlan(null);
        }
        
      } catch (error) {
        logger.error('[useAuth] Failed to fetch subscription:', error);
        
        // En cas d'erreur, ne pas immédiatement rediriger vers subscribe
        // Garder le dernier statut connu pendant quelques minutes
        const lastSuccessfulCheck = localStorage.getItem(`subscription_check_${user.id}`);
        const now = Date.now();
        
        if (lastSuccessfulCheck && (now - parseInt(lastSuccessfulCheck)) < 5 * 60 * 1000) {
          logger.info('[useAuth] Using cached subscription status due to recent success');
          // Garder le statut actuel et ne pas changer
          return;
        }
        
        // Si pas de statut récent, marquer comme inactif après plusieurs tentatives
        if (retryCount >= 2) {
          setSubscriptionStatus('inactive');
          setSubscriptionPlan(null);
        } else {
          // Retry après un délai
          setTimeout(() => fetchSubscription(retryCount + 1), 2000);
          return;
        }
      } finally {
        setSubscriptionLoading(false);
      }
    };
    
    // Marquer un check réussi
    const markSuccessfulCheck = () => {
      if (user?.id && subscriptionStatus === 'active') {
        localStorage.setItem(`subscription_check_${user.id}`, Date.now().toString());
      }
    };
    
    fetchSubscription();
    markSuccessfulCheck();
    
    // Vérification périodique toutes les 10 minutes
    const intervalId = setInterval(() => {
      if (user?.id && user.user_type === 'doctor') {
        fetchSubscription();
      }
    }, 10 * 60 * 1000);
    
    // Écouter l'événement de refresh manuel
    const handleSubscriptionRefresh = () => {
      if (user?.id && user.user_type === 'doctor') {
        logger.info('[useAuth] Manual subscription refresh triggered');
        fetchSubscription();
      }
    };
    
    window.addEventListener('subscription-refresh', handleSubscriptionRefresh);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('subscription-refresh', handleSubscriptionRefresh);
    };
  }, [user?.id, user?.user_type, supabase, subscriptionStatus]);

  // Helper pour activer/désactiver les features selon le plan
  const hasFeature = useCallback((feature: string) => {
    if (user?.user_type !== 'doctor') return true;
    if (subscriptionPlan === 'premium') return true;
    if (subscriptionPlan === 'pro') {
      // Features Pro (sans les demandes urgentes qui sont uniquement Premium)
      const proFeatures = [
        'priorite', 'analytics', 'facturation', 'calendar', 'support-prioritaire',
        'invoices', 'premium_support', 'premium_api', 'premium_features'
      ];
      return proFeatures.includes(feature) || feature === 'essentiel';
    }
    // Essentiel
    return feature === 'essentiel';
  }, [user, subscriptionPlan]);

  const isSubscribed = useCallback(() => {
    // Seuls les médecins sont concernés par l'abonnement
    if (user?.user_type !== 'doctor') return true;
    
    // Si on est en train de charger, considérer comme abonné pour éviter les redirections
    if (subscriptionLoading) return true;
    
    // États d'abonnement valides
    const validStatuses = ['active', 'trialing', 'past_due'];
    
    if (validStatuses.includes(subscriptionStatus)) {
      return true;
    }
    
    // Grâce périodique si le statut est null/undefined (problème technique)
    if (!subscriptionStatus && user?.id) {
      const lastSuccessfulCheck = localStorage.getItem(`subscription_check_${user.id}`);
      if (lastSuccessfulCheck) {
        const timeSince = Date.now() - parseInt(lastSuccessfulCheck);
        // Grâce de 30 minutes pour les problèmes techniques
        if (timeSince < 30 * 60 * 1000) {
          logger.info('[useAuth] Using grace period for subscription check');
          return true;
        }
      }
    }
    
    // Vérification finale : si 'inactive', certainement pas abonné
    return subscriptionStatus !== 'inactive' && subscriptionStatus !== 'canceled';
  }, [user, subscriptionStatus, subscriptionLoading]);

  // Fonction pour forcer un refresh de l'abonnement
  const refreshSubscription = useCallback(() => {
    if (user?.id && user.user_type === 'doctor') {
      logger.info('[useAuth] Manual subscription refresh requested');
      const event = new CustomEvent('subscription-refresh');
      window.dispatchEvent(event);
    }
  }, [user]);

  const isAdmin = useCallback(() => {
    return user?.user_type === "admin";
  }, [user]);

  const isDoctor = useCallback(() => {
    return user?.user_type === "doctor";
  }, [user]);

  const isEstablishment = useCallback(() => {
    return user?.user_type === "establishment";
  }, [user]);

  const isEmailConfirmed = useCallback(() => {
    return !!user?.email_confirmed_at;
  }, [user]);

  const contextValue = useMemo<AuthContextType & {
    isSubscribed: () => boolean;
    refreshSubscription: () => void;
    subscriptionStatus: typeof subscriptionStatus;
    subscriptionLoading: boolean;
    subscriptionPlan: typeof subscriptionPlan;
    hasFeature: typeof hasFeature;
  }>(
    () => ({
      user,
      profile: user?.profile || null,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile,
      isAdmin,
      isDoctor,
      isEstablishment,
      isEmailConfirmed,
      getDashboardRoute,
      redirectToDashboard,
      isSubscribed,
      refreshSubscription,
      subscriptionStatus,
      subscriptionLoading,
      subscriptionPlan,
      hasFeature,
    }),
    [
      user,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile,
      isAdmin,
      isDoctor,
      isEstablishment,
      isEmailConfirmed,
      getDashboardRoute,
      redirectToDashboard,
      isSubscribed,
      refreshSubscription,
      subscriptionStatus,
      subscriptionLoading,
      subscriptionPlan,
      hasFeature,
    ]
  );

  console.log(
    "🎨 AuthProvider rendering, loading:",
    loading,
    "user:",
    user?.email || "none"
  );
  logger.info("[useAuth] contextValue:", contextValue);
  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// Export the hook with proper name to avoid Fast Refresh issues
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export { AuthContext };
