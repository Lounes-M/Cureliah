-- Create enum for time slot types
CREATE TYPE time_slot_type AS ENUM ('morning', 'afternoon', 'custom');

-- Create time slots table
CREATE TABLE time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vacation_id UUID REFERENCES vacation_posts(id) ON DELETE CASCADE,
    type time_slot_type NOT NULL,
    start_time TIME,
    end_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vacation_availability table to track which dates are available
CREATE TABLE vacation_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vacation_id UUID REFERENCES vacation_posts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_slot_id UUID REFERENCES time_slots(id) ON DELETE CASCADE,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(vacation_id, date, time_slot_id)
);

-- Add indexes
CREATE INDEX idx_time_slots_vacation_id ON time_slots(vacation_id);
CREATE INDEX idx_vacation_availability_vacation_id ON vacation_availability(vacation_id);
CREATE INDEX idx_vacation_availability_date ON vacation_availability(date);

-- Add RLS policies for time_slots
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Time slots are viewable by everyone"
    ON time_slots FOR SELECT
    USING (true);

CREATE POLICY "Time slots are insertable by authenticated users"
    ON time_slots FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Time slots are updatable by vacation owner"
    ON time_slots FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vacation_posts
            WHERE vacation_posts.id = time_slots.vacation_id
            AND vacation_posts.doctor_id = auth.uid()
        )
    );

CREATE POLICY "Time slots are deletable by vacation owner"
    ON time_slots FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM vacation_posts
            WHERE vacation_posts.id = time_slots.vacation_id
            AND vacation_posts.doctor_id = auth.uid()
        )
    );

-- Add RLS policies for vacation_availability
ALTER TABLE vacation_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vacation availability is viewable by everyone"
    ON vacation_availability FOR SELECT
    USING (true);

CREATE POLICY "Vacation availability is insertable by vacation owner"
    ON vacation_availability FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vacation_posts
            WHERE vacation_posts.id = vacation_availability.vacation_id
            AND vacation_posts.doctor_id = auth.uid()
        )
    );

CREATE POLICY "Vacation availability is updatable by vacation owner"
    ON vacation_availability FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vacation_posts
            WHERE vacation_posts.id = vacation_availability.vacation_id
            AND vacation_posts.doctor_id = auth.uid()
        )
    );

CREATE POLICY "Vacation availability is deletable by vacation owner"
    ON vacation_availability FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM vacation_posts
            WHERE vacation_posts.id = vacation_availability.vacation_id
            AND vacation_posts.doctor_id = auth.uid()
        )
    );

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON time_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON vacation_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 