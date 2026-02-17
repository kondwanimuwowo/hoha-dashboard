-- Migration: Add soft delete support and case notes
-- This migration adds soft delete functionality and case notes system

-- =====================================================
-- ADD SOFT DELETE SUPPORT
-- =====================================================

-- Add deleted_at column to people table
ALTER TABLE people ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add deleted_at column to educare_enrollment
ALTER TABLE educare_enrollment ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add deleted_at column to legacy_women_enrollment
ALTER TABLE legacy_women_enrollment ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_people_deleted ON people(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_educare_deleted ON educare_enrollment(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_legacy_deleted ON legacy_women_enrollment(deleted_at) WHERE deleted_at IS NULL;

-- =====================================================
-- CASE NOTES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS case_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID REFERENCES people(id) ON DELETE CASCADE,
  note_type VARCHAR(50) DEFAULT 'General', -- 'General', 'Academic', 'Behavioral', 'Medical', 'Family'
  note_content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for case notes
CREATE INDEX IF NOT EXISTS idx_case_notes_person ON case_notes(person_id);
CREATE INDEX IF NOT EXISTS idx_case_notes_created ON case_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_notes_type ON case_notes(note_type);

-- Enable RLS on case_notes
ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for case_notes
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON case_notes;
CREATE POLICY "Enable read access for authenticated users" ON case_notes
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON case_notes;
CREATE POLICY "Enable insert for authenticated users" ON case_notes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for own notes" ON case_notes;
CREATE POLICY "Enable update for own notes" ON case_notes
  FOR UPDATE USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Enable delete for own notes" ON case_notes;
CREATE POLICY "Enable delete for own notes" ON case_notes
  FOR DELETE USING (created_by = auth.uid());

-- Trigger for case_notes updated_at
DROP TRIGGER IF EXISTS update_case_notes_updated_at ON case_notes;
CREATE TRIGGER update_case_notes_updated_at BEFORE UPDATE ON case_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STUDENT DOCUMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS student_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES people(id) ON DELETE CASCADE,
  document_type VARCHAR(50) DEFAULT 'Other', -- 'Result', 'Report Card', 'Medical', 'Certificate', 'Other'
  document_name VARCHAR(200) NOT NULL,
  document_url TEXT NOT NULL,
  file_size INTEGER, -- in bytes
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES auth.users(id),
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for student_documents
CREATE INDEX IF NOT EXISTS idx_student_documents_student ON student_documents(student_id);
CREATE INDEX IF NOT EXISTS idx_student_documents_type ON student_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_student_documents_upload_date ON student_documents(upload_date DESC);

-- Enable RLS on student_documents
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_documents
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON student_documents;
CREATE POLICY "Enable read access for authenticated users" ON student_documents
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON student_documents;
CREATE POLICY "Enable insert for authenticated users" ON student_documents
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON student_documents;
CREATE POLICY "Enable update for authenticated users" ON student_documents
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON student_documents;
CREATE POLICY "Enable delete for authenticated users" ON student_documents
  FOR DELETE USING (auth.role() = 'authenticated');

-- Trigger for student_documents updated_at
DROP TRIGGER IF EXISTS update_student_documents_updated_at ON student_documents;
CREATE TRIGGER update_student_documents_updated_at BEFORE UPDATE ON student_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PARENT EMERGENCY CONTACTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS parent_emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES people(id) ON DELETE CASCADE,
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relationship VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(parent_id)
);

-- Index for parent emergency contacts
CREATE INDEX IF NOT EXISTS idx_parent_emergency_contacts_parent ON parent_emergency_contacts(parent_id);

-- Enable RLS on parent_emergency_contacts
ALTER TABLE parent_emergency_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for parent_emergency_contacts
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON parent_emergency_contacts;
CREATE POLICY "Enable read access for authenticated users" ON parent_emergency_contacts
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON parent_emergency_contacts;
CREATE POLICY "Enable insert for authenticated users" ON parent_emergency_contacts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON parent_emergency_contacts;
CREATE POLICY "Enable update for authenticated users" ON parent_emergency_contacts
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Trigger for parent_emergency_contacts updated_at
DROP TRIGGER IF EXISTS update_parent_emergency_contacts_updated_at ON parent_emergency_contacts;
CREATE TRIGGER update_parent_emergency_contacts_updated_at BEFORE UPDATE ON parent_emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- UPDATE VIEWS TO EXCLUDE SOFT DELETED RECORDS
-- =====================================================

-- Drop and recreate student_details view to exclude deleted records
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
  p.emergency_contact_relationship
FROM people p
JOIN educare_enrollment ee ON p.id = ee.child_id
LEFT JOIN government_schools gs ON ee.government_school_id = gs.id
WHERE p.is_active = true 
  AND p.deleted_at IS NULL 
  AND ee.deleted_at IS NULL;
