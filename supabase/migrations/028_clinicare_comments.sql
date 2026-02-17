-- Migration: Clinicare Comments for Checkboxes
-- Description: Add comment fields for emergency, transport, and follow-up checkboxes in medical visits

-- Add comment columns
ALTER TABLE clinicare_visits
ADD COLUMN IF NOT EXISTS emergency_comment TEXT,
ADD COLUMN IF NOT EXISTS transport_comment TEXT,
ADD COLUMN IF NOT EXISTS followup_comment TEXT;

-- Add comments explaining the columns
COMMENT ON COLUMN clinicare_visits.emergency_comment IS 
'Additional details about the emergency visit (e.g., nature of emergency, urgency level)';

COMMENT ON COLUMN clinicare_visits.transport_comment IS 
'Details about transport provided (e.g., vehicle type, route, special accommodations)';

COMMENT ON COLUMN clinicare_visits.followup_comment IS 
'Instructions or notes for the follow-up visit (e.g., specific tests needed, concerns to monitor)';
