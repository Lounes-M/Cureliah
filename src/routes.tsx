import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Pages existantes
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DoctorDashboard from "./pages/DoctorDashboard";
import EstablishmentDashboard from "./pages/EstablishmentDashboard";
import EstablishmentSearch from "./pages/EstablishmentSearch";
import EstablishmentProfile from "./pages/EstablishmentProfile";
import CreateVacation from "./pages/CreateVacation";
import ManageVacations from "./pages/ManageVacations";
import VacationDetails from "./pages/VacationDetails";
import VacationSearch from "./pages/VacationSearch";
import MyBookings from "./pages/MyBookings";
import ProfileComplete from "./pages/ProfileComplete";
import PaymentSuccess from "./pages/PaymentSuccess";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import DoctorCreateProfile from "./pages/doctor/CreateProfile";
import EstablishmentCreateProfile from "./pages/establishment/CreateProfile";

// Nouvelles pages
import VerifyEmail from "./pages/VerifyEmail";
import AccountActivation from "@/pages/AccountActivation";
import LegalPage from "@/pages/LegalPage";
import Contact from "@/pages/Contact"; // 👈 Ajout de la page de contact
import PaymentCheckout from "./pages/PaymentCheckout";
import Subscribe from "./pages/Subscribe";

// Hook personnalisé pour vérifier le profil complet
const useProfileComplete = (user) => {
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfileComplete = async () => {
      if (!user) {
        setIsComplete(false);
        setLoading(false);
        return;
      }

      try {
        let result;

        // Ajouter un timeout et une gestion d'erreur améliorée
        const queryPromise =
          user.user_type === "doctor"
            ? supabase
                .from("doctor_profiles")
                .select("first_name, last_name, speciality")
                .eq("id", user.id)
                .single()
            : supabase
                .from("establishment_profiles")
                .select("name")
                .eq("id", user.id)
                .single();

        // Timeout de 5 secondes
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 5000)
        );

        result = await Promise.race([queryPromise, timeoutPromise]);

        if (result?.error) {
          if (result.error.code === "PGRST116") {
            // Aucun profil trouvé
            console.log("🔍 No profile found in database");
            setIsComplete(false);
          } else {
            console.error("🚨 Database error:", result.error);
            setIsComplete(false);
          }
        } else if (result?.data) {
          // Vérifier selon le type d'utilisateur
          if (user.user_type === "doctor") {
            const isProfileComplete = !!(
              result.data.first_name &&
              result.data.last_name &&
              result.data.speciality
            );
            console.log("👨‍⚕️ Doctor profile check:", {
              first_name: !!result.data.first_name,
              last_name: !!result.data.last_name,
              speciality: !!result.data.speciality,
              isComplete: isProfileComplete,
            });
            setIsComplete(isProfileComplete);
          } else if (user.user_type === "establishment") {
            const isProfileComplete = !!result.data.name;
            console.log("🏥 Establishment profile check:", {
              name: !!result.data.name,
              isComplete: isProfileComplete,
            });
            setIsComplete(isProfileComplete);
          }
        } else {
          console.log("❓ No data returned from query");
          setIsComplete(false);
        }
      } catch (error) {
        if (error.message === "Timeout") {
          console.log("⏰ Profile check timeout - assuming profile exists");
          // En cas de timeout, on assume que le profil existe pour éviter les redirections
          setIsComplete(true);
        } else {
          console.error("💥 Error checking profile complete:", error);
          setIsComplete(false);
        }
      } finally {
        setLoading(false);
      }
    };

    checkProfileComplete();
  }, [user]);

  return { isComplete, loading };
};

