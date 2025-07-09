/*
  # Store scan results

  1. New Tables
    - `scan_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `keyword` (text)
      - `status` (text)
      - `results` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `scan_history` table
    - Add policies for authenticated users to manage their scan history
*/

CREATE TABLE IF NOT EXISTS scan_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  keyword text NOT NULL,
  status text NOT NULL,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scan history"
  ON scan_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create scan history"
  ON scan_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scan history"
  ON scan_history
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);