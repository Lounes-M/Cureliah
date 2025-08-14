-- Script pour créer un enregistrement user_subscriptions pour les tests
-- Utiliser ceci pour créer un customer Stripe fictif et permettre l'accès au portail

-- D'abord, créer un customer Stripe pour cet utilisateur (ID: 122772a5-88a2-41b8-b942-a5f2ab802e32)
-- Note: En production, ceci devrait être fait par l'Edge Function create-subscription

INSERT INTO user_subscriptions (
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    status,
    current_period_start,
    current_period_end,
    plan_type
) VALUES (
    '122772a5-88a2-41b8-b942-a5f2ab802e32',
    'cus_test_doctor_l_moumou',  -- Customer Stripe factice pour tests
    'sub_test_basic_plan',       -- Subscription Stripe factice
    'active',                    -- Statut actif
    NOW(),                       -- Début de la période actuelle
    NOW() + INTERVAL '1 month',  -- Fin de la période (1 mois)
    'basic'                      -- Plan de base
) ON CONFLICT (stripe_subscription_id) DO UPDATE SET
    status = EXCLUDED.status,
    current_period_end = EXCLUDED.current_period_end,
    updated_at = NOW();
