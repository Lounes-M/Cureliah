-- Tables Analytics pour le tracking des vues et matches
-- À exécuter dans Supabase SQL Editor

-- Table pour tracker les vues de contenu
CREATE TABLE IF NOT EXISTS view_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('vacation', 'profile', 'establishment', 'mission')),
    content_id TEXT NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    session_id TEXT,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour tracker les matches/interactions
CREATE TABLE IF NOT EXISTS match_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id TEXT NOT NULL,
    match_type TEXT NOT NULL CHECK (match_type IN ('application', 'booking', 'contact', 'interest')),
    matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    success BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_view_analytics_user_content ON view_analytics(user_id, content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_view_analytics_date ON view_analytics(viewed_at);
CREATE INDEX IF NOT EXISTS idx_view_analytics_content ON view_analytics(content_type, content_id);

CREATE INDEX IF NOT EXISTS idx_match_analytics_user_content ON match_analytics(user_id, content_id);
CREATE INDEX IF NOT EXISTS idx_match_analytics_date ON match_analytics(matched_at);
CREATE INDEX IF NOT EXISTS idx_match_analytics_type ON match_analytics(match_type, success);

-- Politique de sécurité RLS
ALTER TABLE view_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_analytics ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs puissent voir leurs propres données
CREATE POLICY "Users can view own analytics data" ON view_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics data" ON view_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own match data" ON match_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own match data" ON match_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique pour les admins (voir toutes les données)
CREATE POLICY "Admins can view all analytics" ON view_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );

CREATE POLICY "Admins can manage all match analytics" ON match_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );
