-- Migration 039: Add health fields to educare_enrollment + fix reversed relationships from WomenForm

-- ============================================================
-- 1. Fix reversed relationships created by WomenForm
-- Convention: person_id = parent/guardian, related_person_id = child
-- WomenForm was inserting person_id = child, related_person_id = woman (reversed)
-- ============================================================

-- First, delete reversed rows that already have a correct counterpart
DELETE FROM relationships
WHERE id IN (
    SELECT r.id
    FROM relationships r
    JOIN educare_enrollment ee ON ee.child_id = r.person_id
    JOIN legacy_women_enrollment lwe ON lwe.woman_id = r.related_person_id
    WHERE r.relationship_type IN ('Mother', 'Parent', 'Guardian')
    AND EXISTS (
        SELECT 1 FROM relationships r2
        WHERE r2.person_id = r.related_person_id
        AND r2.related_person_id = r.person_id
    )
);

-- Now swap the remaining reversed ones
UPDATE relationships r
SET person_id = sub.woman_id, related_person_id = sub.child_id
FROM (
    SELECT r2.id, r2.person_id AS child_id, r2.related_person_id AS woman_id
    FROM relationships r2
    JOIN educare_enrollment ee ON ee.child_id = r2.person_id
    JOIN legacy_women_enrollment lwe ON lwe.woman_id = r2.related_person_id
    WHERE r2.relationship_type IN ('Mother', 'Parent', 'Guardian')
) sub
WHERE r.id = sub.id;

-- ============================================================
-- 2. Add health fields to educare_enrollment
-- ============================================================

ALTER TABLE educare_enrollment
    ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS height_cm NUMERIC(5,1),
    ADD COLUMN IF NOT EXISTS last_deworming_date DATE;

-- ============================================================
-- 3. Recreate student_details view (CASCADE drops dependent views)
-- ============================================================

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
    ee.weight_kg,
    ee.height_cm,
    ee.last_deworming_date,

    -- Parent name with fallback
    COALESCE(
        (SELECT CONCAT(ph.first_name, ' ', ph.last_name)
         FROM relationships r
         JOIN people ph ON r.person_id = ph.id
         WHERE r.related_person_id = ee.child_id
           AND r.is_primary = true
         LIMIT 1),
        (SELECT CONCAT(ph.first_name, ' ', ph.last_name)
         FROM relationships r
         JOIN people ph ON r.person_id = ph.id
         WHERE r.related_person_id = ee.child_id
         LIMIT 1)
    ) as parent_name,

    -- Parent phone with fallback
    COALESCE(
        (SELECT ph.phone_number
         FROM relationships r
         JOIN people ph ON r.person_id = ph.id
         WHERE r.related_person_id = ee.child_id
           AND r.is_primary = true
         LIMIT 1),
        (SELECT ph.phone_number
         FROM relationships r
         JOIN people ph ON r.person_id = ph.id
         WHERE r.related_person_id = ee.child_id
         LIMIT 1),
        p.phone_number
    ) as parent_phone,

    -- Parent ID for quick edit
    COALESCE(
        (SELECT ph.id
         FROM relationships r
         JOIN people ph ON r.person_id = ph.id
         WHERE r.related_person_id = ee.child_id
           AND r.is_primary = true
         LIMIT 1),
        (SELECT ph.id
         FROM relationships r
         JOIN people ph ON r.person_id = ph.id
         WHERE r.related_person_id = ee.child_id
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

-- ============================================================
-- 4. Recreate student_award_rankings view (depends on student_details)
-- ============================================================

CREATE VIEW public.student_award_rankings AS
SELECT
    sd.id as student_id,
    sd.person_id,
    sd.first_name,
    sd.last_name,
    sd.grade_level,
    sd.current_status,
    sd.is_registered_member,
    sd.attendance_percentage,
    sd.total_present,
    sd.total_sessions,

    -- Count of awards received
    (SELECT COUNT(*) FROM award_recipients ar WHERE ar.person_id = sd.person_id) as total_awards_received,

    -- Most recent award
    (SELECT sa.award_date
     FROM award_recipients ar
     JOIN school_awards sa ON ar.award_id = sa.id
     WHERE ar.person_id = sd.person_id
     ORDER BY sa.award_date DESC
     LIMIT 1
    ) as last_award_date,

    -- Report cards submitted
    (SELECT COUNT(*) FROM student_documents sdc
     WHERE sdc.student_id = sd.person_id AND sdc.document_type = 'Report Card'
    ) as report_cards_count,

    -- Rank within grade level
    RANK() OVER (PARTITION BY sd.grade_level ORDER BY sd.attendance_percentage DESC) as grade_rank,

    -- Overall rank
    RANK() OVER (ORDER BY sd.attendance_percentage DESC) as overall_rank

FROM student_details sd
WHERE sd.current_status = 'Active'
ORDER BY sd.attendance_percentage DESC;

GRANT SELECT ON public.student_award_rankings TO authenticated;

NOTIFY pgrst, 'reload config';
