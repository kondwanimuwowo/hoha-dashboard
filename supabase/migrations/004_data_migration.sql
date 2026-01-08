-- =====================================================
-- DATA MIGRATION - Update Terminology
-- =====================================================

-- Update grade levels: Baby Class → Early Childhood Program
UPDATE educare_enrollment 
SET grade_level = 'Early Childhood Program' 
WHERE grade_level = 'Baby Class';

-- Update grade levels: Reception → Preparatory Program
UPDATE educare_enrollment 
SET grade_level = 'Preparatory Program' 
WHERE grade_level = 'Reception';

-- Note: Youth Class is a new category, no existing data to migrate
