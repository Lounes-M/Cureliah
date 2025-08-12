#!/bin/bash

# Script pour supprimer les délais artificiels de navigation
# Identifie et supprime les setTimeout inutiles qui dégradent l'UX

echo "⚡ Suppression des délais artificiels de navigation..."

# Patterns à rechercher et leurs remplacements
remove_artificial_delays() {
    local file="$1"
    local changed=false
    
    # Sauvegarder le fichier original
    cp "$file" "$file.bak"
    
    # Supprimer les délais de navigation (800ms, 1000ms etc.)
    if grep -q "setTimeout.*navigate\|setTimeout.*router\|setTimeout.*redirect" "$file"; then
        echo "   🔧 Suppression délais navigation: $file"
        
        # Pattern 1: setTimeout(() => navigate(...), 800)
        sed -i '' 's/setTimeout(() => navigate(/navigate(/g' "$file"
        sed -i '' 's/setTimeout(() => router\.push(/router.push(/g' "$file"
        
        # Pattern 2: setTimeout(callback, delay) où callback contient navigate
        sed -i '' '/setTimeout.*[0-9]{3,}.*navigate/d' "$file"
        
        changed=true
    fi
    
    # Conserver uniquement les délais nécessaires (UX, animations)
    # Les délais < 500ms pour les animations sont conservés
    # Les délais pour les toasts, feedback utilisateur sont conservés
    
    if [ "$changed" = true ]; then
        echo "   ✅ Délais supprimés: $file"
    else
        rm "$file.bak"  # Pas de changement, supprimer la sauvegarde
    fi
}

# Traiter les fichiers de navigation et routing
echo "📁 Traitement des fichiers de navigation..."

find src -name "*.tsx" -o -name "*.ts" | while read -r file; do
    # Vérifier si le fichier contient des navigations avec délais
    if grep -q "setTimeout.*navigate\|setTimeout.*router\|setTimeout.*redirect" "$file" 2>/dev/null; then
        remove_artificial_delays "$file"
    fi
done

echo ""
echo "📊 Vérification des délais restants..."

# Identifier les délais potentiellement inutiles (> 500ms)
echo "⚠️  Délais longs détectés (vérification manuelle nécessaire):"
grep -r "setTimeout.*[1-9][0-9]{3,}" src/ --include="*.tsx" --include="*.ts" | head -10

echo ""
echo "✅ Suppression des délais artificiels terminée!"
echo "💡 Les délais > 1000ms listés ci-dessus nécessitent une vérification manuelle"
