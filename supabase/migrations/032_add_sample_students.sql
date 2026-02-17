-- Migration 032: Add Sample Student Data
-- This migration adds a few sample students to test the application after the schema reset

-- Insert sample students
INSERT INTO public.people (id, first_name, last_name, date_of_birth, gender, phone_number, address, compound_area, is_active)
VALUES 
  ('25be4115-0fd8-4097-9c05-bbf6a95160fd', 'John', 'Banda', '2015-03-15', 'Male', '0977123456', '123 Main Street', 'Kabulonga', true),
  ('7ab1c9a3-5a63-4cfb-aa61-ee907d58777d', 'Mary', 'Mwansa', '2014-07-22', 'Female', '0966234567', '456 School Road', 'Chelston', true),
  ('8ef85cc9-52ef-4b5e-afa8-009ad795d4f7', 'Peter', 'Phiri', '2016-01-10', 'Male', '0955345678', '789 Church Avenue', 'Woodlands', true)
ON CONFLICT (id) DO NOTHING;

-- Insert enrollments for these students
INSERT INTO public.educare_enrollment (child_id, grade_level, enrollment_date, current_status, government_school_id)
VALUES 
  ('25be4115-0fd8-4097-9c05-bbf6a95160fd', 'Grade 4', '2024-01-15', 'Active', NULL),
  ('7ab1c9a3-5a63-4cfb-aa61-ee907d58777d', 'Grade 5', '2023-01-10', 'Active', NULL),
  ('8ef85cc9-52ef-4b5e-afa8-009ad795d4f7', 'Grade 3', '2024-01-15', 'Active', NULL)
ON CONFLICT DO NOTHING;
