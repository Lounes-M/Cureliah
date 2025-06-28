import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  requiredUserType?: "doctor" | "establishment" | "admin";
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredUserType, children }) => {
  const { user, loading, isSubscribed, subscriptionLoading, subscriptionStatus } = useAuth();
  const location = useLocation();
  console.log("[ProtectedRoute] user:", user, "subscriptionStatus:", subscriptionStatus, "isSubscribed:", isSubscribed());

  if (loading || subscriptionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requiredUserType && user.user_type !== requiredUserType) {
    // Redirige vers la page d'accueil si le type ne correspond pas
    return <Navigate to="/" replace />;
  }

  // Si médecin, vérifier l'abonnement
  if (requiredUserType === "doctor" && !isSubscribed()) {
    return <Navigate to="/subscribe" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
