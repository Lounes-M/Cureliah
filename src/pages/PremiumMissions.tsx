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

  return <PremiumDashboardUrgentRequests doctorId={user.id} />;
};

export default PremiumMissions;
