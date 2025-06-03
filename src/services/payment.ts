import { stripe } from '@/integrations/stripe/client';
import { supabase } from '@/integrations/supabase/client';

export interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  bookingId: string;
  customerId: string;
}

export const createPaymentIntent = async ({
  amount,
  currency,
  bookingId,
  customerId,
}: CreatePaymentIntentParams) => {
  try {
    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      metadata: {
        bookingId,
      },
    });

    // Update booking with payment intent ID
    await supabase
      .from('vacation_bookings')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        payment_status: 'pending',
      })
      .eq('id', bookingId);

    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

export const confirmPayment = async (paymentIntentId: string) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      const bookingId = paymentIntent.metadata.bookingId;
      
      // Update booking status
      await supabase
        .from('vacation_bookings')
        .update({
          payment_status: 'completed',
          status: 'confirmed',
        })
        .eq('id', bookingId);

      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }
};

export const createCustomer = async (email: string) => {
  try {
    const customer = await stripe.customers.create({
      email,
    });
    return customer;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
}; 