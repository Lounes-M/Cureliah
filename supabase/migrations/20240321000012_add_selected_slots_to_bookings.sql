
-- Add selected_slots column to vacation_bookings table
ALTER TABLE vacation_bookings 
ADD COLUMN selected_slots JSONB;

-- Add comment to explain the structure
COMMENT ON COLUMN vacation_bookings.selected_slots IS 'Array of selected time slots with date, time_slot_id, and hours';

-- Create index on selected_slots for better query performance
CREATE INDEX idx_vacation_bookings_selected_slots ON vacation_bookings USING GIN (selected_slots);
