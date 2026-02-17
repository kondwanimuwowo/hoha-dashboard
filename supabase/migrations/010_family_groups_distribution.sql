-- Migration: Family Groups and Smart Distribution
-- Creates views and functions for intelligent family grouping in distribution system

-- =====================================================
-- SAFE CLEANUP - Using a DO block to handle type mismatches
-- =====================================================

DO $$ 
BEGIN
    -- 1. Drop dependent objects first
    IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'distribution_summary' AND schemaname = 'public') THEN
        DROP VIEW public.distribution_summary CASCADE;
    END IF;

    -- 2. Drop the family_groups object based on its actual type (must check view first)
    IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'family_groups' AND schemaname = 'public') THEN
        DROP VIEW public.family_groups CASCADE;
    ELSIF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'family_groups' AND schemaname = 'public') THEN
        DROP TABLE public.family_groups CASCADE;
    END IF;

    -- 3. Drop functions
    DROP FUNCTION IF EXISTS mark_family_collected(UUID, VARCHAR) CASCADE;
    DROP FUNCTION IF EXISTS get_distribution_recipients() CASCADE;
END $$;

-- =====================================================
-- FAMILY GROUPS VIEW
-- =====================================================

-- This view identifies family units for distribution purposes (Legacy Women + Sibling Groups)
CREATE OR REPLACE VIEW family_groups AS
WITH 
-- Get all women in legacy program
legacy_women AS (
  SELECT DISTINCT
    p.id as woman_id,
    p.first_name || ' ' || p.last_name as woman_name,
    p.compound_area,
    lwe.status as program_status
  FROM people p
  JOIN legacy_women_enrollment lwe ON p.id = lwe.woman_id
  WHERE lwe.status = 'Active'
),

-- Get all children in educare program
educare_children AS (
  SELECT DISTINCT
    p.id as child_id,
    p.first_name || ' ' || p.last_name as child_name,
    p.compound_area,
    ee.current_status
  FROM people p
  JOIN educare_enrollment ee ON p.id = ee.child_id
  WHERE ee.current_status = 'Active'
),

-- Link children to their mothers in legacy program
children_with_legacy_mothers AS (
  SELECT 
    ec.child_id,
    ec.child_name,
    lw.woman_id as mother_id,
    lw.woman_name as mother_name,
    lw.compound_area
  FROM educare_children ec
  JOIN relationships r ON ec.child_id = r.person_id
  JOIN legacy_women lw ON r.related_person_id = lw.woman_id
  WHERE r.relationship_type IN ('Mother', 'Parent', 'Guardian')
    AND r.is_primary = true
),

-- Find sibling groups (children who share a parent but parent not in legacy)
sibling_groups AS (
  SELECT 
    r1.person_id as child_id,
    r1.related_person_id as parent_id,
    p.first_name || ' ' || p.last_name as parent_name,
    COUNT(*) OVER (PARTITION BY r1.related_person_id) as sibling_count,
    ROW_NUMBER() OVER (PARTITION BY r1.related_person_id ORDER BY COALESCE(p.date_of_birth, '1900-01-01'::DATE)) as child_order
  FROM relationships r1
  JOIN people p ON r1.person_id = p.id
  JOIN educare_enrollment ee ON p.id = ee.child_id
  WHERE r1.relationship_type IN ('Mother', 'Father', 'Parent', 'Guardian')
    AND ee.current_status = 'Active'
    -- Parent is NOT in legacy women program
    AND NOT EXISTS (
      SELECT 1 FROM legacy_women lw WHERE lw.woman_id = r1.related_person_id
    )
),

-- Standalone children (no parent in system or no siblings)
standalone_children AS (
  SELECT 
    ec.child_id,
    ec.child_name,
    ec.compound_area
  FROM educare_children ec
  WHERE NOT EXISTS (
    -- Not linked to legacy mother
    SELECT 1 FROM children_with_legacy_mothers cwlm WHERE cwlm.child_id = ec.child_id
  )
  AND NOT EXISTS (
    -- Not part of sibling group
    SELECT 1 FROM sibling_groups sg WHERE sg.child_id = ec.child_id
  )
)

-- Combine all family types
SELECT 
  'legacy_woman'::VARCHAR(50) as family_type,
  lw.woman_id as recipient_id,
  lw.woman_name as recipient_name,
  lw.compound_area,
  (1 + COUNT(cwlm.child_id))::BIGINT as family_size, -- Woman + children
  lw.woman_id as primary_person_id,
  ARRAY_AGG(cwlm.child_id) FILTER (WHERE cwlm.child_id IS NOT NULL) as family_member_ids
