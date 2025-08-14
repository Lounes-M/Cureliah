import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  requiredUserType?: "doctor" | "establishment" | "admin";
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredUserType, children }) => {
  const { user, loading, isSubscribed, subscriptionLoading, subscriptionStatus, subscriptionPlan } = useAuth();
  const location = useLocation();
  
  // FORCE AFFICHAGE DANS LA CONSOLE
  // TODO: Replace with logger.warn("🚨🚨🚨 PROTECTED ROUTE DEBUG 🚨🚨🚨");
  // TODO: Replace with logger.warn("User:", user);
  // TODO: Replace with logger.warn("Subscription Status:", subscriptionStatus);
  // TODO: Replace with logger.warn("Subscription Plan:", subscriptionPlan);
  // TODO: Replace with logger.warn("Is Subscribed:", isSubscribed(););
  // TODO: Replace with logger.warn("Required User Type:", requiredUserType);
  // TODO: Replace with logger.warn("🚨🚨🚨 FIN DEBUG 🚨🚨🚨");

  if (loading || subscriptionLoading) {
    // TODO: Replace with logger.info("[ProtectedRoute] En chargement...", { loading, subscriptionLoading });
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    // TODO: Replace with logger.info("[ProtectedRoute] Pas d'utilisateur, redirection vers /auth");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requiredUserType && user.user_type !== requiredUserType) {
    // TODO: Replace with logger.info("[ProtectedRoute] Type utilisateur incorrect, redirection vers /");
    return <Navigate to="/" replace />;
  }

  // Si médecin, vérifier l'abonnement
  if (requiredUserType === "doctor" && !isSubscribed()) {
    // TODO: Replace with logger.info("[ProtectedRoute] MÉDECIN NON ABONNÉ - Redirection vers /subscribe");
    console.log("[ProtectedRoute] Détails:", {
      subscriptionStatus,
      isSubscribed: isSubscribed(),
      subscriptionLoading
    });
    return <Navigate to="/subscribe" state={{ from: location }} replace />;
  }

  // TODO: Replace with logger.info("[ProtectedRoute] Accès autorisé");
  return <>{children}</>;
};

export default ProtectedRoute;
