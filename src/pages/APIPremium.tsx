import React from 'react';
import { useAuth } from '../hooks/useAuth';

const APIPremium: React.FC = () => {
  const { hasFeature } = useAuth();

  if (!hasFeature('premium_api')) {
    return <div>Accès réservé aux abonnés Premium.</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">API & Webhooks Premium</h1>
      <p className="mb-4">Générez vos clés API, configurez vos webhooks, et accédez à l’intégration complète avec vos outils.</p>
      {/* TODO: Génération de clé API, gestion des webhooks, documentation intégrée */}
      <div className="bg-gray-100 p-4 rounded">Module en cours d’implémentation…</div>
    </div>
  );
};

export default APIPremium;
