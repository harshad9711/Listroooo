/*
  # Add Marketing Intelligence Schema

  1. New Tables
    - `marketing_metrics`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `date` (date)
      - `platform` (text)
      - `impressions` (integer)
      - `clicks` (integer)
      - `conversions` (integer)
      - `revenue` (numeric)
      - `cost` (numeric)
      - `created_at` (timestamptz)

    - `competitor_insights`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `platform` (text)
      - `ad_count` (integer)
      - `avg_ctr` (numeric)
      - `avg_cpc` (numeric)
      - `top_keywords` (text[])
      - `creative_types` (jsonb)
      - `created_at` (timestamptz)

    - `customer_segments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `segment_name` (text)
      - `size` (integer)
      - `ltv` (numeric)
      - `churn_risk` (numeric)
      - `attributes` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their data
*/

-- Marketing Metrics Table
CREATE TABLE IF NOT EXISTS marketing_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  date date NOT NULL,
  platform text NOT NULL,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  conversions integer DEFAULT 0,
  revenue numeric DEFAULT 0,
  cost numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Competitor Insights Table
CREATE TABLE IF NOT EXISTS competitor_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  platform text NOT NULL,
  ad_count integer DEFAULT 0,
  avg_ctr numeric DEFAULT 0,
  avg_cpc numeric DEFAULT 0,
  top_keywords text[] DEFAULT '{}',
  creative_types jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Customer Segments Table
CREATE TABLE IF NOT EXISTS customer_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  segment_name text NOT NULL,
  size integer DEFAULT 0,
  ltv numeric DEFAULT 0,
  churn_risk numeric DEFAULT 0,
  attributes jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE marketing_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;

-- Marketing Metrics Policies
CREATE POLICY "Users can read own marketing metrics"
  ON marketing_metrics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert marketing metrics"
  ON marketing_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Competitor Insights Policies
CREATE POLICY "Users can read own competitor insights"
  ON competitor_insights
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert competitor insights"
  ON competitor_insights
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Customer Segments Policies
CREATE POLICY "Users can read own customer segments"
  ON customer_segments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert customer segments"
  ON customer_segments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX marketing_metrics_user_date_idx ON marketing_metrics(user_id, date);
CREATE INDEX marketing_metrics_platform_idx ON marketing_metrics(platform);
CREATE INDEX competitor_insights_user_platform_idx ON competitor_insights(user_id, platform);
CREATE INDEX customer_segments_user_idx ON customer_segments(user_id);