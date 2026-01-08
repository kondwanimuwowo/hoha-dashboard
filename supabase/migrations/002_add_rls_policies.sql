-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Relationships
CREATE POLICY "Enable all access for authenticated users" ON relationships
  FOR ALL USING (auth.role() = 'authenticated');

-- Government Schools
CREATE POLICY "Enable all access for authenticated users" ON government_schools
  FOR ALL USING (auth.role() = 'authenticated');

-- Educare Enrollment
CREATE POLICY "Enable all access for authenticated users" ON educare_enrollment
  FOR ALL USING (auth.role() = 'authenticated');

-- Tuition Schedule
CREATE POLICY "Enable all access for authenticated users" ON tuition_schedule
  FOR ALL USING (auth.role() = 'authenticated');

-- Tuition Attendance
CREATE POLICY "Enable all access for authenticated users" ON tuition_attendance
  FOR ALL USING (auth.role() = 'authenticated');

-- Legacy Women Enrollment
CREATE POLICY "Enable all access for authenticated users" ON legacy_women_enrollment
  FOR ALL USING (auth.role() = 'authenticated');

-- Legacy Program Attendance
CREATE POLICY "Enable all access for authenticated users" ON legacy_program_attendance
  FOR ALL USING (auth.role() = 'authenticated');

-- Clinicare Visits
CREATE POLICY "Enable all access for authenticated users" ON clinicare_visits
  FOR ALL USING (auth.role() = 'authenticated');

-- Food Distribution
CREATE POLICY "Enable all access for authenticated users" ON food_distribution
  FOR ALL USING (auth.role() = 'authenticated');

-- Food Recipients
CREATE POLICY "Enable all access for authenticated users" ON food_recipients
  FOR ALL USING (auth.role() = 'authenticated');

-- User Profiles
CREATE POLICY "Enable all access for authenticated users" ON user_profiles
  FOR ALL USING (auth.role() = 'authenticated');
