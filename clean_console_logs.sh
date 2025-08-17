#!/bin/bash

# Script pour nettoyer les derniers console.log restants
echo "🧹 Nettoyage des console.log restants..."

# Fichiers à traiter (excluant logger.ts et monitoring.ts qui sont légitimes)
files_with_console=$(grep -rl "console\." src --include="*.ts" --include="*.tsx" | grep -v "logger.ts" | grep -v "monitoring.ts" | grep -v "monitoringCache.ts")

for file in $files_with_console; do
    echo "📝 Traitement: $file"
    
    # Ajouter l'import logger si nécessaire
    if ! grep -q "import.*logger.*from.*logger" "$file"; then
        # Trouver la dernière ligne d'import
        local last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
        
        if [ ! -z "$last_import_line" ]; then
            # Essayer différents chemins d'import selon la structure
            if [[ $file == src/services/* ]]; then
                sed -i '' "${last_import_line}a\\
import { logger } from './logger'
" "$file" 2>/dev/null
            elif [[ $file == src/hooks/* ]]; then
                sed -i '' "${last_import_line}a\\
import { logger } from '../services/logger'
" "$file" 2>/dev/null
            elif [[ $file == src/components/* ]]; then
                # Compter les niveaux de profondeur
                level_count=$(echo "$file" | grep -o "/" | wc -l)
                if [ $level_count -eq 2 ]; then
                    # src/components/file.tsx
                    sed -i '' "${last_import_line}a\\
import { logger } from '../services/logger'
" "$file" 2>/dev/null
                else
                    # src/components/subfolder/file.tsx
                    sed -i '' "${last_import_line}a\\
import { logger } from '../../services/logger'
" "$file" 2>/dev/null
                fi
            elif [[ $file == src/pages/* ]]; then
                level_count=$(echo "$file" | grep -o "/" | wc -l)
                if [ $level_count -eq 2 ]; then
                    sed -i '' "${last_import_line}a\\
import { logger } from '../services/logger'
" "$file" 2>/dev/null
                else
                    sed -i '' "${last_import_line}a\\
import { logger } from '../../services/logger'
" "$file" 2>/dev/null
                fi
            else
                # Autres cas
                sed -i '' "${last_import_line}a\\
import { logger } from '../services/logger'
" "$file" 2>/dev/null
            fi
        fi
    fi
    
    # Remplacer les console.log par logger (sauf dans certains contextes)
    # Ne pas toucher aux console.log de debug explicites ou dans des commentaires
    sed -i '' 's|console\.log(\([^)]*\));|logger.info(\1);|g' "$file"
    sed -i '' 's|console\.error(\([^)]*\));|logger.error(\1);|g' "$file"
    sed -i '' 's|console\.warn(\([^)]*\));|logger.warn(\1);|g' "$file"
    
done

echo "✅ Nettoyage console.log terminé!"
echo "📊 Console.log restants (hors monitoring/logger):"
grep -rn "console\." src --include="*.ts" --include="*.tsx" | grep -v "logger.ts" | grep -v "monitoring.ts" | grep -v "monitoringCache.ts" | wc -l
