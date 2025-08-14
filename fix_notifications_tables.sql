-- Tables manquantes pour corriger les erreurs
-- Execute ce script dans le SQL Editor de Supabase

-- Table des notifications génériques
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);

-- RLS pour notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Mise à jour de la table urgent_request_notifications pour qu'elle corresponde au code existant
-- D'abord supprimer l'ancienne si elle existe
DROP TABLE IF EXISTS urgent_request_notifications CASCADE;

-- Recréer avec le bon schéma (utilisant 'read' au lieu de 'is_read')
CREATE TABLE urgent_request_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL DEFAULT 'doctor',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  urgency_level INTEGER CHECK (urgency_level BETWEEN 1 AND 5) DEFAULT 1,
  patient_id UUID,
  mission_id UUID,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour urgent_request_notifications
CREATE INDEX IF NOT EXISTS idx_urgent_notifications_recipient_id ON urgent_request_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_urgent_notifications_read ON urgent_request_notifications(recipient_id, read);

-- RLS pour urgent_request_notifications
ALTER TABLE urgent_request_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recipients can view their own urgent notifications" ON urgent_request_notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Recipients can update their own urgent notifications" ON urgent_request_notifications
  FOR UPDATE USING (recipient_id = auth.uid());

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Tables de notifications créées/corrigées avec succès !';
END $$;
