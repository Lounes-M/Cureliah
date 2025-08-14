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
  console.warn("🚨🚨🚨 PROTECTED ROUTE DEBUG 🚨🚨🚨");
  console.warn("User:", user);
  console.warn("Subscription Status:", subscriptionStatus);
  console.warn("Subscription Plan:", subscriptionPlan);
  console.warn("Is Subscribed:", isSubscribed());
  console.warn("Required User Type:", requiredUserType);
  console.warn("🚨🚨🚨 FIN DEBUG 🚨🚨🚨");

  if (loading || subscriptionLoading) {
    console.log("[ProtectedRoute] En chargement...", { loading, subscriptionLoading });
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    console.log("[ProtectedRoute] Pas d'utilisateur, redirection vers /auth");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requiredUserType && user.user_type !== requiredUserType) {
    console.log("[ProtectedRoute] Type utilisateur incorrect, redirection vers /");
    return <Navigate to="/" replace />;
  }

  // Si médecin, vérifier l'abonnement
  if (requiredUserType === "doctor" && !isSubscribed()) {
    console.log("[ProtectedRoute] MÉDECIN NON ABONNÉ - Redirection vers /subscribe");
    console.log("[ProtectedRoute] Détails:", {
      subscriptionStatus,
      isSubscribed: isSubscribed(),
      subscriptionLoading
    });
    return <Navigate to="/subscribe" state={{ from: location }} replace />;
  }

  console.log("[ProtectedRoute] Accès autorisé");
  return <>{children}</>;
};

export default ProtectedRoute;
