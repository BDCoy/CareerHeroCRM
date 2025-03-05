/*
  # Fix storage policies for resume uploads

  1. Changes
    - Add public policy for anonymous users to upload files to customer-files bucket
    - Ensure all users can access the storage bucket
  2. Security
    - Maintain existing RLS policies
    - Add specific policy for anonymous uploads
*/

-- Create a policy to allow anonymous users to upload files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Allow anonymous uploads to customer-files'
  ) THEN
    CREATE POLICY "Allow anonymous uploads to customer-files"
      ON storage.objects
      FOR INSERT
      TO anon
      WITH CHECK (bucket_id = 'customer-files');
  END IF;
END $$;

-- Create a policy to allow anonymous users to read files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Allow anonymous reads from customer-files'
  ) THEN
    CREATE POLICY "Allow anonymous reads from customer-files"
      ON storage.objects
      FOR SELECT
      TO anon
      USING (bucket_id = 'customer-files');
  END IF;
END $$;

-- Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('customer-files', 'customer-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;