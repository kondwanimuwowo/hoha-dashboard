-- Migration: Enhanced Food Distribution
-- Includes family member names and improvements for admin management

-- 1. Add family_member_names to food_recipients
ALTER TABLE public.food_recipients ADD COLUMN IF NOT EXISTS family_member_names TEXT[];

-- 2. Update family_groups view to include family member names
CREATE OR REPLACE VIEW public.family_groups AS
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
  ARRAY_AGG(cwlm.child_id) FILTER (WHERE cwlm.child_id IS NOT NULL) as family_member_ids,
  ARRAY_AGG(cwlm.child_name) FILTER (WHERE cwlm.child_name IS NOT NULL) as family_member_names
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
  ARRAY_AGG(sg2.child_id) as family_member_ids,
  ARRAY_AGG(p2.first_name || ' ' || p2.last_name) as family_member_names
FROM sibling_groups sg
JOIN people p ON sg.child_id = p.id
JOIN sibling_groups sg2 ON sg.parent_id = sg2.parent_id
JOIN people p2 ON sg2.child_id = p2.id
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
  ARRAY[sc.child_id] as family_member_ids,
  ARRAY[sc.child_name] as family_member_names
FROM standalone_children sc;

-- 3. Update the trigger function to include family_member_names
CREATE OR REPLACE FUNCTION public.auto_populate_food_recipients()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert all households from family_groups view into the new distribution
    INSERT INTO public.food_recipients (
        distribution_id,
        family_head_id,
        family_size,
        family_type,
        primary_person_id,
        family_member_ids,
        family_member_names,
        is_collected
    )
    SELECT 
        NEW.id,
        recipient_id,
        family_size,
        family_type,
        primary_person_id,
        family_member_ids,
        family_member_names,
        false
    FROM public.family_groups;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
