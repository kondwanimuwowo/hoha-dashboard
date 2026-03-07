-- Migration 038: Award Resources
-- Adds configurable resource types and per-event resource tracking for award distributions

-- Configurable resource types (editable dropdown)
CREATE TABLE IF NOT EXISTS award_resource_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default resource types
INSERT INTO award_resource_types (name, sort_order) VALUES
    ('Books', 1),
    ('Pencils', 2),
    ('Shoes', 3)
ON CONFLICT (name) DO NOTHING;

-- Resources distributed per award event (same for all recipients in the event)
CREATE TABLE IF NOT EXISTS award_event_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    award_id UUID NOT NULL REFERENCES school_awards(id) ON DELETE CASCADE,
    resource_type_id UUID NOT NULL REFERENCES award_resource_types(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(award_id, resource_type_id)
);

-- Flag per-recipient whether they received resources
ALTER TABLE award_recipients
    ADD COLUMN IF NOT EXISTS received_resources BOOLEAN NOT NULL DEFAULT TRUE;

-- RLS
ALTER TABLE award_resource_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE award_event_resources ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'award_resource_types' AND policyname = 'auth_all'
    ) THEN
        CREATE POLICY "auth_all" ON award_resource_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'award_event_resources' AND policyname = 'auth_all'
    ) THEN
        CREATE POLICY "auth_all" ON award_event_resources FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Update student_award_rankings view to include report_cards_count
DROP VIEW IF EXISTS public.student_award_rankings;
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
