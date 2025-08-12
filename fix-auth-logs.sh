#!/bin/bash

# Script pour corriger automatiquement la syntaxe des logs dans useAuth.tsx
# Remplace les anciens patterns console.log par le nouveau format du logger

FILE="src/hooks/useAuth.tsx"

echo "🔧 Correction automatique des logs dans $FILE..."

# Patterns de remplacement pour corriger les erreurs de syntaxe
sed -i '' \
  -e 's/log\.debug("✅ Doctor profile loaded with avatar:", doctorProfile\.avatar_url);/log.debug("Doctor profile loaded", { avatarUrl: doctorProfile.avatar_url, userId: authUser.id });/g' \
  -e 's/log\.debug("⏰ Doctor profile query timeout, continuing without it");/log.debug("Doctor profile query timeout", { userId: authUser.id });/g' \
  -e 's/log\.debug("✅ Establishment profile loaded with avatar:", establishmentProfile\.avatar_url);/log.debug("Establishment profile loaded", { avatarUrl: establishmentProfile.avatar_url, userId: authUser.id });/g' \
  -e 's/log\.debug("⏰ Establishment profile query timeout, continuing without it");/log.debug("Establishment profile query timeout", { userId: authUser.id });/g' \
  -e 's/log\.debug("✅ User data loaded successfully:", {.*$/log.debug("User data loaded successfully", { userId: authUser.id, userType: validProfile.user_type });/g' \
  -e 's/log\.error("❌ Error fetching user profile:", error);/log.error("Error fetching user profile", error, { userId: authUser.id });/g' \
  -e 's/log\.debug("⚠️ Using fallback user:", fallbackUser);/log.debug("Using fallback user", { userId: fallbackUser.id, userType: fallbackUser.user_type });/g' \
  -e 's/log\.debug("🏁 fetchUserProfile finished, setting loading to false");/log.debug("fetchUserProfile completed", { userId: authUser.id });/g' \
  -e 's/log\.debug("🚀 Auth initialization started");/log.debug("Auth initialization started");/g' \
  -e 's/log\.debug("📡 Getting Supabase session\.\.\.");/log.debug("Getting Supabase session");/g' \
  -e 's/log\.debug("📡 Session result:", session ? "Found" : "None");/log.debug("Session result", { sessionFound: !!session });/g' \
  -e 's/log\.debug("👤 User found in session, fetching profile\.\.\.");/log.debug("User found in session", { userId: session.user.id });/g' \
  -e 's/log\.debug("🔄 Auth state changed:", event, session?.user?.email);/log.debug("Auth state changed", { event, userEmail: session?.user?.email?.substring(0, 3) + "***" });/g' \
  -e 's/log\.debug("🚀 Redirecting to dashboard:", dashboardRoute);/log.debug("Redirecting to dashboard", { route: dashboardRoute });/g' \
  -e 's/log\.debug("🔐 Signing in user:", email);/log.userAction("sign_in_attempt", undefined, { email: email?.substring(0, 3) + "***" });/g' \
  -e 's/log\.debug("📝 Signing up user:", email, userType);/log.userAction("sign_up_attempt", undefined, { email: email?.substring(0, 3) + "***", userType });/g' \
  "$FILE"

# Nettoyer les logs multi-lignes complexes
sed -i '' \
  -e '/log\.debug.*"Email confirmed:",/{N;N;d;}' \
  -e '/log\.debug.*"Needs confirmation:",/{N;N;d;}' \
  -e '/log\.debug.*"\[useAuth\] Statut abonnement reçu du backend:",/{N;N;d;}' \
  -e '/log\.debug.*"user:",/{N;N;d;}' \
  "$FILE"

# Remplacer les patterns avec utilisateur
sed -i '' \
  -e 's/log\.debug("\[useAuth\] Avant useEffect, user:", user);/log.debug("Before useEffect", { userId: user?.id });/g' \
  -e 's/log\.debug("\[useAuth\] useEffect fetchSubscription triggered", user);/log.debug("useEffect fetchSubscription triggered", { userId: user?.id });/g' \
  -e 's/log\.debug("\[useAuth\] fetchSubscription called", user);/log.debug("fetchSubscription called", { userId: user?.id });/g' \
  -e 's/log\.debug("\[useAuth\] contextValue:", contextValue);/log.debug("AuthContext value prepared", { userId: user?.id, hasProfile: !!profile });/g' \
  "$FILE"

# Ajouter les logs manquants pour les blocs multi-lignes supprimés
cat >> "$FILE.tmp" << 'EOF'

// Logs de remplacement ajoutés par le script de migration
const addReplacementLogs = () => {
  // Ces logs remplacent les anciens logs multi-lignes supprimés
  // Ils seront intégrés manuellement aux bonnes positions
};
EOF

echo "✅ Correction automatique terminée pour $FILE"
echo "⚠️  Vérification manuelle requise pour les logs complexes"

# Supprimer le fichier temporaire
rm -f "$FILE.tmp"
