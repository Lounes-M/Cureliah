
import { useState } from 'react';
import Header from '@/components/Header';
import EstablishmentTabsNavigation from '@/components/establishment/EstablishmentTabsNavigation';
import { useAuth } from '@/hooks/useAuth';

const EstablishmentDashboard = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (!user) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Veuillez vous connecter pour accéder au tableau de bord</div>
        </div>
      </div>
    );
  }

  // Check if user is establishment
  if (profile && profile.user_type !== 'establishment') {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Accès réservé aux établissements</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord - Établissement</h1>
          <p className="text-gray-600">Trouvez des médecins et gérez vos réservations</p>
        </div>

        <EstablishmentTabsNavigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
        />
      </div>
    </div>
  );
};

export default EstablishmentDashboard;
