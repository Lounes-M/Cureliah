/**
 * Configuration Supabase avec RLS (Row Level Security) pour Cureliah
 * À exécuter via l'éditeur SQL de Supabase
 */

-- 1. POLITIQUE DE SÉCURITÉ POUR LA TABLE USERS
CREATE POLICY "Users can view own profile" ON auth.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON auth.users
  FOR UPDATE USING (auth.uid() = id);

-- 2. POLITIQUE POUR LA TABLE PROFILES
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 3. POLITIQUE POUR LES MÉDECINS
CREATE POLICY "Doctors can view own data" ON doctors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Doctors can update own data" ON doctors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Establishments can view verified doctors" ON doctors
  FOR SELECT USING (
    verified = true AND 
    EXISTS (
      SELECT 1 FROM establishments 
      WHERE user_id = auth.uid()
    )
  );

-- 4. POLITIQUE POUR LES ÉTABLISSEMENTS
CREATE POLICY "Establishments can view own data" ON establishments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Establishments can update own data" ON establishments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Doctors can view verified establishments" ON establishments
  FOR SELECT USING (
    verified = true AND 
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE user_id = auth.uid()
    )
  );

-- 5. POLITIQUE POUR LES RÉSERVATIONS
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (
    auth.uid() = doctor_id OR 
    auth.uid() = establishment_id
  );

CREATE POLICY "Establishments can create bookings" ON bookings
  FOR INSERT WITH CHECK (
    auth.uid() = establishment_id AND
    EXISTS (
      SELECT 1 FROM establishments 
      WHERE user_id = auth.uid() AND verified = true
    )
  );

CREATE POLICY "Doctors can accept/reject bookings" ON bookings
  FOR UPDATE USING (auth.uid() = doctor_id);

-- 6. POLITIQUE POUR LES MESSAGES
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    auth.uid() IN (sender_id, recipient_id)
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    (
      EXISTS (SELECT 1 FROM doctors WHERE user_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM establishments WHERE user_id = auth.uid())
    )
  );

-- 7. FONCTION DE SÉCURITÉ : Vérification des permissions
CREATE OR REPLACE FUNCTION check_user_permission(user_id uuid, permission text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CASE permission
    WHEN 'doctor_verified' THEN
      RETURN EXISTS (
        SELECT 1 FROM doctors 
        WHERE user_id = user_id AND verified = true
      );
    WHEN 'establishment_verified' THEN
      RETURN EXISTS (
        SELECT 1 FROM establishments 
        WHERE user_id = user_id AND verified = true
      );
    WHEN 'admin' THEN
      RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id AND role = 'admin'
      );
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- 8. AUDIT TRIGGER POUR LES ACTIONS SENSIBLES
CREATE OR REPLACE FUNCTION audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO audit_logs (
    table_name,
    operation,
    old_data,
    new_data,
    user_id,
    timestamp
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    to_jsonb(OLD),
    to_jsonb(NEW),
    auth.uid(),
    now()
  );
  RETURN NULL;
END;
$$;

-- Appliquer l'audit aux tables sensibles
CREATE TRIGGER audit_doctors 
  AFTER INSERT OR UPDATE OR DELETE ON doctors
  FOR EACH ROW EXECUTE FUNCTION audit_log();

CREATE TRIGGER audit_establishments 
  AFTER INSERT OR UPDATE OR DELETE ON establishments
  FOR EACH ROW EXECUTE FUNCTION audit_log();

CREATE TRIGGER audit_bookings 
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW EXECUTE FUNCTION audit_log();

-- 9. FONCTION DE CHIFFREMENT DES DONNÉES SENSIBLES
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT encode(
    pgp_sym_encrypt(
      data, 
      current_setting('app.encryption_key', true)
    ), 
    'base64'
  );
$$;

CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT pgp_sym_decrypt(
    decode(encrypted_data, 'base64'),
    current_setting('app.encryption_key', true)
  );
$$;

-- 10. RATE LIMITING POUR L'API
CREATE OR REPLACE FUNCTION rate_limit_check(
  user_id uuid,
  action text,
  max_requests int,
  time_window interval
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_count int;
BEGIN
  -- Compter les requêtes récentes
  SELECT COUNT(*) INTO request_count
  FROM api_requests
  WHERE 
    user_id = user_id AND
    action = action AND
    created_at > now() - time_window;

  -- Enregistrer cette requête
  INSERT INTO api_requests (user_id, action, created_at)
  VALUES (user_id, action, now());

  -- Vérifier la limite
  RETURN request_count < max_requests;
END;
$$;

-- 11. POLITIQUE POUR LES FICHIERS UPLOADÉS
CREATE POLICY "Users can upload their own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 12. NETTOYAGE AUTOMATIQUE DES DONNÉES TEMPORAIRES
CREATE OR REPLACE FUNCTION cleanup_temp_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Supprimer les tokens expirés
  DELETE FROM auth.refresh_tokens 
  WHERE expires_at < now();

  -- Supprimer les sessions inactives
  DELETE FROM auth.sessions 
  WHERE expires_at < now();

  -- Supprimer les logs d'API anciens (> 30 jours)
  DELETE FROM api_requests 
  WHERE created_at < now() - interval '30 days';

  -- Supprimer les audit logs anciens (> 1 an)
  DELETE FROM audit_logs 
  WHERE timestamp < now() - interval '1 year';
END;
$$;

-- Programmer le nettoyage (à configurer avec pg_cron si disponible)
-- SELECT cron.schedule('cleanup', '0 2 * * *', 'SELECT cleanup_temp_data()');

-- 13. ACTIVATION DE RLS SUR TOUTES LES TABLES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 14. CRÉATION DES INDEX POUR LES PERFORMANCES
CREATE INDEX idx_doctors_verified ON doctors(verified) WHERE verified = true;
CREATE INDEX idx_establishments_verified ON establishments(verified) WHERE verified = true;
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_messages_conversation ON messages(sender_id, recipient_id);
CREATE INDEX idx_audit_logs_table_operation ON audit_logs(table_name, operation);

COMMIT;