// Composant de protection des routes
const ProtectedRoute = ({
  children,
  requiredUserType = null,
  requireVerified = true,
  requireActive = true,
  requireComplete = false,
  requireSubscription = false, // Ajout pour la protection abonnement
}) => {
  const { user, loading, getDashboardRoute, isSubscribed, subscriptionLoading } = useAuth();
  const { isComplete: profileComplete, loading: profileLoading } =
    useProfileComplete(user);
  const location = window.location.pathname;

  // Affichage du loader pendant le chargement
  if (loading || (requireComplete && profileLoading) || (requireSubscription && subscriptionLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-xl font-bold text-gray-700">Cureliah</span>
          </div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Redirection si pas connecté
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Vérification du type d'utilisateur
  if (requiredUserType && user.user_type !== requiredUserType) {
    // Rediriger vers le bon dashboard selon le type d'utilisateur
    return <Navigate to={getDashboardRoute()} replace />;
  }

  // Vérification de l'email confirmé
  if (requireVerified && !user.email_confirmed_at) {
    return <Navigate to="/verify-email" replace />;
  }

  // Vérification du profil complet
  if (requireComplete && !profileComplete) {
    return <Navigate to="/profile/complete" replace />;
  }

  // Protection stricte par abonnement (pour les médecins)
  if (
    requireSubscription &&
    user.user_type === 'doctor' &&
    !isSubscribed() &&
    location !== '/subscribe' &&
    location !== '/profile/complete'
  ) {
    return <Navigate to="/subscribe" replace />;
  }

  return children;
};

// Routes d'authentification (redirection si déjà connecté)
const AuthRoute = ({ children }) => {
  const { user, loading, getDashboardRoute } = useAuth();

  // Attendre le chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si connecté et email confirmé, rediriger vers dashboard
  if (user && user.email_confirmed_at) {
    return <Navigate to={getDashboardRoute()} replace />;
  }

  return children;
};

export default function AppRoutes() {
  return (
    <Routes>
      {/* Page d'accueil - Publique */}
      <Route path="/" element={<Index />} />

      {/* 👇 NOUVELLES ROUTES PUBLIQUES */}
      <Route path="/legal" element={<LegalPage />} />
      <Route path="/contact" element={<Contact />} />

      {/* Pages d'authentification */}
      <Route
        path="/auth"
        element={
          <AuthRoute>
            <Auth />
          </AuthRoute>
        }
      />

      {/* Pages de vérification - Accessibles aux utilisateurs connectés non vérifiés */}
      <Route
        path="/verify-email"
        element={
          <ProtectedRoute requireVerified={false} requireActive={false}>
            <VerifyEmail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account-activation"
        element={
          <ProtectedRoute requireActive={false}>
            <AccountActivation />
          </ProtectedRoute>
        }
      />

      {/* Pages de completion de profil */}
      <Route
        path="/profile/complete"
        element={
          <ProtectedRoute requireComplete={false}>
            <ProfileComplete />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/create-profile"
        element={
          <ProtectedRoute requiredUserType="doctor" requireComplete={false}>
            <DoctorCreateProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/establishment/create-profile"
        element={
          <ProtectedRoute
            requiredUserType="establishment"
            requireComplete={false}
          >
            <EstablishmentCreateProfile />
          </ProtectedRoute>
        }
      />

      {/* Routes protégées - Docteur */}
      <Route
        path="/doctor/dashboard"
        element={
          <ProtectedRoute requiredUserType="doctor" requireSubscription={true}>
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/create-vacation"
        element={
          <ProtectedRoute requiredUserType="doctor" requireComplete={true} requireSubscription={true}>
            <CreateVacation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/manage-vacations"
        element={
          <ProtectedRoute requiredUserType="doctor" requireComplete={true} requireSubscription={true}>
            <ManageVacations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/vacation/:vacationId"
        element={
          <ProtectedRoute requiredUserType="doctor" requireSubscription={true}>
            <VacationDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/vacation/:vacationId/edit"
        element={
          <ProtectedRoute requiredUserType="doctor" requireComplete={true} requireSubscription={true}>
            <CreateVacation />
          </ProtectedRoute>
        }
      />

      {/* Routes protégées - Établissement */}
      <Route
        path="/establishment/dashboard"
        element={
          <ProtectedRoute requiredUserType="establishment">
            <EstablishmentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/establishment/search"
        element={
          <ProtectedRoute requiredUserType="establishment">
            <EstablishmentSearch />
          </ProtectedRoute>
        }
      />
      <Route
        path="/establishment/profile"
        element={
          <ProtectedRoute requiredUserType="establishment">
            <EstablishmentProfile />
          </ProtectedRoute>
        }
      />

      {/* Routes mixtes - Accessibles aux docteurs et établissements */}
      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <VacationSearch />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vacation-search"
        element={
          <ProtectedRoute>
            <VacationSearch />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <MyBookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-bookings"
        element={
          <ProtectedRoute>
            <MyBookings />
          </ProtectedRoute>
        }
      />

      {/* NOUVELLES ROUTES AJOUTÉES - Détails de vacation accessibles à tous */}
      <Route
        path="/vacation/:id"
        element={
          <ProtectedRoute>
            <VacationDetails />
          </ProtectedRoute>
        }
      />
      
      {/* Route alternative pour établissements */}
      <Route
        path="/establishment/vacation/:id"
        element={
          <ProtectedRoute requiredUserType="establishment">
            <VacationDetails />
          </ProtectedRoute>
        }
      />

      {/* Pages de paiement */}
      <Route
        path="/payment-success"
        element={
          <ProtectedRoute>
            <PaymentSuccess />
          </ProtectedRoute>
        }
      />
      {/* Page de paiement dédiée */}
      <Route
        path="/payment/:bookingId"
        element={
          <ProtectedRoute>
            <PaymentCheckout />
          </ProtectedRoute>
        }
      />

      {/* Page d'abonnement */}
      <Route
        path="/subscribe"
        element={
          <ProtectedRoute requiredUserType="doctor">
            <Subscribe />
          </ProtectedRoute>
        }
      />

      {/* Routes admin */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredUserType="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Route 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export { ProtectedRoute };