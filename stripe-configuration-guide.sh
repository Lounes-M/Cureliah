#!/bin/bash

echo "🔧 CONFIGURATION STRIPE - Guide Complet"
echo "======================================="
echo ""

echo "📍 OÙ METTRE VOS PRODUCT/PRICE IDs STRIPE :"
echo ""

echo "1️⃣ DANS LE FRONTEND (src/config/index.ts) :"
echo "   - Remplacez 'price_ESSENTIEL_MONTHLY_TO_UPDATE' par vos vrais Price IDs"
echo "   - Ces IDs sont utilisés pour l'affichage des prix"
echo ""

echo "2️⃣ DANS LES EDGE FUNCTIONS (supabase/functions/) :"
echo "   - create-subscription/index.ts : ligne 18-22"
echo "   - Remplacez les Price IDs de démonstration"
echo ""

echo "🔍 VOS PRICE IDs ACTUELS À REMPLACER :"
echo ""

echo "📁 Frontend (src/config/index.ts) :"
echo "   essentiel_monthly: 'price_ESSENTIEL_MONTHLY_TO_UPDATE'"
echo "   essentiel_yearly:  'price_ESSENTIEL_YEARLY_TO_UPDATE'"
echo "   pro_monthly:       'price_PRO_MONTHLY_TO_UPDATE'"
echo "   pro_yearly:        'price_PRO_YEARLY_TO_UPDATE'"
echo "   premium_monthly:   'price_PREMIUM_MONTHLY_TO_UPDATE'"
echo "   premium_yearly:    'price_PREMIUM_YEARLY_TO_UPDATE'"
echo ""

echo "🛠️  Backend (supabase/functions/create-subscription/index.ts) :"
echo "   essentiel: 'price_1RegyICeORMekP8LJOUjRRyO'  <- À REMPLACER"
echo "   pro:       'price_1RegxuCeORMekP8LY9m2br5I'  <- À REMPLACER"
echo "   premium:   'price_1RegyWCeORMekP8LjR59Wyef'  <- À REMPLACER"
echo ""

echo "💰 POUR RÉCUPÉRER VOS PRICE IDs :"
echo "1. Connectez-vous sur https://dashboard.stripe.com/"
echo "2. Allez dans Products > Vos produits"
echo "3. Cliquez sur chaque produit"
echo "4. Copiez les Price IDs (ex: price_1ABC123...)"
echo ""

echo "🚀 ACTIONS À FAIRE :"
echo "1. Récupérer vos Price IDs depuis Stripe Dashboard"
echo "2. Mettre à jour src/config/index.ts"
echo "3. Mettre à jour supabase/functions/create-subscription/index.ts"
echo "4. Déployer les Edge Functions sur Supabase"
echo "5. Tester un paiement"
echo ""

echo "⚠️  IMPORTANT :"
echo "- Utilisez les Price IDs LIVE pour la production"
echo "- Gardez les Price IDs TEST pour le développement"
echo "- Vérifiez que vos webhooks Stripe sont configurés"
