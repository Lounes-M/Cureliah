-- Script d'initialisation directe pour les missions Premium
-- À exécuter directement dans Supabase Dashboard

-- 1. Créer la table premium_missions avec une nouvelle structure
DROP TABLE IF EXISTS premium_missions CASCADE;
DROP TABLE IF EXISTS premium_mission_applications CASCADE;

CREATE TABLE premium_missions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    establishment_id UUID NOT NULL,
    establishment_name TEXT NOT NULL,
    establishment_type TEXT NOT NULL,
    establishment_rating DECIMAL(2,1) DEFAULT 4.5,
    establishment_logo TEXT,
    
    -- Détails de la mission
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    specialization TEXT NOT NULL,
    mission_type TEXT NOT NULL CHECK (mission_type IN ('urgent', 'replacement', 'vacation', 'night_shift', 'weekend', 'consultation')),
    
    -- Période et horaires
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    duration_hours INTEGER,
    
    -- Compensation
    salary_min INTEGER NOT NULL,
    salary_max INTEGER NOT NULL,
    salary_currency TEXT DEFAULT 'EUR',
    
    -- Avantages Premium
    premium_perks TEXT[] DEFAULT ARRAY[]::TEXT[],
    premium_bonus INTEGER DEFAULT 0,
    priority_level INTEGER DEFAULT 1 CHECK (priority_level BETWEEN 1 AND 5),
    
    -- Disponibilité
    spots_total INTEGER NOT NULL DEFAULT 1,
    spots_available INTEGER NOT NULL DEFAULT 1,
    
    -- Requirements
    experience_required TEXT,
    certifications_required TEXT[],
    languages_required TEXT[],
    
    -- Localisation
    location TEXT NOT NULL,
    remote_possible BOOLEAN DEFAULT false,
    
    -- Premium features
    is_vip BOOLEAN DEFAULT false,
    is_exclusive BOOLEAN DEFAULT false,
    exclusivity_hours INTEGER DEFAULT 24,
    fast_track_application BOOLEAN DEFAULT true,
    premium_support BOOLEAN DEFAULT true,
    
    -- Statut
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'filled', 'expired', 'cancelled')),
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Contraintes
    CONSTRAINT valid_dates CHECK (end_date >= start_date),
    CONSTRAINT valid_salary CHECK (salary_max >= salary_min),
    CONSTRAINT valid_spots CHECK (spots_available <= spots_total)
);

-- 2. Table des candidatures Premium
CREATE TABLE premium_mission_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    mission_id UUID REFERENCES premium_missions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID NOT NULL,
    doctor_name TEXT NOT NULL,
    doctor_specialization TEXT NOT NULL,
    doctor_rating DECIMAL(2,1) DEFAULT 4.0,
    doctor_avatar TEXT,
    
    -- Status de la candidature
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'interview', 'hired')),
    
    -- Détails de la candidature
    cover_letter TEXT,
    availability_confirmed BOOLEAN DEFAULT false,
    expected_salary INTEGER,
    
    -- Premium features
    priority_application BOOLEAN DEFAULT false,
    fast_track_review BOOLEAN DEFAULT false,
    
    -- Métadonnées
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    response_deadline TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(mission_id, user_id)
);

-- 3. Index pour les performances
CREATE INDEX idx_premium_missions_establishment ON premium_missions(establishment_id);
CREATE INDEX idx_premium_missions_status ON premium_missions(status);
CREATE INDEX idx_premium_missions_dates ON premium_missions(start_date, end_date);
CREATE INDEX idx_premium_missions_location ON premium_missions(location);
CREATE INDEX idx_premium_missions_specialization ON premium_missions(specialization);
CREATE INDEX idx_premium_missions_priority ON premium_missions(priority_level);

CREATE INDEX idx_premium_applications_mission ON premium_mission_applications(mission_id);
CREATE INDEX idx_premium_applications_user ON premium_mission_applications(user_id);
CREATE INDEX idx_premium_applications_status ON premium_mission_applications(status);

