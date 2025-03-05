/*
  # Email Parser Support

  1. Changes
    - Add metadata JSONB column to communications table
    - Update communications table status to include 'received'
    - Add indexes for improved query performance

  2. Security
    - Ensure RLS policies are properly configured
*/

-- Add metadata column to communications table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'communications' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE communications ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- Create index on metadata column for better query performance
CREATE INDEX IF NOT EXISTS idx_communications_metadata ON communications USING GIN (metadata);

-- Create index on communications type for better filtering
CREATE INDEX IF NOT EXISTS idx_communications_type ON communications(type);

-- Create index on communications status for better filtering
CREATE INDEX IF NOT EXISTS idx_communications_status ON communications(status);

-- Ensure the status column accepts 'received' value
ALTER TABLE communications DROP CONSTRAINT IF EXISTS communications_status_check;
ALTER TABLE communications ADD CONSTRAINT communications_status_check 
  CHECK (status IN ('sent', 'delivered', 'failed', 'received'));

-- Add default values for required fields if they don't exist
ALTER TABLE communications 
  ALTER COLUMN sentat SET DEFAULT now();

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
END $$;