FROM legacy_women lw
LEFT JOIN children_with_legacy_mothers cwlm ON lw.woman_id = cwlm.mother_id
GROUP BY lw.woman_id, lw.woman_name, lw.compound_area

UNION ALL

-- Sibling groups (use first child as representative)
SELECT 
  'sibling_group'::VARCHAR(50) as family_type,
  sg.child_id as recipient_id,
  p.first_name || ' ' || p.last_name || ' (& ' || (sg.sibling_count - 1)::TEXT || ' sibling' || 
    CASE WHEN sg.sibling_count > 2 THEN 's' ELSE '' END || ')' as recipient_name,
  p.compound_area,
  sg.sibling_count as family_size,
  sg.parent_id as primary_person_id,
  ARRAY_AGG(sg2.child_id) as family_member_ids
FROM sibling_groups sg
JOIN people p ON sg.child_id = p.id
JOIN sibling_groups sg2 ON sg.parent_id = sg2.parent_id
WHERE sg.child_order = 1 -- Only show first child as representative
GROUP BY sg.child_id, p.first_name, p.last_name, p.compound_area, sg.sibling_count, sg.parent_id

UNION ALL

-- Standalone children
SELECT 
  'standalone_child'::VARCHAR(50) as family_type,
  sc.child_id as recipient_id,
  sc.child_name as recipient_name,
  sc.compound_area,
  1::BIGINT as family_size,
  sc.child_id as primary_person_id,
  ARRAY[sc.child_id] as family_member_ids
FROM standalone_children sc;

-- =====================================================
-- FUNCTION TO GET DISTRIBUTION RECIPIENTS
-- =====================================================

CREATE OR REPLACE FUNCTION get_distribution_recipients()
RETURNS TABLE (
  family_type VARCHAR(50),
  recipient_id UUID,
  recipient_name TEXT,
  compound_area VARCHAR(100),
  family_size BIGINT,
  primary_person_id UUID,
  family_member_ids UUID[]
) AS $$
BEGIN
  RETURN QUERY SELECT * FROM family_groups ORDER BY recipient_name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- UPDATE FOOD RECIPIENTS TABLE
-- =====================================================

-- Add columns to track family grouping
ALTER TABLE food_recipients ADD COLUMN IF NOT EXISTS family_type VARCHAR(50);
ALTER TABLE food_recipients ADD COLUMN IF NOT EXISTS primary_person_id UUID REFERENCES people(id);
ALTER TABLE food_recipients ADD COLUMN IF NOT EXISTS family_member_ids UUID[];
ALTER TABLE food_recipients ADD COLUMN IF NOT EXISTS is_collected BOOLEAN DEFAULT false;
ALTER TABLE food_recipients ADD COLUMN IF NOT EXISTS collected_at TIMESTAMP WITH TIME ZONE;

-- Add index for collection status
CREATE INDEX IF NOT EXISTS idx_food_recipients_collected ON food_recipients(is_collected);
CREATE INDEX IF NOT EXISTS idx_food_recipients_family_type ON food_recipients(family_type);

-- =====================================================
-- FUNCTION TO MARK FAMILY AS COLLECTED
-- =====================================================

CREATE OR REPLACE FUNCTION mark_family_collected(recipient_record_id UUID, collector_name VARCHAR)
RETURNS VOID AS $$
BEGIN
  -- Mark the recipient record as collected
  UPDATE food_recipients
  SET 
    is_collected = true,
    collected_by = collector_name,
    collected_at = NOW(),
    collection_time = NOW()
  WHERE id = recipient_record_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEW FOR DISTRIBUTION SUMMARY
-- =====================================================

CREATE OR REPLACE VIEW distribution_summary AS
SELECT 
  fd.id as distribution_id,
  fd.distribution_date,
  fd.quarter,
  fd.year,
  fd.distribution_location,
  COUNT(fr.id) as total_families,
  COUNT(fr.id) FILTER (WHERE fr.is_collected = true) as families_collected,
  COUNT(fr.id) FILTER (WHERE fr.is_collected = false) as families_pending,
  SUM(fr.family_size) as total_individuals,
  SUM(fr.family_size) FILTER (WHERE fr.is_collected = true) as individuals_served
FROM food_distribution fd
LEFT JOIN food_recipients fr ON fd.id = fr.distribution_id
GROUP BY fd.id, fd.distribution_date, fd.quarter, fd.year, fd.distribution_location;