-- 4. Trigger pour mettre à jour spots_available
CREATE OR REPLACE FUNCTION update_premium_mission_spots()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'accepted' THEN
        UPDATE premium_missions 
        SET spots_available = spots_available - 1,
            status = CASE WHEN spots_available - 1 <= 0 THEN 'filled' ELSE status END
        WHERE id = NEW.mission_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
            UPDATE premium_missions 
            SET spots_available = spots_available - 1,
                status = CASE WHEN spots_available - 1 <= 0 THEN 'filled' ELSE status END
            WHERE id = NEW.mission_id;
        ELSIF OLD.status = 'accepted' AND NEW.status != 'accepted' THEN
            UPDATE premium_missions 
            SET spots_available = spots_available + 1,
                status = CASE WHEN status = 'filled' THEN 'active' ELSE status END
            WHERE id = NEW.mission_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'accepted' THEN
        UPDATE premium_missions 
        SET spots_available = spots_available + 1,
            status = CASE WHEN status = 'filled' THEN 'active' ELSE status END
        WHERE id = OLD.mission_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_premium_mission_spots
    AFTER INSERT OR UPDATE OR DELETE ON premium_mission_applications
    FOR EACH ROW EXECUTE FUNCTION update_premium_mission_spots();

-- 5. RLS Policies (à adapter selon votre système d'auth)
ALTER TABLE premium_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_mission_applications ENABLE ROW LEVEL SECURITY;

-- Politique pour voir les missions Premium (tous peuvent voir)
CREATE POLICY "Anyone can view premium missions" ON premium_missions
    FOR SELECT USING (true);

-- Politique pour créer des missions Premium (à adapter selon vos besoins)
CREATE POLICY "Establishments can create premium missions" ON premium_missions
    FOR INSERT WITH CHECK (true); -- À modifier selon votre logique d'auth

-- Politique pour voir ses propres candidatures
CREATE POLICY "Users can view their applications" ON premium_mission_applications
    FOR SELECT USING (user_id = auth.uid());

-- Politique pour candidater
CREATE POLICY "Users can apply to missions" ON premium_mission_applications
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 6. Données de test
INSERT INTO premium_missions (
    establishment_id, establishment_name, establishment_type, establishment_rating,
    title, description, specialization, mission_type,
    start_date, end_date, start_time, end_time,
    salary_min, salary_max,
    premium_perks, premium_bonus, priority_level,
    spots_total, spots_available,
    location, is_vip, is_exclusive,
    status
) VALUES 
(
    '123e4567-e89b-12d3-a456-426614174001',
    'Clinique Saint-Michel',
    'Clinique Privée',
    4.8,
    'Cardiologue Urgence - Mission VIP',
    'Mission urgente en cardiologie interventionnelle. Garde de nuit avec équipe spécialisée.',
    'Cardiologie',
    'urgent',
    CURRENT_DATE + INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '3 days',
    '18:00', '08:00',
    2500, 3500,
    ARRAY['Transport privé', 'Repas inclus', 'Logement 5*', 'Prime urgence'],
    500,
    5,
    1, 1,
    'Paris 16ème',
    true, true,
    'active'
),
(
    '123e4567-e89b-12d3-a456-426614174002',
    'Hôpital Américain',
    'Hôpital International',
    4.9,
    'Chirurgien ORL - Weekend Premium',
    'Weekend de garde en ORL avec bloc opératoire dédié.',
    'ORL',
    'weekend',
    CURRENT_DATE + INTERVAL '2 days',
    CURRENT_DATE + INTERVAL '4 days',
    '08:00', '20:00',
    1800, 2200,
    ARRAY['Prime weekend', 'Parking gratuit', 'Restaurant gastronomique'],
    200,
    3,
    2, 2,
    'Neuilly-sur-Seine',
    false, true,
    'active'
);

-- Confirmation
SELECT 'Tables premium_missions créées avec succès!' as message;
