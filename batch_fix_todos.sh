#!/bin/bash

# Script pour nettoyer TOUS les TODOs de logger d'un coup
echo "🧹 Nettoyage complet des TODOs de logger..."

# Fonction pour ajouter l'import logger si nécessaire
add_logger_import() {
    local file="$1"
    
    # Vérifier si le fichier a déjà l'import logger
    if ! grep -q "import.*logger.*from.*logger" "$file"; then
        # Trouver la dernière ligne d'import
        local last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
        
        if [ ! -z "$last_import_line" ]; then
            # Ajouter l'import après la dernière ligne d'import
            sed -i '' "${last_import_line}a\\
import { logger } from '../services/logger'
" "$file" 2>/dev/null || sed -i '' "${last_import_line}a\\
import { logger } from './logger'
" "$file" 2>/dev/null || sed -i '' "${last_import_line}a\\
import { logger } from '../../services/logger'
" "$file" 2>/dev/null
        fi
    fi
}

# Traiter tous les fichiers avec des TODOs
files_with_todos=$(grep -rl "TODO: Replace with logger" src --include="*.ts" --include="*.tsx")

for file in $files_with_todos; do
    echo "📝 Traitement: $file"
    
    # Ajouter l'import logger
    add_logger_import "$file"
    
    # Remplacer les différents patterns de TODO
    sed -i '' 's|// TODO: Replace with logger\.error(\([^)]*\));|logger.error(\1);|g' "$file"
    sed -i '' 's|// TODO: Replace with logger\.info(\([^)]*\));|logger.info(\1);|g' "$file"
    sed -i '' 's|// TODO: Replace with logger\.warn(\([^)]*\));|logger.warn(\1);|g' "$file"
    sed -i '' 's|// TODO: Replace with logger\.debug(\([^)]*\));|logger.debug(\1);|g' "$file"
    
    # Remplacer les patterns avec quotes multiples
    sed -i '' "s|// TODO: Replace with logger\.error('\([^']*\)', \([^)]*\));|logger.error('\1', \2);|g" "$file"
    sed -i '' 's|// TODO: Replace with logger\.info("\([^"]*\)", \([^)]*\));|logger.info("\1", \2);|g' "$file"
    
    # Supprimer les TODO isolés
    sed -i '' '/^[[:space:]]*\/\/ TODO: Replace with logger/d' "$file"
done

echo "✅ Nettoyage terminé!"
echo "📊 TODOs restants:"
grep -rn "TODO: Replace with logger" src --include="*.ts" --include="*.tsx" | wc -l
