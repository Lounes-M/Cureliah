import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  payment_intent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}

export const createPaymentIntent = async (
  bookingId: string,
  amount: number,
  currency: string = 'EUR'
) => {
  try {
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: { bookingId, amount, currency }
    });

    if (error) throw error;
    return data as PaymentIntent;
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

export const confirmPayment = async (
  paymentIntentId: string,
  bookingId: string
) => {
  try {
    const { data, error } = await supabase.functions.invoke('confirm-payment', {
      body: { paymentIntentId, bookingId }
    });

    if (error) throw error;
    return data as Payment;
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    throw error;
  }
};

export const getPaymentHistory = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        booking:vacation_bookings (
          id,
          vacation_post:vacation_posts (
            id,
            title,
            start_date,
            end_date
          )
        )
      `)
      .or(`doctor_id.eq.${userId},establishment_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error fetching payment history:', error);
    throw error;
  }
};

export const requestRefund = async (
  paymentId: string,
  reason: string
) => {
  try {
    const { data, error } = await supabase.functions.invoke('request-refund', {
      body: { paymentId, reason }
    });

    if (error) throw error;
    return data as Payment;
  } catch (error: any) {
    console.error('Error requesting refund:', error);
    throw error;
  }
};

export const getPaymentStatus = async (paymentId: string) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('status')
      .eq('id', paymentId)
      .single();

    if (error) throw error;
    return data.status;
  } catch (error: any) {
    console.error('Error getting payment status:', error);
    throw error;
  }
};

export const calculatePaymentAmount = (
  hourlyRate: number,
  startDate: string,
  endDate: string
) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
  return hours * hourlyRate;
}; 