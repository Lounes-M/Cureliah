import Stripe from 'stripe';

const stripeSecretKey = import.meta.env.VITE_STRIPE_SECRET_KEY || 'your_stripe_secret_key';

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-05-28.basil', // Use the latest API version
}); 