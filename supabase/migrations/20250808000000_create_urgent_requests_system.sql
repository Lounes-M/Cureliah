-- Create urgent_requests table
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
    -- hourly_rate DECIMAL NOT NULL, -- Removed for compliance
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

-- Create urgent_request_responses table
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

-- Create urgent_notifications table
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

-- Create indexes for better performance
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

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_urgent_requests_updated_at 
    BEFORE UPDATE ON urgent_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_urgent_request_responses_updated_at 
    BEFORE UPDATE ON urgent_request_responses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE urgent_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE urgent_request_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE urgent_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for urgent_requests
CREATE POLICY "Establishments can create their own urgent requests" ON urgent_requests
    FOR INSERT WITH CHECK (auth.uid() = establishment_id);

CREATE POLICY "Establishments can view their own urgent requests" ON urgent_requests
    FOR SELECT USING (auth.uid() = establishment_id);

CREATE POLICY "Establishments can update their own urgent requests" ON urgent_requests
    FOR UPDATE USING (auth.uid() = establishment_id);

CREATE POLICY "Doctors can view open urgent requests" ON urgent_requests
    FOR SELECT USING (status = 'open');

-- RLS Policies for urgent_request_responses
CREATE POLICY "Doctors can create their own responses" ON urgent_request_responses
    FOR INSERT WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can view their own responses" ON urgent_request_responses
    FOR SELECT USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their own responses" ON urgent_request_responses
    FOR UPDATE USING (auth.uid() = doctor_id);

CREATE POLICY "Establishments can view responses to their requests" ON urgent_request_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM urgent_requests 
            WHERE urgent_requests.id = request_id 
            AND urgent_requests.establishment_id = auth.uid()
        )
    );

CREATE POLICY "Establishments can update responses to their requests" ON urgent_request_responses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM urgent_requests 
            WHERE urgent_requests.id = request_id 
            AND urgent_requests.establishment_id = auth.uid()
        )
    );

-- RLS Policies for urgent_notifications
CREATE POLICY "Users can view their own notifications" ON urgent_notifications
    FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update their own notifications" ON urgent_notifications
    FOR UPDATE USING (auth.uid() = recipient_id);

CREATE POLICY "System can insert notifications" ON urgent_notifications
    FOR INSERT WITH CHECK (true);
