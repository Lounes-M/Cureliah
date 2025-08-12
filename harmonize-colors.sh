#!/bin/bash

# Script d'harmonisation automatique de la palette de couleurs
# Remplace les classes Tailwind standard par les couleurs médicales Cureliah

echo "🎨 Harmonisation de la palette de couleurs Cureliah..."

# Répertoires à traiter
DIRS=("src/components" "src/pages" "src/layouts")

# Fonction pour traiter un fichier
harmonize_file() {
    local file="$1"
    echo "   Traitement: $file"
    
    # Remplacements des couleurs bleues
    sed -i '' \
        -e 's/bg-blue-600/bg-medical-blue/g' \
        -e 's/bg-blue-500/bg-medical-blue-light/g' \
        -e 's/bg-blue-700/bg-medical-blue-dark/g' \
        -e 's/text-blue-600/text-medical-blue/g' \
        -e 's/text-blue-500/text-medical-blue-light/g' \
        -e 's/border-blue-600/border-medical-blue/g' \
        -e 's/hover:bg-blue-700/hover:bg-medical-blue-dark/g' \
        -e 's/hover:text-blue-700/hover:text-medical-blue-dark/g' \
        "$file"
    
    # Remplacements des couleurs vertes
    sed -i '' \
        -e 's/bg-green-600/bg-medical-green/g' \
        -e 's/bg-green-500/bg-medical-green-light/g' \
        -e 's/bg-green-700/bg-medical-green-dark/g' \
        -e 's/text-green-600/text-medical-green/g' \
        -e 's/text-green-500/text-medical-green-light/g' \
        -e 's/border-green-600/border-medical-green/g' \
        -e 's/hover:bg-green-700/hover:bg-medical-green-dark/g' \
        -e 's/hover:text-green-700/hover:text-medical-green-dark/g' \
        "$file"
    
    # Autres couleurs communes
    sed -i '' \
        -e 's/bg-indigo-600/bg-medical-blue/g' \
        -e 's/bg-emerald-600/bg-medical-green/g' \
        -e 's/bg-sky-600/bg-medical-blue-light/g' \
        -e 's/bg-teal-600/bg-medical-green/g' \
        "$file"
}

# Traiter tous les fichiers TypeScript/JSX
for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "📁 Traitement du répertoire: $dir"
        find "$dir" -name "*.tsx" -o -name "*.ts" | while read -r file; do
            harmonize_file "$file"
        done
    fi
done

echo "✅ Harmonisation terminée!"

# Vérification des résultats
echo ""
echo "📊 Vérification des couleurs restantes à harmoniser:"

# Chercher les couleurs Tailwind standard qui pourraient encore exister
echo "🔍 Couleurs bleues non harmonisées:"
grep -r "bg-blue-[0-9]" src/ --include="*.tsx" --include="*.ts" | head -5

echo "🔍 Couleurs vertes non harmonisées:"  
grep -r "bg-green-[0-9]" src/ --include="*.tsx" --include="*.ts" | head -5

echo ""
echo "💡 Les couleurs listées ci-dessus nécessitent une vérification manuelle"
echo "💡 Assurez-vous qu'elles respectent la palette médicale Cureliah"
