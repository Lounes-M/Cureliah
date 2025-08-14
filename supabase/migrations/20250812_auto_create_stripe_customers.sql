-- Trigger pour automatiquement créer un customer Stripe lors de l'inscription
-- Cette approche utilise des webhooks ou des triggers côté base de données

-- Fonction pour appeler l'Edge Function de création de customer
CREATE OR REPLACE FUNCTION create_stripe_customer_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Appeler l'Edge Function create-customer via HTTP
  PERFORM net.http_post(
    url := 'https://rlfghipdzxfnwijsylac.supabase.co/functions/v1/create-customer',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb,
    body := json_build_object(
      'userId', NEW.id,
      'email', NEW.email,
      'firstName', COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      'lastName', COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger qui s'exécute après la création d'un nouvel utilisateur
CREATE OR REPLACE TRIGGER trigger_create_stripe_customer
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_stripe_customer_for_new_user();

-- Alternative : Fonction pour appeler manuellement pour les utilisateurs existants
CREATE OR REPLACE FUNCTION create_missing_stripe_customers()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN user_subscriptions us ON u.id = us.user_id
    WHERE us.user_id IS NULL
      AND u.email_confirmed_at IS NOT NULL
  LOOP
    -- Appeler l'Edge Function pour chaque utilisateur manquant
    PERFORM net.http_post(
      url := 'https://rlfghipdzxfnwijsylac.supabase.co/functions/v1/create-customer',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb,
      body := json_build_object(
        'userId', user_record.id,
        'email', user_record.email,
        'firstName', COALESCE(user_record.raw_user_meta_data->>'first_name', ''),
        'lastName', COALESCE(user_record.raw_user_meta_data->>'last_name', '')
      )::text
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
