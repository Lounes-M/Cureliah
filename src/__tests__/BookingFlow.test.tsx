import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BookingFlow from '@/pages/BookingFlow';
import { useAuth } from '@/hooks/useAuth';
import { BrowserRouter } from 'react-router-dom';

// Mock du hook useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

// Mock de Supabase
vi.mock('@/integrations/supabase/client.browser', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: '123',
              title: 'Test Vacation',
              start_date: '2025-08-10',
              end_date: '2025-08-15',
              location: 'Paris',
              price: 500,
              doctor_id: 'doc-123',
              doctor_profiles: {
                first_name: 'Dr.',
                last_name: 'Test',
                speciality: 'cardiology'
              }
            },
            error: null
          }))
        }))
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({
          data: { id: 'booking-123' },
          error: null
        }))
      }))
    }))
  }
}));

// Mock du router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: '123' }),
    useNavigate: () => vi.fn()
  };
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </QueryClientProvider>
);

describe('BookingFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: {
        id: 'user-123',
        email: 'test@example.com',
        user_type: 'establishment'
      },
      profile: {
        user_type: 'establishment',
        establishment_name: 'Test Hospital'
      }
    });
  });

  it('devrait afficher les détails de la vacation', async () => {
    render(
      <TestWrapper>
        <BookingFlow />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Vacation')).toBeInTheDocument();
      expect(screen.getByText('Dr. Test')).toBeInTheDocument();
      expect(screen.getByText('Paris')).toBeInTheDocument();
      expect(screen.getByText('500€')).toBeInTheDocument();
    });
  });

  it('devrait permettre de naviguer entre les étapes', async () => {
    render(
      <TestWrapper>
        <BookingFlow />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Vacation')).toBeInTheDocument();
    });

    // Vérifier que l'étape 1 est active
    const step1 = screen.getByText('1');
    expect(step1).toHaveClass('bg-blue-600');

    // Passer à l'étape suivante
    const nextButton = screen.getByText('Continuer');
    fireEvent.click(nextButton);

    // Vérifier que l'étape 2 est maintenant active
    await waitFor(() => {
      const step2 = screen.getByText('2');
      expect(step2).toHaveClass('bg-blue-600');
    });
  });

  it('devrait valider les champs requis du formulaire', async () => {
    render(
      <TestWrapper>
        <BookingFlow />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Vacation')).toBeInTheDocument();
    });

    // Aller à l'étape 2
    fireEvent.click(screen.getByText('Continuer'));

    await waitFor(() => {
      // Essayer de soumettre sans remplir les champs
      const submitButton = screen.getByText('Confirmer la réservation');
      fireEvent.click(submitButton);
    });

    // Vérifier que les messages d'erreur apparaissent
    await waitFor(() => {
      expect(screen.getByText(/contact d'urgence est requis/)).toBeInTheDocument();
    });
  });

  it('devrait rediriger vers le paiement après une réservation réussie', async () => {
    const mockNavigate = vi.fn();
    vi.doMock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ id: '123' })
      };
    });

    render(
      <TestWrapper>
        <BookingFlow />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Vacation')).toBeInTheDocument();
    });

    // Aller à l'étape 2
    fireEvent.click(screen.getByText('Continuer'));

    await waitFor(() => {
      // Remplir les champs requis
      const emergencyContact = screen.getByLabelText(/contact d'urgence/i);
      fireEvent.change(emergencyContact, { target: { value: '0123456789' } });

      const messageField = screen.getByLabelText(/message/i);
      fireEvent.change(messageField, { target: { value: 'Test message' } });
    });

    // Soumettre la réservation
    const submitButton = screen.getByText('Confirmer la réservation');
    fireEvent.click(submitButton);

    // Vérifier la redirection vers le paiement
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/payment/booking-123');
    });
  });

  it('devrait gérer les erreurs de réservation', async () => {
    // Mock d'une erreur Supabase
    vi.mocked(supabase.from).mockReturnValueOnce({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Database error' }
          }))
        }))
      }))
    } as any);

    render(
      <TestWrapper>
        <BookingFlow />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Vacation')).toBeInTheDocument();
    });

    // Aller à l'étape 2 et soumettre
    fireEvent.click(screen.getByText('Continuer'));

    await waitFor(() => {
      const emergencyContact = screen.getByLabelText(/contact d'urgence/i);
      fireEvent.change(emergencyContact, { target: { value: '0123456789' } });

      const submitButton = screen.getByText('Confirmer la réservation');
      fireEvent.click(submitButton);
    });

    // Vérifier que l'erreur est affichée
    await waitFor(() => {
      expect(screen.getByText(/erreur lors de la réservation/i)).toBeInTheDocument();
    });
  });
});
