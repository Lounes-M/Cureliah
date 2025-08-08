import React from 'react';
import { NotificationBell } from '@/components/notifications/UrgentNotificationDropdown';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

// Exemple d'intégration dans le header existant
export const ExampleHeaderWithNotifications: React.FC = () => {
  const { user } = useAuth();
  
  // Dans un vrai cas, on récupérerait le type d'utilisateur depuis le profil ou le context
  const userType = 'doctor'; // À adapter selon votre logique d'authentification

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">Cureliah</h1>
          </div>

          {/* Navigation et notifications */}
          <div className="flex items-center space-x-4">
            {/* Navigation links */}
            <nav className="hidden md:flex space-x-4">
              <Button variant="ghost" size="sm">Dashboard</Button>
              <Button variant="ghost" size="sm">Recherche</Button>
              <Button variant="ghost" size="sm">Profil</Button>
            </nav>

            {/* Notifications urgentes */}
            {user && (
              <NotificationBell
                userId={user.id}
                userType={userType as 'doctor' | 'establishment'}
                className="ml-4"
              />
            )}

            {/* User menu */}
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                {user?.email || 'Utilisateur'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// Exemple d'utilisation dans une page de dashboard médecin
export const ExampleDoctorDashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <ExampleHeaderWithNotifications />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Titre de la page */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Médecin</h1>
            <p className="text-gray-600">Gérez vos missions et demandes urgentes</p>
          </div>

          {/* Onglets ou sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Section principale */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Missions récentes</h2>
                {/* Contenu des missions */}
                <p className="text-gray-600">Liste des missions récentes...</p>
              </div>
            </div>

            {/* Sidebar avec demandes urgentes */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Demandes urgentes</h2>
                {/* Composant des demandes urgentes */}
                {user && (
                  <div className="h-96">
                    {/* Ici on intégrerait PremiumDashboardUrgentRequests */}
                    <p className="text-sm text-gray-600">
                      Les demandes urgentes apparaîtront ici en temps réel.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Exemple d'utilisation dans une page de dashboard établissement
export const ExampleEstablishmentDashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <ExampleHeaderWithNotifications />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Titre avec bouton de création de demande urgente */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Établissement</h1>
              <p className="text-gray-600">Gérez votre personnel et vos demandes urgentes</p>
            </div>
            
            {/* Le bouton de création de demande urgente peut être ici */}
            <Button className="bg-red-600 hover:bg-red-700">
              🚨 Demande Urgente
            </Button>
          </div>

          {/* Contenu principal */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Statistiques */}
            <div className="xl:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Statistiques</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Demandes ouvertes</p>
                    <p className="text-2xl font-bold text-red-600">3</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Réponses reçues</p>
                    <p className="text-2xl font-bold text-blue-600">12</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Gestion des demandes urgentes */}
            <div className="xl:col-span-3">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Mes demandes urgentes</h2>
                {/* Ici on intégrerait EstablishmentUrgentRequests */}
                {user && (
                  <div className="min-h-96">
                    <p className="text-sm text-gray-600">
                      Vos demandes urgentes et leurs candidats apparaîtront ici.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Instructions d'intégration pour les développeurs
export const IntegrationInstructions = `
## Intégration du système de demandes urgentes

### 1. Dans le header (Header.tsx ou composant équivalent) :
\`\`\`tsx
import { NotificationBell } from '@/components/notifications/UrgentNotificationDropdown';

// Dans le JSX du header :
{user && userType && (
  <NotificationBell
    userId={user.id}
    userType={userType === 'doctor' ? 'doctor' : 'establishment'}
  />
)}
\`\`\`

### 2. Dans le dashboard médecin :
\`\`\`tsx
import PremiumDashboardUrgentRequests from '@/components/dashboard/PremiumDashboardUrgentRequests';

// Dans un onglet "Premium" ou section dédiée :
<PremiumDashboardUrgentRequests doctorId={user.id} />
\`\`\`

### 3. Dans le dashboard établissement :
\`\`\`tsx
import EstablishmentUrgentRequests from '@/components/establishment/EstablishmentUrgentRequests';
import { CreateUrgentRequestModal } from '@/components/establishment/CreateUrgentRequestModal';

// Dans le dashboard :
<EstablishmentUrgentRequests establishmentId={establishment.id} />
\`\`\`

### 4. Schéma de base de données requis :

Tables à créer dans Supabase :
- urgent_requests
- urgent_request_responses  
- urgent_request_notifications
- establishment_subscriptions (pour le système de crédits)
- activity_logs (pour le tracking)

### 5. Fonctionnalités clés :
- ✅ Création de demandes urgentes avec formulaire complet
- ✅ Système de notifications temps réel via Supabase
- ✅ Gestion des réponses et acceptation/rejet
- ✅ Filtrage par spécialité, urgence, distance
- ✅ Système de crédits Premium
- ✅ Analytics et statistiques
- ✅ Interface responsive et moderne
`;

export default ExampleHeaderWithNotifications;
