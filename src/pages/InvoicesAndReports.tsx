import React from 'react';
import { useAuth } from '../hooks/useAuth';

const InvoicesAndReports: React.FC = () => {
  const { hasFeature } = useAuth();

  if (!hasFeature('invoices')) {
    return <div>Accès réservé aux abonnés Pro et Premium.</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Factures & Rapports</h1>
      <p className="mb-4">Retrouvez ici vos factures générées automatiquement via Stripe, ainsi que vos rapports d'activité.</p>
      {/* TODO: Lister les factures Stripe, bouton de téléchargement, affichage des rapports */}
      <div className="bg-gray-100 p-4 rounded">Module en cours d’implémentation…</div>
    </div>
  );
};

export default InvoicesAndReports;
