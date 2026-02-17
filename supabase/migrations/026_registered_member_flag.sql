-- Migration: Add HOHA Registered Member Flag
-- Description: Add is_registered_member boolean to people table with smart defaults

-- Add the column
ALTER TABLE people 
ADD COLUMN IF NOT EXISTS is_registered_member BOOLEAN DEFAULT true;

-- Update existing records: Set to false for people not in any HOHA programs
UPDATE people
SET is_registered_member = false
WHERE id NOT IN (
    -- People in educare
    SELECT DISTINCT child_id FROM educare_enrollment WHERE deleted_at IS NULL
    UNION
    -- People in legacy women program
    SELECT DISTINCT woman_id FROM legacy_women_enrollment WHERE deleted_at IS NULL
    UNION
    -- People who received clinicare
    SELECT DISTINCT patient_id FROM clinicare_visits WHERE patient_id IS NOT NULL
    UNION
    -- People who received food
    SELECT DISTINCT family_head_id FROM food_recipients WHERE family_head_id IS NOT NULL
    UNION
    -- People who received emergency relief
    SELECT DISTINCT family_head_id FROM emergency_relief_recipients WHERE family_head_id IS NOT NULL
);

-- Create index for filtering performance
CREATE INDEX IF NOT EXISTS idx_people_registered_member ON people(is_registered_member);

-- Update the student_details view to include registration status
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
    
    -- Parent information with fallback
    COALESCE(
        (SELECT ph.phone_number 
         FROM relationships r 
         JOIN people ph ON r.person_id = ph.id 
         WHERE r.related_person_id = ee.child_id AND r.relationship_type IN ('Parent', 'Guardian', 'Mother', 'Father')
         LIMIT 1),
        p.phone_number
    ) as parent_phone,
    
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

-- Add comment explaining the column
COMMENT ON COLUMN people.is_registered_member IS 
'Indicates if the person is a registered HOHA member (enrolled in any HOHA program).';
