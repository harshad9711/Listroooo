/*
  # Add launch plans table

  1. New Tables
    - `launch_plans`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `product_name` (text)
      - `category` (text)
      - `target_audience` (text)
      - `budget` (text)
      - `timeline` (text)
      - `goals` (text)
      - `plan_text` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `launch_plans` table
    - Add policies for authenticated users to manage their launch plans
*/

CREATE TABLE IF NOT EXISTS launch_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  product_name text NOT NULL,
  category text NOT NULL,
  target_audience text NOT NULL,
  budget text NOT NULL,
  timeline text NOT NULL,
  goals text NOT NULL,
  plan_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE launch_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own launch plans"
  ON launch_plans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create launch plans"
  ON launch_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own launch plans"
  ON launch_plans
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);