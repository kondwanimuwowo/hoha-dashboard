-- Migration: Grade Progression Logic
-- This adds the ability to promote all active students to the next grade

CREATE OR REPLACE FUNCTION promote_all_students()
RETURNS TABLE (students_promoted INTEGER, students_graduated INTEGER) AS $$
DECLARE
    promoted INTEGER;
    graduated INTEGER;
BEGIN
    -- 1. Progress grades
    -- We use a CASE statement to progress each level to the next
    UPDATE educare_enrollment
    SET grade_level = CASE
        WHEN grade_level = 'Early Childhood Program' THEN 'Preparatory Program'
        WHEN grade_level = 'Preparatory Program' THEN 'Grade 1'
        WHEN grade_level = 'Grade 1' THEN 'Grade 2'
        WHEN grade_level = 'Grade 2' THEN 'Grade 3'
        WHEN grade_level = 'Grade 3' THEN 'Grade 4'
        WHEN grade_level = 'Grade 4' THEN 'Grade 5'
        WHEN grade_level = 'Grade 5' THEN 'Grade 6'
        WHEN grade_level = 'Grade 6' THEN 'Grade 7'
        WHEN grade_level = 'Grade 7' THEN 'Grade 8'
        WHEN grade_level = 'Grade 8' THEN 'Grade 9'
        WHEN grade_level = 'Grade 9' THEN 'Grade 10'
        WHEN grade_level = 'Grade 10' THEN 'Grade 11'
        WHEN grade_level = 'Grade 11' THEN 'Grade 12'
        ELSE grade_level
    END,
    updated_at = NOW()
    WHERE status = 'Active'
    AND grade_level NOT IN ('Grade 12', 'Youth Class')
    AND deleted_at IS NULL;
    
    GET DIAGNOSTICS promoted = ROW_COUNT;

    -- 2. Mark Grade 12 as Graduated
    UPDATE educare_enrollment
    SET status = 'Graduated',
        completion_date = CURRENT_DATE,
        updated_at = NOW()
    WHERE status = 'Active'
    AND grade_level = 'Grade 12'
    AND deleted_at IS NULL;
    
    GET DIAGNOSTICS graduated = ROW_COUNT;

    RETURN QUERY SELECT promoted, graduated;
END;
$$ LANGUAGE plpgsql;
