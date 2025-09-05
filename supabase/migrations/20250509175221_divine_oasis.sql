/*
  # Create ad tokens table

  1. New Tables
    - `ad_tokens`
      - `id` (uuid, primary key)
      - `platform` (text)
      - `access_token` (text)
      - `created_at` (timestamptz)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on `ad_tokens` table
    - Add policies for authenticated users to:
      - Read their own tokens
      - Create new tokens
      - Update their own tokens
*/

CREATE TABLE IF NOT EXISTS ad_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  access_token text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users NOT NULL
);

ALTER TABLE ad_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tokens"
  ON ad_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create tokens"
  ON ad_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens"
  ON ad_tokens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create unique constraint to ensure one token per platform per user
CREATE UNIQUE INDEX ad_tokens_user_platform_idx ON ad_tokens (user_id, platform);