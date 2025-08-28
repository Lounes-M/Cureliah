import React, { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logger } from '@/services/logger';

interface ProtectedRouteProps {
  requiredUserType?: "doctor" | "establishment" | "admin";
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredUserType, children }) => {
  const { user, loading, isSubscribed, subscriptionLoading, subscriptionStatus, subscriptionPlan, refreshSubscription } = useAuth();
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefreshSubscription = async () => {
    setIsRefreshing(true);
    refreshSubscription();
    
    // Attendre un peu puis vérifier à nouveau
    setTimeout(() => {
      setIsRefreshing(false);
    }, 3000);
  };

  if (loading || subscriptionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-medical-blue" />
      </div>
    );
  }

  if (!user) {
    logger.info('Pas d\'utilisateur, redirection vers /auth', { from: location.pathname, component: 'ProtectedRoute', action: 'redirect_auth' });
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requiredUserType && user.user_type !== requiredUserType) {
    logger.warn('Type utilisateur incorrect, redirection vers /', {
      userType: user.user_type,
      requiredType: requiredUserType,
      component: 'ProtectedRoute',
      action: 'redirect_home'
    });
    return <Navigate to="/" replace />;
  }

  // Si médecin, vérifier l'abonnement avec interface de retry
  if (requiredUserType === "doctor" && !isSubscribed()) {
    logger.warn('Médecin non abonné, affichage interface vérification', {
      subscriptionStatus,
      isSubscribed: isSubscribed(),
      subscriptionLoading,
      userEmail: user.email,
      component: 'ProtectedRoute',
      action: 'subscription_check'
    });

    // Afficher une interface de diagnostic avant redirection
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="w-5 h-5" />
              Vérification de l'abonnement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Statut :</strong> {subscriptionStatus || 'Non déterminé'}</p>
              <p><strong>Plan :</strong> {subscriptionPlan || 'Aucun'}</p>
              <p><strong>Utilisateur :</strong> {user.email}</p>
            </div>
            
            <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded">
              <p>Si vous venez de souscrire un abonnement, il peut y avoir un délai de synchronisation.</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button 
                onClick={handleRefreshSubscription} 
                disabled={isRefreshing}
                variant="outline"
                className="w-full"
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Vérification en cours...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Vérifier à nouveau
                  </>
                )}
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/subscribe'} 
                className="w-full"
              >
                Souscrire un abonnement
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  logger.debug('Accès autorisé', { userType: user.user_type, requiredType: requiredUserType, component: 'ProtectedRoute', action: 'access_granted' });
  return <>{children}</>;
};

export default ProtectedRoute;
