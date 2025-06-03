-- Fix time_slots table structure
DROP TABLE IF EXISTS time_slots CASCADE;

CREATE TABLE time_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vacation_id UUID REFERENCES vacation_posts(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('morning', 'afternoon', 'custom')),
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add constraints for custom time slots
ALTER TABLE time_slots ADD CONSTRAINT custom_time_slots_have_times 
  CHECK (
    (type != 'custom') OR 
    (type = 'custom' AND start_time IS NOT NULL AND end_time IS NOT NULL)
  );

-- Add indexes for better performance
CREATE INDEX idx_time_slots_vacation_id ON time_slots(vacation_id);
CREATE INDEX idx_time_slots_type ON time_slots(type);

-- Enable RLS
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view time slots for their vacations" ON time_slots
  FOR SELECT USING (
    vacation_id IN (
      SELECT id FROM vacation_posts 
      WHERE doctor_id = auth.uid() OR establishment_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can manage time slots for their vacations" ON time_slots
  FOR ALL USING (
    vacation_id IN (
      SELECT id FROM vacation_posts WHERE doctor_id = auth.uid()
    )
  );

-- Add act_type column to vacation_posts if it doesn't exist
ALTER TABLE vacation_posts ADD COLUMN IF NOT EXISTS act_type TEXT DEFAULT 'consultation';