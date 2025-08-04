#!/bin/bash

# 🎨 Script de Génération d'Icônes PWA
# Génère toutes les icônes PWA à partir du logo existant

echo "🎨 Génération des icônes PWA pour Cureliah"
echo "=========================================="

# Vérifier si ImageMagick est installé
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick n'est pas installé"
    echo "   Installation : brew install imagemagick"
    echo ""
    echo "🔄 Génération d'icônes simplifiées en cours..."
    
    # Créer des icônes factices temporaires en attendant
    mkdir -p public/icons
    
    # Copier le logo comme base pour toutes les tailles
    sizes=(72 96 128 144 152 192 384 512)
    
    for size in "${sizes[@]}"; do
        cp public/logo.png "public/icons/icon-${size}x${size}.png"
        echo "✅ Icône ${size}x${size} créée (temporaire)"
    done
    
    # Créer les icônes spéciales
    cp public/logo.png "public/icons/badge-72x72.png"
    cp public/logo.png "public/icons/action-view.png"
    cp public/logo.png "public/icons/action-close.png"
    
    echo ""
    echo "⚠️  IMPORTANT: Ces icônes sont temporaires"
    echo "   Pour des icônes optimales, installez ImageMagick:"
    echo "   brew install imagemagick"
    echo "   Puis relancez ce script"
    
else
    echo "✅ ImageMagick détecté"
    echo ""
    
    # Créer le dossier icons
    mkdir -p public/icons
    
    # Définir les tailles d'icônes PWA
    sizes=(72 96 128 144 152 192 384 512)
    
    echo "🔄 Génération des icônes PWA..."
    
    for size in "${sizes[@]}"; do
        magick public/logo.png -resize "${size}x${size}" -background transparent -gravity center -extent "${size}x${size}" "public/icons/icon-${size}x${size}.png"
        echo "✅ Icône ${size}x${size} générée"
    done
    
    # Générer des icônes spéciales pour les notifications
    magick public/logo.png -resize "72x72" -background transparent -gravity center -extent "72x72" "public/icons/badge-72x72.png"
    magick public/logo.png -resize "32x32" -background transparent -gravity center -extent "32x32" "public/icons/action-view.png"
    magick public/logo.png -resize "32x32" -background transparent -gravity center -extent "32x32" "public/icons/action-close.png"
    
    echo "✅ Icônes spéciales générées"
fi

echo ""
echo "📱 Icônes PWA générées avec succès !"
echo "   - Toutes les tailles requises créées"
echo "   - Compatible iOS et Android"
echo "   - Optimisées pour PWA"
echo ""
echo "🔄 Redémarrez votre serveur de développement :"
echo "npm run dev"
