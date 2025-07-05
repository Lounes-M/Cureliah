import React from 'react';
import { useAuth } from '../hooks/useAuth';

const SupportPremiumEstablishment: React.FC = () => {
  const { hasFeature } = useAuth();

  if (!hasFeature('premium_support')) {
    return <div>Accès réservé aux abonnés Premium.</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Support prioritaire & Manager dédié (Établissement)</h1>
      <p className="mb-4">Contactez votre manager dédié, accédez au support 24/7, et bénéficiez de formations personnalisées.</p>
      <div className="bg-gray-100 p-4 rounded">Module en cours d’implémentation…</div>
    </div>
  );
};

export default SupportPremiumEstablishment;
