-- Migration 013: Fix foreign keys for metadata joins
-- This migration updates case_notes and student_documents to reference user_profiles
-- instead of auth.users. This allows Supabase to join and fetch metadata like full_name.

-- 1. Fix Case Notes
ALTER TABLE case_notes DROP CONSTRAINT IF EXISTS case_notes_created_by_fkey;
ALTER TABLE case_notes 
  ADD CONSTRAINT case_notes_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.user_profiles(id);

-- 2. Fix Student Documents
ALTER TABLE student_documents DROP CONSTRAINT IF EXISTS student_documents_uploaded_by_fkey;
ALTER TABLE student_documents 
  ADD CONSTRAINT student_documents_uploaded_by_fkey 
  FOREIGN KEY (uploaded_by) REFERENCES public.user_profiles(id);

-- Verify RLS is still valid (it should be, as user_profiles.id == auth.uid())
-- No changes needed to RLS policies as they mostly use auth.role() or auth.uid().
