-- ===================================
-- SCRIPT SQL PRODUCTION PREMIUM TABLES
-- ===================================
-- Exécute ce script dans ton tableau de bord Supabase (SQL Editor)

-- 1. Table des statistiques des médecins Premium
CREATE TABLE IF NOT EXISTS doctor_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  total_missions INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  total_consultations INTEGER DEFAULT 0,
  patient_satisfaction DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, month)
);

-- 2. Table des factures Premium
CREATE TABLE IF NOT EXISTS premium_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL, -- En centimes (ex: 19900 pour €199.00)
  currency TEXT DEFAULT 'eur',
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void')),
  description TEXT,
  invoice_pdf TEXT,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table des clés API
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT UNIQUE NOT NULL,
  key_name TEXT NOT NULL,
  permissions TEXT[] DEFAULT ARRAY['read'],
  rate_limit INTEGER DEFAULT 1000,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table des webhooks
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint_url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table des missions Premium
CREATE TABLE IF NOT EXISTS premium_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  mission_type TEXT NOT NULL CHECK (mission_type IN ('urgent', 'specialized', 'vip', 'consultation')),
  specialty TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  urgency_level INTEGER CHECK (urgency_level BETWEEN 1 AND 5),
  patient_location TEXT,
  required_date TIMESTAMPTZ,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'in_progress', 'completed', 'cancelled')),
  assigned_doctor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Table des notifications urgentes
