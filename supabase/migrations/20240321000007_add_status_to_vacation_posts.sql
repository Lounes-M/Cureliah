-- Add status column to vacation_posts table
ALTER TABLE vacation_posts
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft' 
CHECK (status IN ('draft', 'available', 'booked', 'completed', 'cancelled', 'pending'));

-- Update existing rows to have a default status
UPDATE vacation_posts
SET status = 'available'
WHERE status IS NULL; 