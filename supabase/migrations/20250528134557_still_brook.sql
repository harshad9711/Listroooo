/*
  # Create A/B testing schema

  1. New Tables
    - `listing_variants`
      - `id` (uuid, primary key)
      - `listing_id` (uuid, references listings)
      - `title` (text)
      - `description` (text)
      - `price` (numeric)
      - `created_at` (timestamptz)
      - `user_id` (uuid, references auth.users)

    - `ab_tests`
      - `id` (uuid, primary key)
      - `name` (text)
      - `listing_id` (uuid, references listings)
      - `control_variant_id` (uuid, references listing_variants)
      - `test_variant_id` (uuid, references listing_variants)
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `status` (text)
      - `created_at` (timestamptz)
      - `user_id` (uuid, references auth.users)

    - `ab_test_results`
      - `id` (uuid, primary key)
      - `test_id` (uuid, references ab_tests)
      - `variant_id` (uuid, references listing_variants)
      - `impressions` (integer)
      - `clicks` (integer)
      - `conversions` (integer)
      - `revenue` (numeric)
      - `date` (date)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their tests
*/

-- Create listing variants table
CREATE TABLE IF NOT EXISTS listing_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings NOT NULL,
  title text,
  description text,
  price numeric,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users NOT NULL
);

-- Create A/B tests table
CREATE TABLE IF NOT EXISTS ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  listing_id uuid REFERENCES listings NOT NULL,
  control_variant_id uuid REFERENCES listing_variants NOT NULL,
  test_variant_id uuid REFERENCES listing_variants NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users NOT NULL,
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- Create A/B test results table
CREATE TABLE IF NOT EXISTS ab_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid REFERENCES ab_tests NOT NULL,
  variant_id uuid REFERENCES listing_variants NOT NULL,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  conversions integer DEFAULT 0,
  revenue numeric DEFAULT 0,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE listing_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;

-- Listing variants policies
CREATE POLICY "Users can read own variants"
  ON listing_variants
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create variants"
  ON listing_variants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own variants"
  ON listing_variants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- A/B tests policies
CREATE POLICY "Users can read own tests"
  ON ab_tests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create tests"
  ON ab_tests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tests"
  ON ab_tests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Test results policies
CREATE POLICY "Users can read test results"
  ON ab_test_results
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ab_tests
    WHERE ab_tests.id = ab_test_results.test_id
    AND ab_tests.user_id = auth.uid()
  ));

CREATE POLICY "Users can create test results"
  ON ab_test_results
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM ab_tests
    WHERE ab_tests.id = ab_test_results.test_id
    AND ab_tests.user_id = auth.uid()
  ));

-- Create indexes
CREATE INDEX listing_variants_listing_id_idx ON listing_variants(listing_id);
CREATE INDEX ab_tests_listing_id_idx ON ab_tests(listing_id);
CREATE INDEX ab_test_results_test_id_idx ON ab_test_results(test_id);
CREATE INDEX ab_test_results_variant_id_idx ON ab_test_results(variant_id);
CREATE INDEX ab_test_results_date_idx ON ab_test_results(date);