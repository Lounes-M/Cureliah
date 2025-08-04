# 🔧 Supabase Environment Configuration

## Required Environment Variables

Your **Stripe production secret key** must be configured in Supabase for the Edge Functions to work:

### Configure in Supabase Dashboard:

1. Go to: https://supabase.com/dashboard/project/[your-project]/settings/api
2. Navigate to **Edge Functions** → **Environment Variables**
3. Add these variables:

```bash
STRIPE_SECRET_KEY=sk_live_[your-actual-secret-key]
STRIPE_WEBHOOK_SECRET=whsec_[your-webhook-secret]
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

### Important Notes:
- ⚠️ **NEVER** commit these keys to git
- 🔒 Use your **production** Stripe keys (sk_live_*, not sk_test_*)
- 🔄 The keys are already rotated and secure after the recent security incident

### Webhook Endpoint Configuration:
In Stripe Dashboard → Webhooks, add endpoint:
```
https://[your-project].supabase.co/functions/v1/stripe-webhook
```

Events to listen for:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
