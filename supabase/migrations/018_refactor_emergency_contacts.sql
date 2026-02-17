-- Add is_emergency_contact flag to relationships
ALTER TABLE relationships
ADD COLUMN IF NOT EXISTS is_emergency_contact BOOLEAN DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_relationships_emergency_contact 
ON relationships(related_person_id, is_emergency_contact) 
WHERE is_emergency_contact = true;

-- Data Migration: 
-- 1. For each student (person with a relationship to someone else who is their child), 
--    find their primary guardian and mark as emergency contact.
-- 2. Copy emergency contact info from the student record to the parent record.

UPDATE relationships r
SET is_emergency_contact = true
FROM people p
WHERE r.related_person_id = p.id
AND r.is_primary = true
AND p.emergency_contact_name IS NOT NULL
-- Only update if not already set to avoid unnecessary updates
AND r.is_emergency_contact = false;

-- Important: We don't delete the columns from people yet to ensure backward compatibility 
-- and because parents are also in the people table and need these fields.
-- In fact, we are repurposing the fields on the parent's record.
