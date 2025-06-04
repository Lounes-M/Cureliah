import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate, useLocation } from "react-router-dom";

interface User {
  id: string;
  email: string;
  user_type: "doctor" | "establishment" | "admin";
  user_metadata?: {
    user_type?: "doctor" | "establishment" | "admin";
  };
  profile?: {
    first_name?: string;
    last_name?: string;
    specialty?: string;
    establishment_name?: string;
    is_active?: boolean;
    is_verified?: boolean;
    user_type?: "doctor" | "establishment" | "admin";
  };
}

interface AuthContextType {
  user: User | null;
  profile: User["profile"] | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ data: any; error: any }>;
  signUp: (
    email: string,
    password: string,
    userType: "doctor" | "establishment",
    profileData: any
  ) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (profileData: any) => Promise<{ data: any; error: any }>;
  isAdmin: () => boolean;
  isDoctor: () => boolean;
  isEstablishment: () => boolean;
  isVerified: () => boolean;
  isActive: () => boolean;
  getDashboardRoute: () => string;
  redirectToDashboard: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Pages d'authentification où on doit rediriger après connexion
  const authPages = [
    "/auth",
    "/login",
    "/register",
    "/signin",
    "/signup",
    "/reset-password",
  ];

  // Pages publiques où on ne doit pas rediriger automatiquement
  const publicPages = ["/", "/about", "/contact", "/pricing", "/features"];

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
        setInitialLoad(false);
      }
    });

    // Listen for changes on auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
        setInitialLoad(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Gestion intelligente de la redirection
  useEffect(() => {
    // Ne pas rediriger pendant le chargement initial ou si pas d'utilisateur
    if (loading || !user || initialLoad) return;

    const currentPath = location.pathname;
    const isAuthPage = authPages.some((page) => currentPath.includes(page));
    const isPublicPage = publicPages.includes(currentPath);

    // Cas 1: Utilisateur sur une page d'auth -> rediriger vers dashboard
    if (isAuthPage) {
      redirectToDashboard();
      return;
    }

    // Cas 2: Utilisateur non vérifié -> permettre seulement certaines pages
    if (
      !user.profile?.is_verified &&
      !isPublicPage &&
      !currentPath.includes("/verify")
    ) {
      navigate("/verify-email");
      return;
    }

    // Cas 3: Utilisateur inactif -> rediriger vers page d'activation
    if (
      !user.profile?.is_active &&
      !isPublicPage &&
      !currentPath.includes("/activation")
    ) {
      navigate("/account-activation");
      return;
    }

    // Cas 4: Vérifier les permissions d'accès aux dashboards
    if (currentPath.includes("/doctor/") && user.user_type !== "doctor") {
      redirectToDashboard();
      toast({
        title: "Accès refusé",
        description:
          "Vous n'avez pas les permissions pour accéder à cette page",
        variant: "destructive",
      });
      return;
    }

    if (
      currentPath.includes("/establishment/") &&
      user.user_type !== "establishment"
    ) {
      redirectToDashboard();
      toast({
        title: "Accès refusé",
        description:
          "Vous n'avez pas les permissions pour accéder à cette page",
        variant: "destructive",
      });
      return;
    }

    if (currentPath.includes("/admin/") && user.user_type !== "admin") {
      redirectToDashboard();
      toast({
        title: "Accès refusé",
        description:
          "Vous n'avez pas les permissions pour accéder à cette page",
        variant: "destructive",
      });
      return;
    }
  }, [user, loading, location.pathname, initialLoad, navigate]);

  const fetchUserProfile = async (userId: string) => {
    try {
      // First get the base profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      // Si le profil n'existe pas, on utilise les métadonnées de l'utilisateur
      if (profileError) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("User not found");

        const userType = user.user_metadata?.user_type || "doctor";
        const userData: User = {
          id: userId,
          email: user.email || "",
          user_type: userType,
          user_metadata: {
            user_type: userType,
          },
          profile: {
            user_type: userType,
          },
        };

        setUser(userData);
        setLoading(false);
        setInitialLoad(false);
        return;
      }

      let userData: User = {
        id: userId,
        email: profile.email,
        user_type: profile.user_type,
        user_metadata: {
          user_type: profile.user_type,
        },
        profile: {
          first_name: profile.first_name,
          last_name: profile.last_name,
          is_active: profile.is_active,
          is_verified: profile.is_verified,
          user_type: profile.user_type,
        },
      };

      // Then get the specific profile based on user type
      if (profile.user_type === "doctor") {
        const { data: doctorProfile, error: doctorError } = await supabase
          .from("doctor_profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (!doctorError && doctorProfile) {
          userData.profile = {
            ...userData.profile,
            specialty: doctorProfile.speciality,
          };
        }
      } else if (profile.user_type === "establishment") {
        const { data: establishmentProfile, error: establishmentError } =
          await supabase
            .from("establishment_profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (!establishmentError && establishmentProfile) {
          userData.profile = {
            ...userData.profile,
            establishment_name: establishmentProfile.name,
          };
        }
      }

      setUser(userData);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Ne pas afficher de toast d'erreur car c'est un cas normal
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const getDashboardRoute = () => {
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
  };

  const redirectToDashboard = () => {
    const dashboardRoute = getDashboardRoute();
    navigate(dashboardRoute);
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await fetchUserProfile(data.user.id);

        // Toast de succès
        toast({
          title: "Connexion réussie",
          description: "Bienvenue ! Vous êtes maintenant connecté.",
          variant: "default",
        });
      }

      return { data, error: null };
    } catch (error: any) {
      console.error("Error signing in:", error);

      // Messages d'erreur personnalisés
      let errorMessage = "Une erreur est survenue lors de la connexion";

      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Email ou mot de passe incorrect";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Veuillez confirmer votre email avant de vous connecter";
      } else if (error.message.includes("Too many requests")) {
        errorMessage =
          "Trop de tentatives de connexion. Veuillez réessayer plus tard";
      }

      toast({
        title: "Erreur de connexion",
        description: errorMessage,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userType: "doctor" | "establishment",
    profileData: any
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: userType,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create base profile first using service role
        const { error: profileError } = await supabase.auth.admin.createUser({
          email,
          password,
          user_metadata: {
            user_type: userType,
          },
        });

        if (profileError) {
          console.error("Error creating base profile:", profileError);
          throw profileError;
        }

        // Create base profile
        const { error: profileInsertError } = await supabase
          .from("profiles")
          .insert([
            {
              id: data.user.id,
              email,
              user_type: userType,
              first_name: profileData.firstName,
              last_name: profileData.lastName,
            },
          ]);

        if (profileInsertError) {
          console.error("Error inserting profile:", profileInsertError);
          throw profileInsertError;
        }

        // Wait a moment to ensure the profile is created
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Create specific profile based on user type
        if (userType === "doctor") {
          const { error: doctorError } = await supabase
            .from("doctor_profiles")
            .insert([
              {
                id: data.user.id,
                speciality: profileData.specialty,
              },
            ]);

          if (doctorError) {
            console.error("Error creating doctor profile:", doctorError);
            throw doctorError;
          }
        } else if (userType === "establishment") {
          const { error: establishmentError } = await supabase
            .from("establishment_profiles")
            .insert([
              {
                id: data.user.id,
                name: profileData.establishmentName,
                establishment_type: profileData.establishmentType,
              },
            ]);

          if (establishmentError) {
            console.error(
              "Error creating establishment profile:",
              establishmentError
            );
            throw establishmentError;
          }
        }

        await fetchUserProfile(data.user.id);

        // Toast de succès pour l'inscription
        toast({
          title: "Inscription réussie",
          description:
            "Votre compte a été créé avec succès. Vérifiez votre email pour confirmer votre compte.",
          variant: "default",
        });
      }

      return { data, error: null };
    } catch (error: any) {
      console.error("Error signing up:", error);

      // Messages d'erreur personnalisés pour l'inscription
      let errorMessage = "Une erreur est survenue lors de l'inscription";

      if (error.message.includes("User already registered")) {
        errorMessage = "Un compte existe déjà avec cette adresse email";
      } else if (error.message.includes("Password should be at least")) {
        errorMessage = "Le mot de passe doit contenir au moins 6 caractères";
      } else if (error.message.includes("Invalid email")) {
        errorMessage = "Format d'email invalide";
      }

      toast({
        title: "Erreur d'inscription",
        description: errorMessage,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      navigate("/");

      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast({
        title: "Erreur de déconnexion",
        description:
          error.message || "Une erreur est survenue lors de la déconnexion",
        variant: "destructive",
      });
    }
  };

  const updateProfile = async (profileData: any) => {
    try {
      if (!user) throw new Error("No user logged in");

      const { error } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("id", user.id);

      if (error) throw error;

      await fetchUserProfile(user.id);

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès",
        variant: "default",
      });

      return { data: null, error: null };
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erreur de mise à jour",
        description:
          error.message ||
          "Une erreur est survenue lors de la mise à jour du profil",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const isAdmin = () => {
    return user?.user_type === "admin";
  };

  const isDoctor = () => {
    return user?.user_type === "doctor";
  };

  const isEstablishment = () => {
    return user?.user_type === "establishment";
  };

  const isVerified = () => {
    return user?.profile?.is_verified || false;
  };

  const isActive = () => {
    return user?.profile?.is_active || false;
  };

  const value = {
    user,
    profile: user?.profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    isAdmin,
    isDoctor,
    isEstablishment,
    isVerified,
    isActive,
    getDashboardRoute,
    redirectToDashboard,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
