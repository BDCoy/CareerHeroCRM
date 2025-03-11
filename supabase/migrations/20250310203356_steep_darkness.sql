/*
  # Create templates table for WhatsApp message templates

  1. New Tables
    - `templates`
      - `id` (uuid, primary key)
      - `name` (text, required) - Template name/title
      - `content` (text, required) - Template message content
      - `category` (text) - Template category/type
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
      - `is_active` (boolean) - Whether template is active
      - `user_id` (uuid) - Reference to auth.users
      - `variables` (jsonb) - Template variables/placeholders

  2. Security
    - Enable RLS on `templates` table
    - Add policies for authenticated users to:
      - Read all templates
      - Create/update/delete their own templates

  3. Changes
    - Initial table creation
    - Basic RLS policies
*/

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  user_id uuid REFERENCES auth.users(id),
  variables jsonb DEFAULT '{}',
  CONSTRAINT templates_name_check CHECK (char_length(name) > 0),
  CONSTRAINT templates_content_check CHECK (char_length(content) > 0)
);

-- Enable RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read all templates"
  ON templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create templates"
  ON templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON templates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX templates_user_id_idx ON templates(user_id);
CREATE INDEX templates_category_idx ON templates(category);
CREATE INDEX templates_is_active_idx ON templates(is_active);

-- Insert some sample templates
INSERT INTO templates (name, content, category, variables) VALUES
('Welcome Message', 'Hi {{name}}, welcome to our service! How can we help you today?', 'greeting', '{"name": "string"}'),
('Follow Up', 'Hello {{name}}, just following up on our previous conversation about {{topic}}. Would you like to discuss further?', 'follow_up', '{"name": "string", "topic": "string"}'),
('Appointment Reminder', 'Reminder: Your appointment is scheduled for {{date}} at {{time}}. Please let us know if you need to reschedule.', 'reminder', '{"date": "string", "time": "string"}'),
('Payment Confirmation', 'Thank you for your payment of {{amount}}. Your transaction ID is {{transaction_id}}.', 'payment', '{"amount": "string", "transaction_id": "string"}'),
('Support Response', 'Hi {{name}}, regarding your support request #{{ticket_id}}: {{response}}', 'support', '{"name": "string", "ticket_id": "string", "response": "string"}');

-- Add function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();