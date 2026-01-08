-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PEOPLE (Master Table)
-- =====================================================
CREATE TABLE people (
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for searching
CREATE INDEX idx_people_name ON people(first_name, last_name);
CREATE INDEX idx_people_phone ON people(phone_number);
CREATE INDEX idx_people_active ON people(is_active);

-- =====================================================
-- RELATIONSHIPS
-- =====================================================
CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID REFERENCES people(id) ON DELETE CASCADE,
  related_person_id UUID REFERENCES people(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL, -- Parent, Guardian, Sibling, Spouse
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT different_people CHECK (person_id != related_person_id)
);

CREATE INDEX idx_relationships_person ON relationships(person_id);
CREATE INDEX idx_relationships_related ON relationships(related_person_id);

-- =====================================================
-- GOVERNMENT SCHOOLS
-- =====================================================
CREATE TABLE government_schools (
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

-- =====================================================
-- EDUCARE ENROLLMENT
-- =====================================================
CREATE TABLE educare_enrollment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES people(id) ON DELETE CASCADE,
  grade_level VARCHAR(50) NOT NULL, -- Baby Class, Reception, Grade 1-12
  enrollment_date DATE DEFAULT CURRENT_DATE,
  current_status VARCHAR(50) DEFAULT 'Active', -- Active, Graduated, Withdrawn, Transferred
  government_school_id UUID REFERENCES government_schools(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_educare_child ON educare_enrollment(child_id);
CREATE INDEX idx_educare_status ON educare_enrollment(current_status);
CREATE INDEX idx_educare_grade ON educare_enrollment(grade_level);

-- =====================================================
-- TUITION SCHEDULE
-- =====================================================
CREATE TABLE tuition_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grade_level VARCHAR(50) NOT NULL,
  day_of_week VARCHAR(20) NOT NULL, -- Monday-Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject VARCHAR(100),
  instructor_name VARCHAR(200),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TUITION ATTENDANCE
-- =====================================================
CREATE TABLE tuition_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES people(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES tuition_schedule(id),
  attendance_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL, -- Present, Absent, Excused, Late
  notes TEXT,
  recorded_by VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(child_id, schedule_id, attendance_date)
);

CREATE INDEX idx_attendance_child ON tuition_attendance(child_id);
CREATE INDEX idx_attendance_date ON tuition_attendance(attendance_date);
CREATE INDEX idx_attendance_status ON tuition_attendance(status);

-- =====================================================
-- LEGACY WOMEN'S ENROLLMENT
-- =====================================================
CREATE TABLE legacy_women_enrollment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  woman_id UUID REFERENCES people(id) ON DELETE CASCADE,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  stage VARCHAR(50) NOT NULL, -- Stage 1, Stage 2, etc.
  status VARCHAR(50) DEFAULT 'Active', -- Active, Completed, Withdrawn
  completion_date DATE,
  skills_learned TEXT,
  mentor_id UUID REFERENCES people(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_legacy_woman ON legacy_women_enrollment(woman_id);
CREATE INDEX idx_legacy_status ON legacy_women_enrollment(status);

-- =====================================================
-- LEGACY PROGRAM ATTENDANCE
-- =====================================================
CREATE TABLE legacy_program_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  woman_id UUID REFERENCES people(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  session_type VARCHAR(100) NOT NULL, -- Counseling, Life Skills, English, Skills Training
  status VARCHAR(20) NOT NULL, -- Present, Absent, Excused
  notes TEXT,
  recorded_by VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_legacy_attendance_woman ON legacy_program_attendance(woman_id);
CREATE INDEX idx_legacy_attendance_date ON legacy_program_attendance(session_date);

-- =====================================================
-- CLINICARE VISITS
-- =====================================================
CREATE TABLE clinicare_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES people(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  facility_name VARCHAR(200),
  reason_for_visit TEXT,
  diagnosis TEXT,
  treatment_provided TEXT,
  prescription_url TEXT,
  cost_amount DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'ZMW',
  hoha_contribution DECIMAL(10,2),
  patient_contribution DECIMAL(10,2),
  is_emergency BOOLEAN DEFAULT false,
  transport_provided BOOLEAN DEFAULT false,
  transport_cost DECIMAL(10,2),
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  in_hoha_program BOOLEAN DEFAULT true,
  notes TEXT,
  recorded_by VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_visits_patient ON clinicare_visits(patient_id);
CREATE INDEX idx_visits_date ON clinicare_visits(visit_date);
CREATE INDEX idx_visits_followup ON clinicare_visits(follow_up_date) WHERE follow_up_required = true;

-- =====================================================
-- FOOD DISTRIBUTION
-- =====================================================
CREATE TABLE food_distribution (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  distribution_date DATE NOT NULL,
  quarter VARCHAR(10) NOT NULL, -- Q1, Q2, Q3, Q4
  year INTEGER NOT NULL,
  distribution_location VARCHAR(200),
  total_hampers_distributed INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_distribution_date ON food_distribution(distribution_date);
CREATE INDEX idx_distribution_quarter ON food_distribution(quarter, year);

-- =====================================================
-- FOOD RECIPIENTS
-- =====================================================
CREATE TABLE food_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  distribution_id UUID REFERENCES food_distribution(id) ON DELETE CASCADE,
  family_head_id UUID REFERENCES people(id) ON DELETE CASCADE,
  family_size INTEGER,
  hamper_contents TEXT,
  special_needs TEXT,
  collected_by VARCHAR(200),
  collection_time TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recipients_distribution ON food_recipients(distribution_id);
CREATE INDEX idx_recipients_family ON food_recipients(family_head_id);

-- =====================================================
-- USERS (Auth handled by Supabase Auth, this is for profiles)
-- =====================================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(200),
  email VARCHAR(200),
  role VARCHAR(50) DEFAULT 'Data Entry', -- Admin, Program Manager, Data Entry, Read-Only
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE educare_enrollment ENABLE ROW LEVEL SECURITY;
ALTER TABLE tuition_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE tuition_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_women_enrollment ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_program_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinicare_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_distribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies (authenticated users can access all data for now)
-- Refine these based on roles later

CREATE POLICY "Enable read access for authenticated users" ON people
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON people
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON people
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Repeat similar policies for other tables
-- (Or create a function to apply policies to all tables)

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON people
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON relationships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_government_schools_updated_at BEFORE UPDATE ON government_schools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_educare_enrollment_updated_at BEFORE UPDATE ON educare_enrollment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tuition_schedule_updated_at BEFORE UPDATE ON tuition_schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tuition_attendance_updated_at BEFORE UPDATE ON tuition_attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legacy_women_enrollment_updated_at BEFORE UPDATE ON legacy_women_enrollment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legacy_program_attendance_updated_at BEFORE UPDATE ON legacy_program_attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinicare_visits_updated_at BEFORE UPDATE ON clinicare_visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_distribution_updated_at BEFORE UPDATE ON food_distribution
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_recipients_updated_at BEFORE UPDATE ON food_recipients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: Students with full details
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
  p.compound_area
FROM people p
JOIN educare_enrollment ee ON p.id = ee.child_id
LEFT JOIN government_schools gs ON ee.government_school_id = gs.id
WHERE p.is_active = true;

-- View: Attendance summary by student
CREATE VIEW attendance_summary AS
SELECT 
  ta.child_id,
  p.first_name,
  p.last_name,
  COUNT(*) FILTER (WHERE ta.status = 'Present') as days_present,
  COUNT(*) as total_sessions,
  ROUND(
    COUNT(*) FILTER (WHERE ta.status = 'Present')::numeric / 
    NULLIF(COUNT(*), 0)::numeric * 100, 
    2
  ) as attendance_percentage
FROM tuition_attendance ta
JOIN people p ON ta.child_id = p.id
WHERE ta.attendance_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY ta.child_id, p.first_name, p.last_name;

-- View: Family connections
CREATE VIEW family_view AS
SELECT 
  p1.id as person_id,
  p1.first_name || ' ' || p1.last_name as person_name,
  r.relationship_type,
  p2.id as related_person_id,
  p2.first_name || ' ' || p2.last_name as related_person_name
FROM people p1
JOIN relationships r ON p1.id = r.person_id
JOIN people p2 ON r.related_person_id = p2.id;