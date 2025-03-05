/*
  # Fix database schema with lowercase column names

  1. New Tables (if not exist)
    - `customers` table with lowercase column names
    - `communications` table with lowercase column names
  2. Security
    - Enable RLS on tables
    - Add policies for authenticated users
  3. Storage
    - Create bucket for customer files
    - Set up storage policies
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firstname text NOT NULL,
  lastname text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  status text NOT NULL CHECK (status IN ('lead', 'prospect', 'customer', 'inactive')),
  source text,
  notes text,
  createdat timestamptz NOT NULL DEFAULT now(),
  updatedat timestamptz NOT NULL DEFAULT now(),
  resumeurl text,
  resumedata jsonb
);

-- Create communications table
CREATE TABLE IF NOT EXISTS communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customerid uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('email', 'sms', 'whatsapp')),
  content text NOT NULL,
  sentat timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('sent', 'delivered', 'failed'))
);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

-- Create policies for customers table (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users can create customers'
  ) THEN
    CREATE POLICY "Users can create customers"
      ON customers
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users can view customers'
  ) THEN
    CREATE POLICY "Users can view customers"
      ON customers
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users can update customers'
  ) THEN
    CREATE POLICY "Users can update customers"
      ON customers
      FOR UPDATE
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users can delete customers'
  ) THEN
    CREATE POLICY "Users can delete customers"
      ON customers
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Create policies for communications table (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'communications' AND policyname = 'Users can create communications'
  ) THEN
    CREATE POLICY "Users can create communications"
      ON communications
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'communications' AND policyname = 'Users can view communications'
  ) THEN
    CREATE POLICY "Users can view communications"
      ON communications
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'communications' AND policyname = 'Users can update communications'
  ) THEN
    CREATE POLICY "Users can update communications"
      ON communications
      FOR UPDATE
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'communications' AND policyname = 'Users can delete communications'
  ) THEN
    CREATE POLICY "Users can delete communications"
      ON communications
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Create storage bucket for resume files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('customer-files', 'customer-files', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policy (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public access to customer-files'
  ) THEN
    CREATE POLICY "Public access to customer-files"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'customer-files');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated users can upload customer files'
  ) THEN
    CREATE POLICY "Authenticated users can upload customer files"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'customer-files');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated users can update customer files'
  ) THEN
    CREATE POLICY "Authenticated users can update customer files"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'customer-files');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated users can delete customer files'
  ) THEN
    CREATE POLICY "Authenticated users can delete customer files"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (bucket_id = 'customer-files');
  END IF;
END $$;