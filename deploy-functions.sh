#!/bin/bash

echo "🚀 ÉTAPE 1 : DÉPLOIEMENT DES EDGE FUNCTIONS"
echo "============================================"
echo ""

echo "📋 Vérification des prérequis..."

# Vérifier si Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI non installé"
    echo ""
    echo "🔧 Installation Supabase CLI :"
    echo "npm install -g supabase"
    echo "# OU"
    echo "brew install supabase/tap/supabase"
    echo ""
    echo "Réexécutez ce script après installation."
    exit 1
fi

echo "✅ Supabase CLI détecté"

# Vérifier si connecté
if ! supabase projects list &> /dev/null; then
    echo "🔐 Connexion à Supabase requise..."
    echo ""
    supabase login
    echo ""
fi

echo "✅ Connecté à Supabase"

# Lister les projets
echo "📋 Vos projets Supabase :"
supabase projects list

echo ""
echo "🚀 Déploiement des Edge Functions..."
echo ""

# Déployer create-subscription
echo "📤 Déploiement de create-subscription..."
if supabase functions deploy create-subscription; then
    echo "✅ create-subscription déployée avec succès"
else
    echo "❌ Erreur lors du déploiement de create-subscription"
    exit 1
fi

echo ""

# Déployer stripe-webhook
echo "📤 Déploiement de stripe-webhook..."
if supabase functions deploy stripe-webhook; then
    echo "✅ stripe-webhook déployée avec succès"
else
    echo "❌ Erreur lors du déploiement de stripe-webhook"
    exit 1
fi

echo ""
echo "🎉 DÉPLOIEMENT TERMINÉ !"
echo ""

# Afficher les URLs des fonctions
echo "🔗 URLs de vos fonctions :"
echo ""
PROJECT_REF=$(supabase status | grep "Project" | awk '{print $3}')
if [ -n "$PROJECT_REF" ]; then
    echo "create-subscription:"
    echo "  https://$PROJECT_REF.supabase.co/functions/v1/create-subscription"
    echo ""
    echo "stripe-webhook:"
    echo "  https://$PROJECT_REF.supabase.co/functions/v1/stripe-webhook"
    echo ""
    echo "📋 Copiez l'URL stripe-webhook pour l'étape suivante dans Stripe Dashboard"
else
    echo "Récupérez vos URLs avec : supabase status"
fi

echo ""
echo "➡️  PROCHAINE ÉTAPE : Configurer le webhook dans Stripe Dashboard"
echo "    URL: https://dashboard.stripe.com/webhooks"
