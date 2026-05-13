-- =============================================================================
-- HOHA Dashboard — Consolidated Schema
-- Generated from migrations 001–040. Use this for new environment setup only.
-- Production DB already has all migrations applied; continue using numbered
-- migration files (041_... onwards) for future changes.
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(20),
  phone_number VARCHAR(20),
  alternate_phone VARCHAR(20),
  address TEXT,
  compound_area VARCHAR(100),
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relationship VARCHAR(50),
  photo_url TEXT,
  notes TEXT,
  registration_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  nrc_number VARCHAR(20) CONSTRAINT check_nrc_format CHECK (nrc_number IS NULL OR nrc_number ~ '^\d{6}/\d{2}/\d$'),
  deleted_at TIMESTAMP WITH TIME ZONE,
  is_registered_member BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON COLUMN public.people.is_registered_member IS
  'Indicates if the person is a registered HOHA member (enrolled in any HOHA program).';

CREATE TABLE IF NOT EXISTS public.relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID,         -- guardian / parent
  related_person_id UUID, -- child / student
  relationship_type VARCHAR(50) NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  is_emergency_contact BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT different_people CHECK (person_id != related_person_id),
  CONSTRAINT relationships_person_id_fkey
    FOREIGN KEY (person_id) REFERENCES public.people(id) ON DELETE CASCADE,
  CONSTRAINT relationships_related_person_id_fkey
    FOREIGN KEY (related_person_id) REFERENCES public.people(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.government_schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_name VARCHAR(200) NOT NULL,
  location VARCHAR(200),
  contact_person VARCHAR(200),
  contact_phone VARCHAR(20),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.educare_enrollment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grade_level VARCHAR(50) NOT NULL,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  current_status VARCHAR(50) DEFAULT 'Active',
  notes TEXT,
  weight_kg NUMERIC(5,2),
  height_cm NUMERIC(5,1),
  last_deworming_date DATE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  child_id UUID,
  government_school_id UUID,
  CONSTRAINT educare_enrollment_child_id_fkey
    FOREIGN KEY (child_id) REFERENCES public.people(id) ON DELETE CASCADE,
  CONSTRAINT educare_enrollment_government_school_id_fkey
    FOREIGN KEY (government_school_id) REFERENCES public.government_schools(id)
);

CREATE TABLE IF NOT EXISTS public.tuition_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grade_level VARCHAR(50) NOT NULL,
  day_of_week VARCHAR(20) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject VARCHAR(100),
  instructor_name VARCHAR(200),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tuition_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  notes TEXT,
  recorded_by VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  child_id UUID REFERENCES public.people(id),
  schedule_id UUID REFERENCES public.tuition_schedule(id)
);

CREATE TABLE IF NOT EXISTS public.legacy_women_enrollment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_date DATE DEFAULT CURRENT_DATE,
  stage VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'Active',
  completion_date DATE,
  skills_learned TEXT,
  notes TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  woman_id UUID REFERENCES public.people(id),
  mentor_id UUID REFERENCES public.people(id)
);

CREATE TABLE IF NOT EXISTS public.legacy_program_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_date DATE NOT NULL,
  session_type VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL,
  notes TEXT,
  recorded_by VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  woman_id UUID REFERENCES public.people(id)
);

CREATE TABLE IF NOT EXISTS public.medical_facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_name VARCHAR(200) NOT NULL UNIQUE,
  location VARCHAR(200),
  contact_person VARCHAR(200),
  contact_phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.health_facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_name VARCHAR(200) NOT NULL,
  facility_type VARCHAR(100),
  location VARCHAR(200),
  contact_phone VARCHAR(20),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.clinicare_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_date DATE NOT NULL,
  facility_name VARCHAR(200),
  reason_for_visit TEXT,
  diagnosis TEXT,
  treatment_provided TEXT,
  prescription_url TEXT,
  cost_amount NUMERIC,
  currency VARCHAR DEFAULT 'ZMW',
  medical_fees NUMERIC,
  transport_costs NUMERIC,
  other_fees NUMERIC DEFAULT 0,
  is_emergency BOOLEAN DEFAULT false,
  emergency_comment TEXT,
  transport_provided BOOLEAN DEFAULT false,
  transport_cost NUMERIC,
  transport_comment TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  followup_comment TEXT,
  in_hoha_program BOOLEAN DEFAULT true,
  notes TEXT,
  recorded_by VARCHAR(200),
  last_edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  patient_id UUID REFERENCES public.people(id),
  facility_id UUID REFERENCES public.medical_facilities(id),
  parent_visit_id UUID REFERENCES public.clinicare_visits(id),
  last_edited_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.food_distribution (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  distribution_date DATE NOT NULL,
  quarter VARCHAR(10) NOT NULL,
  year INTEGER NOT NULL,
  distribution_location VARCHAR(200),
  total_hampers_distributed INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.food_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_size INTEGER,
  hamper_contents TEXT,
  special_needs TEXT,
  collected_by VARCHAR(200),
  collection_time TIMESTAMP,
  notes TEXT,
  family_type VARCHAR(50),
  family_member_ids UUID[],
  family_member_names TEXT[],
  collected BOOLEAN DEFAULT false,
  is_collected BOOLEAN DEFAULT false,
  collected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  distribution_id UUID REFERENCES public.food_distribution(id),
  family_head_id UUID REFERENCES public.people(id),
  family_group_id UUID,
  primary_person_id UUID REFERENCES public.people(id)
);

