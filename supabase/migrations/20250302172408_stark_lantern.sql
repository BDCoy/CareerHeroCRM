/*
  # Initial Schema Setup for CRM System

  1. New Tables
    - `customers` - Stores customer information
      - `id` (uuid, primary key)
      - `firstName` (text)
      - `lastName` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `status` (text)
      - `source` (text)
      - `notes` (text)
      - `createdAt` (timestamptz)
      - `updatedAt` (timestamptz)
      - `resumeUrl` (text, nullable)
      - `resumeData` (jsonb, nullable)
    
    - `communications` - Stores communication history
      - `id` (uuid, primary key)
      - `customerId` (uuid, foreign key to customers.id)
      - `type` (text)
      - `content` (text)
      - `sentAt` (timestamptz)
      - `status` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to perform CRUD operations
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firstName text NOT NULL,
  lastName text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  status text NOT NULL CHECK (status IN ('lead', 'prospect', 'customer', 'inactive')),
  source text,
  notes text,
  createdAt timestamptz NOT NULL DEFAULT now(),
  updatedAt timestamptz NOT NULL DEFAULT now(),
  resumeUrl text,
  resumeData jsonb
);

-- Create communications table
CREATE TABLE IF NOT EXISTS communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customerId uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('email', 'sms', 'whatsapp')),
  content text NOT NULL,
  sentAt timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('sent', 'delivered', 'failed'))
);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

-- Create policies for customers table
CREATE POLICY "Users can create customers"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update customers"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete customers"
  ON customers
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for communications table
CREATE POLICY "Users can create communications"
  ON communications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view communications"
  ON communications
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update communications"
  ON communications
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete communications"
  ON communications
  FOR DELETE
  TO authenticated
  USING (true);

-- Create storage bucket for resume files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('customer-files', 'customer-files', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policy
CREATE POLICY "Public access to customer-files"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'customer-files');

CREATE POLICY "Authenticated users can upload customer files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'customer-files');

CREATE POLICY "Authenticated users can update customer files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'customer-files');

CREATE POLICY "Authenticated users can delete customer files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'customer-files');