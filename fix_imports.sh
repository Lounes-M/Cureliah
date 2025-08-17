#!/bin/bash

# Script de nettoyage final pour corriger les imports dupliqués
echo "🔧 Correction des imports dupliqués..."

# Supprimer les lignes dupliquées d'import logger
find src -name "*.ts" -o -name "*.tsx" | while read file; do
    # Supprimer les lignes dupliquées d'import logger
    sed -i '' '/import { logger } from "@\/services\/logger"/,+1{N;s/\(import { logger } from "@\/services\/logger"[[:space:]]*\)\nimplement { logger } from "@\/services\/logger"/\1/;}' "$file"
    
    # Supprimer les imports orphelins
    sed -i '' '/^import { logger } from "@\/services\/logger"$/,/^[[:space:]]*[A-Za-z]/{/^import { logger }/d;}' "$file"
    
    # Réparer les blocs d'import cassés
    sed -i '' '/^import {$/,/^import { logger/{
        /^import { logger/d
        /^import {$/{
            N
            s/^import {$/import { logger } from "@\/services\/logger";\
import {/
        }
    }' "$file"
done

echo "✅ Correction terminée!"
