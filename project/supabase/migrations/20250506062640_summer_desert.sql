/*
  # Create listings table

  1. New Tables
    - `listings`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `description` (text)
      - `status` (text, not null)
      - `platform` (text, not null)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on `listings` table
    - Add policies for authenticated users to:
      - Read their own listings
      - Create new listings
      - Update their own listings
*/

CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL,
  platform text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users NOT NULL
);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own listings"
  ON listings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create listings"
  ON listings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own listings"
  ON listings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);