-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Relationships
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON relationships;
CREATE POLICY "Enable all access for authenticated users" ON relationships
  FOR ALL USING (auth.role() = 'authenticated');

-- Government Schools
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON government_schools;
CREATE POLICY "Enable all access for authenticated users" ON government_schools
  FOR ALL USING (auth.role() = 'authenticated');

-- Educare Enrollment
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON educare_enrollment;
CREATE POLICY "Enable all access for authenticated users" ON educare_enrollment
  FOR ALL USING (auth.role() = 'authenticated');

-- Tuition Schedule
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON tuition_schedule;
CREATE POLICY "Enable all access for authenticated users" ON tuition_schedule
  FOR ALL USING (auth.role() = 'authenticated');

-- Tuition Attendance
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON tuition_attendance;
CREATE POLICY "Enable all access for authenticated users" ON tuition_attendance
  FOR ALL USING (auth.role() = 'authenticated');

-- Legacy Women Enrollment
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON legacy_women_enrollment;
CREATE POLICY "Enable all access for authenticated users" ON legacy_women_enrollment
  FOR ALL USING (auth.role() = 'authenticated');

-- Legacy Program Attendance
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON legacy_program_attendance;
CREATE POLICY "Enable all access for authenticated users" ON legacy_program_attendance
  FOR ALL USING (auth.role() = 'authenticated');

-- Clinicare Visits
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON clinicare_visits;
CREATE POLICY "Enable all access for authenticated users" ON clinicare_visits
  FOR ALL USING (auth.role() = 'authenticated');

-- Food Distribution
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON food_distribution;
CREATE POLICY "Enable all access for authenticated users" ON food_distribution
  FOR ALL USING (auth.role() = 'authenticated');

-- Food Recipients
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON food_recipients;
CREATE POLICY "Enable all access for authenticated users" ON food_recipients
  FOR ALL USING (auth.role() = 'authenticated');

-- User Profiles
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON user_profiles;
CREATE POLICY "Enable all access for authenticated users" ON user_profiles
  FOR ALL USING (auth.role() = 'authenticated');
