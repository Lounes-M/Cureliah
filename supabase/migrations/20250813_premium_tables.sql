-- Tables pour les fonctionnalités Premium

-- Table pour les statistiques avancées des médecins
CREATE TABLE IF NOT EXISTS doctor_statistics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    completed_missions INTEGER DEFAULT 0,
    active_patients INTEGER DEFAULT 0,
    satisfaction_score DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(doctor_id, month, year)
);

-- Table pour les factures Premium
CREATE TABLE IF NOT EXISTS premium_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table pour les clés API Premium
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    key_name VARCHAR(100) NOT NULL,
    api_key VARCHAR(64) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    permissions TEXT[] DEFAULT '{}',
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table pour les webhooks Premium
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL DEFAULT '{}',
    secret VARCHAR(64),
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table pour les missions Premium
CREATE TABLE IF NOT EXISTS premium_missions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    mission_type VARCHAR(50) NOT NULL CHECK (mission_type IN ('urgent', 'specialized', 'vip', 'emergency')),
    specialty VARCHAR(100),
    amount DECIMAL(10,2) NOT NULL,
    urgency_level INTEGER DEFAULT 1 CHECK (urgency_level BETWEEN 1 AND 5),
    assigned_doctor_id UUID REFERENCES auth.users(id),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'in_progress', 'completed', 'cancelled')),
    patient_location TEXT,
    required_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table pour les notifications urgentes Premium
CREATE TABLE IF NOT EXISTS urgent_request_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('doctor', 'establishment')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    mission_id UUID REFERENCES premium_missions(id) ON DELETE CASCADE,
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table pour les tickets de support Premium
CREATE TABLE IF NOT EXISTS premium_support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_agent VARCHAR(100),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table pour les insights IA Premium
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN ('performance', 'opportunity', 'prediction', 'recommendation')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
    impact_level VARCHAR(10) DEFAULT 'medium' CHECK (impact_level IN ('low', 'medium', 'high')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_doctor_statistics_doctor_date ON doctor_statistics(doctor_id, year, month);
CREATE INDEX IF NOT EXISTS idx_premium_invoices_doctor ON premium_invoices(doctor_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_doctor ON api_keys(doctor_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_doctor ON webhooks(doctor_id);
CREATE INDEX IF NOT EXISTS idx_premium_missions_status ON premium_missions(status, mission_type);
CREATE INDEX IF NOT EXISTS idx_premium_missions_specialty ON premium_missions(specialty);
CREATE INDEX IF NOT EXISTS idx_urgent_notifications_recipient ON urgent_request_notifications(recipient_id, recipient_type);
CREATE INDEX IF NOT EXISTS idx_support_tickets_doctor ON premium_support_tickets(doctor_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_doctor ON ai_insights(doctor_id, is_active);

-- RLS Policies
ALTER TABLE doctor_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE urgent_request_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Policies pour doctor_statistics
CREATE POLICY "Users can view own statistics" ON doctor_statistics
    FOR SELECT USING (auth.uid() = doctor_id);

CREATE POLICY "Users can insert own statistics" ON doctor_statistics
    FOR INSERT WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Users can update own statistics" ON doctor_statistics
    FOR UPDATE USING (auth.uid() = doctor_id);

-- Policies pour premium_invoices
CREATE POLICY "Users can view own invoices" ON premium_invoices
    FOR SELECT USING (auth.uid() = doctor_id);

-- Policies pour api_keys
CREATE POLICY "Users can manage own API keys" ON api_keys
    FOR ALL USING (auth.uid() = doctor_id);

-- Policies pour webhooks
CREATE POLICY "Users can manage own webhooks" ON webhooks
    FOR ALL USING (auth.uid() = doctor_id);

-- Policies pour premium_missions
CREATE POLICY "Doctors can view available missions" ON premium_missions
    FOR SELECT USING (
        status = 'available' OR 
        assigned_doctor_id = auth.uid()
    );

CREATE POLICY "Doctors can update assigned missions" ON premium_missions
    FOR UPDATE USING (assigned_doctor_id = auth.uid());

-- Policies pour urgent_request_notifications
CREATE POLICY "Users can view own notifications" ON urgent_request_notifications
    FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update own notifications" ON urgent_request_notifications
    FOR UPDATE USING (auth.uid() = recipient_id);

-- Policies pour premium_support_tickets
CREATE POLICY "Users can manage own support tickets" ON premium_support_tickets
    FOR ALL USING (auth.uid() = doctor_id);

-- Policies pour ai_insights
CREATE POLICY "Users can view own insights" ON ai_insights
    FOR SELECT USING (auth.uid() = doctor_id);
