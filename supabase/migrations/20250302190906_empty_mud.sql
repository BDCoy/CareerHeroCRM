/*
  # Customer Persistence Improvements

  1. Changes
    - Add indexes to improve query performance
    - Add constraints to ensure data integrity
    - Add triggers to automatically update the 'updatedat' timestamp
    - Add default values for required fields
    - Add cascade delete for related records

  2. Security
    - Ensure RLS policies are properly configured
    - Add additional policies for anonymous access
*/

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_createdat ON customers(createdat);
CREATE INDEX IF NOT EXISTS idx_communications_customerid ON communications(customerid);
CREATE INDEX IF NOT EXISTS idx_communications_type ON communications(type);
CREATE INDEX IF NOT EXISTS idx_communications_sentat ON communications(sentat);

-- Add trigger to automatically update the 'updatedat' timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedat = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_customers_updatedat'
  ) THEN
    CREATE TRIGGER set_customers_updatedat
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
  END IF;
END $$;

-- Add default values for required fields if they don't exist
ALTER TABLE customers 
  ALTER COLUMN status SET DEFAULT 'lead',
  ALTER COLUMN createdat SET DEFAULT now(),
  ALTER COLUMN updatedat SET DEFAULT now();

-- Ensure cascade delete for communications when a customer is deleted
-- This is already set up in the original migration, but we'll check to make sure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'communications_customerid_fkey' 
    AND confdeltype = 'c'
  ) THEN
    -- If the constraint exists but doesn't cascade, drop and recreate it
    ALTER TABLE communications DROP CONSTRAINT IF EXISTS communications_customerid_fkey;
    
    ALTER TABLE communications
    ADD CONSTRAINT communications_customerid_fkey
    FOREIGN KEY (customerid) REFERENCES customers(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure all required RLS policies exist for customers table
DO $$
BEGIN
  -- For authenticated users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customers' 
    AND policyname = 'Users can create customers'
  ) THEN
    CREATE POLICY "Users can create customers"
      ON customers
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customers' 
    AND policyname = 'Users can view customers'
  ) THEN
    CREATE POLICY "Users can view customers"
      ON customers
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customers' 
    AND policyname = 'Users can update customers'
  ) THEN
    CREATE POLICY "Users can update customers"
      ON customers
      FOR UPDATE
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customers' 
    AND policyname = 'Users can delete customers'
  ) THEN
    CREATE POLICY "Users can delete customers"
      ON customers
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;

  -- For anonymous users (for demo purposes)
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

-- Ensure all required RLS policies exist for communications table
DO $$
BEGIN
  -- For authenticated users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'communications' 
    AND policyname = 'Users can create communications'
  ) THEN
    CREATE POLICY "Users can create communications"
      ON communications
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'communications' 
    AND policyname = 'Users can view communications'
  ) THEN
    CREATE POLICY "Users can view communications"
      ON communications
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'communications' 
    AND policyname = 'Users can update communications'
  ) THEN
    CREATE POLICY "Users can update communications"
      ON communications
      FOR UPDATE
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'communications' 
    AND policyname = 'Users can delete communications'
  ) THEN
    CREATE POLICY "Users can delete communications"
      ON communications
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;

  -- For anonymous users (for demo purposes)
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