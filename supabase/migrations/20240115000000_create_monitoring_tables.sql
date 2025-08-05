-- Migration pour créer les tables de monitoring des erreurs et performances
-- 2024-01-XX: Create monitoring tables

-- Table pour stocker les rapports d'erreurs
CREATE TABLE IF NOT EXISTS error_reports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    message text NOT NULL,
    stack text,
    user_agent text,
    url text NOT NULL,
    timestamp timestamptz NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    user_type text CHECK (user_type IN ('doctor', 'establishment', 'admin')),
    severity text CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    context jsonb,
    resolved boolean DEFAULT false,
    resolved_at timestamptz,
    resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Table pour stocker les métriques de performance
CREATE TABLE IF NOT EXISTS performance_metrics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    value numeric NOT NULL,
    timestamp timestamptz NOT NULL,
    url text,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    context jsonb,
    created_at timestamptz DEFAULT now()
);

-- Table pour stocker les alertes de performance
CREATE TABLE IF NOT EXISTS performance_alerts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name text NOT NULL,
    value numeric NOT NULL,
    threshold numeric NOT NULL,
    url text,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    timestamp timestamptz NOT NULL,
    resolved boolean DEFAULT false,
    resolved_at timestamptz,
    resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_error_reports_timestamp ON error_reports(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_reports_severity ON error_reports(severity);
CREATE INDEX IF NOT EXISTS idx_error_reports_resolved ON error_reports(resolved);
CREATE INDEX IF NOT EXISTS idx_error_reports_user_id ON error_reports(user_id);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);

CREATE INDEX IF NOT EXISTS idx_performance_alerts_resolved ON performance_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_timestamp ON performance_alerts(timestamp DESC);

-- RLS (Row Level Security) policies
ALTER TABLE error_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;

-- Les admins peuvent tout voir (nous allons créer une table admins ou utiliser une approche différente)
CREATE POLICY "Admins can view all error reports" ON error_reports
    FOR SELECT USING (
        -- Pour l'instant, on permet l'accès aux utilisateurs authentifiés
        -- Cette policy sera mise à jour une fois le système d'admin en place
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Admins can update error reports" ON error_reports
    FOR UPDATE USING (
        -- Pour l'instant, on permet l'accès aux utilisateurs authentifiés
        auth.uid() IS NOT NULL
    );

-- Service role peut insérer des rapports d'erreurs (pour la fonction Edge)
CREATE POLICY "Service role can insert error reports" ON error_reports
    FOR INSERT WITH CHECK (true);

-- Les utilisateurs peuvent voir leurs propres métriques
CREATE POLICY "Users can view their own metrics" ON performance_metrics
    FOR SELECT USING (user_id = auth.uid());

-- Les admins peuvent voir toutes les métriques
CREATE POLICY "Admins can view all metrics" ON performance_metrics
    FOR SELECT USING (
        -- Pour l'instant, on permet l'accès aux utilisateurs authentifiés
        auth.uid() IS NOT NULL
    );

-- Service role peut insérer des métriques (pour la fonction Edge)
CREATE POLICY "Service role can insert metrics" ON performance_metrics
    FOR INSERT WITH CHECK (true);

-- Policies similaires pour les alertes de performance
CREATE POLICY "Admins can view all performance alerts" ON performance_alerts
    FOR SELECT USING (
        -- Pour l'instant, on permet l'accès aux utilisateurs authentifiés
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Admins can update performance alerts" ON performance_alerts
    FOR UPDATE USING (
        -- Pour l'instant, on permet l'accès aux utilisateurs authentifiés
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Service role can insert performance alerts" ON performance_alerts
    FOR INSERT WITH CHECK (true);

-- Triggers pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_error_reports_updated_at 
    BEFORE UPDATE ON error_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_alerts_updated_at 
    BEFORE UPDATE ON performance_alerts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
