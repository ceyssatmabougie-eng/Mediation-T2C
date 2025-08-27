/*
  # Create interventions table

  1. New Tables
    - `interventions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `date` (date, not null)
      - `time` (time, not null)
      - `line` (text, not null)
      - `custom_line` (text, nullable)
      - `vehicle_number` (text, not null)
      - `stop` (text, not null)
      - `regulation` (integer, default 0)
      - `help` (integer, default 0)
      - `aggression` (integer, default 0)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `interventions` table
    - Add policy for authenticated users to read all interventions
    - Add policy for authenticated users to insert their own interventions
    - Add policy for authenticated users to update their own interventions
    - Add policy for authenticated users to delete their own interventions
*/

CREATE TABLE IF NOT EXISTS interventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  time time NOT NULL,
  line text NOT NULL,
  custom_line text,
  vehicle_number text NOT NULL,
  stop text NOT NULL,
  regulation integer NOT NULL DEFAULT 0,
  help integer NOT NULL DEFAULT 0,
  aggression integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read all interventions
CREATE POLICY "Users can read all interventions"
  ON interventions
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for authenticated users to insert their own interventions
CREATE POLICY "Users can insert their own interventions"
  ON interventions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for authenticated users to update their own interventions
CREATE POLICY "Users can update their own interventions"
  ON interventions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for authenticated users to delete their own interventions
CREATE POLICY "Users can delete their own interventions"
  ON interventions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS interventions_user_id_date_idx ON interventions(user_id, date);
CREATE INDEX IF NOT EXISTS interventions_date_idx ON interventions(date);