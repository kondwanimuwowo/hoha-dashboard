-- Migration: Atomic student creation + attendance uniqueness

-- =====================================================
-- UNIQUE CONSTRAINTS
-- =====================================================

-- One active enrollment per child (soft-deletes allowed)
CREATE UNIQUE INDEX IF NOT EXISTS educare_enrollment_one_active_per_child
ON public.educare_enrollment (child_id)
WHERE deleted_at IS NULL;

-- Prevent duplicate legacy attendance records
CREATE UNIQUE INDEX IF NOT EXISTS legacy_program_attendance_unique
ON public.legacy_program_attendance (woman_id, session_date, session_type);

-- Prevent duplicate tuition attendance records
CREATE UNIQUE INDEX IF NOT EXISTS tuition_attendance_unique_null_schedule
ON public.tuition_attendance (child_id, attendance_date)
WHERE schedule_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS tuition_attendance_unique_with_schedule
ON public.tuition_attendance (child_id, attendance_date, schedule_id)
WHERE schedule_id IS NOT NULL;

-- =====================================================
-- ATOMIC STUDENT CREATION
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_student_with_enrollment(
    p_first_name text,
    p_last_name text,
    p_date_of_birth date,
    p_gender text,
    p_phone_number text,
    p_address text,
    p_compound_area text,
    p_emergency_contact_name text,
    p_emergency_contact_phone text,
    p_emergency_contact_relationship text,
    p_notes text,
    p_grade_level text,
    p_government_school_id uuid,
    p_enrollment_date date,
    p_parent_id uuid,
    p_relationship_type text,
    p_is_emergency_contact boolean
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    new_person_id uuid;
BEGIN
    INSERT INTO public.people (
        first_name,
        last_name,
        date_of_birth,
        gender,
        phone_number,
        address,
        compound_area,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relationship,
        notes,
        is_active
    )
    VALUES (
        p_first_name,
        p_last_name,
        p_date_of_birth,
        p_gender,
        p_phone_number,
        p_address,
        p_compound_area,
        p_emergency_contact_name,
        p_emergency_contact_phone,
        p_emergency_contact_relationship,
        p_notes,
        true
    )
    RETURNING id INTO new_person_id;

    INSERT INTO public.educare_enrollment (
        child_id,
        grade_level,
        government_school_id,
        enrollment_date
    )
    VALUES (
        new_person_id,
        p_grade_level,
        p_government_school_id,
        p_enrollment_date
    );

    IF p_parent_id IS NOT NULL THEN
        INSERT INTO public.relationships (
            person_id,
            related_person_id,
            relationship_type,
            is_primary,
            is_emergency_contact
        )
        VALUES (
            p_parent_id,
            new_person_id,
            COALESCE(p_relationship_type, 'Parent'),
            true,
            COALESCE(p_is_emergency_contact, false)
        );
    END IF;

    RETURN new_person_id;
END;
$$;

-- =====================================================
-- ATOMIC TUITION ATTENDANCE UPSERT
-- =====================================================

CREATE OR REPLACE FUNCTION public.upsert_tuition_attendance(
    p_child_id uuid,
    p_attendance_date date,
    p_status text,
    p_notes text,
    p_schedule_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_id uuid;
BEGIN
    IF p_schedule_id IS NULL THEN
        INSERT INTO public.tuition_attendance (
            child_id,
            attendance_date,
            status,
            notes,
            schedule_id
        )
        VALUES (
            p_child_id,
            p_attendance_date,
            p_status,
            p_notes,
            NULL
        )
        ON CONFLICT (child_id, attendance_date) WHERE schedule_id IS NULL
        DO UPDATE SET
            status = EXCLUDED.status,
            notes = EXCLUDED.notes,
            schedule_id = NULL,
            updated_at = now()
        RETURNING id INTO v_id;
    ELSE
        INSERT INTO public.tuition_attendance (
            child_id,
            attendance_date,
            status,
            notes,
            schedule_id
        )
        VALUES (
            p_child_id,
            p_attendance_date,
            p_status,
            p_notes,
            p_schedule_id
        )
        ON CONFLICT (child_id, attendance_date, schedule_id)
        DO UPDATE SET
            status = EXCLUDED.status,
            notes = EXCLUDED.notes,
            updated_at = now()
        RETURNING id INTO v_id;
    END IF;

    RETURN v_id;
END;
$$;
