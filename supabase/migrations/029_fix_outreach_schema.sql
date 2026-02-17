-- Migration: Fix Community Outreach Schema Relationships
-- Description: Add named foreign keys and point created_by to user_profiles for PostgREST joins

-- Fix created_by relationship
ALTER TABLE community_outreach 
DROP CONSTRAINT IF EXISTS community_outreach_created_by_fkey;

ALTER TABLE community_outreach
ADD CONSTRAINT community_outreach_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES user_profiles(id);

-- Fix location_id relationship
ALTER TABLE community_outreach 
DROP CONSTRAINT IF EXISTS community_outreach_location_id_fkey;

ALTER TABLE community_outreach
ADD CONSTRAINT community_outreach_location_id_fkey 
FOREIGN KEY (location_id) REFERENCES outreach_locations(id);

-- Add comments for documentation
COMMENT ON CONSTRAINT community_outreach_created_by_fkey ON community_outreach IS 'Link to user profiles for creator information';
COMMENT ON CONSTRAINT community_outreach_location_id_fkey ON community_outreach IS 'Link to outreach locations lookup table';