CREATE TABLE IF NOT EXISTS public.emergency_relief_distributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  distribution_date DATE NOT NULL,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.emergency_relief_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  items_provided TEXT,
  collected BOOLEAN DEFAULT false,
  collection_time TIMESTAMP WITH TIME ZONE,
  collected_by VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  distribution_id UUID REFERENCES public.emergency_relief_distributions(id),
  family_head_id UUID REFERENCES public.people(id)
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(200),
  email VARCHAR(200),
  role VARCHAR(50) DEFAULT 'Data Entry',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  compact_mode BOOLEAN NOT NULL DEFAULT false,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  system_updates BOOLEAN NOT NULL DEFAULT false,
  theme_preference TEXT NOT NULL DEFAULT 'system'
    CHECK (theme_preference IN ('system', 'light', 'dark')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.case_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_type VARCHAR(50) DEFAULT 'General',
  note_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  person_id UUID REFERENCES public.people(id),
  created_by UUID REFERENCES public.user_profiles(id)
);

CREATE TABLE IF NOT EXISTS public.student_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_type VARCHAR(50) DEFAULT 'Other',
  document_name VARCHAR(200) NOT NULL,
  document_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  student_id UUID REFERENCES public.people(id),
  uploaded_by UUID REFERENCES public.user_profiles(id)
);

CREATE TABLE IF NOT EXISTS public.parent_emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relationship VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  parent_id UUID UNIQUE REFERENCES public.people(id)
);

CREATE TABLE IF NOT EXISTS public.outreach_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_outreach (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outreach_date DATE NOT NULL,
  location_name TEXT,
  notes TEXT,
  total_expenses DECIMAL(10,2) DEFAULT 0,
  total_participants INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  location_id UUID REFERENCES public.outreach_locations(id),
  created_by UUID REFERENCES public.user_profiles(id)
);

