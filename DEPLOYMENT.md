# Documentation de déploiement en production pour Cureliah

## 🚀 Guide de déploiement professionnel

### Prérequis infrastructure

#### Serveur de production
- **CPU**: Minimum 2 vCPUs, recommandé 4 vCPUs
- **RAM**: Minimum 4GB, recommandé 8GB
- **Storage**: Minimum 50GB SSD, recommandé 100GB
- **OS**: Ubuntu 22.04 LTS ou CentOS 8

#### Services externes requis
- **Supabase** (Base de données et authentification)
- **Stripe** (Paiements)
- **SendGrid/Mailgun** (Emails)
- **AWS S3** (Stockage et backups)
- **CloudFlare** (CDN et protection DDoS)

### Étapes de déploiement

#### 1. Préparation du serveur
```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation de Docker et Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Installation des outils de monitoring
sudo apt install -y htop iotop nethogs
```

#### 2. Configuration des certificats SSL
```bash
# Installation de Certbot
sudo apt install certbot python3-certbot-nginx

# Génération des certificats
sudo certbot certonly --standalone -d cureliah.com -d www.cureliah.com

# Copie vers le projet
sudo cp /etc/letsencrypt/live/cureliah.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/cureliah.com/privkey.pem ./ssl/key.pem
```

#### 3. Configuration des variables d'environnement
```bash
# Copier le fichier d'exemple
cp .env.production.example .env.production

# Éditer avec les vraies valeurs
nano .env.production
```

#### 4. Déploiement avec Docker
```bash
# Build et démarrage
docker-compose -f docker-compose.yml up -d --build

# Vérification des services
docker-compose ps
docker-compose logs -f
```

#### 5. Configuration du monitoring
```bash
# Accès Grafana
open http://your-server:3000
# Login: admin / admin123

# Configuration des dashboards
# Importer les dashboards depuis monitoring/dashboards/
```

### Post-déploiement

#### Tests de fumée
```bash
# Test de santé
curl https://cureliah.com/health

# Test API
curl https://cureliah.com/api/health

# Test SSL
openssl s_client -connect cureliah.com:443 -servername cureliah.com
```

#### Configuration des sauvegardes
```bash
# Test manuel du backup
./scripts/backup.sh

# Configuration du cron
crontab -e
# Ajouter: 0 2 * * * /path/to/backup.sh
```

#### Surveillance continue
- **Uptime monitoring**: UptimeRobot ou Pingdom
- **Error tracking**: Sentry
- **Performance**: New Relic ou DataDog
- **Logs**: ELK Stack ou Splunk

### Sécurité en production

#### Pare-feu
```bash
# Configuration UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

#### Hardening système
```bash
# Désactiver SSH root
sudo nano /etc/ssh/sshd_config
# PermitRootLogin no

# Fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### Procédures opérationnelles

#### Mise à jour de l'application
```bash
# 1. Backup avant mise à jour
./scripts/backup.sh

# 2. Pull des nouvelles images
docker-compose pull

# 3. Redéploiement rolling
docker-compose up -d --no-deps --build cureliah-app

# 4. Vérification
./scripts/health-check.sh
```

#### Rollback d'urgence
```bash
# Revenir à la version précédente
docker-compose down
docker tag cureliah-app:previous cureliah-app:latest
docker-compose up -d

# Restaurer backup si nécessaire
./scripts/restore-backup.sh [backup-date]
```

### Contacts d'urgence
- **DevOps**: +33 X XX XX XX XX
- **Sécurité**: security@cureliah.com
- **Support**: support@cureliah.com

### Documentation technique
- Architecture: `/docs/architecture.md`
- API: `/docs/api.md`
- Monitoring: `/docs/monitoring.md`
- Sécurité: `/docs/security.md`
