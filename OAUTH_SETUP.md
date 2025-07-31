# Configuration OAuth pour Google et LinkedIn

## 🚀 Configuration requise dans Supabase

### 1. Google OAuth

#### Étapes dans Google Cloud Console :

1. **Aller sur [Google Cloud Console](https://console.cloud.google.com/)**
2. **Créer ou sélectionner un projet**
3. **Activer Google+ API :**
   - Aller dans "APIs & Services" > "Library"
   - Chercher "Google+ API" et l'activer
4. **Créer des identifiants OAuth 2.0 :**
   - Aller dans "APIs & Services" > "Credentials"
   - Cliquer "Create Credentials" > "OAuth 2.0 Client IDs"
   - Type d'application : "Web application"
   - **Origines JavaScript autorisées :**
     ```
     http://localhost:8081
     https://votre-domaine.com
     ```
   - **URIs de redirection autorisées :**
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     http://localhost:8081/auth/callback
     ```

#### Configuration dans Supabase :

1. **Aller dans Supabase Dashboard > Authentication > Providers**
2. **Activer Google :**
   - Enable : ✅
   - Client ID : `votre-google-client-id`
   - Client Secret : `votre-google-client-secret`

### 2. LinkedIn OAuth

#### Étapes dans LinkedIn Developer Portal :

1. **Aller sur [LinkedIn Developer Portal](https://www.linkedin.com/developers/)**
2. **Créer une nouvelle app**
3. **Configurer l'OAuth :**
   - **Redirect URLs :**
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     http://localhost:8081/auth/callback
     ```
   - **Scopes requis :**
     - `r_liteprofile` (profil de base)
     - `r_emailaddress` (adresse email)

#### Configuration dans Supabase :

1. **Aller dans Supabase Dashboard > Authentication > Providers**
2. **Activer LinkedIn (OIDC) :**
   - Enable : ✅
   - Client ID : `votre-linkedin-client-id`
   - Client Secret : `votre-linkedin-client-secret`

## 🔧 Variables d'environnement

Ajouter à votre `.env.local` :

```bash
# OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_LINKEDIN_CLIENT_ID=your-linkedin-client-id
VITE_REDIRECT_URL=http://localhost:8081/auth/callback
```

## 🎯 URLs de redirection

### Développement :
```
http://localhost:8081/auth/callback
```

### Production :
```
https://votre-domaine.com/auth/callback
```

## ✅ Fonctionnalités implémentées

- ✅ **Boutons OAuth** dans la page d'authentification
- ✅ **Callback OAuth** avec gestion d'erreurs
- ✅ **Création automatique de profil** pour nouveaux utilisateurs
- ✅ **Page de configuration** pour choisir le type de compte
- ✅ **Extraction des données** (nom, email, avatar) depuis Google/LinkedIn
- ✅ **Redirection intelligente** vers le bon dashboard

## 🔍 Test de l'implémentation

1. **Lancer l'application :** `npm run dev`
2. **Aller sur** `http://localhost:8081/auth`
3. **Cliquer sur "Google" ou "LinkedIn"**
4. **Suivre le flow OAuth**
5. **Vérifier la création du profil** dans Supabase

## 🐛 Debug

Si l'OAuth ne fonctionne pas :

1. **Vérifier les URLs de redirection** dans Google/LinkedIn
2. **Vérifier la configuration Supabase**
3. **Regarder la console** pour les erreurs
4. **Tester l'URL de callback** : `/auth/callback`

## 📋 Checklist de déploiement

- [ ] Configurer Google OAuth avec URLs de production
- [ ] Configurer LinkedIn OAuth avec URLs de production
- [ ] Mettre à jour les variables d'environnement
- [ ] Tester le flow complet en production
- [ ] Vérifier les redirections