CREATE TABLE IF NOT EXISTS public.outreach_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_hoc_name TEXT,
  is_registered_member BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  outreach_id UUID NOT NULL REFERENCES public.community_outreach(id) ON DELETE CASCADE,
  person_id UUID REFERENCES public.people(id),
  CONSTRAINT participant_identity_check CHECK (
    (person_id IS NOT NULL AND ad_hoc_name IS NULL) OR
    (person_id IS NULL AND ad_hoc_name IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.outreach_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_type TEXT NOT NULL CHECK (expense_type IN ('Medical Bills', 'Rent', 'School Fees', 'Food', 'Other')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  outreach_id UUID NOT NULL REFERENCES public.community_outreach(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES public.outreach_participants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.school_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  award_date DATE NOT NULL,
  term TEXT NOT NULL CHECK (term IN ('Term 1', 'Term 2', 'Term 3', 'Year-End')),
  academic_year INTEGER NOT NULL,
  notes TEXT,
  total_recipients INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.award_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_percentage DECIMAL(5,2) NOT NULL CHECK (attendance_percentage >= 0 AND attendance_percentage <= 100),
  grade_level TEXT NOT NULL,
  notes TEXT,
  received_resources BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  award_id UUID NOT NULL REFERENCES public.school_awards(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.educare_enrollment(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.people(id),
  UNIQUE(award_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.award_resource_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.award_event_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  award_id UUID NOT NULL REFERENCES public.school_awards(id) ON DELETE CASCADE,
  resource_type_id UUID NOT NULL REFERENCES public.award_resource_types(id),
  UNIQUE(award_id, resource_type_id)
);

CREATE TABLE IF NOT EXISTS public.notification_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_key TEXT NOT NULL,
  read_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT notification_reads_unique UNIQUE (user_id, notification_key)
);

CREATE TABLE IF NOT EXISTS public.deworming_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date DATE NOT NULL,
  medication_name TEXT NOT NULL,
  dosage_amount NUMERIC(8,2) NOT NULL,
  dosage_unit TEXT NOT NULL DEFAULT 'mg',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.deworming_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weight_kg NUMERIC(5,2),
  height_cm NUMERIC(5,1),
  administered BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_id UUID NOT NULL REFERENCES public.deworming_events(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.people(id),
  UNIQUE(event_id, child_id)
);

CREATE TABLE IF NOT EXISTS public.family_members (
  family_group_id UUID NOT NULL,
  person_id UUID NOT NULL REFERENCES public.people(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (family_group_id, person_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_people_name ON public.people(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_people_phone ON public.people(phone_number);
CREATE INDEX IF NOT EXISTS idx_people_active ON public.people(is_active);
CREATE INDEX IF NOT EXISTS idx_people_deleted ON public.people(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_people_nrc ON public.people(nrc_number) WHERE nrc_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_people_registered_member ON public.people(is_registered_member);

CREATE INDEX IF NOT EXISTS idx_relationships_person ON public.relationships(person_id);
CREATE INDEX IF NOT EXISTS idx_relationships_related ON public.relationships(related_person_id);

CREATE INDEX IF NOT EXISTS idx_educare_child ON public.educare_enrollment(child_id);
CREATE INDEX IF NOT EXISTS idx_educare_status ON public.educare_enrollment(current_status);
CREATE INDEX IF NOT EXISTS idx_educare_grade ON public.educare_enrollment(grade_level);
CREATE INDEX IF NOT EXISTS idx_educare_deleted ON public.educare_enrollment(deleted_at) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS educare_enrollment_one_active_per_child
  ON public.educare_enrollment (child_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_child ON public.tuition_attendance(child_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.tuition_attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.tuition_attendance(status);
CREATE UNIQUE INDEX IF NOT EXISTS tuition_attendance_unique_null_schedule
  ON public.tuition_attendance (child_id, attendance_date) WHERE schedule_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS tuition_attendance_unique_with_schedule
  ON public.tuition_attendance (child_id, attendance_date, schedule_id) WHERE schedule_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_legacy_woman ON public.legacy_women_enrollment(woman_id);
CREATE INDEX IF NOT EXISTS idx_legacy_status ON public.legacy_women_enrollment(status);
CREATE INDEX IF NOT EXISTS idx_legacy_deleted ON public.legacy_women_enrollment(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_legacy_attendance_woman ON public.legacy_program_attendance(woman_id);
CREATE INDEX IF NOT EXISTS idx_legacy_attendance_date ON public.legacy_program_attendance(session_date);
CREATE UNIQUE INDEX IF NOT EXISTS legacy_program_attendance_unique
  ON public.legacy_program_attendance (woman_id, session_date, session_type);

CREATE INDEX IF NOT EXISTS idx_facilities_name ON public.medical_facilities(facility_name);
CREATE INDEX IF NOT EXISTS idx_facilities_active ON public.medical_facilities(is_active);

CREATE INDEX IF NOT EXISTS idx_visits_patient ON public.clinicare_visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON public.clinicare_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_followup ON public.clinicare_visits(follow_up_date) WHERE follow_up_required = true;
CREATE INDEX IF NOT EXISTS idx_visits_parent_visit ON public.clinicare_visits(parent_visit_id);
CREATE INDEX IF NOT EXISTS idx_visits_facility ON public.clinicare_visits(facility_id);

CREATE INDEX IF NOT EXISTS idx_distribution_date ON public.food_distribution(distribution_date);
CREATE INDEX IF NOT EXISTS idx_distribution_quarter ON public.food_distribution(quarter, year);

CREATE INDEX IF NOT EXISTS idx_recipients_distribution ON public.food_recipients(distribution_id);
CREATE INDEX IF NOT EXISTS idx_recipients_family ON public.food_recipients(family_head_id);
CREATE INDEX IF NOT EXISTS idx_food_recipients_collected ON public.food_recipients(is_collected);
CREATE INDEX IF NOT EXISTS idx_food_recipients_family_type ON public.food_recipients(family_type);
CREATE INDEX IF NOT EXISTS idx_food_recipients_family_group ON public.food_recipients(family_group_id);

CREATE INDEX IF NOT EXISTS idx_emergency_distributions_date ON public.emergency_relief_distributions(distribution_date);
CREATE INDEX IF NOT EXISTS idx_emergency_recipients_distribution ON public.emergency_relief_recipients(distribution_id);
CREATE INDEX IF NOT EXISTS idx_emergency_recipients_family ON public.emergency_relief_recipients(family_head_id);
CREATE INDEX IF NOT EXISTS idx_emergency_recipients_collected ON public.emergency_relief_recipients(collected);

CREATE INDEX IF NOT EXISTS idx_case_notes_person ON public.case_notes(person_id);
CREATE INDEX IF NOT EXISTS idx_case_notes_created ON public.case_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_notes_type ON public.case_notes(note_type);

CREATE INDEX IF NOT EXISTS idx_student_documents_student ON public.student_documents(student_id);
CREATE INDEX IF NOT EXISTS idx_student_documents_type ON public.student_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_student_documents_upload_date ON public.student_documents(upload_date DESC);

CREATE INDEX IF NOT EXISTS idx_parent_emergency_contacts_parent ON public.parent_emergency_contacts(parent_id);

CREATE INDEX IF NOT EXISTS idx_outreach_date ON public.community_outreach(outreach_date DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_location ON public.community_outreach(location_id);
CREATE INDEX IF NOT EXISTS idx_outreach_participants_outreach ON public.outreach_participants(outreach_id);
CREATE INDEX IF NOT EXISTS idx_outreach_participants_person ON public.outreach_participants(person_id);
CREATE INDEX IF NOT EXISTS idx_outreach_participants_registered ON public.outreach_participants(is_registered_member);
CREATE INDEX IF NOT EXISTS idx_outreach_expenses_outreach ON public.outreach_expenses(outreach_id);
CREATE INDEX IF NOT EXISTS idx_outreach_expenses_participant ON public.outreach_expenses(participant_id);

CREATE INDEX IF NOT EXISTS idx_school_awards_date ON public.school_awards(award_date DESC);
CREATE INDEX IF NOT EXISTS idx_school_awards_term ON public.school_awards(term, academic_year);
CREATE INDEX IF NOT EXISTS idx_award_recipients_award ON public.award_recipients(award_id);
CREATE INDEX IF NOT EXISTS idx_award_recipients_student ON public.award_recipients(student_id);
CREATE INDEX IF NOT EXISTS idx_award_recipients_attendance ON public.award_recipients(attendance_percentage DESC);

CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON public.notification_reads(user_id);

CREATE INDEX IF NOT EXISTS idx_deworming_records_event_id ON public.deworming_records(event_id);
CREATE INDEX IF NOT EXISTS idx_deworming_records_child_id ON public.deworming_records(child_id);
CREATE INDEX IF NOT EXISTS idx_deworming_events_event_date ON public.deworming_events(event_date);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, 'Data Entry');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_role_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'Admin'
    ) THEN
      RAISE EXCEPTION 'Only Administrators can change user roles.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.set_user_preferences_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_visit_total_cost()
RETURNS TRIGGER AS $$
BEGIN
  NEW.cost_amount := COALESCE(NEW.medical_fees, 0) +
                     COALESCE(NEW.transport_costs, 0) +
                     COALESCE(NEW.other_fees, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_outreach_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.community_outreach
  SET
    total_expenses = (
      SELECT COALESCE(SUM(amount), 0) FROM public.outreach_expenses
      WHERE outreach_id = COALESCE(NEW.outreach_id, OLD.outreach_id)
    ),
    total_participants = (
      SELECT COUNT(*) FROM public.outreach_participants
      WHERE outreach_id = COALESCE(NEW.outreach_id, OLD.outreach_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.outreach_id, OLD.outreach_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_award_recipients_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.school_awards
  SET
    total_recipients = (
      SELECT COUNT(*) FROM public.award_recipients
      WHERE award_id = COALESCE(NEW.award_id, OLD.award_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.award_id, OLD.award_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.auto_populate_food_recipients()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.food_recipients (
    distribution_id, family_head_id, family_size, family_type,
    primary_person_id, family_member_ids, is_collected
  )
  SELECT
    NEW.id, recipient_id, family_size, family_type,
    primary_person_id, family_member_ids, false
  FROM public.family_groups;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.mark_family_collected(recipient_record_id UUID, collector_name VARCHAR)
RETURNS VOID AS $$
BEGIN
  UPDATE public.food_recipients
  SET
    is_collected = true,
    collected_by = collector_name,
    collected_at = NOW(),
    collection_time = NOW()
  WHERE id = recipient_record_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.create_student_with_enrollment(
  p_first_name TEXT, p_last_name TEXT, p_date_of_birth DATE, p_gender TEXT,
  p_phone_number TEXT, p_address TEXT, p_compound_area TEXT,
  p_emergency_contact_name TEXT, p_emergency_contact_phone TEXT,
  p_emergency_contact_relationship TEXT, p_notes TEXT, p_grade_level TEXT,
  p_government_school_id UUID, p_enrollment_date DATE, p_parent_id UUID,
  p_relationship_type TEXT, p_is_emergency_contact BOOLEAN
)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  new_person_id UUID;
BEGIN
  INSERT INTO public.people (
    first_name, last_name, date_of_birth, gender, phone_number, address,
    compound_area, emergency_contact_name, emergency_contact_phone,
    emergency_contact_relationship, notes, is_active
  ) VALUES (
    p_first_name, p_last_name, p_date_of_birth, p_gender, p_phone_number,
    p_address, p_compound_area, p_emergency_contact_name,
    p_emergency_contact_phone, p_emergency_contact_relationship, p_notes, true
  ) RETURNING id INTO new_person_id;

  INSERT INTO public.educare_enrollment (child_id, grade_level, government_school_id, enrollment_date)
  VALUES (new_person_id, p_grade_level, p_government_school_id, p_enrollment_date);

  IF p_parent_id IS NOT NULL THEN
    INSERT INTO public.relationships (
      person_id, related_person_id, relationship_type, is_primary, is_emergency_contact
    ) VALUES (
      p_parent_id, new_person_id,
      COALESCE(p_relationship_type, 'Parent'),
      true,
      COALESCE(p_is_emergency_contact, false)
    );
  END IF;

  RETURN new_person_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_tuition_attendance(
  p_child_id UUID, p_attendance_date DATE, p_status TEXT,
  p_notes TEXT, p_schedule_id UUID
)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_schedule_id IS NULL THEN
    INSERT INTO public.tuition_attendance (child_id, attendance_date, status, notes, schedule_id)
    VALUES (p_child_id, p_attendance_date, p_status, p_notes, NULL)
    ON CONFLICT (child_id, attendance_date) WHERE schedule_id IS NULL
    DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes, schedule_id = NULL, updated_at = now()
    RETURNING id INTO v_id;
  ELSE
    INSERT INTO public.tuition_attendance (child_id, attendance_date, status, notes, schedule_id)
    VALUES (p_child_id, p_attendance_date, p_status, p_notes, p_schedule_id)
    ON CONFLICT (child_id, attendance_date, schedule_id)
    DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes, updated_at = now()
    RETURNING id INTO v_id;
  END IF;
  RETURN v_id;
END;
$$;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

DROP TRIGGER IF EXISTS update_people_updated_at ON public.people;
CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON public.people
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_relationships_updated_at ON public.relationships;
CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON public.relationships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_government_schools_updated_at ON public.government_schools;
CREATE TRIGGER update_government_schools_updated_at BEFORE UPDATE ON public.government_schools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_educare_enrollment_updated_at ON public.educare_enrollment;
CREATE TRIGGER update_educare_enrollment_updated_at BEFORE UPDATE ON public.educare_enrollment
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tuition_schedule_updated_at ON public.tuition_schedule;
CREATE TRIGGER update_tuition_schedule_updated_at BEFORE UPDATE ON public.tuition_schedule
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tuition_attendance_updated_at ON public.tuition_attendance;
CREATE TRIGGER update_tuition_attendance_updated_at BEFORE UPDATE ON public.tuition_attendance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_legacy_women_enrollment_updated_at ON public.legacy_women_enrollment;
CREATE TRIGGER update_legacy_women_enrollment_updated_at BEFORE UPDATE ON public.legacy_women_enrollment
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_legacy_program_attendance_updated_at ON public.legacy_program_attendance;
CREATE TRIGGER update_legacy_program_attendance_updated_at BEFORE UPDATE ON public.legacy_program_attendance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_medical_facilities_updated_at ON public.medical_facilities;
CREATE TRIGGER update_medical_facilities_updated_at BEFORE UPDATE ON public.medical_facilities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_clinicare_visits_updated_at ON public.clinicare_visits;
CREATE TRIGGER update_clinicare_visits_updated_at BEFORE UPDATE ON public.clinicare_visits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_calculate_visit_cost ON public.clinicare_visits;
CREATE TRIGGER trigger_calculate_visit_cost
  BEFORE INSERT OR UPDATE OF medical_fees, transport_costs, other_fees ON public.clinicare_visits
  FOR EACH ROW EXECUTE FUNCTION public.calculate_visit_total_cost();

DROP TRIGGER IF EXISTS update_food_distribution_updated_at ON public.food_distribution;
CREATE TRIGGER update_food_distribution_updated_at BEFORE UPDATE ON public.food_distribution
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_food_recipients_updated_at ON public.food_recipients;
CREATE TRIGGER update_food_recipients_updated_at BEFORE UPDATE ON public.food_recipients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS tr_auto_populate_food_recipients ON public.food_distribution;
CREATE TRIGGER tr_auto_populate_food_recipients
  AFTER INSERT ON public.food_distribution
  FOR EACH ROW EXECUTE FUNCTION public.auto_populate_food_recipients();

DROP TRIGGER IF EXISTS update_emergency_distributions_updated_at ON public.emergency_relief_distributions;
CREATE TRIGGER update_emergency_distributions_updated_at BEFORE UPDATE ON public.emergency_relief_distributions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_emergency_recipients_updated_at ON public.emergency_relief_recipients;
CREATE TRIGGER update_emergency_recipients_updated_at BEFORE UPDATE ON public.emergency_relief_recipients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS check_role_update_trigger ON public.user_profiles;
CREATE TRIGGER check_role_update_trigger
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_role_update();

DROP TRIGGER IF EXISTS trg_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_user_preferences_updated_at();

DROP TRIGGER IF EXISTS update_case_notes_updated_at ON public.case_notes;
CREATE TRIGGER update_case_notes_updated_at BEFORE UPDATE ON public.case_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_documents_updated_at ON public.student_documents;
CREATE TRIGGER update_student_documents_updated_at BEFORE UPDATE ON public.student_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_parent_emergency_contacts_updated_at ON public.parent_emergency_contacts;
CREATE TRIGGER update_parent_emergency_contacts_updated_at BEFORE UPDATE ON public.parent_emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_outreach_totals_on_expense ON public.outreach_expenses;
CREATE TRIGGER update_outreach_totals_on_expense
  AFTER INSERT OR UPDATE OR DELETE ON public.outreach_expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_outreach_totals();

DROP TRIGGER IF EXISTS update_outreach_totals_on_participant ON public.outreach_participants;
CREATE TRIGGER update_outreach_totals_on_participant
  AFTER INSERT OR UPDATE OR DELETE ON public.outreach_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_outreach_totals();

DROP TRIGGER IF EXISTS update_award_recipients_count_trigger ON public.award_recipients;
CREATE TRIGGER update_award_recipients_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.award_recipients
  FOR EACH ROW EXECUTE FUNCTION public.update_award_recipients_count();

-- =============================================================================
-- VIEWS
-- =============================================================================

-- student_details: id = enrollment id, person_id = people.id
-- Always use person_id (not id) when referencing people FKs.
DROP VIEW IF EXISTS public.student_details CASCADE;
CREATE VIEW public.student_details AS
SELECT
  ee.id,
  ee.child_id AS person_id,
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
  gs.school_name AS government_school,
  ee.notes,
  ee.weight_kg,
  ee.height_cm,
  ee.last_deworming_date,
  COALESCE(
    (SELECT CONCAT(ph.first_name, ' ', ph.last_name)
     FROM public.relationships r JOIN public.people ph ON r.person_id = ph.id
     WHERE r.related_person_id = ee.child_id AND r.is_primary = true LIMIT 1),
    (SELECT CONCAT(ph.first_name, ' ', ph.last_name)
     FROM public.relationships r JOIN public.people ph ON r.person_id = ph.id
     WHERE r.related_person_id = ee.child_id LIMIT 1)
  ) AS parent_name,
  COALESCE(
    (SELECT ph.phone_number
     FROM public.relationships r JOIN public.people ph ON r.person_id = ph.id
     WHERE r.related_person_id = ee.child_id AND r.is_primary = true LIMIT 1),
    (SELECT ph.phone_number
     FROM public.relationships r JOIN public.people ph ON r.person_id = ph.id
     WHERE r.related_person_id = ee.child_id LIMIT 1),
    p.phone_number
  ) AS parent_phone,
  COALESCE(
    (SELECT ph.id
     FROM public.relationships r JOIN public.people ph ON r.person_id = ph.id
     WHERE r.related_person_id = ee.child_id AND r.is_primary = true LIMIT 1),
    (SELECT ph.id
     FROM public.relationships r JOIN public.people ph ON r.person_id = ph.id
     WHERE r.related_person_id = ee.child_id LIMIT 1)
  ) AS parent_id,
  (SELECT COUNT(*) FROM public.tuition_attendance ta
   WHERE ta.child_id = ee.child_id AND ta.status = 'Present') AS total_present,
  (SELECT COUNT(*) FROM public.tuition_attendance ta
   WHERE ta.child_id = ee.child_id AND ta.status = 'Absent') AS total_absent,
  (SELECT COUNT(*) FROM public.tuition_attendance ta
   WHERE ta.child_id = ee.child_id) AS total_sessions,
  CASE
    WHEN (SELECT COUNT(*) FROM public.tuition_attendance ta WHERE ta.child_id = ee.child_id) > 0
    THEN ROUND(
      (SELECT COUNT(*) FROM public.tuition_attendance ta WHERE ta.child_id = ee.child_id AND ta.status = 'Present')::NUMERIC /
      (SELECT COUNT(*) FROM public.tuition_attendance ta WHERE ta.child_id = ee.child_id)::NUMERIC * 100, 2)
    ELSE 0
  END AS attendance_percentage,
  ee.created_at,
  ee.updated_at
FROM public.educare_enrollment ee
JOIN public.people p ON ee.child_id = p.id
LEFT JOIN public.government_schools gs ON ee.government_school_id = gs.id
WHERE ee.deleted_at IS NULL;

DROP VIEW IF EXISTS public.student_award_rankings;
CREATE VIEW public.student_award_rankings AS
SELECT
  sd.id AS student_id,
  sd.person_id,
  sd.first_name,
  sd.last_name,
  sd.grade_level,
  sd.current_status,
  sd.is_registered_member,
  sd.attendance_percentage,
  sd.total_present,
  sd.total_sessions,
  (SELECT COUNT(*) FROM public.award_recipients ar WHERE ar.person_id = sd.person_id) AS total_awards_received,
  (SELECT sa.award_date FROM public.award_recipients ar
   JOIN public.school_awards sa ON ar.award_id = sa.id
   WHERE ar.person_id = sd.person_id ORDER BY sa.award_date DESC LIMIT 1) AS last_award_date,
  (SELECT COUNT(*) FROM public.student_documents sdc
   WHERE sdc.student_id = sd.person_id AND sdc.document_type = 'Report Card') AS report_cards_count,
  RANK() OVER (PARTITION BY sd.grade_level ORDER BY sd.attendance_percentage DESC) AS grade_rank,
  RANK() OVER (ORDER BY sd.attendance_percentage DESC) AS overall_rank
FROM public.student_details sd
WHERE sd.current_status = 'Active'
ORDER BY sd.attendance_percentage DESC;

CREATE OR REPLACE VIEW public.family_groups AS
WITH active_children AS (
  SELECT p.id AS child_id, p.first_name || ' ' || p.last_name AS child_name, p.compound_area AS child_compound
  FROM public.people p
  JOIN public.educare_enrollment ee ON ee.child_id = p.id
  WHERE ee.current_status = 'Active' AND ee.deleted_at IS NULL AND p.deleted_at IS NULL AND p.is_active = true
),
parent_links AS (
  SELECT ac.child_id, r.person_id AS parent_id, r.relationship_type, COALESCE(r.is_primary, false) AS is_primary, r.created_at
  FROM active_children ac JOIN public.relationships r ON r.related_person_id = ac.child_id
  WHERE r.relationship_type IN ('Mother', 'Father', 'Parent', 'Guardian')
  UNION ALL
  SELECT ac.child_id, r.related_person_id AS parent_id, r.relationship_type, COALESCE(r.is_primary, false) AS is_primary, r.created_at
  FROM active_children ac JOIN public.relationships r ON r.person_id = ac.child_id
  WHERE r.relationship_type IN ('Mother', 'Father', 'Parent', 'Guardian')
),
ranked_parent_links AS (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY child_id ORDER BY is_primary DESC,
    CASE relationship_type WHEN 'Mother' THEN 1 WHEN 'Father' THEN 2 WHEN 'Parent' THEN 3 WHEN 'Guardian' THEN 4 ELSE 5 END,
    created_at ASC
  ) AS rn FROM parent_links
),
chosen_parent AS (SELECT child_id, parent_id FROM ranked_parent_links WHERE rn = 1),
household_base AS (
  SELECT ac.child_id, ac.child_name, ac.child_compound, cp.parent_id,
    pp.first_name || ' ' || pp.last_name AS parent_name, pp.compound_area AS parent_compound
  FROM active_children ac
  LEFT JOIN chosen_parent cp ON cp.child_id = ac.child_id
  LEFT JOIN public.people pp ON pp.id = cp.parent_id
),
parent_households AS (
  SELECT 'parent_household'::varchar(50) AS family_type, hb.parent_id AS recipient_id,
    MAX(hb.parent_name) AS recipient_name,
    COALESCE(MAX(hb.parent_compound), MAX(hb.child_compound))::varchar(100) AS compound_area,
    (COUNT(*) + 1)::bigint AS family_size, hb.parent_id AS primary_person_id,
    ARRAY_AGG(hb.child_id ORDER BY hb.child_name) AS family_member_ids,
    ARRAY_AGG(hb.child_name ORDER BY hb.child_name) AS family_member_names
  FROM household_base hb WHERE hb.parent_id IS NOT NULL GROUP BY hb.parent_id
),
child_only_households AS (
  SELECT 'child_only'::varchar(50) AS family_type, hb.child_id AS recipient_id,
    hb.child_name || ' (No parent linked)' AS recipient_name,
    hb.child_compound::varchar(100) AS compound_area, 1::bigint AS family_size,
    hb.child_id AS primary_person_id, ARRAY[hb.child_id] AS family_member_ids,
    ARRAY[hb.child_name] AS family_member_names
  FROM household_base hb WHERE hb.parent_id IS NULL
)
SELECT * FROM parent_households UNION ALL SELECT * FROM child_only_households;

CREATE OR REPLACE VIEW public.food_distribution_household_metrics AS
SELECT fr.distribution_id,
  COUNT(*) AS recipient_rows,
  COUNT(DISTINCT COALESCE(fr.family_group_id::text, fr.family_head_id::text)) AS families_served
FROM public.food_recipients fr
GROUP BY fr.distribution_id;

CREATE OR REPLACE VIEW public.distribution_summary AS
SELECT fd.id AS distribution_id, fd.distribution_date, fd.quarter, fd.year, fd.distribution_location,
  COUNT(fr.id) AS total_families,
  COUNT(fr.id) FILTER (WHERE fr.is_collected = true) AS families_collected,
  COUNT(fr.id) FILTER (WHERE fr.is_collected = false) AS families_pending,
  SUM(fr.family_size) AS total_individuals,
  SUM(fr.family_size) FILTER (WHERE fr.is_collected = true) AS individuals_served
FROM public.food_distribution fd
LEFT JOIN public.food_recipients fr ON fd.id = fr.distribution_id
GROUP BY fd.id, fd.distribution_date, fd.quarter, fd.year, fd.distribution_location;

CREATE OR REPLACE VIEW public.visit_details AS
SELECT v.*, p.first_name || ' ' || p.last_name AS patient_name, hf.facility_name,
  pv.visit_date AS parent_visit_date, pv.diagnosis AS parent_diagnosis, pv.treatment_provided AS parent_treatment
FROM public.clinicare_visits v
LEFT JOIN public.people p ON v.patient_id = p.id
LEFT JOIN public.medical_facilities hf ON v.facility_id = hf.id
LEFT JOIN public.clinicare_visits pv ON v.parent_visit_id = pv.id;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educare_enrollment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tuition_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tuition_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_women_enrollment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_program_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinicare_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_distribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_relief_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_relief_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_outreach ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_resource_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_event_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deworming_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deworming_records ENABLE ROW LEVEL SECURITY;

-- Blanket authenticated-access policies
DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY[
    'people','relationships','government_schools','educare_enrollment',
    'tuition_schedule','tuition_attendance','legacy_women_enrollment',
    'legacy_program_attendance','medical_facilities','clinicare_visits',
    'food_distribution','food_recipients','emergency_relief_distributions',
    'emergency_relief_recipients','health_facilities',
    'parent_emergency_contacts','student_documents'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Enable all access for authenticated users" ON public.%I FOR ALL USING (auth.role() = ''authenticated'')', t);
  END LOOP;
END $$;

-- people: explicit read/insert/update split kept from migration 001
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.people;
CREATE POLICY "Enable read access for authenticated users" ON public.people
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.people;
CREATE POLICY "Enable insert for authenticated users" ON public.people
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.people;
CREATE POLICY "Enable update for authenticated users" ON public.people
  FOR UPDATE USING (auth.role() = 'authenticated');

-- user_profiles
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.user_profiles;
CREATE POLICY "Authenticated users can view all profiles" ON public.user_profiles
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
CREATE POLICY "Admins can update all profiles" ON public.user_profiles
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'Admin'));

-- user_preferences (own row + admin)
DROP POLICY IF EXISTS "user_preferences_select_own" ON public.user_preferences;
CREATE POLICY "user_preferences_select_own" ON public.user_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.id = auth.uid() AND p.role = 'Admin'));
DROP POLICY IF EXISTS "user_preferences_insert_own" ON public.user_preferences;
CREATE POLICY "user_preferences_insert_own" ON public.user_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.id = auth.uid() AND p.role = 'Admin'));
DROP POLICY IF EXISTS "user_preferences_update_own" ON public.user_preferences;
CREATE POLICY "user_preferences_update_own" ON public.user_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.id = auth.uid() AND p.role = 'Admin'))
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.id = auth.uid() AND p.role = 'Admin'));

-- case_notes
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.case_notes;
CREATE POLICY "Enable read access for authenticated users" ON public.case_notes FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.case_notes;
CREATE POLICY "Enable insert for authenticated users" ON public.case_notes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable update for own notes" ON public.case_notes;
CREATE POLICY "Enable update for own notes" ON public.case_notes FOR UPDATE USING (created_by = auth.uid());
DROP POLICY IF EXISTS "Enable delete for own notes" ON public.case_notes;
CREATE POLICY "Enable delete for own notes" ON public.case_notes FOR DELETE USING (created_by = auth.uid());

-- student_documents
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.student_documents;
CREATE POLICY "Enable read access for authenticated users" ON public.student_documents FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.student_documents;
CREATE POLICY "Enable insert for authenticated users" ON public.student_documents FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.student_documents;
CREATE POLICY "Enable update for authenticated users" ON public.student_documents FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.student_documents;
CREATE POLICY "Enable delete for authenticated users" ON public.student_documents FOR DELETE USING (auth.role() = 'authenticated');

-- outreach
DROP POLICY IF EXISTS "Allow authenticated users to read locations" ON public.outreach_locations;
CREATE POLICY "Allow authenticated users to read locations" ON public.outreach_locations FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to add custom locations" ON public.outreach_locations;
CREATE POLICY "Allow authenticated users to add custom locations" ON public.outreach_locations FOR INSERT TO authenticated WITH CHECK (is_custom = true);

DROP POLICY IF EXISTS "Allow authenticated users to read outreach events" ON public.community_outreach;
CREATE POLICY "Allow authenticated users to read outreach events" ON public.community_outreach FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to create outreach events" ON public.community_outreach;
CREATE POLICY "Allow authenticated users to create outreach events" ON public.community_outreach FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow users to update their own outreach events" ON public.community_outreach;
CREATE POLICY "Allow users to update their own outreach events" ON public.community_outreach FOR UPDATE TO authenticated USING (created_by = auth.uid());
DROP POLICY IF EXISTS "Allow users to delete their own outreach events" ON public.community_outreach;
CREATE POLICY "Allow users to delete their own outreach events" ON public.community_outreach FOR DELETE TO authenticated USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Allow authenticated users to read participants" ON public.outreach_participants;
CREATE POLICY "Allow authenticated users to read participants" ON public.outreach_participants FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to manage participants" ON public.outreach_participants;
CREATE POLICY "Allow authenticated users to manage participants" ON public.outreach_participants FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to read expenses" ON public.outreach_expenses;
CREATE POLICY "Allow authenticated users to read expenses" ON public.outreach_expenses FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to manage expenses" ON public.outreach_expenses;
CREATE POLICY "Allow authenticated users to manage expenses" ON public.outreach_expenses FOR ALL TO authenticated USING (true);

-- school_awards
DROP POLICY IF EXISTS "Allow authenticated users to read awards" ON public.school_awards;
CREATE POLICY "Allow authenticated users to read awards" ON public.school_awards FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to create awards" ON public.school_awards;
CREATE POLICY "Allow authenticated users to create awards" ON public.school_awards FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow users to update awards they created" ON public.school_awards;
CREATE POLICY "Allow users to update awards they created" ON public.school_awards FOR UPDATE TO authenticated USING (created_by = auth.uid());
DROP POLICY IF EXISTS "Allow users to delete awards they created" ON public.school_awards;
CREATE POLICY "Allow users to delete awards they created" ON public.school_awards FOR DELETE TO authenticated USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Allow authenticated users to read recipients" ON public.award_recipients;
CREATE POLICY "Allow authenticated users to read recipients" ON public.award_recipients FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to manage recipients" ON public.award_recipients;
CREATE POLICY "Allow authenticated users to manage recipients" ON public.award_recipients FOR ALL TO authenticated USING (true);

-- award_resource_types, award_event_resources, deworming_events, deworming_records
DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY['award_resource_types','award_event_resources','deworming_events','deworming_records'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "auth_all" ON public.%I', t);
    EXECUTE format('CREATE POLICY "auth_all" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- notification_reads (own row only)
DROP POLICY IF EXISTS "Users manage own reads" ON public.notification_reads;
CREATE POLICY "Users manage own reads" ON public.notification_reads FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT ON public.student_award_rankings TO authenticated;
GRANT SELECT ON public.student_details TO authenticated;

-- =============================================================================
-- STORAGE BUCKETS
-- =============================================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('student-documents', 'student-documents', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true) ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access for Student Documents') THEN
    CREATE POLICY "Public Access for Student Documents" ON storage.objects FOR SELECT USING (bucket_id = 'student-documents');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated Upload for Student Documents') THEN
    CREATE POLICY "Authenticated Upload for Student Documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'student-documents' AND auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated Delete for Student Documents') THEN
    CREATE POLICY "Authenticated Delete for Student Documents" ON storage.objects FOR DELETE USING (bucket_id = 'student-documents' AND auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access for Photos') THEN
    CREATE POLICY "Public Access for Photos" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated Upload for Photos') THEN
    CREATE POLICY "Authenticated Upload for Photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- =============================================================================
-- SEED DATA
-- =============================================================================

INSERT INTO public.outreach_locations (name, is_custom) VALUES
  ('Hospital', false), ('School', false), ('Home', false), ('Community Center', false)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.award_resource_types (name, sort_order) VALUES
  ('Books', 1), ('Pencils', 2), ('Shoes', 3)
ON CONFLICT (name) DO NOTHING;

NOTIFY pgrst, 'reload config';
