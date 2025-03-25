-- Storage policies for scripts bucket
BEGIN;

-- First, ensure the scripts bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('scripts', 'scripts', true)
ON CONFLICT (id) DO NOTHING;

-- Remove any existing policies
DROP POLICY IF EXISTS "Allow public read access of scripts bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload to scripts bucket" ON storage.objects;

-- Create policy to allow anyone to read from scripts bucket
CREATE POLICY "Allow public read access of scripts bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'scripts');

-- Create policy to allow authenticated users to upload to scripts bucket
CREATE POLICY "Allow authenticated users to upload to scripts bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'scripts');

-- Create policy to allow authenticated users to update files in scripts bucket
CREATE POLICY "Allow authenticated users to update scripts bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'scripts');

-- Create policy to allow authenticated users to delete files in scripts bucket
CREATE POLICY "Allow authenticated users to delete from scripts bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'scripts');

COMMIT; 