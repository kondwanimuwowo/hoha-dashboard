-- Migration: make student_details resilient to legacy relationship direction
-- Some historical rows store parent->child, others child->parent.
-- This view resolves parent info from either direction and prefers primary links.

DROP VIEW IF EXISTS student_details;

CREATE VIEW student_details AS
SELECT
  p.id,
  p.first_name,
  p.last_name,
  p.date_of_birth,
  p.gender,
  p.phone_number,
  p.photo_url,
  ee.grade_level,
  ee.current_status,
  ee.government_school_id,
  gs.school_name AS government_school,
  ee.enrollment_date,
  p.compound_area,
  p.emergency_contact_name,
  p.emergency_contact_phone,
  p.emergency_contact_relationship,
  rel.parent_name,
  rel.parent_id,
  rel.parent_phone
FROM people p
JOIN educare_enrollment ee ON p.id = ee.child_id
LEFT JOIN government_schools gs ON ee.government_school_id = gs.id
LEFT JOIN LATERAL (
  SELECT
    candidate.parent_id,
    candidate.parent_name,
    candidate.parent_phone
  FROM (
    -- Standard direction: parent/guardian -> student
    SELECT
      r.person_id AS parent_id,
      p2.first_name || ' ' || p2.last_name AS parent_name,
      p2.phone_number AS parent_phone,
      COALESCE(r.is_primary, false) AS is_primary,
      r.created_at
    FROM relationships r
    JOIN people p2 ON p2.id = r.person_id
    WHERE r.related_person_id = p.id

    UNION ALL

    -- Legacy/inverse direction: student -> parent/guardian
    SELECT
      r.related_person_id AS parent_id,
      p3.first_name || ' ' || p3.last_name AS parent_name,
      p3.phone_number AS parent_phone,
      COALESCE(r.is_primary, false) AS is_primary,
      r.created_at
    FROM relationships r
    JOIN people p3 ON p3.id = r.related_person_id
    WHERE r.person_id = p.id
  ) candidate
  ORDER BY candidate.is_primary DESC, candidate.created_at ASC
  LIMIT 1
) rel ON true
WHERE p.is_active = true
  AND p.deleted_at IS NULL
  AND ee.deleted_at IS NULL;
