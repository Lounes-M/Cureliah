-- Mise à jour de la table premium_missions pour correspondre aux vacations premium

-- Supprimer l'ancienne table si elle existe
DROP TABLE IF EXISTS premium_missions CASCADE;

-- Créer la nouvelle table premium_missions alignée sur vacation_posts mais avec des fonctionnalités premium
CREATE TABLE premium_missions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    establishment_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    specialty TEXT,
    location TEXT NOT NULL,
    
    -- Informations de dates et disponibilité
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    application_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    exclusive_until TIMESTAMP WITH TIME ZONE NOT NULL, -- Période d'exclusivité premium
    
    -- Informations financières
    salary_min DECIMAL(10,2) NOT NULL,
    salary_max DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    
    -- Caractéristiques premium
    urgency TEXT NOT NULL DEFAULT 'high' CHECK (urgency IN ('high', 'critical')),
    duration TEXT NOT NULL, -- ex: "24h", "week-end", "garde de nuit"
    mission_type TEXT NOT NULL DEFAULT 'specialized' CHECK (mission_type IN ('urgent', 'specialized', 'vip', 'emergency')),
    
    -- Avantages premium
    premium_perks TEXT[] DEFAULT '{}', -- Parking, repas, logement, etc.
    benefits TEXT[] DEFAULT '{}', -- Formation, certification, etc.
    requirements TEXT[] DEFAULT '{}', -- Diplômes, expérience requise
    
    -- Disponibilités
    spots_available INTEGER DEFAULT 1,
    spots_filled INTEGER DEFAULT 0,
    
    -- Informations sur l'établissement (dénormalisé pour performance)
    establishment_name TEXT,
    establishment_rating DECIMAL(3,2) DEFAULT 0,
    establishment_logo_url TEXT,
    
    -- Statut de la mission
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'in_progress', 'completed', 'cancelled', 'expired')),
    is_active BOOLEAN DEFAULT true,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- Contraintes
    CHECK (salary_min <= salary_max),
    CHECK (spots_filled <= spots_available),
    CHECK (start_date < end_date),
    CHECK (application_deadline <= exclusive_until)
);

-- Créer la table des candidatures aux missions premium
CREATE TABLE IF NOT EXISTS premium_mission_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mission_id UUID REFERENCES premium_missions(id) ON DELETE CASCADE NOT NULL,
    doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Statut de la candidature
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'interview_scheduled', 'withdrawn')),
    
    -- Score de priorité premium (basé sur l'ancienneté de l'abonnement, historique, etc.)
    priority_score INTEGER DEFAULT 0,
    
    -- Messages et notes
    cover_letter TEXT,
    establishment_notes TEXT, -- Notes privées de l'établissement
    
    -- Dates importantes
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    interview_scheduled_at TIMESTAMP WITH TIME ZONE,
    decision_made_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- Contrainte d'unicité : un médecin ne peut postuler qu'une fois par mission
    UNIQUE(mission_id, doctor_id)
);

-- Index pour les performances
CREATE INDEX idx_premium_missions_status_active ON premium_missions(status, is_active);
CREATE INDEX idx_premium_missions_specialty ON premium_missions(specialty);
CREATE INDEX idx_premium_missions_urgency ON premium_missions(urgency, exclusive_until);
CREATE INDEX idx_premium_missions_establishment ON premium_missions(establishment_id);
CREATE INDEX idx_premium_missions_dates ON premium_missions(start_date, end_date);

CREATE INDEX idx_premium_applications_mission ON premium_mission_applications(mission_id);
CREATE INDEX idx_premium_applications_doctor ON premium_mission_applications(doctor_id);
CREATE INDEX idx_premium_applications_status ON premium_mission_applications(status, applied_at);

-- Activer RLS
ALTER TABLE premium_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_mission_applications ENABLE ROW LEVEL SECURITY;

-- Policies pour premium_missions
CREATE POLICY "Premium missions are viewable by premium doctors" ON premium_missions
    FOR SELECT USING (
        is_active = true 
        AND status = 'available' 
        AND exclusive_until > now()
        AND EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_id = auth.uid() 
            AND plan_type = 'premium' 
            AND status = 'active'
        )
    );

CREATE POLICY "Establishments can manage their premium missions" ON premium_missions
    FOR ALL USING (establishment_id = auth.uid());

-- Policies pour premium_mission_applications
CREATE POLICY "Doctors can manage their applications" ON premium_mission_applications
    FOR ALL USING (doctor_id = auth.uid());

CREATE POLICY "Establishments can view applications to their missions" ON premium_mission_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM premium_missions 
            WHERE id = mission_id 
            AND establishment_id = auth.uid()
        )
    );

CREATE POLICY "Establishments can update applications to their missions" ON premium_mission_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM premium_missions 
            WHERE id = mission_id 
            AND establishment_id = auth.uid()
        )
    );

-- Fonction pour mettre à jour le nombre de places occupées
CREATE OR REPLACE FUNCTION update_premium_mission_spots()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE premium_missions 
    SET spots_filled = (
        SELECT COUNT(*) 
        FROM premium_mission_applications 
        WHERE mission_id = COALESCE(NEW.mission_id, OLD.mission_id)
        AND status = 'accepted'
    )
    WHERE id = COALESCE(NEW.mission_id, OLD.mission_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement le nombre de places
CREATE TRIGGER trigger_update_premium_mission_spots
    AFTER INSERT OR UPDATE OR DELETE ON premium_mission_applications
    FOR EACH ROW EXECUTE FUNCTION update_premium_mission_spots();

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER trigger_premium_missions_updated_at
    BEFORE UPDATE ON premium_missions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_premium_applications_updated_at
    BEFORE UPDATE ON premium_mission_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
