
-- Fix time_slots table structure
CREATE TABLE IF NOT EXISTS time_slots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vacation_id UUID REFERENCES vacation_posts(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('morning', 'afternoon', 'custom')),
    start_time TIME,
    end_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies for time_slots
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view time_slots for their own vacations" ON time_slots
    FOR SELECT USING (
        vacation_id IN (
            SELECT id FROM vacation_posts WHERE doctor_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert time_slots for their own vacations" ON time_slots
    FOR INSERT WITH CHECK (
        vacation_id IN (
            SELECT id FROM vacation_posts WHERE doctor_id = auth.uid()
        )
    );

CREATE POLICY "Users can update time_slots for their own vacations" ON time_slots
    FOR UPDATE USING (
        vacation_id IN (
            SELECT id FROM vacation_posts WHERE doctor_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete time_slots for their own vacations" ON time_slots
    FOR DELETE USING (
        vacation_id IN (
            SELECT id FROM vacation_posts WHERE doctor_id = auth.uid()
        )
    );

-- Add act_type column to vacation_posts if it doesn't exist
ALTER TABLE vacation_posts ADD COLUMN IF NOT EXISTS act_type TEXT DEFAULT 'consultation';
