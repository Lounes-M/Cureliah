#!/bin/bash

# 🚀 Script de Configuration des Price IDs Stripe Production
# Utilisez ce script après avoir créé vos produits dans Stripe Dashboard
# ⚠️ SÉCURITÉ: Ce script ne contient AUCUNE clé API - elles sont saisies manuellement

echo "🎯 Configuration des Price IDs Stripe pour Cureliah"
echo "=================================================="
echo ""
echo "⚠️  IMPORTANT: Assurez-vous d'être en mode LIVE dans Stripe Dashboard"
echo "📍 Allez sur: https://dashboard.stripe.com/products"
echo ""
echo "🔒 SÉCURITÉ: Vos clés API ne seront jamais stockées dans ce script"
echo ""

# Vérification de sécurité
echo "🛡️  Vérification de sécurité en cours..."
PATTERN1="sk_live_"
PATTERN2="pk_live_"
if grep -r "$PATTERN1\|$PATTERN2" . --include="*.md" --include="*.js" --include="*.ts" --exclude-dir=node_modules --exclude="update-stripe-prices.sh" 2>/dev/null; then
    echo "❌ ALERTE SÉCURITÉ: Des clés API ont été détectées dans les fichiers!"
    echo "   Supprimez-les immédiatement avant de continuer."
    exit 1
fi
echo "✅ Aucune clé API détectée dans les fichiers publics"
echo ""

# Prompt pour chaque Price ID
echo "📦 ESSENTIEL (€49/mois)"
echo "------------------------"
read -p "Price ID Mensuel (price_...): " ESSENTIEL_MONTHLY
read -p "Price ID Annuel (price_...): " ESSENTIEL_YEARLY

echo ""
echo "� PRO (€99/mois)"
echo "-------------------"
read -p "Price ID Mensuel (price_...): " PRO_MONTHLY
read -p "Price ID Annuel (price_...): " PRO_YEARLY

echo ""
echo "⭐ PREMIUM (€199/mois)"
echo "--------------"
read -p "Price ID Mensuel (price_...): " PREMIUM_MONTHLY
read -p "Price ID Annuel (price_...): " PREMIUM_YEARLYecho ""
echo "🔧 Mise à jour du fichier de configuration..."

# Backup des fichiers originaux
cp src/config/index.ts src/config/index.ts.backup.$(date +%Y%m%d_%H%M%S)
cp src/components/landing/PricingSection.tsx src/components/landing/PricingSection.tsx.backup.$(date +%Y%m%d_%H%M%S)

# Mise à jour des Price IDs dans config
sed -i "" "s/price_ESSENTIEL_MONTHLY_TO_UPDATE/$ESSENTIEL_MONTHLY/g" src/config/index.ts
sed -i "" "s/price_ESSENTIEL_YEARLY_TO_UPDATE/$ESSENTIEL_YEARLY/g" src/config/index.ts
sed -i "" "s/price_PRO_MONTHLY_TO_UPDATE/$PRO_MONTHLY/g" src/config/index.ts
sed -i "" "s/price_PRO_YEARLY_TO_UPDATE/$PRO_YEARLY/g" src/config/index.ts
sed -i "" "s/price_PREMIUM_MONTHLY_TO_UPDATE/$PREMIUM_MONTHLY/g" src/config/index.ts
sed -i "" "s/price_PREMIUM_YEARLY_TO_UPDATE/$PREMIUM_YEARLY/g" src/config/index.ts

# Mise à jour des Price IDs dans PricingSection
sed -i "" "s/price_ESSENTIEL_MONTHLY_TO_UPDATE/$ESSENTIEL_MONTHLY/g" src/components/landing/PricingSection.tsx
sed -i "" "s/price_ESSENTIEL_YEARLY_TO_UPDATE/$ESSENTIEL_YEARLY/g" src/components/landing/PricingSection.tsx
sed -i "" "s/price_PRO_MONTHLY_TO_UPDATE/$PRO_MONTHLY/g" src/components/landing/PricingSection.tsx
sed -i "" "s/price_PRO_YEARLY_TO_UPDATE/$PRO_YEARLY/g" src/components/landing/PricingSection.tsx
sed -i "" "s/price_PREMIUM_MONTHLY_TO_UPDATE/$PREMIUM_MONTHLY/g" src/components/landing/PricingSection.tsx
sed -i "" "s/price_PREMIUM_YEARLY_TO_UPDATE/$PREMIUM_YEARLY/g" src/components/landing/PricingSection.tsx

echo "✅ Configuration mise à jour!"
echo ""
echo "📋 Résumé des Price IDs configurés:"
echo "=================================="
echo "Essentiel Monthly: $ESSENTIEL_MONTHLY"
echo "Essentiel Yearly:  $ESSENTIEL_YEARLY"
echo "Pro Monthly:       $PRO_MONTHLY"
echo "Pro Yearly:        $PRO_YEARLY"
echo "Premium Monthly:   $PREMIUM_MONTHLY"
echo "Premium Yearly:    $PREMIUM_YEARLY"
echo ""
echo "🔄 Redémarrez votre application pour appliquer les changements:"
echo "npm run dev"
echo ""
echo "📁 Backups sauvegardés avec timestamp dans le nom"
echo ""
echo "🔒 SÉCURITÉ: Vérifiez que vos clés API ne sont pas dans git:"
echo "git status"
