-- =====================================================
-- STORAGE & FIXES
-- =====================================================

-- 1. Create 'photos' bucket for public access
-- Note: 'storage' schema and 'buckets' table are part of Supabase Storage

-- Insert bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies

-- Enable public read access
DROP POLICY IF EXISTS "Public Photos Access" ON storage.objects;
CREATE POLICY "Public Photos Access" ON storage.objects
FOR SELECT USING (bucket_id = 'photos');

-- Enable authenticated uploads
DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;
CREATE POLICY "Authenticated Uploads" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'photos' 
    AND auth.role() = 'authenticated'
);

-- Enable authenticated updates (optional, for replacing photos)
DROP POLICY IF EXISTS "Authenticated Updates" ON storage.objects;
CREATE POLICY "Authenticated Updates" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'photos' 
    AND auth.role() = 'authenticated'
);

-- Enable authenticated deletes
DROP POLICY IF EXISTS "Authenticated Deletes" ON storage.objects;
CREATE POLICY "Authenticated Deletes" ON storage.objects
FOR DELETE USING (
    bucket_id = 'photos' 
    AND auth.role() = 'authenticated'
);

-- Reload schema cache
NOTIFY pgrst, 'reload config';
