import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BookingFlow from '@/pages/BookingFlow';
import { useAuth } from '@/hooks/useAuth';
import { BrowserRouter } from 'react-router-dom';

// Mock du hook useAuth
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

// Mock de Supabase
jest.mock('@/integrations/supabase/client.browser', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: {
              id: '1',
              title: 'Test Vacation',
              start_date: '2024-03-15',
              end_date: '2024-03-22',
              doctor_profile: {
                full_name: 'Dr. Test',
              },
              establishment_profile: {
                establishment_name: 'Test Hospital',
                city: 'Paris',
              },
              price: 500,
            },
            error: null
          }))
        }))
      }))
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } }
      }))
    },
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({
          data: {
            id: 'booking-123'
          },
          error: null
        }))
      }))
    }))
  }
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({
    vacationId: '1'
  }),
  useNavigate: () => jest.fn()
}));

// Mock du logger
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('BookingFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render vacation details when loaded', async () => {
    // Mock des hooks
    const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
    mockUseAuth.mockReturnValue({
      user: { 
        id: 'test-user-id',
        email: 'test@test.com'
      },
      loading: false
    } as any);

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

  it('should handle step navigation', async () => {
    const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
    mockUseAuth.mockReturnValue({
      user: { 
        id: 'test-user-id',
        email: 'test@test.com'
      },
      loading: false
    } as any);

    render(
      <TestWrapper>
        <BookingFlow />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Vacation')).toBeInTheDocument();
    });

    // Test navigation steps
    const step1 = screen.getByTestId('step-1');
    const step2 = screen.getByTestId('step-2');
    
    expect(step1).toHaveClass('bg-blue-600');

    // Click next button
    const nextButton = screen.getByText('Suivant');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(step2).toHaveClass('bg-blue-600');
    });
  });

  it('should handle form validation', async () => {
    const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
    mockUseAuth.mockReturnValue({
      user: { 
        id: 'test-user-id',
        email: 'test@test.com'
      },
      loading: false
    } as any);

    render(
      <TestWrapper>
        <BookingFlow />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Vacation')).toBeInTheDocument();
    });

    // Try to submit without filling required fields
    const submitButton = screen.getByText('Finaliser la réservation');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/contact d'urgence est requis/)).toBeInTheDocument();
    });
  });

  it('should redirect after successful booking', async () => {
    const mockNavigate = jest.fn();
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate
    }));

    const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
    mockUseAuth.mockReturnValue({
      user: { 
        id: 'test-user-id',
        email: 'test@test.com'
      },
      loading: false
    } as any);

    render(
      <TestWrapper>
        <BookingFlow />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Test Vacation')).toBeInTheDocument();
    });

    // Fill form with valid data
    const emergencyContactInput = screen.getByLabelText(/contact d'urgence/i);
    fireEvent.change(emergencyContactInput, { target: { value: 'John Doe - 0123456789' } });

    const phoneInput = screen.getByLabelText(/téléphone/i);
    fireEvent.change(phoneInput, { target: { value: '0123456789' } });

    // Mock successful booking
    const { supabase } = require('@/integrations/supabase/client.browser');
    jest.mocked(supabase.from).mockReturnValueOnce({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: {
              id: 'booking-123'
            },
            error: null
          }))
        }))
      }))
    } as any);

    const submitButton = screen.getByText('Finaliser la réservation');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/my-bookings');
    });
  });

  it('should handle booking error', async () => {
    const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
    mockUseAuth.mockReturnValue({
      user: { 
        id: 'test-user-id',
        email: 'test@test.com'
      },
      loading: false
    } as any);

    render(
      <TestWrapper>
        <BookingFlow />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Test Vacation')).toBeInTheDocument();
    });

    // Fill form with valid data
    const emergencyContactInput = screen.getByLabelText(/contact d'urgence/i);
    fireEvent.change(emergencyContactInput, { target: { value: 'John Doe - 0123456789' } });

    // Mock booking error
    const { supabase } = require('@/integrations/supabase/client.browser');
    jest.mocked(supabase.from).mockReturnValueOnce({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Booking failed' }
          }))
        }))
      }))
    } as any);

    const submitButton = screen.getByText('Finaliser la réservation');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/erreur lors de la réservation/i)).toBeInTheDocument();
    });
  });
});
