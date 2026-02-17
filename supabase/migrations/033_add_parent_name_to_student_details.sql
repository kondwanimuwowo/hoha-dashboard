-- Migration: Add parent_name to student_details view
-- This fixes the issue where parent/guardian names are not displaying in the students table

DROP VIEW IF EXISTS student_details CASCADE;

CREATE VIEW student_details AS
SELECT 
    ee.id,
    ee.child_id as person_id,
    p.first_name,
    p.last_name,
    p.date_of_birth,
    p.gender,
    p.phone_number,
    p.compound_area,
    p.is_registered_member,
    ee.grade_level,
    ee.enrollment_date,
    ee.current_status,
    ee.government_school_id,
    gs.school_name as government_school,
    ee.notes,
    
    -- Parent name with fallback
    COALESCE(
        (SELECT CONCAT(ph.first_name, ' ', ph.last_name)
         FROM relationships r 
         JOIN people ph ON r.person_id = ph.id 
         WHERE r.related_person_id = ee.child_id 
           AND r.relationship_type IN ('Parent', 'Guardian', 'Mother', 'Father')
           AND r.is_primary = true
         LIMIT 1),
        (SELECT CONCAT(ph.first_name, ' ', ph.last_name)
         FROM relationships r 
         JOIN people ph ON r.person_id = ph.id 
         WHERE r.related_person_id = ee.child_id 
           AND r.relationship_type IN ('Parent', 'Guardian', 'Mother', 'Father')
         LIMIT 1)
    ) as parent_name,
    
    -- Parent phone with fallback
    COALESCE(
        (SELECT ph.phone_number 
         FROM relationships r 
         JOIN people ph ON r.person_id = ph.id 
         WHERE r.related_person_id = ee.child_id 
           AND r.relationship_type IN ('Parent', 'Guardian', 'Mother', 'Father')
           AND r.is_primary = true
         LIMIT 1),
        (SELECT ph.phone_number 
         FROM relationships r 
         JOIN people ph ON r.person_id = ph.id 
         WHERE r.related_person_id = ee.child_id 
           AND r.relationship_type IN ('Parent', 'Guardian', 'Mother', 'Father')
         LIMIT 1),
        p.phone_number
    ) as parent_phone,
    
    -- Parent ID for quick edit
    COALESCE(
        (SELECT ph.id
         FROM relationships r 
         JOIN people ph ON r.person_id = ph.id 
         WHERE r.related_person_id = ee.child_id 
           AND r.relationship_type IN ('Parent', 'Guardian', 'Mother', 'Father')
           AND r.is_primary = true
         LIMIT 1),
        (SELECT ph.id
         FROM relationships r 
         JOIN people ph ON r.person_id = ph.id 
         WHERE r.related_person_id = ee.child_id 
           AND r.relationship_type IN ('Parent', 'Guardian', 'Mother', 'Father')
         LIMIT 1)
    ) as parent_id,
    
    -- Attendance stats (using tuition_attendance)
    (SELECT COUNT(*) 
     FROM tuition_attendance ta 
     WHERE ta.child_id = ee.child_id AND ta.status = 'Present'
    ) as total_present,
    
    (SELECT COUNT(*) 
     FROM tuition_attendance ta 
     WHERE ta.child_id = ee.child_id AND ta.status = 'Absent'
    ) as total_absent,
    
    (SELECT COUNT(*) 
     FROM tuition_attendance ta 
     WHERE ta.child_id = ee.child_id
    ) as total_sessions,
    
    -- Attendance percentage
    CASE 
        WHEN (SELECT COUNT(*) FROM tuition_attendance ta WHERE ta.child_id = ee.child_id) > 0
        THEN ROUND(
            (SELECT COUNT(*) FROM tuition_attendance ta WHERE ta.child_id = ee.child_id AND ta.status = 'Present')::NUMERIC / 
            (SELECT COUNT(*) FROM tuition_attendance ta WHERE ta.child_id = ee.child_id)::NUMERIC * 100, 
            2
        )
        ELSE 0
    END as attendance_percentage,
    
    ee.created_at,
    ee.updated_at
FROM educare_enrollment ee
JOIN people p ON ee.child_id = p.id
LEFT JOIN government_schools gs ON ee.government_school_id = gs.id
WHERE ee.deleted_at IS NULL;

-- Reload schema cache
NOTIFY pgrst, 'reload config';
