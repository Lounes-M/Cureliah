#!/bin/bash

# Script pour remplacer automatiquement tous les TODOs logger restants
# Ce script va traiter tous les fichiers en une seule fois

echo "🚀 Démarrage du remplacement automatique des TODOs logger..."

# Fonction pour remplacer les TODOs dans un fichier
replace_todos() {
    local file="$1"
    echo "📝 Traitement: $file"
    
    # Remplacer les patterns TODO les plus courants
    sed -i '' 's|// TODO: Replace with logger\.error(\(.*\));|logger.error(\1, {}, '"'"'Auto'"'"', '"'"'todo_replaced'"'"');|g' "$file"
    sed -i '' 's|// TODO: Replace with logger\.info(\(.*\));|logger.info(\1, {}, '"'"'Auto'"'"', '"'"'todo_replaced'"'"');|g' "$file"
    sed -i '' 's|// TODO: Replace with logger\.warn(\(.*\));|logger.warn(\1, {}, '"'"'Auto'"'"', '"'"'todo_replaced'"'"');|g' "$file"
    sed -i '' 's|// TODO: Replace with logger\.debug(\(.*\));|logger.debug(\1, {}, '"'"'Auto'"'"', '"'"'todo_replaced'"'"');|g' "$file"
}

# Liste des fichiers à traiter
files=(
    "src/components/vacation/PlanningMedecin.tsx"
    "src/pages/ContactSales.tsx"
    "src/pages/MonitoringDashboard.tsx"
    "src/pages/SystemTest.tsx"
    "src/pages/PaymentSuccess.tsx"
    "src/pages/CreditsPage.tsx"
    "src/pages/ProfileComplete.tsx"
    "src/pages/EstablishmentProfile.tsx"
    "src/hooks/useRecentBookings.tsx"
    "src/hooks/useNotifications.tsx"
    "src/hooks/useMonitoringNotifications.tsx"
    "src/hooks/useEstablishmentSearch.tsx"
    "src/components/admin/UserManagement.tsx"
    "src/utils/initUrgentTables.ts"
)

# Traiter chaque fichier
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        replace_todos "$file"
    else
        echo "⚠️  Fichier non trouvé: $file"
    fi
done

echo "✅ Remplacement automatique terminé!"
echo "📊 Vérification des TODOs restants..."

# Compter les TODOs restants
remaining=$(grep -r "TODO.*Replace.*logger" src/ --include="*.tsx" --include="*.ts" | wc -l)
echo "🎯 TODOs restants: $remaining"
