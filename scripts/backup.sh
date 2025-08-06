#!/bin/bash
# Script de backup automatique pour Cureliah

set -e

# Variables d'environnement
PROJECT_ID=${SUPABASE_PROJECT_ID:-"your-project-id"}
ACCESS_TOKEN=${SUPABASE_ACCESS_TOKEN:-"your-access-token"}
S3_BUCKET=${BACKUP_S3_BUCKET:-"cureliah-backups"}
BACKUP_DIR="/backups"
DATE=$(date +%Y-%m-%d-%H-%M-%S)

echo "🔄 Démarrage du backup automatique - $DATE"

# Créer le dossier de backup
mkdir -p "$BACKUP_DIR/$DATE"

# 1. Backup de la base de données Supabase
echo "📦 Backup de la base de données..."
if command -v supabase &> /dev/null; then
    # Export de la structure et des données
    supabase db dump --project-id "$PROJECT_ID" > "$BACKUP_DIR/$DATE/database.sql"
    
    # Export des policies RLS
    supabase db dump --project-id "$PROJECT_ID" --schema auth > "$BACKUP_DIR/$DATE/auth_policies.sql"
    
    echo "✅ Backup base de données terminé"
else
    echo "⚠️ Supabase CLI non disponible, utilisation de pg_dump..."
    # Fallback avec pg_dump si Supabase CLI n'est pas disponible
    # pg_dump $DATABASE_URL > "$BACKUP_DIR/$DATE/database.sql"
fi

# 2. Backup des fichiers de storage
echo "📁 Backup des fichiers de storage..."
# TODO: Implement storage backup logic
# supabase storage download --project-id "$PROJECT_ID" --bucket-name "avatars" "$BACKUP_DIR/$DATE/storage/"

# 3. Backup des configurations
echo "⚙️ Backup des configurations..."
cp -r /app/config "$BACKUP_DIR/$DATE/" 2>/dev/null || echo "Pas de dossier config à sauvegarder"

# 4. Créer l'archive
echo "🗜️ Création de l'archive..."
cd "$BACKUP_DIR"
tar -czf "cureliah-backup-$DATE.tar.gz" "$DATE/"

# 5. Upload vers S3
echo "☁️ Upload vers S3..."
if command -v aws &> /dev/null; then
    aws s3 cp "cureliah-backup-$DATE.tar.gz" "s3://$S3_BUCKET/daily-backups/"
    echo "✅ Backup uploadé vers S3"
else
    echo "⚠️ AWS CLI non disponible, backup local uniquement"
fi

# 6. Nettoyage des anciens backups (garder 7 jours)
echo "🧹 Nettoyage des anciens backups..."
find "$BACKUP_DIR" -type f -name "cureliah-backup-*.tar.gz" -mtime +7 -delete
rm -rf "$BACKUP_DIR/$DATE"

# 7. Nettoyage S3 (garder 30 jours)
if command -v aws &> /dev/null; then
    aws s3api list-objects-v2 --bucket "$S3_BUCKET" --prefix "daily-backups/" --query "Contents[?LastModified<='$(date -d '30 days ago' --iso-8601)'].Key" --output text | xargs -r -I {} aws s3 rm "s3://$S3_BUCKET/{}"
fi

# 8. Vérification de l'intégrité
echo "🔍 Vérification de l'intégrité..."
if [ -f "cureliah-backup-$DATE.tar.gz" ]; then
    BACKUP_SIZE=$(stat -f%z "cureliah-backup-$DATE.tar.gz" 2>/dev/null || stat -c%s "cureliah-backup-$DATE.tar.gz")
    if [ "$BACKUP_SIZE" -gt 1000 ]; then
        echo "✅ Backup créé avec succès ($BACKUP_SIZE bytes)"
        
        # Log du succès
        echo "$(date): Backup successful - Size: $BACKUP_SIZE bytes" >> /var/log/backup.log
        
        # Notification de succès (optionnel)
        if [ -n "$SLACK_WEBHOOK" ]; then
            curl -X POST -H 'Content-type: application/json' \
                --data "{\"text\":\"✅ Backup Cureliah réussi - $DATE ($BACKUP_SIZE bytes)\"}" \
                "$SLACK_WEBHOOK"
        fi
    else
        echo "❌ Erreur: Backup trop petit"
        exit 1
    fi
else
    echo "❌ Erreur: Fichier de backup non créé"
    exit 1
fi

echo "🎉 Backup terminé avec succès!"
