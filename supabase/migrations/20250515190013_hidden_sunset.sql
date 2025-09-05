/*
  # Add delivery preferences schema

  1. New Tables
    - `delivery_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `type` (text, not null) - email, slack, in_app
      - `enabled` (boolean, default true)
      - `frequency` (text, not null) - instant, daily, weekly
      - `events` (text[], not null)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `delivery_preferences` table
    - Add policies for authenticated users to manage their preferences
*/

CREATE TABLE IF NOT EXISTS delivery_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  type text NOT NULL,
  enabled boolean DEFAULT true,
  frequency text NOT NULL,
  events text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE delivery_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences"
  ON delivery_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create preferences"
  ON delivery_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON delivery_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create unique constraint to ensure one preference type per user
CREATE UNIQUE INDEX delivery_preferences_user_type_idx ON delivery_preferences (user_id, type);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_delivery_preferences_updated_at
  BEFORE UPDATE ON delivery_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();