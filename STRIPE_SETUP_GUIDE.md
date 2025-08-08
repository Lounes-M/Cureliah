# Configuration Stripe pour le Système de Crédits

## 1. Configuration Stripe Dashboard

### Étape 1 : Créer un compte Stripe
1. Allez sur [https://stripe.com](https://stripe.com)
2. Créez un compte ou connectez-vous
3. Activez votre compte en mode "Live" pour la production

### Étape 2 : Récupérer les clés API
1. Dans le dashboard Stripe, allez dans **Developers** > **API Keys**
2. Copiez vos clés :
   - **Publishable key** (commence par `pk_`)
   - **Secret key** (commence par `sk_`)

### Étape 3 : Configuration des variables d'environnement

#### Dans votre fichier `.env` local :
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXX
```

#### Dans Supabase (Project Settings > Edge Functions > Environment Variables) :
```
STRIPE_SECRET_KEY=sk_test_XXXXX
```

## 2. Déploiement des fonctions Supabase Edge

### Prérequis
Installez la CLI Supabase :
```bash
npm install -g supabase
```

### Déployer les fonctions
```bash
# Se connecter à Supabase
supabase login

# Lier votre projet
supabase link --project-ref YOUR_PROJECT_ID

# Déployer les fonctions
supabase functions deploy create-credits-checkout
supabase functions deploy verify-credits-purchase
```

### Définir les variables d'environnement pour les fonctions
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_XXXXX
```

## 3. Configuration de la base de données

### Créer les tables de crédits
Exécutez le script SQL dans l'éditeur SQL de Supabase :
```sql
-- Contenu du fichier CREDITS_TABLES_SETUP.sql
```

### Vérifier les RLS (Row Level Security)
Assurez-vous que les politiques RLS sont bien configurées :
- Les utilisateurs peuvent voir leurs propres crédits
- Les fonctions système peuvent insérer des transactions
- Les fonctions système peuvent mettre à jour les soldes

## 4. Configuration des Webhooks Stripe (Optionnel mais recommandé)

### Étape 1 : Créer un endpoint webhook
1. Dans le dashboard Stripe, allez dans **Developers** > **Webhooks**
2. Cliquez sur **Add endpoint**
3. URL de l'endpoint : `https://YOUR_SUPABASE_URL.supabase.co/functions/v1/stripe-webhook`
4. Sélectionnez les événements :
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

### Étape 2 : Récupérer la clé de signature
1. Cliquez sur votre webhook créé
2. Copiez la **Signing secret** (commence par `whsec_`)
3. Ajoutez-la aux variables d'environnement Supabase :
```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_XXXXX
```

## 5. Test du système

### Test avec les clés de test
1. Utilisez les clés de test Stripe (commencent par `pk_test_` et `sk_test_`)
2. Utilisez les numéros de carte de test Stripe :
   - **Succès** : `4242 4242 4242 4242`
   - **Décliné** : `4000 0000 0000 0002`
   - **Authentification 3D Secure** : `4000 0027 6000 3184`

### Vérifier le flux complet
1. Un établissement achète des crédits
2. La session Stripe est créée
3. Le paiement est traité
4. Les crédits sont ajoutés au compte
5. L'historique des transactions est mis à jour

## 6. Migration vers la production

### Étape 1 : Activer le compte Stripe
1. Complétez la vérification de votre entreprise dans Stripe
2. Activez votre compte pour accepter des paiements réels

### Étape 2 : Remplacer les clés de test
```env
# Production
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXX
```
```bash
# Supabase production
supabase secrets set STRIPE_SECRET_KEY=sk_live_XXXXX
```

### Étape 3 : Mettre à jour les webhooks
Créez de nouveaux webhooks pointant vers votre environnement de production.

## 7. Sécurité

### Bonnes pratiques
- ✅ Utilisez HTTPS partout
- ✅ Validez tous les webhooks avec la signature Stripe
- ✅ Ne jamais exposer les clés secrètes côté client
- ✅ Loggez toutes les transactions pour audit
- ✅ Mettez en place des alertes pour les échecs de paiement

### Gestion des erreurs
- Gérez les cas d'échec de paiement
- Implémentez une logique de retry pour les webhooks
- Alertez l'équipe technique en cas de problèmes

## 8. Monitoring

### Métriques importantes
- Taux de conversion des paiements
- Montant moyen des achats de crédits
- Fréquence d'utilisation des crédits
- Taux d'abandon panier

### Outils de monitoring
- Dashboard Stripe pour les paiements
- Logs Supabase pour les fonctions Edge
- Métriques applicatives via votre système d'analytics

## 9. Support client

### Gestion des remboursements
Utilisez la fonction `refund_credits` pour rembourser des crédits :
```sql
SELECT refund_credits('user_id', amount, 'Raison du remboursement');
```

### Questions fréquentes
- Les crédits n'expirent pas
- Les crédits ne sont pas transférables entre comptes
- Le prix d'un crédit est fixe à 1€
- Les remboursements sont possibles selon vos conditions générales
