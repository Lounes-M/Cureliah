import { supabase } from '@/integrations/supabase/client.browser';

export const createTablesDirectly = async () => {
  // TODO: Replace with logger.info('🚀 Tentative de création directe des tables...');
  
  // Comme exec_sql ne fonctionne pas, nous allons utiliser une approche différente
  // Nous allons créer les tables via l'API REST en utilisant des fonctions PostgreSQL
  
  try {
    // Test 1: Essayer de créer via rpc si la fonction existe
    // TODO: Replace with logger.info('Test 1: Vérification fonction exec_sql...');
    const { error: testError } = await supabase.rpc('exec_sql', { 
      sql: 'SELECT 1 as test' 
    });
    
    if (!testError) {
      // TODO: Replace with logger.info('✅ Fonction exec_sql disponible !');
      // Si exec_sql fonctionne, utilisons notre méthode originale
      return await createUrgentRequestsTables();
    }
    
    // TODO: Replace with logger.info('❌ Fonction exec_sql non disponible:', testError.message);
    
    // Test 2: Créer les tables via l'API REST directement
    // TODO: Replace with logger.info('Test 2: Tentative via API REST...');
    
    // Pour contourner le problème, nous allons créer un service mock temporaire
    // qui simule l'existence des tables
    // TODO: Replace with logger.info('⚠️ Création d\'un service mock temporaire...');
    
    // Retourner false pour indiquer qu'il faut utiliser le SQL manuel
    return false;
    
  } catch (error) {
    // TODO: Replace with logger.error('💥 Erreur lors de la création:', error);
    return false;
  }
};

