-- Migration: CliniCare Enhancements
-- Adds follow-up visit tracking and other fees field

-- =====================================================
-- ADD FOLLOW-UP VISIT TRACKING
-- =====================================================

-- Add parent_visit_id to track follow-up visits
ALTER TABLE clinicare_visits ADD COLUMN IF NOT EXISTS parent_visit_id UUID REFERENCES clinicare_visits(id) ON DELETE SET NULL;

-- Add index for follow-up queries
CREATE INDEX IF NOT EXISTS idx_visits_parent_visit ON clinicare_visits(parent_visit_id);

-- =====================================================
-- ADD OTHER FEES AND ENHANCE COST TRACKING
-- =====================================================

-- Add other_fees column
ALTER TABLE clinicare_visits ADD COLUMN IF NOT EXISTS other_fees DECIMAL(10,2) DEFAULT 0;

-- Add medical_fees and transport_costs if they don't exist (they should from schema)
ALTER TABLE clinicare_visits ADD COLUMN IF NOT EXISTS medical_fees DECIMAL(10,2) DEFAULT 0;
ALTER TABLE clinicare_visits ADD COLUMN IF NOT EXISTS transport_costs DECIMAL(10,2) DEFAULT 0;

-- Add facility_id reference (replacing facility_name string)
ALTER TABLE clinicare_visits ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES health_facilities(id) ON DELETE SET NULL;

-- =====================================================
-- CREATE HEALTH FACILITIES TABLE IF NOT EXISTS
-- =====================================================

CREATE TABLE IF NOT EXISTS health_facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_name VARCHAR(200) NOT NULL,
  facility_type VARCHAR(100), -- 'Hospital', 'Clinic', 'Health Center'
  location VARCHAR(200),
  contact_phone VARCHAR(20),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for facilities
CREATE INDEX IF NOT EXISTS idx_facilities_active ON health_facilities(is_active);
CREATE INDEX IF NOT EXISTS idx_facilities_name ON health_facilities(facility_name);

-- Enable RLS on health_facilities
ALTER TABLE health_facilities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for health_facilities
CREATE POLICY "Enable read access for authenticated users" ON health_facilities
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON health_facilities
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON health_facilities
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Trigger for health_facilities updated_at
CREATE TRIGGER update_health_facilities_updated_at BEFORE UPDATE ON health_facilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CREATE FUNCTION TO CALCULATE TOTAL COST
-- =====================================================

-- Function to automatically calculate total cost
CREATE OR REPLACE FUNCTION calculate_visit_total_cost()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-calculate cost_amount from medical_fees + transport_costs + other_fees
  NEW.cost_amount := COALESCE(NEW.medical_fees, 0) + 
                     COALESCE(NEW.transport_costs, 0) + 
                     COALESCE(NEW.other_fees, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate cost on insert/update
DROP TRIGGER IF EXISTS trigger_calculate_visit_cost ON clinicare_visits;
CREATE TRIGGER trigger_calculate_visit_cost
  BEFORE INSERT OR UPDATE OF medical_fees, transport_costs, other_fees
  ON clinicare_visits
  FOR EACH ROW
  EXECUTE FUNCTION calculate_visit_total_cost();

-- =====================================================
-- ADD VISIT EDIT TRACKING
-- =====================================================

-- Add columns to track edits
ALTER TABLE clinicare_visits ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES auth.users(id);
ALTER TABLE clinicare_visits ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- CREATE VIEW FOR VISIT DETAILS WITH FOLLOW-UPS
-- =====================================================

CREATE OR REPLACE VIEW visit_details AS
SELECT 
  v.id,
  v.patient_id,
  p.first_name || ' ' || p.last_name as patient_name,
  v.visit_date,
  v.facility_id,
  hf.facility_name,
  v.reason_for_visit,
  v.diagnosis,
  v.treatment_provided,
  v.medical_fees,
  v.transport_costs,
  v.other_fees,
  v.cost_amount,
  v.currency,
  v.is_emergency,
  v.transport_provided,
  v.transport_cost,
  v.follow_up_required,
  v.follow_up_date,
  v.parent_visit_id,
  v.in_hoha_program,
  v.notes,
  v.recorded_by,
  v.created_at,
  v.updated_at,
  -- Include parent visit info if this is a follow-up
  pv.visit_date as parent_visit_date,
  pv.diagnosis as parent_diagnosis,
  pv.treatment_provided as parent_treatment
FROM clinicare_visits v
LEFT JOIN people p ON v.patient_id = p.id
LEFT JOIN health_facilities hf ON v.facility_id = hf.id
LEFT JOIN clinicare_visits pv ON v.parent_visit_id = pv.id;

-- =====================================================
-- INSERT SOME DEFAULT FACILITIES
-- =====================================================

INSERT INTO health_facilities (facility_name, facility_type, location, is_active)
VALUES 
  ('University Teaching Hospital (UTH)', 'Hospital', 'Lusaka', true),
  ('Levy Mwanawasa Hospital', 'Hospital', 'Lusaka', true),
  ('Chilenje Level 1 Hospital', 'Hospital', 'Lusaka', true),
  ('Kanyama Clinic', 'Clinic', 'Kanyama, Lusaka', true),
  ('Chipata Clinic', 'Clinic', 'Chipata, Lusaka', true),
  ('Matero Main Clinic', 'Clinic', 'Matero, Lusaka', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- UPDATE EXISTING VISITS TO SET CURRENCY TO ZMW
-- =====================================================

UPDATE clinicare_visits SET currency = 'ZMW' WHERE currency = 'MK' OR currency IS NULL;
