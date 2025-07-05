import React from 'react';
import { useAuth } from '../hooks/useAuth';

const PremiumMissions: React.FC = () => {
  const { hasFeature } = useAuth();

  if (!hasFeature('premium_missions')) {
    return <div>Accès réservé aux abonnés Premium.</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Missions Exclusives Premium</h1>
      <p className="mb-4">Accédez en avant-première aux missions réservées aux membres Premium et bénéficiez d’opportunités exclusives.</p>
      {/* TODO: Lister les missions premium, filtres, badges, accès prioritaire */}
      <div className="bg-gray-100 p-4 rounded">Module en cours d’implémentation…</div>
    </div>
  );
};

export default PremiumMissions;
