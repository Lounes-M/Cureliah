#!/bin/bash

# 🔍 Script de Vérification PWA
# Vérifie que tous les composants PWA sont en place

echo "🔍 VÉRIFICATION PWA - Cureliah"
echo "=============================="
echo ""

# Vérifier les icônes
echo "📱 1. Icônes PWA:"
echo "----------------"
REQUIRED_ICONS=(72 96 128 144 152 192 384 512)
MISSING_ICONS=0

for size in "${REQUIRED_ICONS[@]}"; do
    if [ -f "public/icons/icon-${size}x${size}.png" ]; then
        echo "✅ Icône ${size}x${size} présente"
    else
        echo "❌ Icône ${size}x${size} manquante"
        ((MISSING_ICONS++))
    fi
done

if [ $MISSING_ICONS -eq 0 ]; then
    echo "✅ Toutes les icônes PWA sont présentes"
else
    echo "⚠️  $MISSING_ICONS icône(s) manquante(s)"
    echo "   Lancez: ./generate-pwa-icons.sh"
fi

echo ""

# Vérifier le manifeste
echo "📄 2. Manifeste PWA:"
echo "-------------------"
if [ -f "public/manifest.json" ]; then
    echo "✅ manifest.json présent"
    
    # Vérifier les propriétés essentielles
    if grep -q '"name"' public/manifest.json; then
        echo "✅ Propriété 'name' définie"
    else
        echo "❌ Propriété 'name' manquante"
    fi
    
    if grep -q '"start_url"' public/manifest.json; then
        echo "✅ Propriété 'start_url' définie"
    else
        echo "❌ Propriété 'start_url' manquante"
    fi
    
    if grep -q '"display".*standalone' public/manifest.json; then
        echo "✅ Mode 'standalone' configuré"
    else
        echo "⚠️  Mode standalone non configuré"
    fi
    
else
    echo "❌ manifest.json manquant"
fi

echo ""

# Vérifier le Service Worker
echo "⚙️  3. Service Worker:"
echo "--------------------"
if [ -f "public/sw.js" ]; then
    echo "✅ Service Worker présent (public/sw.js)"
    
    # Vérifier les événements essentiels
    if grep -q "addEventListener.*install" public/sw.js; then
        echo "✅ Événement 'install' géré"
    else
        echo "⚠️  Événement 'install' non géré"
    fi
    
    if grep -q "addEventListener.*fetch" public/sw.js; then
        echo "✅ Événement 'fetch' géré (cache)"
    else
        echo "⚠️  Événement 'fetch' non géré"
    fi
    
else
    echo "❌ Service Worker manquant"
fi

echo ""

# Vérifier les métadonnées HTML
echo "📄 4. Métadonnées HTML:"
echo "----------------------"
if [ -f "index.html" ]; then
    if grep -q 'rel="manifest"' index.html; then
        echo "✅ Lien vers manifest.json"
    else
        echo "❌ Lien vers manifest.json manquant"
    fi
    
    if grep -q 'name="theme-color"' index.html; then
        echo "✅ Couleur de thème définie"
    else
        echo "⚠️  Couleur de thème manquante"
    fi
    
    if grep -q 'name="mobile-web-app-capable"' index.html; then
        echo "✅ Meta mobile-web-app-capable (nouveau standard)"
    else
        echo "⚠️  Meta mobile-web-app-capable manquant"
    fi
    
    if grep -q 'name="apple-mobile-web-app-capable"' index.html; then
        echo "✅ Support iOS configuré"
    else
        echo "⚠️  Support iOS manquant"
    fi
else
    echo "❌ index.html non trouvé"
fi

echo ""

# Résumé
echo "📊 RÉSUMÉ PWA:"
echo "=============="

PWA_SCORE=0
MAX_SCORE=10

# Calcul du score
if [ $MISSING_ICONS -eq 0 ]; then ((PWA_SCORE+=3)); fi
if [ -f "public/manifest.json" ]; then ((PWA_SCORE+=2)); fi
if [ -f "public/sw.js" ]; then ((PWA_SCORE+=3)); fi
if grep -q 'rel="manifest"' index.html 2>/dev/null; then ((PWA_SCORE+=1)); fi
if grep -q 'name="theme-color"' index.html 2>/dev/null; then ((PWA_SCORE+=1)); fi

echo "Score PWA: $PWA_SCORE/$MAX_SCORE"

if [ $PWA_SCORE -eq $MAX_SCORE ]; then
    echo "🎉 PWA parfaitement configurée !"
elif [ $PWA_SCORE -ge 7 ]; then
    echo "✅ PWA bien configurée"
elif [ $PWA_SCORE -ge 4 ]; then
    echo "⚠️  PWA partiellement configurée"
else
    echo "❌ PWA nécessite des corrections"
fi

echo ""
echo "🔗 Test PWA en ligne:"
echo "   1. Déployez votre app"
echo "   2. Testez sur: https://web.dev/measure/"
echo "   3. Vérifiez avec Chrome DevTools > Lighthouse"
