# 🚀 Actions i1. **Sélectionner le projet** dans Google Cloud Console
2. **Aller dans "APIs & Services" > "Credentials"**édiates pour configurer Google OAuth

## ✅ Ce qui est déjà fait :

- ✅ **Client ID Google** : Configuré dans `.env.local`
- ✅ **Client Secret Google** : Configuré dans `.env.local`
- ✅ **Variables d'environnement** mises à jour dans `.env.local`
- ✅ **Code OAuth** implémenté dans l'application

## 🔧 À faire maintenant :

### 1. Configurer Google Cloud Console

1. **Aller sur [Google Cloud Console](https://console.cloud.google.com/)**
2. **Sélectionner le projet** `fit-aleph-462514-q8`
3. **Aller dans "APIs & Services" > "Credentials"**
4. **Cliquer sur votre OAuth 2.0 Client ID**
5. **Ajouter ces URLs dans "Authorized redirect URIs" :**
   ```
   https://[VOTRE_PROJET_SUPABASE].supabase.co/auth/v1/callback
   http://localhost:8081/auth/callback
   ```
6. **Ajouter dans "Authorized JavaScript origins" :**
   ```
   http://localhost:8081
   https://votre-domaine-production.com
   ```

### 2. Configurer Supabase

1. **Aller sur [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Sélectionner votre projet** Supabase
3. **Aller dans Authentication > Providers**
4. **Activer Google :**
   - **Enable** : ✅ Cocher
   - **Client ID** : `[COPIER DEPUIS VOTRE .env.local]`
   - **Client Secret** : `[COPIER DEPUIS VOTRE .env.local]`
5. **Cliquer "Save"**

## 🧪 Test immédiat

1. **Redémarrer l'application :**
   ```bash
   npm run dev
   ```

2. **Aller sur :** `http://localhost:8081/auth`

3. **Cliquer sur le bouton "Google"**

4. **Vérifier le flow :**
   - Redirection vers Google ✅
   - Connexion Google ✅
   - Retour sur `/auth/callback` ✅
   - Redirection vers `/setup-profile` ✅
   - Choix du type de compte ✅
   - Redirection vers dashboard ✅

## 🔍 Debug si ça ne marche pas

**Si erreur "redirect_uri_mismatch" :**
- Vérifier que les URLs sont exactement identiques dans Google Console

**Si erreur "unauthorized_client" :**
- Vérifier que le Client ID/Secret sont corrects dans Supabase

**Si pas de redirection :**
- Vérifier que le serveur dev tourne sur le bon port (8081)

## 📱 LinkedIn (optionnel)

Pour LinkedIn, vous devrez :
1. Créer une app sur [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Ajouter les mêmes URLs de redirection
3. Configurer dans Supabase avec "LinkedIn (OIDC)"

## ✨ Une fois testé avec succès

- [ ] Google OAuth fonctionne en local
- [ ] Profil utilisateur créé automatiquement
- [ ] Redirection vers dashboard correct
- [ ] Avatar Google importé

**Prêt pour le déploiement !** 🚀
