import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PaymentButton from '../PaymentButton';

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: jest.fn().mockResolvedValue({ data: { url: 'https://test.url' }, error: null })
    }
  }
}));

describe('PaymentButton', () => {
  it('affiche le montant et le bouton', () => {
    render(<PaymentButton bookingId="1" amount={100} />);
    // Use a flexible matcher to find the button with the amount
    expect(screen.getByRole('button', { name: /100.*€/ })).toBeInTheDocument();
  });

  it('désactive le bouton si disabled', () => {
    render(<PaymentButton bookingId="1" amount={100} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
