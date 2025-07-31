#!/bin/bash

# 🔒 Script de vérification de sécurité Cureliah
# Usage: ./security-check.sh

echo "🔍 AUDIT SÉCURITÉ CURELIAH"
echo "=========================="

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# 1. Vérifier les fichiers de backup
echo -e "\n${YELLOW}1. Recherche de fichiers de backup...${NC}"
BACKUP_FILES=$(find . -name "*.bak" -o -name "*.backup" -o -name "*.tmp" -o -name "*.orig" 2>/dev/null | grep -v node_modules)
if [ -z "$BACKUP_FILES" ]; then
    print_result 0 "Aucun fichier de backup trouvé"
else
    print_result 1 "Fichiers de backup détectés:"
    echo "$BACKUP_FILES"
fi

# 2. Vérifier les tokens JWT en dur
echo -e "\n${YELLOW}2. Recherche de tokens JWT...${NC}"
JWT_TOKENS=$(grep -r "eyJ" --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" . 2>/dev/null | grep -v "package-lock.json")
if [ -z "$JWT_TOKENS" ]; then
    print_result 0 "Aucun token JWT en dur détecté"
else
    print_result 1 "Tokens JWT détectés:"
    echo "$JWT_TOKENS"
fi

# 3. Vérifier les clés API/secrets
echo -e "\n${YELLOW}3. Recherche de clés API/secrets...${NC}"
SECRETS=$(grep -r -E "(api_key|secret_key|private_key|client_secret)" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/ 2>/dev/null | grep -v "client_secret" | grep -v "VITE_")
if [ -z "$SECRETS" ]; then
    print_result 0 "Aucune clé en dur détectée"
else
    print_result 1 "Clés potentielles détectées:"
    echo "$SECRETS"
fi

# 4. Vérifier les URLs Supabase en dur
echo -e "\n${YELLOW}4. Recherche d'URLs Supabase...${NC}"
SUPABASE_URLS=$(grep -r "https://.*\.supabase\.co" --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" . 2>/dev/null)
if [ -z "$SUPABASE_URLS" ]; then
    print_result 0 "Aucune URL Supabase en dur"
else
    print_result 1 "URLs Supabase détectées:"
    echo "$SUPABASE_URLS"
fi

# 5. Vérifier le .gitignore
echo -e "\n${YELLOW}5. Vérification du .gitignore...${NC}"
if grep -q "\.env" .gitignore && grep -q "\.bak" .gitignore; then
    print_result 0 "Fichier .gitignore correctement configuré"
else
    print_result 1 "Fichier .gitignore à améliorer"
fi

# 6. Vérifier les console.log avec données sensibles
echo -e "\n${YELLOW}6. Recherche de console.log sensibles...${NC}"
SENSITIVE_LOGS=$(grep -r "console\.log.*\(token\|key\|secret\|password\)" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/ 2>/dev/null)
if [ -z "$SENSITIVE_LOGS" ]; then
    print_result 0 "Aucun console.log sensible détecté"
else
    print_result 1 "Console.log sensibles détectés:"
    echo "$SENSITIVE_LOGS"
fi

echo -e "\n${YELLOW}=========================="
echo -e "🎯 AUDIT TERMINÉ${NC}"
echo -e "\n${GREEN}Recommandations:${NC}"
echo "• Exécuter ce script avant chaque commit"
echo "• Régénérer les clés si exposées"
echo "• Utiliser uniquement des variables d'environnement"
