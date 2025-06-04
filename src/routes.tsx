import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

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
import AccountActivation from "@/pages/AccountActivation"; // À créer après

// Composant de protection des routes
const ProtectedRoute = ({
  children,
  requiredUserType = null,
  requireVerified = true,
  requireActive = true,
  requireComplete = false,
}) => {
  const { user, loading, getDashboardRoute } = useAuth();

  // Affichage du loader pendant le chargement
  if (loading) {
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

  // MODIFICATION: Utiliser email_confirmed_at au lieu de is_verified
  if (requireVerified && !user.email_confirmed_at) {
    return <Navigate to="/verify-email" replace />;
  }

  // MODIFICATION: Simplifier la vérification d'activation (optionnel pour l'instant)
  // if (requireActive && !user.profile?.is_active) {
  //   return <Navigate to="/account-activation" replace />;
  // }

  // Vérification du profil complet (pour certaines pages)
  if (requireComplete && !isProfileComplete(user)) {
    return <Navigate to="/profile/complete" replace />;
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

  // MODIFICATION: Si connecté et email confirmé, rediriger vers dashboard
  if (user && user.email_confirmed_at) {
    return <Navigate to={getDashboardRoute()} replace />;
  }

  return children;
};

// Fonction utilitaire pour vérifier si le profil est complet
const isProfileComplete = (user) => {
  if (!user) return false;

  const profile = user.profile;
  if (!profile) return false;

  // Vérifications communes
  if (!profile.first_name || !profile.last_name) return false;

  // Vérifications spécifiques selon le type
  if (user.user_type === "doctor") {
    return !!profile.specialty;
  } else if (user.user_type === "establishment") {
    return !!profile.establishment_name;
  }

  return true;
};

export default function AppRoutes() {
  return (
    <Routes>
      {/* Page d'accueil - Publique */}
      <Route path="/" element={<Index />} />

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
          <ProtectedRoute requiredUserType="doctor">
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/create-vacation"
        element={
          <ProtectedRoute requiredUserType="doctor" requireComplete={true}>
            <CreateVacation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/manage-vacations"
        element={
          <ProtectedRoute requiredUserType="doctor" requireComplete={true}>
            <ManageVacations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/vacation/:vacationId"
        element={
          <ProtectedRoute requiredUserType="doctor">
            <VacationDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/vacation/:vacationId/edit"
        element={
          <ProtectedRoute requiredUserType="doctor" requireComplete={true}>
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

      {/* Pages de paiement */}
      <Route
        path="/payment-success"
        element={
          <ProtectedRoute>
            <PaymentSuccess />
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
