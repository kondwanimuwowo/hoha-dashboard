-- =====================================================
-- SCHEMA ENHANCEMENTS - Phase 1
-- =====================================================

-- Medical Facilities Table
CREATE TABLE IF NOT EXISTS medical_facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_name VARCHAR(200) NOT NULL UNIQUE,
  location VARCHAR(200),
  contact_person VARCHAR(200),
  contact_phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facilities_name ON medical_facilities(facility_name);
CREATE INDEX IF NOT EXISTS idx_facilities_active ON medical_facilities(is_active);

-- Add trigger for updated_at
-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_medical_facilities_updated_at ON medical_facilities;
CREATE TRIGGER update_medical_facilities_updated_at BEFORE UPDATE ON medical_facilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PEOPLE TABLE ENHANCEMENTS
-- =====================================================

-- Add NRC number field
ALTER TABLE people ADD COLUMN IF NOT EXISTS nrc_number VARCHAR(20);

-- Add constraint for NRC format (XXXXXX/XX/X)
ALTER TABLE people DROP CONSTRAINT IF EXISTS check_nrc_format;
ALTER TABLE people ADD CONSTRAINT check_nrc_format 
  CHECK (nrc_number IS NULL OR nrc_number ~ '^\d{6}/\d{2}/\d$');

-- Ensure photo_url exists (should already exist from initial schema)
ALTER TABLE people ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add index for NRC lookups
CREATE INDEX IF NOT EXISTS idx_people_nrc ON people(nrc_number) WHERE nrc_number IS NOT NULL;

-- =====================================================
-- FAMILY GROUPS FOR DISTRIBUTION TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS family_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_head_id UUID REFERENCES people(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS family_members (
  family_group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  person_id UUID REFERENCES people(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (family_group_id, person_id)
);

CREATE INDEX IF NOT EXISTS idx_family_groups_head ON family_groups(family_head_id);
CREATE INDEX IF NOT EXISTS idx_family_members_person ON family_members(person_id);

DROP TRIGGER IF EXISTS update_family_groups_updated_at ON family_groups;
CREATE TRIGGER update_family_groups_updated_at BEFORE UPDATE ON family_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- EMERGENCY RELIEF MODULE
-- =====================================================

CREATE TABLE IF NOT EXISTS emergency_relief_distributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  distribution_date DATE NOT NULL,
  reason TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emergency_relief_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  distribution_id UUID REFERENCES emergency_relief_distributions(id) ON DELETE CASCADE,
  family_head_id UUID REFERENCES people(id) ON DELETE CASCADE,
  items_provided TEXT,
  collected BOOLEAN DEFAULT false,
  collection_time TIMESTAMP WITH TIME ZONE,
  collected_by VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_distributions_date ON emergency_relief_distributions(distribution_date);
CREATE INDEX IF NOT EXISTS idx_emergency_recipients_distribution ON emergency_relief_recipients(distribution_id);
CREATE INDEX IF NOT EXISTS idx_emergency_recipients_family ON emergency_relief_recipients(family_head_id);
CREATE INDEX IF NOT EXISTS idx_emergency_recipients_collected ON emergency_relief_recipients(collected);

DROP TRIGGER IF EXISTS update_emergency_distributions_updated_at ON emergency_relief_distributions;
CREATE TRIGGER update_emergency_distributions_updated_at BEFORE UPDATE ON emergency_relief_distributions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_emergency_recipients_updated_at ON emergency_relief_recipients;
CREATE TRIGGER update_emergency_recipients_updated_at BEFORE UPDATE ON emergency_relief_recipients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CLINICARE ENHANCEMENTS
-- =====================================================

-- Add facility reference
ALTER TABLE clinicare_visits ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES medical_facilities(id);

-- Rename columns for clarity
DO $$
BEGIN
  IF EXISTS(SELECT *
    FROM information_schema.columns
    WHERE table_name='clinicare_visits' and column_name='hoha_contribution')
  THEN
      ALTER TABLE clinicare_visits RENAME COLUMN hoha_contribution TO medical_fees;
  END IF;

  IF EXISTS(SELECT *
    FROM information_schema.columns
    WHERE table_name='clinicare_visits' and column_name='patient_contribution')
  THEN
      ALTER TABLE clinicare_visits RENAME COLUMN patient_contribution TO transport_costs;
  END IF;
END $$;

-- Add index for facility lookups
CREATE INDEX IF NOT EXISTS idx_visits_facility ON clinicare_visits(facility_id);

-- =====================================================
-- FOOD DISTRIBUTION ENHANCEMENTS
-- =====================================================

-- Add family group tracking to food recipients
ALTER TABLE food_recipients ADD COLUMN IF NOT EXISTS family_group_id UUID REFERENCES family_groups(id);
ALTER TABLE food_recipients ADD COLUMN IF NOT EXISTS collected BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_food_recipients_family_group ON food_recipients(family_group_id);
CREATE INDEX IF NOT EXISTS idx_food_recipients_collected ON food_recipients(collected);

-- =====================================================
-- ENABLE RLS ON NEW TABLES
-- =====================================================

ALTER TABLE medical_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_relief_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_relief_recipients ENABLE ROW LEVEL SECURITY;

-- Create policies for new tables
-- Create policies for new tables
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON medical_facilities;
CREATE POLICY "Enable all access for authenticated users" ON medical_facilities
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON family_groups;
CREATE POLICY "Enable all access for authenticated users" ON family_groups
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON family_members;
CREATE POLICY "Enable all access for authenticated users" ON family_members
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON emergency_relief_distributions;
CREATE POLICY "Enable all access for authenticated users" ON emergency_relief_distributions
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON emergency_relief_recipients;
CREATE POLICY "Enable all access for authenticated users" ON emergency_relief_recipients
  FOR ALL USING (auth.role() = 'authenticated');

-- Reload schema cache
NOTIFY pgrst, 'reload config';
