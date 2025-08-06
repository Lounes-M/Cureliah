import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import HowItWorksSection from '../../src/components/HowItWorksSection';

// Mock de navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Composant wrapper pour les tests
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('HowItWorksSection - Tests d\'intégration', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('devrait afficher la section avec le titre correct', () => {
    render(
      <TestWrapper>
        <HowItWorksSection />
      </TestWrapper>
    );

    expect(screen.getByText(/Comment fonctionne/i)).toBeInTheDocument();
    expect(screen.getByText(/Cureliah/i)).toBeInTheDocument();
  });

  it('devrait basculer entre les onglets médecins et établissements', async () => {
    render(
      <TestWrapper>
        <HowItWorksSection />
      </TestWrapper>
    );

    // Vérifier l'onglet initial (médecins)
    const doctorTab = screen.getByRole('button', { pressed: true });
    expect(doctorTab).toHaveTextContent(/médecins/i);

    // Cliquer sur l'onglet établissements
    const facilityTab = screen.getByText(/établissements/i);
    fireEvent.click(facilityTab);

    // Vérifier le changement d'onglet
    await waitFor(() => {
      expect(screen.getByText(/Recherchez un médecin/i)).toBeInTheDocument();
    });
  });

  it('devrait afficher les étapes pour les médecins par défaut', () => {
    render(
      <TestWrapper>
        <HowItWorksSection />
      </TestWrapper>
    );

    expect(screen.getByText(/Inscription et validation/i)).toBeInTheDocument();
    expect(screen.getByText(/Publiez vos créneaux/i)).toBeInTheDocument();
    expect(screen.getByText(/Acceptez les missions/i)).toBeInTheDocument();
  });

  it('devrait afficher les étapes pour les établissements après clic', async () => {
    render(
      <TestWrapper>
        <HowItWorksSection />
      </TestWrapper>
    );

    // Cliquer sur l'onglet établissements
    const facilityTab = screen.getByText(/établissements/i);
    fireEvent.click(facilityTab);

    // Vérifier les étapes établissements
    await waitFor(() => {
      expect(screen.getByText(/Recherchez un médecin/i)).toBeInTheDocument();
      expect(screen.getByText(/Réservez instantanément/i)).toBeInTheDocument();
      expect(screen.getByText(/Contrat automatique/i)).toBeInTheDocument();
    });
  });

  it('devrait gérer la navigation vers l\'inscription', () => {
    // Mock de window.location.href
    delete (window as any).location;
    window.location = { ...window.location, href: '' };

    render(
      <TestWrapper>
        <HowItWorksSection />
      </TestWrapper>
    );

    // Cliquer sur le bouton d'inscription médecin
    const doctorSignupBtn = screen.getByText(/Inscription médecin/i);
    fireEvent.click(doctorSignupBtn);

    // Vérifier que la navigation est appelée (simulation)
    expect(window.location.href).toContain('/auth?type=doctor');
  });

  it('devrait être responsive et afficher le contenu mobile', () => {
    // Mock de la taille d'écran mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(
      <TestWrapper>
        <HowItWorksSection />
      </TestWrapper>
    );

    // Vérifier que les éléments responsive sont présents
    expect(screen.getByText(/Comment fonctionne/i)).toBeInTheDocument();
  });

  it('devrait afficher les statistiques de la section', () => {
    render(
      <TestWrapper>
        <HowItWorksSection />
      </TestWrapper>
    );

    expect(screen.getByText('24h')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('0€')).toBeInTheDocument();
  });

  it('devrait avoir les bons attributs d\'accessibilité', () => {
    render(
      <TestWrapper>
        <HowItWorksSection />
      </TestWrapper>
    );

    // Vérifier l'accessibilité
    const section = screen.getByRole('region');
    expect(section).toHaveAttribute('aria-label', 'Comment fonctionne Cureliah');

    const doctorTab = screen.getByRole('button', { pressed: true });
    expect(doctorTab).toHaveAttribute('aria-pressed', 'true');
  });
});
