import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate, useLocation } from "react-router-dom";

interface User {
  id: string;
  email: string;
  user_type: "doctor" | "establishment" | "admin";
  email_confirmed_at?: string;
  user_metadata?: {
    user_type?: "doctor" | "establishment" | "admin";
  };
  profile?: {
    first_name?: string;
    last_name?: string;
    specialty?: string;
    establishment_name?: string;
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
  isEmailConfirmed: () => boolean;
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

  // Fetch user profile function
  const fetchUserProfile = useCallback(async (authUser: any) => {
    try {
      console.log(
        "Fetching profile for user:",
        authUser.id,
        authUser.email,
        "Email confirmed:",
        !!authUser.email_confirmed_at
      );

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (profileError && profileError.code === "PGRST116") {
        console.log("Profile not found, using auth user metadata");
        const userType = authUser.user_metadata?.user_type || "doctor";
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

        setUser(userData);
        setLoading(false);
        setInitialLoad(false);
        return;
      }

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        throw profileError;
      }

      let userData: User = {
        id: authUser.id,
        email: authUser.email,
        user_type: profile.user_type,
        email_confirmed_at: authUser.email_confirmed_at,
        user_metadata: {
          user_type: profile.user_type,
        },
        profile: {
          first_name: profile.first_name,
          last_name: profile.last_name,
          user_type: profile.user_type,
        },
      };

      // Get specialized profile
      if (profile.user_type === "doctor") {
        const { data: doctorProfile, error: doctorError } = await supabase
          .from("doctor_profiles")
          .select("*")
          .eq("id", authUser.id)
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
            .eq("id", authUser.id)
            .single();

        if (!establishmentError && establishmentProfile) {
          userData.profile = {
            ...userData.profile,
            establishment_name: establishmentProfile.name,
          };
        }
      }

      console.log("User data loaded:", {
        id: userData.id,
        email: userData.email,
        user_type: userData.user_type,
        email_confirmed: !!userData.email_confirmed_at,
      });

      setUser(userData);
    } catch (error) {
      console.error("Error fetching user profile:", error);

      const userType = authUser.user_metadata?.user_type || "doctor";
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

      setUser(fallbackUser);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, []);

  // Initialize auth session
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (mounted) {
          if (session) {
            await fetchUserProfile(session.user);
          } else {
            setLoading(false);
            setInitialLoad(false);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) {
          setLoading(false);
          setInitialLoad(false);
        }
      }
    };

    initAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);

      if (mounted) {
        if (session) {
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
          setLoading(false);
          setInitialLoad(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (loading || initialLoad) return;

    const currentPath = location.pathname;
    const isAuthPage = authPages.some((page) => currentPath.includes(page));
    const isPublicPage = publicPages.includes(currentPath);
    const isSpecialPage = specialPages.some((page) =>
      currentPath.includes(page)
    );

    // No user logged in
    if (!user) {
      if (!isPublicPage && !isAuthPage && !isSpecialPage) {
        navigate("/auth");
      }
      return;
    }

    // User logged in but email not confirmed
    if (!user.email_confirmed_at) {
      if (!isPublicPage && !isSpecialPage) {
        navigate("/verify-email");
        return;
      }
    }

    // Email confirmed but on auth page
    if (user.email_confirmed_at && isAuthPage) {
      const dashboardRoute = getDashboardRoute();
      navigate(dashboardRoute);
      return;
    }

    // Check dashboard permissions
    if (currentPath.includes("/doctor/") && user.user_type !== "doctor") {
      const dashboardRoute = getDashboardRoute();
      navigate(dashboardRoute);
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
      const dashboardRoute = getDashboardRoute();
      navigate(dashboardRoute);
      toast({
        title: "Accès refusé",
        description:
          "Vous n'avez pas les permissions pour accéder à cette page",
        variant: "destructive",
      });
      return;
    }

    if (currentPath.includes("/admin/") && user.user_type !== "admin") {
      const dashboardRoute = getDashboardRoute();
      navigate(dashboardRoute);
      toast({
        title: "Accès refusé",
        description:
          "Vous n'avez pas les permissions pour accéder à cette page",
        variant: "destructive",
      });
      return;
    }
  }, [
    user,
    loading,
    location.pathname,
    initialLoad,
    navigate,
    toast,
    authPages,
    publicPages,
    specialPages,
  ]);

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
    navigate(dashboardRoute);
  }, [getDashboardRoute, navigate]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          console.log(
            "User signed in:",
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
      } catch (error: any) {
        console.error("Error signing in:", error);

        let errorMessage = "Une erreur est survenue lors de la connexion";

        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Email ou mot de passe incorrect";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage =
            "Veuillez confirmer votre email avant de vous connecter";
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
    },
    [toast]
  );

  const signUp = useCallback(
    async (
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
              first_name: profileData.firstName,
              last_name: profileData.lastName,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          console.log(
            "User signed up:",
            data.user.email,
            "Needs confirmation:",
            !data.user.email_confirmed_at
          );

          if (data.user.id) {
            try {
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
                console.warn(
                  "Could not create profile immediately:",
                  profileInsertError
                );
              }

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
                  console.warn(
                    "Could not create doctor profile immediately:",
                    doctorError
                  );
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
                  console.warn(
                    "Could not create establishment profile immediately:",
                    establishmentError
                  );
                }
              }
            } catch (profileError) {
              console.warn(
                "Profile creation error (non-blocking):",
                profileError
              );
            }
          }

          toast({
            title: "Inscription réussie",
            description:
              "Votre compte a été créé. Vérifiez votre email pour confirmer votre compte.",
            variant: "default",
          });
        }

        return { data, error: null };
      } catch (error: any) {
        console.error("Error signing up:", error);

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
    },
    [toast]
  );

  const signOut = useCallback(async () => {
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
  }, [navigate, toast]);

  const updateProfile = useCallback(
    async (profileData: any) => {
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
    },
    [user, fetchUserProfile, toast]
  );

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

  const contextValue = useMemo<AuthContextType>(
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
    ]
  );

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
