import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';

// Lazy imports for heavy components
const EstablishmentDashboardTabs = React.lazy(() => 
  import('@/components/establishment/EstablishmentDashboardTabs')
);

interface ExtendedProfile {
  establishment_name?: string;
  logo_url?: string;
  type?: string;
  user_type?: "doctor" | "establishment" | "admin";
}

const EstablishmentDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const extendedProfile = profile as ExtendedProfile;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="flex items-center justify-center h-96">
          <Card className="p-8 text-center shadow-lg">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <div className="text-lg font-medium text-gray-900 mb-2">
              Accès restreint
            </div>
            <div className="text-gray-600">
              Veuillez vous connecter pour accéder au tableau de bord
            </div>
            <Button 
              onClick={() => window.location.href = "/auth?type=establishment"} 
              className="mt-4"
            >
              Se connecter
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (profile && profile.user_type !== "establishment") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="flex items-center justify-center h-96">
          <Card className="p-8 text-center shadow-lg">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <div className="text-lg font-medium text-gray-900 mb-2">
              Accès réservé aux établissements
            </div>
            <div className="text-gray-600">
              Votre compte n'a pas les permissions nécessaires
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <React.Suspense 
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Chargement du tableau de bord...</span>
            </div>
          }
        >
          <EstablishmentDashboardTabs 
            user={user} 
            profile={extendedProfile} 
          />
        </React.Suspense>
      </div>
    </div>
  );
};

export default EstablishmentDashboard;
