/*
  # Create inventory management schema

  1. New Tables
    - `inventory_levels`
      - `id` (uuid, primary key)
      - `sku` (text, not null)
      - `channel` (text, not null)
      - `on_hand` (integer)
      - `reserved` (integer)
      - `updated_at` (timestamptz)
      - `user_id` (uuid, references auth.users)

    - `demand_forecasts`
      - `id` (uuid, primary key)
      - `sku` (text, not null)
      - `channel` (text, not null)
      - `forecast_date` (date, not null)
      - `forecast_qty` (integer)
      - `created_at` (timestamptz)
      - `user_id` (uuid, references auth.users)

    - `reorder_recommendations`
      - `id` (uuid, primary key)
      - `sku` (text, not null)
      - `recommended_qty` (integer)
      - `target_days_cover` (integer)
      - `created_at` (timestamptz)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their data
*/

CREATE TABLE IF NOT EXISTS inventory_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL,
  channel text NOT NULL,
  on_hand integer DEFAULT 0,
  reserved integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users NOT NULL
);

CREATE TABLE IF NOT EXISTS demand_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL,
  channel text NOT NULL,
  forecast_date date NOT NULL,
  forecast_qty integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users NOT NULL
);

CREATE TABLE IF NOT EXISTS reorder_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL,
  recommended_qty integer DEFAULT 0,
  target_days_cover integer DEFAULT 7,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users NOT NULL
);

-- Enable RLS
ALTER TABLE inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reorder_recommendations ENABLE ROW LEVEL SECURITY;

-- Inventory Levels Policies
CREATE POLICY "Users can read own inventory"
  ON inventory_levels
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert inventory"
  ON inventory_levels
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory"
  ON inventory_levels
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Demand Forecasts Policies
CREATE POLICY "Users can read own forecasts"
  ON demand_forecasts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert forecasts"
  ON demand_forecasts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Reorder Recommendations Policies
CREATE POLICY "Users can read own recommendations"
  ON reorder_recommendations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert recommendations"
  ON reorder_recommendations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX inventory_levels_sku_idx ON inventory_levels(sku);
CREATE INDEX inventory_levels_channel_idx ON inventory_levels(channel);
CREATE INDEX demand_forecasts_sku_idx ON demand_forecasts(sku);
CREATE INDEX demand_forecasts_date_idx ON demand_forecasts(forecast_date);