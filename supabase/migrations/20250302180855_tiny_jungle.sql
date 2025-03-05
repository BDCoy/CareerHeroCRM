/*
  # Fix RLS policies for anonymous access

  1. Changes
    - Add RLS policies for anonymous users to access customers table
    - Allow anonymous users to insert, select, update, and delete from customers table
    - Fix policy names to avoid conflicts
  
  2. Security
    - These policies are intentionally permissive for demo purposes
    - In a production environment, you would want more restrictive policies
*/

-- Create policies for anonymous users to access customers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customers' 
    AND policyname = 'Allow anonymous to create customers'
  ) THEN
    CREATE POLICY "Allow anonymous to create customers"
      ON customers
      FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customers' 
    AND policyname = 'Allow anonymous to view customers'
  ) THEN
    CREATE POLICY "Allow anonymous to view customers"
      ON customers
      FOR SELECT
      TO anon
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customers' 
    AND policyname = 'Allow anonymous to update customers'
  ) THEN
    CREATE POLICY "Allow anonymous to update customers"
      ON customers
      FOR UPDATE
      TO anon
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customers' 
    AND policyname = 'Allow anonymous to delete customers'
  ) THEN
    CREATE POLICY "Allow anonymous to delete customers"
      ON customers
      FOR DELETE
      TO anon
      USING (true);
  END IF;
END $$;

-- Create policies for anonymous users to access communications table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'communications' 
    AND policyname = 'Allow anonymous to create communications'
  ) THEN
    CREATE POLICY "Allow anonymous to create communications"
      ON communications
      FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'communications' 
    AND policyname = 'Allow anonymous to view communications'
  ) THEN
    CREATE POLICY "Allow anonymous to view communications"
      ON communications
      FOR SELECT
      TO anon
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'communications' 
    AND policyname = 'Allow anonymous to update communications'
  ) THEN
    CREATE POLICY "Allow anonymous to update communications"
      ON communications
      FOR UPDATE
      TO anon
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'communications' 
    AND policyname = 'Allow anonymous to delete communications'
  ) THEN
    CREATE POLICY "Allow anonymous to delete communications"
      ON communications
      FOR DELETE
      TO anon
      USING (true);
  END IF;
END $$;