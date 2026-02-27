-- Migration: Final Alignment & Standardization
-- Description: Standardize award_recipients FK and ensure food_recipients field consistency

-- 1. Standardize award_recipients to use person_id (people.id)
-- This aligns it with clinicare_visits and other person-centric tables.

DO $$ 
BEGIN
    -- Add person_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'award_recipients' AND column_name = 'person_id') THEN
        ALTER TABLE public.award_recipients ADD COLUMN person_id UUID REFERENCES public.people(id) ON DELETE CASCADE;
        
        -- Migrate data from student_id (which points to educare_enrollment.id)
        UPDATE public.award_recipients ar
        SET person_id = ee.child_id
        FROM public.educare_enrollment ee
        WHERE ar.student_id = ee.id;
        
        -- Set NOT NULL after migration
        ALTER TABLE public.award_recipients ALTER COLUMN person_id SET NOT NULL;
    END IF;
END $$;

-- 2. Update Constraints for award_recipients
DO $$ 
BEGIN
    -- Drop old unique constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'award_recipients_award_id_student_id_key') THEN
        ALTER TABLE public.award_recipients DROP CONSTRAINT award_recipients_award_id_student_id_key;
    END IF;

    -- Add new person-based unique constraint if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'award_recipients_award_id_person_id_key') THEN
        ALTER TABLE public.award_recipients ADD CONSTRAINT award_recipients_award_id_person_id_key UNIQUE (award_id, person_id);
    END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_award_recipients_person ON award_recipients(person_id);

-- 3. Update student_award_rankings View to reflect change
-- Must DROP first because CREATE OR REPLACE VIEW cannot rename existing columns
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
    
    -- Count of awards received (updated to use person_id)
    (SELECT COUNT(*) FROM award_recipients ar WHERE ar.person_id = sd.person_id) as total_awards_received,
    
    -- Most recent award (updated to use person_id)
    (SELECT sa.award_date 
     FROM award_recipients ar 
     JOIN school_awards sa ON ar.award_id = sa.id 
     WHERE ar.person_id = sd.person_id 
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

-- 4. Food Recipients Alignment
-- Ensure is_collected column is consistent with hook logic
ALTER TABLE public.food_recipients ADD COLUMN IF NOT EXISTS collection_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.food_recipients ADD COLUMN IF NOT EXISTS is_collected BOOLEAN DEFAULT false;

-- 5. ClinicaCare Alignment
-- Ensure all comment fields are available for the new UI
ALTER TABLE public.clinicare_visits ADD COLUMN IF NOT EXISTS emergency_comment TEXT;
ALTER TABLE public.clinicare_visits ADD COLUMN IF NOT EXISTS transport_comment TEXT;
ALTER TABLE public.clinicare_visits ADD COLUMN IF NOT EXISTS followup_comment TEXT;

-- Reload schema cache
NOTIFY pgrst, 'reload config';