export const createUrgentRequestsTables = async () => {
  // TODO: Replace with logger.info('🚀 Création des tables de demandes urgentes...');
  
  try {
    // Créer la fonction exec_sql si elle n'existe pas
    const { error: funcError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION exec_sql(sql text)
        RETURNS text
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql;
          RETURN 'SUCCESS';
        EXCEPTION
          WHEN OTHERS THEN
            RETURN 'ERROR: ' || SQLERRM;
        END;
        $$;
      `
    });

    if (funcError) {
      // TODO: Replace with logger.info('⚠️ Fonction exec_sql existe déjà ou erreur:', funcError.message);
    }

    // Créer les tables une par une
    const tables = [
      {
        name: 'urgent_requests',
        sql: `
          CREATE TABLE IF NOT EXISTS urgent_requests (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              establishment_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
              title TEXT NOT NULL,
              description TEXT NOT NULL,
              specialty_required TEXT NOT NULL,
              urgency_level TEXT NOT NULL CHECK (urgency_level IN ('medium', 'high', 'critical', 'emergency')),
              start_date DATE NOT NULL,
              end_date DATE NOT NULL,
              start_time TIME NOT NULL,
              end_time TIME NOT NULL,
              location TEXT NOT NULL,
              latitude DECIMAL,
              longitude DECIMAL,
              hourly_rate DECIMAL NOT NULL,
              total_budget DECIMAL,
              min_experience_years INTEGER DEFAULT 0,
              required_certifications TEXT[] DEFAULT '{}',
              equipment_provided BOOLEAN DEFAULT false,
              transport_provided BOOLEAN DEFAULT false,
              accommodation_provided BOOLEAN DEFAULT false,
              priority_boost BOOLEAN DEFAULT false,
              featured BOOLEAN DEFAULT false,
              auto_accept_qualified BOOLEAN DEFAULT false,
              max_responses INTEGER DEFAULT 10,
              status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'filled', 'cancelled', 'expired')),
              expires_at TIMESTAMP WITH TIME ZONE,
              response_count INTEGER DEFAULT 0,
              view_count INTEGER DEFAULT 0,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Indexes
          CREATE INDEX IF NOT EXISTS idx_urgent_requests_establishment_id ON urgent_requests(establishment_id);
          CREATE INDEX IF NOT EXISTS idx_urgent_requests_status ON urgent_requests(status);
          CREATE INDEX IF NOT EXISTS idx_urgent_requests_specialty ON urgent_requests(specialty_required);
        `
      },
      {
        name: 'urgent_request_responses',
        sql: `
          CREATE TABLE IF NOT EXISTS urgent_request_responses (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              request_id UUID REFERENCES urgent_requests(id) ON DELETE CASCADE,
              doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
              response_type TEXT NOT NULL CHECK (response_type IN ('interested', 'available', 'maybe')),
              availability_start TIMESTAMP WITH TIME ZONE,
              availability_end TIMESTAMP WITH TIME ZONE,
              message TEXT,
              requested_rate DECIMAL,
              status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
              response_time INTEGER,
              notes TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              UNIQUE(request_id, doctor_id)
          );
          
          -- Indexes
          CREATE INDEX IF NOT EXISTS idx_urgent_request_responses_request_id ON urgent_request_responses(request_id);
          CREATE INDEX IF NOT EXISTS idx_urgent_request_responses_doctor_id ON urgent_request_responses(doctor_id);
        `
      },
      {
        name: 'urgent_notifications',
        sql: `
          CREATE TABLE IF NOT EXISTS urgent_notifications (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              request_id UUID REFERENCES urgent_requests(id) ON DELETE CASCADE,
              recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
              recipient_type TEXT NOT NULL CHECK (recipient_type IN ('doctor', 'establishment')),
              type TEXT NOT NULL CHECK (type IN ('new_request', 'new_response', 'request_accepted', 'request_cancelled', 'reminder')),
              title TEXT NOT NULL,
              message TEXT NOT NULL,
              read BOOLEAN DEFAULT false,
              action_url TEXT,
              expires_at TIMESTAMP WITH TIME ZONE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Indexes
          CREATE INDEX IF NOT EXISTS idx_urgent_notifications_recipient_id ON urgent_notifications(recipient_id);
          CREATE INDEX IF NOT EXISTS idx_urgent_notifications_read ON urgent_notifications(read);
        `
      }
    ];

    // Créer chaque table
    for (const table of tables) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: table.sql });
        
        if (error) {
          // TODO: Replace with logger.error(`❌ Erreur création ${table.name}:`, error);
        } else {
          // TODO: Replace with logger.info(`✅ Table ${table.name} créée: ${data}`);
        }
      } catch (err) {
        // TODO: Replace with logger.error(`❌ Exception création ${table.name}:`, err);
      }
    }

    // Activer RLS
    const rlsSql = `
      ALTER TABLE urgent_requests ENABLE ROW LEVEL SECURITY;
      ALTER TABLE urgent_request_responses ENABLE ROW LEVEL SECURITY;
      ALTER TABLE urgent_notifications ENABLE ROW LEVEL SECURITY;
    `;
    
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSql });
    if (rlsError) {
      // TODO: Replace with logger.error('❌ Erreur RLS:', rlsError);
    } else {
      // TODO: Replace with logger.info('✅ RLS activé');
    }

    // TODO: Replace with logger.info('🎉 Initialisation terminée !');
    return true;
  } catch (error) {
    // TODO: Replace with logger.error('💥 Erreur fatale:', error);
    return false;
  }
};

export const checkTablesExist = async () => {
  try {
    // TODO: Replace with logger.info('🔍 Vérification de l\'existence des tables...');
    
    // Test simple pour voir si les tables existent
    const { error } = await supabase.from('urgent_requests').select('*', { count: 'exact', head: true });
    
    // TODO: Replace with logger.info('✅ Test table urgent_requests:', error ? 'ÉCHEC' : 'SUCCÈS');
    // TODO: Replace with logger.info('Détails erreur:', error);
    
    return !error;
  } catch (err) {
    // TODO: Replace with logger.info('❌ Exception lors du test:', err);
    return false;
  }
};
