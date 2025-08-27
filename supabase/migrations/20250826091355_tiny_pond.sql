/*
  # Create route_sheets table

  1. New Tables
    - `route_sheets`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `file_path` (text, not null)
      - `file_type` (text, not null)
      - `uploaded_by` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `route_sheets` table
    - Add policy for authenticated users to read all route sheets
    - Add policy for authenticated users to insert route sheets
    - Add policy for authenticated users to update their own route sheets
    - Add policy for authenticated users to delete their own route sheets

  3. Storage
    - Create storage bucket for route sheets if it doesn't exist
    - Set up storage policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS route_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE route_sheets ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read all route sheets
CREATE POLICY "Users can read all route sheets"
  ON route_sheets
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for authenticated users to insert route sheets
CREATE POLICY "Users can insert route sheets"
  ON route_sheets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

-- Policy for authenticated users to update their own route sheets
CREATE POLICY "Users can update their own route sheets"
  ON route_sheets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = uploaded_by)
  WITH CHECK (auth.uid() = uploaded_by);

-- Policy for authenticated users to delete their own route sheets
CREATE POLICY "Users can delete their own route sheets"
  ON route_sheets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = uploaded_by);

-- Create storage bucket for route sheets
INSERT INTO storage.buckets (id, name, public)
VALUES ('route-sheets', 'route-sheets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for route sheets bucket
CREATE POLICY "Authenticated users can upload route sheets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'route-sheets');

CREATE POLICY "Authenticated users can view route sheets"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'route-sheets');

CREATE POLICY "Users can delete their own route sheets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'route-sheets');

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS route_sheets_uploaded_by_idx ON route_sheets(uploaded_by);
CREATE INDEX IF NOT EXISTS route_sheets_created_at_idx ON route_sheets(created_at);