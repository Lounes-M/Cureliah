-- Add availability column to doctor_profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'doctor_profiles' 
        AND column_name = 'availability'
    ) THEN
        ALTER TABLE doctor_profiles 
        ADD COLUMN availability JSONB DEFAULT '{"days": [], "hours": ""}';
    END IF;
END $$; 