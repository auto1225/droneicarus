-- Migration 0011 — Lab document/video viewer support
-- Run ONCE in Supabase Dashboard → SQL Editor

BEGIN;

-- 1. Add document fields to lab_items
ALTER TABLE public.lab_items
  ADD COLUMN IF NOT EXISTS document_url   text,        -- direct URL to PDF / DOCX / video (our storage or external)
  ADD COLUMN IF NOT EXISTS document_type  text,        -- 'pdf' | 'docx' | 'youtube' | 'vimeo' | 'html' | 'none'
  ADD COLUMN IF NOT EXISTS document_size  bigint;      -- bytes

COMMENT ON COLUMN public.lab_items.document_url  IS 'Viewable/embeddable document or video URL. PDF → native iframe, YT/Vimeo → iframe embed.';
COMMENT ON COLUMN public.lab_items.document_type IS 'pdf | docx | youtube | vimeo | html | none';

-- 2. Create lab-documents public storage bucket (requires storage schema access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lab-documents', 'lab-documents', true,
  50 * 1024 * 1024,   -- 50 MB per file
  ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/png','image/jpeg','image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 50 * 1024 * 1024,
  allowed_mime_types = ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/png','image/jpeg','image/svg+xml'];

-- Storage policies — public read, admin write
-- (Supabase provides table storage.objects)
DROP POLICY IF EXISTS "public reads lab-documents" ON storage.objects;
CREATE POLICY "public reads lab-documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'lab-documents');

DROP POLICY IF EXISTS "admins upload lab-documents" ON storage.objects;
CREATE POLICY "admins upload lab-documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'lab-documents' AND public.is_admin());

DROP POLICY IF EXISTS "admins update lab-documents" ON storage.objects;
CREATE POLICY "admins update lab-documents" ON storage.objects
  FOR UPDATE USING (bucket_id = 'lab-documents' AND public.is_admin());

DROP POLICY IF EXISTS "admins delete lab-documents" ON storage.objects;
CREATE POLICY "admins delete lab-documents" ON storage.objects
  FOR DELETE USING (bucket_id = 'lab-documents' AND public.is_admin());

COMMIT;

-- Verify
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'lab-documents';
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'lab_items' AND column_name LIKE 'document%';
