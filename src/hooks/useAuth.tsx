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
import { useToast } from "@/components/ui/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import type { User as SupabaseUser } from '@supabase/supabase-js';

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
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

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
      console.log("🔍 fetchUserProfile started for:", authUser.email);

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

        console.log("📡 Querying profiles table...");

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
          console.log("Profile not found or timeout, using auth user metadata");
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

          console.log("✅ Setting fallback user data:", userData);
          setUser(userData);
          setLoading(false);
          setInitialLoad(false);
          return;
        }

        if (profileError) {
          console.error("❌ Database error:", profileError);
          throw profileError;
        }

        console.log("✅ Profile data received:", profile);

        // Vérifier que le profil est valide
        if (!isUserProfile(profile)) {
          console.error("❌ Invalid profile data:", profile);
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
        console.log("📡 Querying specialized profile for:", validProfile.user_type);

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
                console.log("✅ Doctor profile loaded with avatar:", doctorProfile.avatar_url);
              }
            }
          } catch (error) {
            console.log("⏰ Doctor profile query timeout, continuing without it");
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
                console.log("✅ Establishment profile loaded with avatar:", establishmentProfile.avatar_url);
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
        console.error("❌ Error fetching user profile:", error);

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

        console.log("⚠️ Using fallback user:", fallbackUser);
        setUser(fallbackUser);
      } finally {
        console.log("🏁 fetchUserProfile finished, setting loading to false");
        setLoading(false);
        setInitialLoad(false);
      }
    },
    [supabase]
  );

  // Initialize auth session
  useEffect(() => {
    console.log("🚀 Auth initialization started");
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log("📡 Getting Supabase session...");
        const {
          data: { session },
        } = await supabase.auth.getSession();

        console.log("📡 Session result:", session ? "Found" : "None");

        if (mounted) {
          if (session) {
            console.log("👤 User found in session, fetching profile...");
            await fetchUserProfile(session.user);
          } else {
            console.log("👤 No user in session, setting loading to false");
            setLoading(false);
            setInitialLoad(false);
          }
        }
      } catch (error) {
        console.error("❌ Auth initialization error:", error);
        if (mounted) {
          setLoading(false);
          setInitialLoad(false);
        }
      }
    };

    initAuth();

    // Listen for auth state changes
    console.log("👂 Setting up auth state listener...");
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth state changed:", event, session?.user?.email);

      if (mounted) {
        if (session) {
          console.log("👤 Session found, fetching profile...");
          await fetchUserProfile(session.user);
        } else {
          console.log("👤 No session, clearing user");
          setUser(null);
          setLoading(false);
          setInitialLoad(false);
        }
      }
    });

    return () => {
      console.log("🧹 Cleaning up auth initialization");
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
    console.log("🚀 Redirecting to dashboard:", dashboardRoute);
    navigate(dashboardRoute);
  }, [getDashboardRoute, navigate]);

  const signIn = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ data: unknown; error: Error | null }> => {
      try {
        console.log("🔐 Signing in user:", email);
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
        console.log("📝 Signing up user:", email, userType);
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
      console.log("🚪 Signing out user");
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

  console.log("[useAuth] Avant useEffect, user:", user);
  // Récupération du statut d'abonnement pour les médecins
  useEffect(() => {
    console.log("[useAuth] useEffect fetchSubscription triggered", user);
    const fetchSubscription = async () => {
      console.log("[useAuth] fetchSubscription called", user);
      if (!user?.id || user.user_type !== 'doctor') {
        setSubscriptionStatus(null);
        setSubscriptionPlan(null);
        return;
      }
      setSubscriptionLoading(true);
      try {
        console.log("[useAuth] fetchSubscription: avant appel invoke");
        const { data, error } = await supabase.functions.invoke('get-subscription-status');
        console.log("[useAuth] fetchSubscription: après appel invoke");
        console.log("[useAuth] Statut abonnement reçu du backend:", data, "Erreur:", error);
        if (!error && data?.status) {
          setSubscriptionStatus(data.status);
          // Mapping du plan à partir du Price ID ou du champ plan
          let plan = null;
          if (data.plan_id) {
            if (data.plan_id.includes('pro')) plan = 'pro';
            else if (data.plan_id.includes('premium')) plan = 'premium';
            else plan = 'essentiel';
          } else if (data.plan) {
            plan = data.plan;
          } else {
            plan = 'essentiel';
          }
          setSubscriptionPlan(plan);
        } else {
          setSubscriptionStatus(null);
          setSubscriptionPlan(null);
        }
      } catch (e) {
        setSubscriptionStatus(null);
        setSubscriptionPlan(null);
      } finally {
        setSubscriptionLoading(false);
      }
    };
    fetchSubscription();
  }, [user?.id, user?.user_type, supabase]);

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
    return subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
  }, [user, subscriptionStatus]);

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
  console.log("[useAuth] contextValue:", contextValue);
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
