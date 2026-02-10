-- Migration 022: Standardize family_groups to always prefer parent/guardian as household head.
-- This ensures food distribution lists show parent names with child members regardless of Legacy enrollment.

CREATE OR REPLACE VIEW public.family_groups AS
WITH active_children AS (
  SELECT
    p.id AS child_id,
    p.first_name || ' ' || p.last_name AS child_name,
    p.compound_area AS child_compound
  FROM public.people p
  JOIN public.educare_enrollment ee ON ee.child_id = p.id
  WHERE ee.current_status = 'Active'
    AND ee.deleted_at IS NULL
    AND p.deleted_at IS NULL
    AND p.is_active = true
),
parent_links AS (
  -- Standard direction: parent -> child
  SELECT
    ac.child_id,
    r.person_id AS parent_id,
    r.relationship_type,
    COALESCE(r.is_primary, false) AS is_primary,
    r.created_at
  FROM active_children ac
  JOIN public.relationships r ON r.related_person_id = ac.child_id
  WHERE r.relationship_type IN ('Mother', 'Father', 'Parent', 'Guardian')

  UNION ALL

  -- Legacy/inverse direction: child -> parent
  SELECT
    ac.child_id,
    r.related_person_id AS parent_id,
    r.relationship_type,
    COALESCE(r.is_primary, false) AS is_primary,
    r.created_at
  FROM active_children ac
  JOIN public.relationships r ON r.person_id = ac.child_id
  WHERE r.relationship_type IN ('Mother', 'Father', 'Parent', 'Guardian')
),
ranked_parent_links AS (
  SELECT
    pl.*,
    ROW_NUMBER() OVER (
      PARTITION BY pl.child_id
      ORDER BY
        pl.is_primary DESC,
        CASE pl.relationship_type
          WHEN 'Mother' THEN 1
          WHEN 'Father' THEN 2
          WHEN 'Parent' THEN 3
          WHEN 'Guardian' THEN 4
          ELSE 5
        END,
        pl.created_at ASC
    ) AS rn
  FROM parent_links pl
),
chosen_parent AS (
  SELECT child_id, parent_id
  FROM ranked_parent_links
  WHERE rn = 1
),
household_base AS (
  SELECT
    ac.child_id,
    ac.child_name,
    ac.child_compound,
    cp.parent_id,
    pp.first_name || ' ' || pp.last_name AS parent_name,
    pp.compound_area AS parent_compound
  FROM active_children ac
  LEFT JOIN chosen_parent cp ON cp.child_id = ac.child_id
  LEFT JOIN public.people pp ON pp.id = cp.parent_id
),
parent_households AS (
  SELECT
    'parent_household'::varchar(50) AS family_type,
    hb.parent_id AS recipient_id,
    MAX(hb.parent_name) AS recipient_name,
    COALESCE(MAX(hb.parent_compound), MAX(hb.child_compound))::varchar(100) AS compound_area,
    (COUNT(*) + 1)::bigint AS family_size,
    hb.parent_id AS primary_person_id,
    ARRAY_AGG(hb.child_id ORDER BY hb.child_name) AS family_member_ids,
    ARRAY_AGG(hb.child_name ORDER BY hb.child_name) AS family_member_names
  FROM household_base hb
  WHERE hb.parent_id IS NOT NULL
  GROUP BY hb.parent_id
),
child_only_households AS (
  SELECT
    'child_only'::varchar(50) AS family_type,
    hb.child_id AS recipient_id,
    hb.child_name || ' (No parent linked)' AS recipient_name,
    hb.child_compound::varchar(100) AS compound_area,
    1::bigint AS family_size,
    hb.child_id AS primary_person_id,
    ARRAY[hb.child_id] AS family_member_ids,
    ARRAY[hb.child_name] AS family_member_names
  FROM household_base hb
  WHERE hb.parent_id IS NULL
)
SELECT * FROM parent_households
UNION ALL
SELECT * FROM child_only_households;
