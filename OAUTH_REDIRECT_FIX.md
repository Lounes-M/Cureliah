# 🔧 RÉSOLUTION: Erreur OAuth Google - redirect_uri_mismatch

## 🚨 PROBLÈME IDENTIFIÉ

```
Erreur 400 : redirect_uri_mismatch
```

Cette erreur signifie que l'URL de redirection configurée dans Google Cloud Console ne correspond pas à l'URL utilisée par votre application.

## ✅ SOLUTION ÉTAPE PAR ÉTAPE

### 1. **Vérifier l'URL de votre application**

**Application en développement:**
```
URL de base: http://localhost:5173
URL de callback: http://localhost:5173/auth/callback
```

**Application en production:**
```
URL de base: https://cureliah.com
URL de callback: https://cureliah.com/auth/callback
```

### 2. **Configurer Google Cloud Console**

1. **Aller sur** [Google Cloud Console](https://console.cloud.google.com/)
2. **Sélectionner votre projet** Cureliah
3. **Naviguer vers** : APIs & Services > Credentials
4. **Cliquer sur votre OAuth 2.0 Client ID**
5. **Dans "Authorized redirect URIs", ajouter:**

#### Pour le développement:
```
http://localhost:5173/auth/callback
```

#### Pour la production:
```
https://cureliah.com/auth/callback
```

### 3. **Vérification de la configuration Supabase**

Dans votre **Supabase Dashboard** :

1. **Aller dans** Authentication > Providers > Google
2. **Vérifier que l'URL de redirection est:**
```
https://[votre-projet-id].supabase.co/auth/v1/callback
```

### 4. **Configuration des variables d'environnement**

Vérifiez votre fichier `.env.local` :

```env
VITE_SUPABASE_URL=https://[votre-projet-id].supabase.co
VITE_SUPABASE_ANON_KEY=[votre-clé-anonyme]
VITE_GOOGLE_CLIENT_ID=[votre-client-id-google]
```

## 🔄 PROCESSUS DE TEST

### 1. **Redémarrer le serveur de développement**
```bash
npm run dev
# ou
yarn dev
```

### 2. **Tester la connexion OAuth**
1. Aller sur `http://localhost:5173/auth`
2. Cliquer sur "Se connecter avec Google"
3. Vérifier que la redirection fonctionne

## 🛡️ URLS AUTORISÉES À CONFIGURER

### Google Cloud Console - Authorized redirect URIs:

**Développement local:**
```
http://localhost:5173/auth/callback
http://127.0.0.1:5173/auth/callback
```

**Production (exemple):**
```
https://cureliah.com/auth/callback
https://www.cureliah.com/auth/callback
```

**Supabase (obligatoire):**
```
https://[votre-projet-id].supabase.co/auth/v1/callback
```

## ⚠️ POINTS IMPORTANTS

1. **Pas de slash final** dans les URLs
2. **HTTPS en production** obligatoire pour Google OAuth
3. **Redémarrer l'application** après changement de configuration
4. **Attendre 5-10 minutes** pour que les changements Google prennent effet

## 🔍 VÉRIFICATION APRÈS CONFIGURATION

Testez ces URLs dans votre navigateur :

1. **Page d'authentification** : `http://localhost:5173/auth`
2. **Callback OAuth** : `http://localhost:5173/auth/callback` (doit rediriger)
3. **Page de configuration** : `http://localhost:5173/setup-profile`

## 📝 CHECKLIST DE VÉRIFICATION

- [ ] URLs configurées dans Google Cloud Console
- [ ] Supabase OAuth Google activé avec bon Client ID
- [ ] Variables d'environnement correctes
- [ ] Serveur de développement redémarré
- [ ] Test de connexion Google réussi

Une fois ces étapes complétées, l'erreur `redirect_uri_mismatch` devrait être résolue.
