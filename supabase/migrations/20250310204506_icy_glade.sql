/*
  # Remove variables column from templates table

  1. Changes
    - Remove the variables column from the templates table
*/

DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'templates' AND column_name = 'variables'
  ) THEN
    ALTER TABLE templates DROP COLUMN variables;
  END IF;
END $$;