CREATE TABLE IF NOT EXISTS urgent_request_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  urgency_level INTEGER CHECK (urgency_level BETWEEN 1 AND 5),
  patient_id UUID,
  mission_id UUID REFERENCES premium_missions(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Table des tickets de support Premium
CREATE TABLE IF NOT EXISTS premium_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('technical', 'billing', 'feature', 'training', 'other')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  agent_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Table des insights IA
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('performance', 'recommendation', 'trend', 'alert')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- ===================================
-- INDEX POUR LA PERFORMANCE
-- ===================================

-- Index pour doctor_statistics
CREATE INDEX IF NOT EXISTS idx_doctor_statistics_doctor_month ON doctor_statistics(doctor_id, month DESC);

-- Index pour premium_invoices
CREATE INDEX IF NOT EXISTS idx_premium_invoices_doctor_id ON premium_invoices(doctor_id);
CREATE INDEX IF NOT EXISTS idx_premium_invoices_status ON premium_invoices(status);
CREATE INDEX IF NOT EXISTS idx_premium_invoices_stripe_id ON premium_invoices(stripe_invoice_id);

-- Index pour api_keys
CREATE INDEX IF NOT EXISTS idx_api_keys_doctor_id ON api_keys(doctor_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

-- Index pour premium_missions
CREATE INDEX IF NOT EXISTS idx_premium_missions_status ON premium_missions(status);
CREATE INDEX IF NOT EXISTS idx_premium_missions_assigned_doctor ON premium_missions(assigned_doctor_id);
CREATE INDEX IF NOT EXISTS idx_premium_missions_urgency ON premium_missions(urgency_level DESC);

-- Index pour support tickets
CREATE INDEX IF NOT EXISTS idx_support_tickets_doctor_id ON premium_support_tickets(doctor_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON premium_support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON premium_support_tickets(priority);

-- Index pour notifications
CREATE INDEX IF NOT EXISTS idx_urgent_notifications_doctor_id ON urgent_request_notifications(doctor_id);
CREATE INDEX IF NOT EXISTS idx_urgent_notifications_unread ON urgent_request_notifications(doctor_id, is_read);

-- Index pour AI insights
CREATE INDEX IF NOT EXISTS idx_ai_insights_doctor_id ON ai_insights(doctor_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);

-- ===================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================

-- Activer RLS sur toutes les tables
ALTER TABLE doctor_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE urgent_request_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Policies pour doctor_statistics
CREATE POLICY "Doctors can view their own statistics" ON doctor_statistics
  FOR SELECT USING (doctor_id = auth.uid());

CREATE POLICY "Doctors can insert their own statistics" ON doctor_statistics
  FOR INSERT WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Doctors can update their own statistics" ON doctor_statistics
  FOR UPDATE USING (doctor_id = auth.uid());

-- Policies pour premium_invoices
CREATE POLICY "Doctors can view their own invoices" ON premium_invoices
  FOR SELECT USING (doctor_id = auth.uid());

CREATE POLICY "System can insert invoices" ON premium_invoices
  FOR INSERT WITH CHECK (true);

-- Policies pour api_keys
CREATE POLICY "Doctors can manage their own API keys" ON api_keys
  FOR ALL USING (doctor_id = auth.uid());

-- Policies pour webhooks
CREATE POLICY "Doctors can manage their own webhooks" ON webhooks
  FOR ALL USING (doctor_id = auth.uid());

-- Policies pour premium_missions
CREATE POLICY "Everyone can view available missions" ON premium_missions
  FOR SELECT USING (status = 'available');

CREATE POLICY "Doctors can view their assigned missions" ON premium_missions
  FOR SELECT USING (assigned_doctor_id = auth.uid());

CREATE POLICY "Doctors can update missions assigned to them" ON premium_missions
  FOR UPDATE USING (assigned_doctor_id = auth.uid());

-- Policies pour support tickets
CREATE POLICY "Doctors can manage their own support tickets" ON premium_support_tickets
  FOR ALL USING (doctor_id = auth.uid());

-- Policies pour notifications
CREATE POLICY "Doctors can view their own notifications" ON urgent_request_notifications
  FOR SELECT USING (doctor_id = auth.uid());

CREATE POLICY "Doctors can update their own notifications" ON urgent_request_notifications
  FOR UPDATE USING (doctor_id = auth.uid());

-- Policies pour AI insights
CREATE POLICY "Doctors can view their own insights" ON ai_insights
  FOR SELECT USING (doctor_id = auth.uid());

CREATE POLICY "System can insert insights" ON ai_insights
  FOR INSERT WITH CHECK (true);

-- ===================================
-- FONCTIONS UTILITAIRES
-- ===================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_doctor_statistics_updated_at BEFORE UPDATE ON doctor_statistics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_premium_invoices_updated_at BEFORE UPDATE ON premium_invoices 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_premium_missions_updated_at BEFORE UPDATE ON premium_missions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_premium_support_tickets_updated_at BEFORE UPDATE ON premium_support_tickets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- DONNÉES D'EXEMPLE (OPTIONNEL)
-- ===================================

-- Insérer quelques missions d'exemple (optionnel)
INSERT INTO premium_missions (title, description, mission_type, specialty, amount, urgency_level, patient_location, required_date) VALUES
('Consultation cardiologique urgente', 'Patient avec douleurs thoraciques nécessitant une consultation immédiate', 'urgent', 'cardiology', 1500.00, 5, 'Paris 15e', NOW() + INTERVAL '2 hours'),
('Consultation neurologique spécialisée', 'Cas complexe nécessitant expertise en neurologie', 'specialized', 'neurology', 800.00, 3, 'Lyon 6e', NOW() + INTERVAL '1 day'),
('Téléconsultation VIP', 'Patient premium demandant suivi personnalisé', 'vip', 'general_medicine', 600.00, 2, 'Marseille', NOW() + INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Tables Premium créées avec succès ! 🎉';
    RAISE NOTICE '✅ 8 tables créées';
    RAISE NOTICE '✅ Index de performance ajoutés';
    RAISE NOTICE '✅ Politiques RLS configurées';
    RAISE NOTICE '✅ Triggers pour updated_at ajoutés';
    RAISE NOTICE '';
    RAISE NOTICE 'Tu peux maintenant utiliser les vraies données de production !';
END $$;
