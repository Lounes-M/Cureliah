# 🎯 Guide de Création des Produits Stripe - Nouvelles Offres

## Étapes de Configuration Stripe

### 1. Connexion à Stripe Dashboard
- Rendez-vous sur : https://dashboard.stripe.com
- **⚠️ IMPORTANT** : Assurez-vous d'être en mode **PRODUCTION** (pas test)

### 2. Création des 3 Produits

#### 📦 **Produit 1 : Essentiel**
```
Nom du produit : Cureliah Essentiel
Description : Parfait pour commencer votre activité médicale
```

**Prix à créer :**
- **Mensuel** : €49.00 EUR - Récurrent mensuel
- **Annuel** : €470.00 EUR - Récurrent annuel (économie de ~20%)

#### 🚀 **Produit 2 : Pro** 
```
Nom du produit : Cureliah Pro
Description : Pour les médecins actifs et ambitieux
```

**Prix à créer :**
- **Mensuel** : €99.00 EUR - Récurrent mensuel  
- **Annuel** : €950.00 EUR - Récurrent annuel (économie de ~20%)

#### ⭐ **Produit 3 : Premium**
```
Nom du produit : Cureliah Premium
Description : Pour les médecins experts et établissements
```

**Prix à créer :**
- **Mensuel** : €199.00 EUR - Récurrent mensuel
- **Annuel** : €1910.00 EUR - Récurrent annuel (économie de ~20%)

### 3. Copie des Price IDs

Une fois les produits créés, vous obtiendrez 6 Price IDs au format :
- `price_1ABC123DEF456...` (Essentiel Mensuel)
- `price_1ABC123DEF789...` (Essentiel Annuel)
- `price_1DEF456GHI012...` (Pro Mensuel)
- `price_1DEF456GHI345...` (Pro Annuel)
- `price_1GHI789JKL678...` (Premium Mensuel)
- `price_1GHI789JKL901...` (Premium Annuel)

### 4. Configuration Automatique

Lancez le script de configuration :
```bash
./update-stripe-prices.sh
```

Et entrez les Price IDs copiés depuis Stripe Dashboard.

## 📊 Résumé des Offres

| Offre | Mensuel | Annuel | Économie |
|-------|---------|--------|----------|
| **Essentiel** | €49 | €470 (~€39/mois) | ~20% |
| **Pro** | €99 | €950 (~€79/mois) | ~20% |
| **Premium** | €199 | €1910 (~€159/mois) | ~20% |

## ✅ Fonctionnalités par Offre

### 📦 **Essentiel (€49/mois)**
- Profil médecin vérifié et sécurisé
- Recherche de missions par spécialité
- Notifications par email en temps réel
- Support technique basique (48h)

### 🚀 **Pro (€99/mois)**
- Toutes les fonctionnalités Essentiel
- Accès prioritaire aux missions
- Statistiques détaillées et analytics
- Support prioritaire (24h)
- Facturation automatique et rapports
- Intégration calendrier avancée

### ⭐ **Premium (€199/mois)**
- Toutes les fonctionnalités Pro
- Missions exclusives haute rémunération
- Accès aux établissements premium
- Formation personnalisée incluse
- Manager dédicacé personnel
- API complète et webhooks
- Support 24/7 avec hotline directe

## 🔄 Prochaines Étapes

1. ✅ Créer les produits dans Stripe Dashboard
2. ✅ Copier les Price IDs
3. ✅ Lancer `./update-stripe-prices.sh`
4. ✅ Configurer les variables d'environnement Supabase
5. ✅ Tester le flux d'abonnement

---
**Note** : Ce guide remplace l'ancienne structure à 3 offres (Establishment/Doctor/API) par la nouvelle structure unifiée (Essentiel/Pro/Premium).
