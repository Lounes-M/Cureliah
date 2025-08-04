#!/bin/bash

echo "🔄 SCRIPT DE MISE À JOUR DES PRICE IDs STRIPE"
echo "============================================="
echo ""

# Configuration - REMPLACEZ CES VALEURS PAR VOS VRAIS PRICE IDs
ESSENTIEL_MONTHLY="price_VOTRE_ESSENTIEL_MONTHLY_ID"
ESSENTIEL_YEARLY="price_VOTRE_ESSENTIEL_YEARLY_ID"
PRO_MONTHLY="price_VOTRE_PRO_MONTHLY_ID"
PRO_YEARLY="price_VOTRE_PRO_YEARLY_ID"
PREMIUM_MONTHLY="price_VOTRE_PREMIUM_MONTHLY_ID"
PREMIUM_YEARLY="price_VOTRE_PREMIUM_YEARLY_ID"

echo "⚠️  AVANT D'EXÉCUTER CE SCRIPT :"
echo "1. Éditez ce fichier (update-stripe-price-ids.sh)"
echo "2. Remplacez les valeurs ci-dessus par vos vrais Price IDs"
echo "3. Sauvegardez et ré-exécutez"
echo ""

if [[ "$ESSENTIEL_MONTHLY" == "price_VOTRE_ESSENTIEL_MONTHLY_ID" ]]; then
    echo "❌ ERREUR: Vous devez d'abord configurer vos Price IDs dans ce script"
    echo ""
    echo "📝 Pour récupérer vos Price IDs :"
    echo "1. Allez sur https://dashboard.stripe.com/products"
    echo "2. Cliquez sur chaque produit"
    echo "3. Copiez le Price ID (ex: price_1ABC123DEF456GHI789)"
    echo "4. Éditez ce script avec vos vrais IDs"
    echo ""
    exit 1
fi

echo "🔄 Mise à jour en cours..."

# Mise à jour du frontend
echo "📁 Mise à jour frontend (src/config/index.ts)..."
sed -i.backup "s/price_ESSENTIEL_MONTHLY_TO_UPDATE/$ESSENTIEL_MONTHLY/g" src/config/index.ts
sed -i.backup "s/price_ESSENTIEL_YEARLY_TO_UPDATE/$ESSENTIEL_YEARLY/g" src/config/index.ts
sed -i.backup "s/price_PRO_MONTHLY_TO_UPDATE/$PRO_MONTHLY/g" src/config/index.ts
sed -i.backup "s/price_PRO_YEARLY_TO_UPDATE/$PRO_YEARLY/g" src/config/index.ts
sed -i.backup "s/price_PREMIUM_MONTHLY_TO_UPDATE/$PREMIUM_MONTHLY/g" src/config/index.ts
sed -i.backup "s/price_PREMIUM_YEARLY_TO_UPDATE/$PREMIUM_YEARLY/g" src/config/index.ts

# Mise à jour du composant pricing
echo "💰 Mise à jour composant pricing..."
sed -i.backup "s/price_ESSENTIEL_MONTHLY_TO_UPDATE/$ESSENTIEL_MONTHLY/g" src/components/landing/PricingSection.tsx
sed -i.backup "s/price_ESSENTIEL_YEARLY_TO_UPDATE/$ESSENTIEL_YEARLY/g" src/components/landing/PricingSection.tsx
sed -i.backup "s/price_PRO_MONTHLY_TO_UPDATE/$PRO_MONTHLY/g" src/components/landing/PricingSection.tsx
sed -i.backup "s/price_PRO_YEARLY_TO_UPDATE/$PRO_YEARLY/g" src/components/landing/PricingSection.tsx
sed -i.backup "s/price_PREMIUM_MONTHLY_TO_UPDATE/$PREMIUM_MONTHLY/g" src/components/landing/PricingSection.tsx
sed -i.backup "s/price_PREMIUM_YEARLY_TO_UPDATE/$PREMIUM_YEARLY/g" src/components/landing/PricingSection.tsx

# Mise à jour des Edge Functions
echo "🛠️  Mise à jour Edge Functions..."
sed -i.backup "s/price_1RegyICeORMekP8LJOUjRRyO/$ESSENTIEL_MONTHLY/g" supabase/functions/create-subscription/index.ts
sed -i.backup "s/price_1RegxuCeORMekP8LY9m2br5I/$PRO_MONTHLY/g" supabase/functions/create-subscription/index.ts
sed -i.backup "s/price_1RegyWCeORMekP8LjR59Wyef/$PREMIUM_MONTHLY/g" supabase/functions/create-subscription/index.ts

echo ""
echo "✅ MISE À JOUR TERMINÉE !"
echo ""
echo "📋 PROCHAINES ÉTAPES :"
echo "1. Vérifiez les modifications : git diff"
echo "2. Testez l'application : npm run dev"
echo "3. Déployez les Edge Functions : supabase functions deploy"
echo "4. Commitez les changements : git add . && git commit -m 'Update Stripe Price IDs'"
echo ""
echo "🔍 Fichiers modifiés :"
echo "   - src/config/index.ts"
echo "   - src/components/landing/PricingSection.tsx"
echo "   - supabase/functions/create-subscription/index.ts"
