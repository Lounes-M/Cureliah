-- Script optimisé pour les tables manquantes - Missions Premium Cureliah
-- À exécuter directement dans Supabase Dashboard
-- Note: Les tables doctor_profiles, establishment_profiles existent déjà via les migrations

-- 1. Créer seulement la table establishments si elle n'existe pas (pour la relation avec urgent_requests)
-- Cette table est différente de establishment_profiles qui est liée aux utilisateurs
CREATE TABLE IF NOT EXISTS establishments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    address TEXT,
    city TEXT,
    rating DECIMAL(2,1) DEFAULT 4.5,
    logo_url TEXT,
    specialties TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Créer la table urgent_requests (elle existe déjà mais avec une structure différente)
-- Vérifier d'abord si la table a la bonne structure
DO $$
BEGIN
    -- Supprimer et recréer si nécessaire
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'urgent_requests') THEN
        -- Vérifier si elle a les bonnes colonnes, sinon la recréer
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'urgent_requests' AND column_name = 'establishment_name') THEN
            DROP TABLE urgent_requests CASCADE;
        END IF;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS urgent_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
    establishment_name TEXT,
    establishment_logo TEXT,
    establishment_rating DECIMAL(2,1),
    
    -- Détails de la demande
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    specialty_required TEXT NOT NULL,
    urgency_level TEXT NOT NULL CHECK (urgency_level IN ('medium', 'high', 'critical', 'emergency')),
    
    -- Période et horaires
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Localisation
    location TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Compensation
    hourly_rate INTEGER NOT NULL,
    
    -- Features Premium
    priority_boost BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    
    -- Limites
    max_responses INTEGER DEFAULT 50,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Status et stats
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'filled', 'cancelled', 'expired')),
    response_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Créer la table urgent_request_responses (peut exister, vérifier la structure)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'urgent_request_responses') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'urgent_request_responses' AND column_name = 'doctor_name') THEN
            DROP TABLE urgent_request_responses CASCADE;
        END IF;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS urgent_request_responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES urgent_requests(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL,
    
    -- Informations du médecin (dénormalisées)
    doctor_name TEXT NOT NULL,
    doctor_specialty TEXT,
    doctor_rating DECIMAL(2,1) DEFAULT 4.5,
    
    -- Détails de la réponse
    response_type TEXT NOT NULL CHECK (response_type IN ('interested', 'available', 'maybe')),
    availability_start TIMESTAMP WITH TIME ZONE,
    availability_end TIMESTAMP WITH TIME ZONE,
    message TEXT,
    requested_rate INTEGER,
    
    -- Status et timing
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    response_time INTEGER,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte d'unicité
    UNIQUE(request_id, doctor_id)
);

-- 4. Créer la table urgent_request_notifications
DROP TABLE IF EXISTS urgent_request_notifications CASCADE;
CREATE TABLE urgent_request_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id UUID REFERENCES urgent_requests(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL,
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('doctor', 'establishment')),
    
    -- Contenu de la notification
    type TEXT NOT NULL CHECK (type IN ('new_request', 'new_response', 'request_accepted', 'request_cancelled', 'reminder')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    
    -- Status
    read BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Créer des index pour les performances
CREATE INDEX IF NOT EXISTS idx_urgent_requests_establishment ON urgent_requests(establishment_id);
CREATE INDEX IF NOT EXISTS idx_urgent_requests_status ON urgent_requests(status);
CREATE INDEX IF NOT EXISTS idx_urgent_requests_specialty ON urgent_requests(specialty_required);
CREATE INDEX IF NOT EXISTS idx_urgent_requests_urgency ON urgent_requests(urgency_level);
CREATE INDEX IF NOT EXISTS idx_urgent_requests_expires ON urgent_requests(expires_at);

CREATE INDEX IF NOT EXISTS idx_urgent_responses_request ON urgent_request_responses(request_id);
CREATE INDEX IF NOT EXISTS idx_urgent_responses_doctor ON urgent_request_responses(doctor_id);
CREATE INDEX IF NOT EXISTS idx_urgent_responses_status ON urgent_request_responses(status);

CREATE INDEX IF NOT EXISTS idx_urgent_notifications_recipient ON urgent_request_notifications(recipient_id, recipient_type);
CREATE INDEX IF NOT EXISTS idx_urgent_notifications_read ON urgent_request_notifications(read);

-- 6. Désactiver RLS temporairement pour le développement
ALTER TABLE establishments DISABLE ROW LEVEL SECURITY;
ALTER TABLE urgent_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE urgent_request_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE urgent_request_notifications DISABLE ROW LEVEL SECURITY;

-- Finalisation
SELECT 'Base de données initialisée avec succès!' as status;
