-- Tables essentielles Premium - Version simplifiée
-- Execute ce script dans le SQL Editor de Supabase

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
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'eur',
  status TEXT NOT NULL,
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

-- 4. Table des missions Premium
CREATE TABLE IF NOT EXISTS premium_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  mission_type TEXT NOT NULL,
  specialty TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  urgency_level INTEGER DEFAULT 1,
  patient_location TEXT,
  required_date TIMESTAMPTZ,
  status TEXT DEFAULT 'available',
  assigned_doctor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table des tickets de support Premium
CREATE TABLE IF NOT EXISTS premium_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  agent_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index essentiels
CREATE INDEX IF NOT EXISTS idx_doctor_statistics_doctor_month ON doctor_statistics(doctor_id, month DESC);
CREATE INDEX IF NOT EXISTS idx_premium_invoices_doctor_id ON premium_invoices(doctor_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_doctor_id ON api_keys(doctor_id);
CREATE INDEX IF NOT EXISTS idx_premium_missions_status ON premium_missions(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_doctor_id ON premium_support_tickets(doctor_id);

-- RLS policies essentielles
ALTER TABLE doctor_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_support_tickets ENABLE ROW LEVEL SECURITY;

-- Policies simples
CREATE POLICY "Doctors can manage their own statistics" ON doctor_statistics
  FOR ALL USING (doctor_id = auth.uid());

CREATE POLICY "Doctors can view their own invoices" ON premium_invoices
  FOR SELECT USING (doctor_id = auth.uid());

CREATE POLICY "Doctors can manage their own API keys" ON api_keys
  FOR ALL USING (doctor_id = auth.uid());

CREATE POLICY "Everyone can view available missions" ON premium_missions
  FOR SELECT USING (status = 'available' OR assigned_doctor_id = auth.uid());

CREATE POLICY "Doctors can update their assigned missions" ON premium_missions
  FOR UPDATE USING (assigned_doctor_id = auth.uid());

CREATE POLICY "Doctors can manage their own support tickets" ON premium_support_tickets
  FOR ALL USING (doctor_id = auth.uid());

-- Données d'exemple
INSERT INTO premium_missions (title, description, mission_type, specialty, amount, urgency_level, patient_location, required_date) VALUES
('Consultation cardiologique urgente', 'Patient avec douleurs thoraciques nécessitant une consultation immédiate', 'urgent', 'cardiology', 1500.00, 5, 'Paris 15e', NOW() + INTERVAL '2 hours'),
('Consultation neurologique spécialisée', 'Cas complexe nécessitant expertise en neurologie', 'specialized', 'neurology', 800.00, 3, 'Lyon 6e', NOW() + INTERVAL '1 day'),
('Téléconsultation VIP', 'Patient premium demandant suivi personnalisé', 'vip', 'general_medicine', 600.00, 2, 'Marseille', NOW() + INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- Confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Tables Premium créées avec succès !';
END $$;
