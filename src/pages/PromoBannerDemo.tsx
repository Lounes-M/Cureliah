import React, { useState } from 'react';
import { PromoBanner } from '@/components/PromoBanner';

const PromoBannerDemo: React.FC = () => {
  const [mockUser, setMockUser] = useState<any>(null);

  const testUsers = [
    {
      id: 'user1',
      label: 'Visiteur non-connecté',
      user: null
    },
    {
      id: 'user2', 
      label: 'Médecin sans abonnement',
      user: {
        id: 'doctor1',
        email: 'doctor@example.com',
        user_metadata: { user_type: 'doctor' }
      }
    },
    {
      id: 'user3',
      label: 'Médecin avec abonnement actif',
      user: {
        id: 'doctor2',
        email: 'doctor@example.com',
        user_metadata: { user_type: 'doctor' },
        subscription_status: 'active'
      }
    },
    {
      id: 'user4',
      label: 'Établissement connecté',
      user: {
        id: 'establishment1',
        email: 'establishment@example.com',
        user_metadata: { user_type: 'establishment' }
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Test du Banner Promo WELCOME100
          </h1>
          <p className="text-gray-600">
            Test de l'affichage conditionnel selon le type d'utilisateur
          </p>
        </div>

        {/* Sélecteur de type d'utilisateur */}
        <div className="bg-white p-6 border border-gray-200 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Simuler un type d'utilisateur
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testUsers.map((testUser) => (
              <button
                key={testUser.id}
                onClick={() => setMockUser(testUser.user)}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  JSON.stringify(mockUser) === JSON.stringify(testUser.user)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{testUser.label}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {testUser.user ? (
                    <>
                      Type: {testUser.user.user_metadata?.user_type || 'non défini'}<br/>
                      Abonnement: {testUser.user.subscription_status || 'aucun'}
                    </>
                  ) : (
                    'Non connecté'
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Aperçu du banner selon l'utilisateur sélectionné */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Aperçu du banner (utilisateur sélectionné: {
              mockUser 
                ? `${mockUser.user_metadata?.user_type || 'inconnu'}`
                : 'visiteur'
            })
          </h2>
          
          {/* Test de visibilité avec usePromoBanner */}
          <div className="bg-white p-4 border border-gray-200 rounded-lg">
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Logique d'affichage:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• ✅ <strong>Affiche pour:</strong> Visiteurs non-connectés</li>
                <li>• ✅ <strong>Affiche pour:</strong> Médecins sans abonnement actif</li>
                <li>• ❌ <strong>Cache pour:</strong> Médecins avec abonnement actif</li>
                <li>• ❌ <strong>Cache pour:</strong> Établissements (tous types)</li>
              </ul>
            </div>

            {/* Simuler l'affichage conditionnel */}
            {(() => {
              // Reproduire la logique de usePromoBanner
              if (mockUser && mockUser.user_metadata?.user_type === 'establishment') {
                return (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    ❌ Banner caché : Utilisateur établissement
                  </div>
                );
              }

              if (mockUser && mockUser.user_metadata?.user_type === 'doctor' && mockUser.subscription_status === 'active') {
                return (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    ❌ Banner caché : Médecin avec abonnement actif
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-green-700">
                    ✅ Banner visible
                  </div>
                  <PromoBanner 
                    variant="inline" 
                    user={mockUser}
                  />
                </div>
              );
            })()}
          </div>
        </div>

        {/* Informations techniques */}
        <div className="bg-white p-6 border border-gray-200 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Informations techniques</h2>
          <div className="space-y-2 text-gray-600">
            <p><strong>Code promo:</strong> WELCOME100</p>
            <p><strong>Stripe Promo ID:</strong> promo_1RuwSNEL5OGpZLTYbh8L5YfT</p>
            <p><strong>Réduction:</strong> Premier mois gratuit (100% off)</p>
            <p><strong>Stockage:</strong> localStorage pour mémoriser la fermeture</p>
            <p><strong>Auto-hide:</strong> Après 3 jours si fermé</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoBannerDemo;
