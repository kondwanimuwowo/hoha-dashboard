-- Migration 030: Standardize Relationship Foreign Key Names
-- This ensures that the constraint names match the expectations of the frontend hooks (useStudent and useRelationships).

-- 1. Drop existing possibly unnamed or differently named constraints
ALTER TABLE IF EXISTS public.relationships 
  DROP CONSTRAINT IF EXISTS relationships_person_id_fkey,
  DROP CONSTRAINT IF EXISTS relationships_related_person_id_fkey;

-- 2. Add named constraints
ALTER TABLE public.relationships
  ADD CONSTRAINT relationships_person_id_fkey 
  FOREIGN KEY (person_id) REFERENCES public.people(id) ON DELETE CASCADE,
  ADD CONSTRAINT relationships_related_person_id_fkey 
  FOREIGN KEY (related_person_id) REFERENCES public.people(id) ON DELETE CASCADE;

-- 3. Ensure educare_enrollment also has a named constraint although it's not ambiguous
ALTER TABLE IF EXISTS public.educare_enrollment
  DROP CONSTRAINT IF EXISTS educare_enrollment_child_id_fkey;

ALTER TABLE public.educare_enrollment
  ADD CONSTRAINT educare_enrollment_child_id_fkey 
  FOREIGN KEY (child_id) REFERENCES public.people(id) ON DELETE CASCADE;
