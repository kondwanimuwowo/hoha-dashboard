-- Migration: Update student_details view to include primary parent/guardian name
-- This allows the student table to show the parent name without complex joins on the frontend

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
  gs.school_name as government_school,
  ee.enrollment_date,
  p.compound_area,
  p.emergency_contact_name,
  p.emergency_contact_phone,
  p.emergency_contact_relationship,
  (
    SELECT p2.first_name || ' ' || p2.last_name
    FROM relationships r
    JOIN people p2 ON r.person_id = p2.id
    WHERE r.related_person_id = p.id AND r.is_primary = true
    LIMIT 1
  ) as parent_name,
  (
    SELECT r.person_id
    FROM relationships r
    WHERE r.related_person_id = p.id AND r.is_primary = true
    LIMIT 1
  ) as parent_id
FROM people p
JOIN educare_enrollment ee ON p.id = ee.child_id
LEFT JOIN government_schools gs ON ee.government_school_id = gs.id
WHERE p.is_active = true 
  AND p.deleted_at IS NULL 
  AND ee.deleted_at IS NULL;
