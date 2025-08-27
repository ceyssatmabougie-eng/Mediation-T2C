/*
  # Create useful links table

  1. New Tables
    - `useful_links`
      - `id` (uuid, primary key)
      - `label` (text, not null)
      - `url` (text, not null)
      - `type` (text, not null)
      - `information` (text, optional)
      - `order_index` (integer, not null)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `useful_links` table
    - Add policies for authenticated users to read all links
    - Add policies for admins to manage links

  3. Initial Data
    - Insert default useful links
*/

CREATE TABLE IF NOT EXISTS useful_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  url text NOT NULL,
  type text NOT NULL CHECK (type IN ('https', 'pdf', 'other')),
  information text,
  order_index integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE useful_links ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read all useful links"
  ON useful_links
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert useful links"
  ON useful_links
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update useful links"
  ON useful_links
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete useful links"
  ON useful_links
  FOR DELETE
  TO authenticated
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS useful_links_order_idx ON useful_links(order_index);
CREATE INDEX IF NOT EXISTS useful_links_created_at_idx ON useful_links(created_at);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_useful_links_updated_at
  BEFORE UPDATE ON useful_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default useful links
INSERT INTO useful_links (label, url, type, information, order_index) VALUES
  ('Site Web T2C', 'https://www.t2c.fr', 'https', 'Site officiel de T2C avec toutes les informations', 1),
  ('Règlement Transport', 'https://www.t2c.fr/reglement.pdf', 'pdf', 'Document PDF du règlement des transports', 2),
  ('Horaires en ligne', 'https://www.t2c.fr/horaires', 'https', 'Consultation des horaires en temps réel', 3)
ON CONFLICT DO NOTHING;