import { ComponentType, lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingFallbackProps {
  message?: string;
}

const LoadingFallback = ({ message = "Chargement..." }: LoadingFallbackProps) => (
  <div className="flex items-center justify-center min-h-[400px] w-full">
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-medical-blue" />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  </div>
);

const createLazyComponent = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallbackMessage?: string
) => {
  const LazyComponent = lazy(importFunc);
  
  return (props: any) => (
    <Suspense fallback={<LoadingFallback message={fallbackMessage} />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Lazy loaded pages
export const LazyDoctorDashboard = createLazyComponent(
  () => import('@/pages/DoctorDashboard'),
  'Chargement du tableau de bord médecin...'
);

export const LazyEstablishmentDashboard = createLazyComponent(
  () => import('@/pages/EstablishmentDashboard'),
  'Chargement du tableau de bord établissement...'
);

export const LazyAdminDashboard = createLazyComponent(
  () => import('@/pages/admin/AdminDashboard'),
  'Chargement du tableau de bord administrateur...'
);

export const LazyVacationSearch = createLazyComponent(
  () => import('@/pages/VacationSearch'),
  'Chargement de la recherche de vacations...'
);

export const LazyEstablishmentSearch = createLazyComponent(
  () => import('@/pages/EstablishmentSearch'),
  'Chargement de la recherche d\'établissements...'
);

export const LazyManageVacations = createLazyComponent(
  () => import('@/pages/ManageVacations'),
  'Chargement de la gestion des vacations...'
);

export const LazyCreateVacation = createLazyComponent(
  () => import('@/pages/CreateVacation'),
  'Chargement du formulaire de création...'
);

export const LazyDoctorProfile = createLazyComponent(
  () => import('@/pages/DoctorProfile'),
  'Chargement du profil médecin...'
);

export const LazyEstablishmentProfile = createLazyComponent(
  () => import('@/pages/EstablishmentProfile'),
  'Chargement du profil établissement...'
);

export const LazyAnalyticsDashboard = createLazyComponent(
  () => import('@/components/analytics/AnalyticsDashboard'),
  'Chargement des analyses...'
);

export const LazyDocumentManager = createLazyComponent(
  () => import('@/components/documents/DocumentManager'),
  'Chargement des documents...'
);

export const LazyMessagingInterface = createLazyComponent(
  () => import('@/components/MessagingInterface'),
  'Chargement de la messagerie...'
);

export const LazyBookingFlow = createLazyComponent(
  () => import('@/pages/BookingFlow'),
  'Chargement du processus de réservation...'
);

export const LazyPaymentCheckout = createLazyComponent(
  () => import('@/pages/PaymentCheckout'),
  'Chargement du paiement...'
);

export const LazySubscribe = createLazyComponent(
  () => import('@/pages/Subscribe'),
  'Chargement de l\'abonnement...'
);

export { LoadingFallback };
