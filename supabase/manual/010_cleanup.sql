-- Cleanup script for 010_family_groups_distribution.sql
-- Run this FIRST if you get errors about family_groups not being a view

-- Drop everything that might exist from previous attempts
DROP VIEW IF EXISTS distribution_summary CASCADE;
DROP FUNCTION IF EXISTS mark_family_collected(UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS get_distribution_recipients() CASCADE;
DROP TABLE IF EXISTS family_groups CASCADE;
DROP VIEW IF EXISTS family_groups CASCADE;

-- Remove columns from food_recipients if they exist
-- (We'll add them back in the main migration)
ALTER TABLE food_recipients DROP COLUMN IF EXISTS family_type;
ALTER TABLE food_recipients DROP COLUMN IF EXISTS primary_person_id;
ALTER TABLE food_recipients DROP COLUMN IF EXISTS family_member_ids;
ALTER TABLE food_recipients DROP COLUMN IF EXISTS is_collected;
ALTER TABLE food_recipients DROP COLUMN IF EXISTS collected_at;

-- Drop indexes if they exist
DROP INDEX IF EXISTS idx_food_recipients_collected;
DROP INDEX IF EXISTS idx_food_recipients_family_type;

-- Now you can run the main 010_family_groups_distribution.sql migration
