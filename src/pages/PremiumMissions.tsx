import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import PremiumDashboardUrgentRequests from '@/components/dashboard/PremiumDashboardUrgentRequests';

const PremiumMissions: React.FC = () => {
  const { user } = useAuth();

  if (!user?.id) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Veuillez vous connecter pour accéder à cette section.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Missions Premium</h1>
        <p className="text-muted-foreground">
          Gérez vos demandes urgentes et missions premium en temps réel
        </p>
      </div>
      
      <PremiumDashboardUrgentRequests doctorId={user.id} />
    </div>
  );
};

export default PremiumMissions;
