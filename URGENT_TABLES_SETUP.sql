-- ========================================
-- SCRIPT SQL POUR DEMANDES URGENTES CURELIAH
-- ========================================
-- Copiez et collez ce code dans l'éditeur SQL de Supabase
-- URL: https://supabase.com/dashboard/project/rlfghipdzxfnwijsylac/sql/new

-- 1. Création de la table urgent_requests
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

-- 2. Création de la table urgent_request_responses
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
    response_time INTEGER, -- in minutes
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(request_id, doctor_id)
);

-- 3. Création de la table urgent_notifications
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

-- 4. Création des index pour les performances
CREATE INDEX IF NOT EXISTS idx_urgent_requests_establishment_id ON urgent_requests(establishment_id);
CREATE INDEX IF NOT EXISTS idx_urgent_requests_status ON urgent_requests(status);
CREATE INDEX IF NOT EXISTS idx_urgent_requests_specialty ON urgent_requests(specialty_required);
CREATE INDEX IF NOT EXISTS idx_urgent_requests_expires_at ON urgent_requests(expires_at);
CREATE INDEX IF NOT EXISTS idx_urgent_requests_created_at ON urgent_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_urgent_request_responses_request_id ON urgent_request_responses(request_id);
CREATE INDEX IF NOT EXISTS idx_urgent_request_responses_doctor_id ON urgent_request_responses(doctor_id);
CREATE INDEX IF NOT EXISTS idx_urgent_request_responses_status ON urgent_request_responses(status);

CREATE INDEX IF NOT EXISTS idx_urgent_notifications_recipient_id ON urgent_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_urgent_notifications_read ON urgent_notifications(read);
CREATE INDEX IF NOT EXISTS idx_urgent_notifications_created_at ON urgent_notifications(created_at);

-- 5. Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Triggers pour updated_at
DROP TRIGGER IF EXISTS update_urgent_requests_updated_at ON urgent_requests;
CREATE TRIGGER update_urgent_requests_updated_at 
    BEFORE UPDATE ON urgent_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_urgent_request_responses_updated_at ON urgent_request_responses;
CREATE TRIGGER update_urgent_request_responses_updated_at 
    BEFORE UPDATE ON urgent_request_responses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Activation de Row Level Security (RLS)
ALTER TABLE urgent_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE urgent_request_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE urgent_notifications ENABLE ROW LEVEL SECURITY;

-- 8. Politiques RLS pour urgent_requests
DROP POLICY IF EXISTS "Establishments can create their own urgent requests" ON urgent_requests;
CREATE POLICY "Establishments can create their own urgent requests" ON urgent_requests
    FOR INSERT WITH CHECK (auth.uid() = establishment_id);

DROP POLICY IF EXISTS "Establishments can view their own urgent requests" ON urgent_requests;
CREATE POLICY "Establishments can view their own urgent requests" ON urgent_requests
    FOR SELECT USING (auth.uid() = establishment_id);

DROP POLICY IF EXISTS "Establishments can update their own urgent requests" ON urgent_requests;
CREATE POLICY "Establishments can update their own urgent requests" ON urgent_requests
    FOR UPDATE USING (auth.uid() = establishment_id);

DROP POLICY IF EXISTS "Doctors can view open urgent requests" ON urgent_requests;
CREATE POLICY "Doctors can view open urgent requests" ON urgent_requests
    FOR SELECT USING (status = 'open');

-- 9. Politiques RLS pour urgent_request_responses
DROP POLICY IF EXISTS "Doctors can create their own responses" ON urgent_request_responses;
CREATE POLICY "Doctors can create their own responses" ON urgent_request_responses
    FOR INSERT WITH CHECK (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Doctors can view their own responses" ON urgent_request_responses;
CREATE POLICY "Doctors can view their own responses" ON urgent_request_responses
    FOR SELECT USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Doctors can update their own responses" ON urgent_request_responses;
CREATE POLICY "Doctors can update their own responses" ON urgent_request_responses
    FOR UPDATE USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Establishments can view responses to their requests" ON urgent_request_responses;
CREATE POLICY "Establishments can view responses to their requests" ON urgent_request_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM urgent_requests 
            WHERE urgent_requests.id = request_id 
            AND urgent_requests.establishment_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Establishments can update responses to their requests" ON urgent_request_responses;
CREATE POLICY "Establishments can update responses to their requests" ON urgent_request_responses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM urgent_requests 
            WHERE urgent_requests.id = request_id 
            AND urgent_requests.establishment_id = auth.uid()
        )
    );

-- 10. Politiques RLS pour urgent_notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON urgent_notifications;
CREATE POLICY "Users can view their own notifications" ON urgent_notifications
    FOR SELECT USING (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON urgent_notifications;
CREATE POLICY "Users can update their own notifications" ON urgent_notifications
    FOR UPDATE USING (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "System can insert notifications" ON urgent_notifications;
CREATE POLICY "System can insert notifications" ON urgent_notifications
    FOR INSERT WITH CHECK (true);

-- 11. Données d'exemple (optionnel - décommentez pour tester)
/*
INSERT INTO urgent_requests (
    establishment_id,
    title,
    description,
    specialty_required,
    urgency_level,
    start_date,
    end_date,
    start_time,
    end_time,
    location,
    hourly_rate
) VALUES (
    'eadd697f-8c6c-459d-a933-dd02c97f160c', -- Remplacez par un vrai ID d'établissement
    'Remplacement d\'urgence - Médecin généraliste',
    'Nous recherchons un médecin généraliste pour un remplacement d\'urgence suite à un arrêt maladie imprévu.',
    'general_medicine',
    'high',
    CURRENT_DATE + INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '7 days',
    '08:00',
    '18:00',
    'Paris 15ème',
    75.00
);
*/

-- ========================================
-- FIN DU SCRIPT
-- ========================================
-- 
-- INSTRUCTIONS :
-- 1. Allez sur https://supabase.com/dashboard/project/rlfghipdzxfnwijsylac/sql/new
-- 2. Copiez-collez tout ce code
-- 3. Cliquez sur "Run" pour exécuter
-- 4. Vérifiez que les tables apparaissent dans l'onglet "Table Editor"
-- 
-- ========================================
