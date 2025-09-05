/*
  # Scan History Schema

  1. New Tables
    - `scan_history_reports`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `scan_date` (timestamptz)
      - `keyword` (text)
      - `platform` (text)
      - `total_results` (integer)
      - `status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `scan_history_reports` table
    - Add policies for authenticated users to manage their scan history
*/

CREATE TABLE IF NOT EXISTS scan_history_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  scan_date timestamptz NOT NULL DEFAULT now(),
  keyword text NOT NULL,
  platform text NOT NULL,
  total_results integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE scan_history_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scan history"
  ON scan_history_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create scan history"
  ON scan_history_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scan history"
  ON scan_history_reports
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);