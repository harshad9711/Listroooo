-- Create missing tables for features that currently use mock data

-- Ad Creatives Table
CREATE TABLE IF NOT EXISTS ad_creatives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT,
  thumbnail_url TEXT,
  platform TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'carousel')),
  performance JSONB DEFAULT '{}',
  spend DECIMAL(10,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  ctr DECIMAL(5,2) DEFAULT 0,
  cost_per_conversion DECIMAL(10,2) DEFAULT 0,
  last_refreshed TIMESTAMP WITH TIME ZONE,
  refresh_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitors Table
CREATE TABLE IF NOT EXISTS competitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT,
  market_share DECIMAL(5,2),
  price_range TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'monitoring', 'new')),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitor Activities Table
CREATE TABLE IF NOT EXISTS competitor_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('product_launch', 'price_change', 'promotion', 'ad_campaign', 'partnership')),
  title TEXT NOT NULL,
  description TEXT,
  impact TEXT CHECK (impact IN ('high', 'medium', 'low')),
  url TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Abandoned Carts Table
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID,
  customer_email TEXT,
  customer_name TEXT,
  total_value DECIMAL(10,2) NOT NULL,
  platform TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'recovered', 'expired')),
  abandoned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recovered_at TIMESTAMP WITH TIME ZONE,
  recovery_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart Items Table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id UUID REFERENCES abandoned_carts(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_id TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Winning Ads Table
CREATE TABLE IF NOT EXISTS winning_ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  image_url TEXT,
  platform TEXT NOT NULL,
  performance_score DECIMAL(3,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr DECIMAL(5,2) DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- UGC Split Tests Table
CREATE TABLE IF NOT EXISTS ugc_split_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('image', 'video')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'paused')),
  test_duration INTEGER DEFAULT 7,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  winner_id UUID,
  confidence_level DECIMAL(5,2),
  improvement_percentage DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test Variants Table
CREATE TABLE IF NOT EXISTS test_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID REFERENCES ugc_split_tests(id) ON DELETE CASCADE,
  content_url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  impressions INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  ad_spend DECIMAL(10,2) DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automation Reminders Table
CREATE TABLE IF NOT EXISTS automation_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('budget_review', 'campaign_check', 'report_due', 'meeting')),
  frequency TEXT DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'custom')),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  last_sent TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automation Playbooks Table
CREATE TABLE IF NOT EXISTS automation_playbooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('financial', 'marketing', 'product', 'operational')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'draft')),
  schedule TEXT,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  success_rate DECIMAL(5,2) DEFAULT 0,
  avg_duration INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ad_creatives_user_id ON ad_creatives(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_creatives_platform ON ad_creatives(platform);
CREATE INDEX IF NOT EXISTS idx_ad_creatives_status ON ad_creatives(status);

CREATE INDEX IF NOT EXISTS idx_competitors_user_id ON competitors(user_id);
CREATE INDEX IF NOT EXISTS idx_competitors_status ON competitors(status);

CREATE INDEX IF NOT EXISTS idx_competitor_activities_competitor_id ON competitor_activities(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_activities_timestamp ON competitor_activities(timestamp);

CREATE INDEX IF NOT EXISTS idx_abandoned_carts_user_id ON abandoned_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_status ON abandoned_carts(status);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_platform ON abandoned_carts(platform);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);

CREATE INDEX IF NOT EXISTS idx_winning_ads_user_id ON winning_ads(user_id);
CREATE INDEX IF NOT EXISTS idx_winning_ads_platform ON winning_ads(platform);

CREATE INDEX IF NOT EXISTS idx_ugc_split_tests_user_id ON ugc_split_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_ugc_split_tests_status ON ugc_split_tests(status);

CREATE INDEX IF NOT EXISTS idx_test_variants_test_id ON test_variants(test_id);

CREATE INDEX IF NOT EXISTS idx_automation_reminders_user_id ON automation_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_reminders_due_date ON automation_reminders(due_date);

CREATE INDEX IF NOT EXISTS idx_automation_playbooks_user_id ON automation_playbooks(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_playbooks_status ON automation_playbooks(status);

-- Enable Row Level Security
ALTER TABLE ad_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE winning_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ugc_split_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_playbooks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own ad creatives" ON ad_creatives
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ad creatives" ON ad_creatives
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ad creatives" ON ad_creatives
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own competitors" ON competitors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own competitors" ON competitors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own competitors" ON competitors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view competitor activities for their competitors" ON competitor_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM competitors 
      WHERE competitors.id = competitor_activities.competitor_id 
      AND competitors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own abandoned carts" ON abandoned_carts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own abandoned carts" ON abandoned_carts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own abandoned carts" ON abandoned_carts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view cart items for their carts" ON cart_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM abandoned_carts 
      WHERE abandoned_carts.id = cart_items.cart_id 
      AND abandoned_carts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own winning ads" ON winning_ads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own winning ads" ON winning_ads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own winning ads" ON winning_ads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own split tests" ON ugc_split_tests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own split tests" ON ugc_split_tests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own split tests" ON ugc_split_tests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view test variants for their tests" ON test_variants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ugc_split_tests 
      WHERE ugc_split_tests.id = test_variants.test_id 
      AND ugc_split_tests.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own automation reminders" ON automation_reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own automation reminders" ON automation_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automation reminders" ON automation_reminders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own automation playbooks" ON automation_playbooks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own automation playbooks" ON automation_playbooks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automation playbooks" ON automation_playbooks
  FOR UPDATE USING (auth.uid() = user_id); 