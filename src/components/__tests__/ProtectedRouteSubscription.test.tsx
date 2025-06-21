import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '@/hooks/useAuth';
import { ProtectedRoute } from '../../routes';

// Mock composant cible
const DummyPage = () => <div>Page protégée</div>;
const SubscribePage = () => <div>Page abonnement</div>;

function renderWithAuthContext(contextValue, initialEntries = ['/doctor/dashboard']) {
  return render(
    <AuthContext.Provider value={contextValue}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/doctor/dashboard" element={
            <ProtectedRoute requiredUserType="doctor" requireSubscription={true}>
              <DummyPage />
            </ProtectedRoute>
          } />
          <Route path="/subscribe" element={<SubscribePage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('ProtectedRoute abonnement', () => {
  it('redirige un médecin non abonné vers /subscribe', async () => {
    const contextValue = {
      user: { id: '1', email: 'doc@x.fr', user_type: 'doctor', email_confirmed_at: '2024-01-01' },
      profile: { is_verified: false, is_active: false },
      loading: false,
      isSubscribed: () => false,
      subscriptionStatus: 'inactive',
      subscriptionLoading: false,
      getDashboardRoute: () => '/doctor/dashboard',
      isAdmin: () => false,
      isDoctor: () => true,
      isEstablishment: () => false,
      isEmailConfirmed: () => true,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateProfile: jest.fn(),
      redirectToDashboard: jest.fn(),
    };
    renderWithAuthContext(contextValue);
    await waitFor(() => {
      expect(screen.getByText(/Page abonnement/i)).toBeInTheDocument();
    });
  });

  it('laisse passer un médecin abonné', async () => {
    const contextValue = {
      user: { id: '1', email: 'doc@x.fr', user_type: 'doctor', email_confirmed_at: '2024-01-01' },
      profile: { is_verified: true, is_active: true },
      loading: false,
      isSubscribed: () => true,
      subscriptionStatus: 'active',
      subscriptionLoading: false,
      getDashboardRoute: () => '/doctor/dashboard',
      isAdmin: () => false,
      isDoctor: () => true,
      isEstablishment: () => false,
      isEmailConfirmed: () => true,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateProfile: jest.fn(),
      redirectToDashboard: jest.fn(),
    };
    renderWithAuthContext(contextValue);
    await waitFor(() => {
      expect(screen.getByText(/Page protégée/i)).toBeInTheDocument();
    });
  });
});
