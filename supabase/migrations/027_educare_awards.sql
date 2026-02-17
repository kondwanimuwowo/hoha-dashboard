-- Migration: Educare Awards Tracking
-- Description: Create tables for tracking school items/awards distribution based on attendance

-- Award distribution events (term or year-end)
CREATE TABLE IF NOT EXISTS school_awards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    award_date DATE NOT NULL,
    term TEXT NOT NULL CHECK (term IN ('Term 1', 'Term 2', 'Term 3', 'Year-End')),
    academic_year INTEGER NOT NULL,
    notes TEXT,
    total_recipients INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Students who received awards
CREATE TABLE IF NOT EXISTS award_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    award_id UUID NOT NULL REFERENCES school_awards(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES educare_enrollment(id) ON DELETE CASCADE,
    attendance_percentage DECIMAL(5, 2) NOT NULL CHECK (attendance_percentage >= 0 AND attendance_percentage <= 100),
    grade_level TEXT NOT NULL,
    notes TEXT, -- Individual notes for this student's award
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure a student can only receive one award per distribution event
    UNIQUE(award_id, student_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_school_awards_date ON school_awards(award_date DESC);
CREATE INDEX IF NOT EXISTS idx_school_awards_term ON school_awards(term, academic_year);
CREATE INDEX IF NOT EXISTS idx_award_recipients_award ON award_recipients(award_id);
CREATE INDEX IF NOT EXISTS idx_award_recipients_student ON award_recipients(student_id);
CREATE INDEX IF NOT EXISTS idx_award_recipients_attendance ON award_recipients(attendance_percentage DESC);

-- Function to update total_recipients
CREATE OR REPLACE FUNCTION update_award_recipients_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE school_awards
    SET total_recipients = (
        SELECT COUNT(*)
        FROM award_recipients
        WHERE award_id = COALESCE(NEW.award_id, OLD.award_id)
    ),
    updated_at = now()
    WHERE id = COALESCE(NEW.award_id, OLD.award_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update recipient count
DROP TRIGGER IF EXISTS update_award_recipients_count_trigger ON award_recipients;
CREATE TRIGGER update_award_recipients_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON award_recipients
FOR EACH ROW
EXECUTE FUNCTION update_award_recipients_count();

-- View to get student rankings by attendance for award selection
DROP VIEW IF EXISTS student_award_rankings CASCADE;

CREATE VIEW student_award_rankings AS
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
    (SELECT COUNT(*) FROM award_recipients ar WHERE ar.student_id = sd.id) as total_awards_received,
    
    -- Most recent award
    (SELECT sa.award_date 
     FROM award_recipients ar 
     JOIN school_awards sa ON ar.award_id = sa.id 
     WHERE ar.student_id = sd.id 
     ORDER BY sa.award_date DESC 
     LIMIT 1
    ) as last_award_date,
    
    -- Rank within grade level
    RANK() OVER (PARTITION BY sd.grade_level ORDER BY sd.attendance_percentage DESC) as grade_rank,
    
    -- Overall rank
    RANK() OVER (ORDER BY sd.attendance_percentage DESC) as overall_rank
    
FROM student_details sd
WHERE sd.current_status = 'Active'
ORDER BY sd.attendance_percentage DESC;

-- RLS Policies
ALTER TABLE school_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE award_recipients ENABLE ROW LEVEL SECURITY;

-- Awards policies
DROP POLICY IF EXISTS "Allow authenticated users to read awards" ON school_awards;
CREATE POLICY "Allow authenticated users to read awards"
    ON school_awards FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to create awards" ON school_awards;
CREATE POLICY "Allow authenticated users to create awards"
    ON school_awards FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow users to update awards they created" ON school_awards;
CREATE POLICY "Allow users to update awards they created"
    ON school_awards FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Allow users to delete awards they created" ON school_awards;
CREATE POLICY "Allow users to delete awards they created"
    ON school_awards FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());

-- Recipients policies
DROP POLICY IF EXISTS "Allow authenticated users to read recipients" ON award_recipients;
CREATE POLICY "Allow authenticated users to read recipients"
    ON award_recipients FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage recipients" ON award_recipients;
CREATE POLICY "Allow authenticated users to manage recipients"
    ON award_recipients FOR ALL
    TO authenticated
    USING (true);

-- Grant permissions on the view
GRANT SELECT ON student_award_rankings TO authenticated;
