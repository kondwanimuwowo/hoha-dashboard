-- Migration: Setup storage buckets for documents and photos
-- This ensures the necessary storage infrastructure is in place

-- 1. Create buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-documents', 'student-documents', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policies for student-documents
-- Note: Re-creating policies safely using DO blocks or DROP if EXISTS

DO $$
BEGIN
    -- Select Policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Public Access for Student Documents'
    ) THEN
        CREATE POLICY "Public Access for Student Documents" ON storage.objects
        FOR SELECT USING (bucket_id = 'student-documents');
    END IF;

    -- Insert Policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Authenticated Upload for Student Documents'
    ) THEN
        CREATE POLICY "Authenticated Upload for Student Documents" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'student-documents' AND auth.role() = 'authenticated');
    END IF;

    -- Delete Policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Authenticated Delete for Student Documents'
    ) THEN
        CREATE POLICY "Authenticated Delete for Student Documents" ON storage.objects
        FOR DELETE USING (bucket_id = 'student-documents' AND auth.role() = 'authenticated');
    END IF;

    -- Repeat for photos bucket
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Public Access for Photos'
    ) THEN
        CREATE POLICY "Public Access for Photos" ON storage.objects
        FOR SELECT USING (bucket_id = 'photos');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Authenticated Upload for Photos'
    ) THEN
        CREATE POLICY "Authenticated Upload for Photos" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');
    END IF;

END $$;
