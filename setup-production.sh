#!/bin/bash

# Script de déploiement pour la production
# Ce script guide pour configurer les variables d'environnement de production

echo "🚀 Configuration de production pour Cureliah"
echo "============================================="

# Vérification que .env.local n'existe pas déjà
if [ -f ".env.local" ]; then
    echo "⚠️  Un fichier .env.local existe déjà."
    read -p "Voulez-vous le remplacer ? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Déploiement annulé"
        exit 1
    fi
fi

echo "📋 Copie du fichier exemple..."
cp .env.example .env.local

echo ""
echo "🔑 Vous devez maintenant éditer .env.local avec vos vraies clés :"
echo "   - VITE_SUPABASE_URL: URL de votre projet Supabase"
echo "   - VITE_SUPABASE_ANON_KEY: Clé anonyme de Supabase"
echo "   - VITE_STRIPE_PUBLISHABLE_KEY: Clé publique Stripe (pk_live_...)"
echo ""
echo "💡 Astuce: Vous trouverez ces clés dans :"
echo "   - Supabase: Dashboard > Settings > API"
echo "   - Stripe: Dashboard > Developers > API keys"
echo ""

read -p "Appuyez sur Entrée pour ouvrir .env.local dans l'éditeur..."

# Ouvre le fichier dans l'éditeur par défaut
if command -v code &> /dev/null; then
    code .env.local
elif command -v nano &> /dev/null; then
    nano .env.local
elif command -v vi &> /dev/null; then
    vi .env.local
else
    echo "Éditez manuellement le fichier .env.local"
fi

echo ""
echo "✅ Configuration terminée !"
echo ""
echo "📦 Prochaines étapes :"
echo "   1. Vérifiez que .env.local n'est PAS dans git (git status)"
echo "   2. Buildez l'application : npm run build"
echo "   3. Déployez sur votre plateforme (Vercel, Netlify, etc.)"
echo ""
echo "🔒 Sécurité :"
echo "   - .env.local est dans .gitignore (sécurisé)"
echo "   - Seul .env.example sera commité"
echo "   - Vos clés restent locales"
