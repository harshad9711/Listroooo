-- Create UGC Content table
CREATE TABLE IF NOT EXISTS ugc_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'twitter', 'youtube', 'manual')),
  platform_content_id TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('image', 'video', 'carousel', 'story', 'reel', 'post')),
  content_url TEXT,
  thumbnail_url TEXT,
  permalink TEXT,
  caption TEXT,
  username TEXT,
  hashtags TEXT[] DEFAULT '{}',
  mentions TEXT[] DEFAULT '{}',
  engagement_metrics JSONB DEFAULT '{"likes": 0, "comments": 0, "shares": 0, "views": 0, "saves": 0}',
  location JSONB,
  posted_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'featured')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('api', 'manual', 'instagram_api', 'facebook_api')),
  brand_mentions TEXT[] DEFAULT '{}',
  sentiment_score DECIMAL(3,2),
  quality_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create UGC Campaigns table
CREATE TABLE IF NOT EXISTS ugc_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  hashtags TEXT[] DEFAULT '{}',
  platforms TEXT[] DEFAULT '{}',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'paused', 'completed', 'draft')),
  target_metrics JSONB DEFAULT '{"total_posts": 0, "total_engagement": 0, "total_reach": 0}',
  actual_metrics JSONB DEFAULT '{"total_posts": 0, "total_engagement": 0, "total_reach": 0}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create UGC Influencers table
CREATE TABLE IF NOT EXISTS ugc_influencers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  platform TEXT NOT NULL,
  followers_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  content_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  contact_info JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create UGC Edits table
CREATE TABLE IF NOT EXISTS ugc_edits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES ugc_content(id) ON DELETE CASCADE,
  edit_type TEXT NOT NULL CHECK (edit_type IN ('auto', 'manual')),
  changes JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  output_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create UGC Voiceovers table
CREATE TABLE IF NOT EXISTS ugc_voiceovers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES ugc_content(id) ON DELETE CASCADE,
  voice_type TEXT NOT NULL CHECK (voice_type IN ('male', 'female', 'neutral', 'energetic', 'calm')),
  language TEXT NOT NULL DEFAULT 'en',
  script TEXT NOT NULL,
  audio_url TEXT,
  duration INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create UGC Hotspots table
CREATE TABLE IF NOT EXISTS ugc_hotspots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES ugc_content(id) ON DELETE CASCADE,
  hotspot_type TEXT NOT NULL CHECK (hotspot_type IN ('product', 'link', 'info', 'cta')),
  position JSONB NOT NULL,
  size JSONB NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create UGC Inbox table
CREATE TABLE IF NOT EXISTS ugc_inbox (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES ugc_content(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'approved', 'rejected', 'published')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI User Memory table
CREATE TABLE IF NOT EXISTS ai_user_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  last_prompt TEXT,
  preferences JSONB DEFAULT '{"theme": "dark", "language": "en"}',
  frequently_asked TEXT[] DEFAULT '{}',
  saved_actions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ugc_content_platform ON ugc_content(platform);
CREATE INDEX IF NOT EXISTS idx_ugc_content_status ON ugc_content(status);
CREATE INDEX IF NOT EXISTS idx_ugc_content_created_at ON ugc_content(created_at);
CREATE INDEX IF NOT EXISTS idx_ugc_content_hashtags ON ugc_content USING GIN(hashtags);
CREATE INDEX IF NOT EXISTS idx_ugc_content_tags ON ugc_content USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_ugc_content_platform_content_id ON ugc_content(platform_content_id);

CREATE INDEX IF NOT EXISTS idx_ugc_campaigns_status ON ugc_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ugc_campaigns_start_date ON ugc_campaigns(start_date);

CREATE INDEX IF NOT EXISTS idx_ugc_influencers_platform ON ugc_influencers(platform);
CREATE INDEX IF NOT EXISTS idx_ugc_influencers_status ON ugc_influencers(platform);

CREATE INDEX IF NOT EXISTS idx_ugc_edits_content_id ON ugc_edits(content_id);
CREATE INDEX IF NOT EXISTS idx_ugc_edits_status ON ugc_edits(status);

CREATE INDEX IF NOT EXISTS idx_ugc_voiceovers_content_id ON ugc_voiceovers(content_id);
CREATE INDEX IF NOT EXISTS idx_ugc_voiceovers_status ON ugc_voiceovers(status);

CREATE INDEX IF NOT EXISTS idx_ugc_hotspots_content_id ON ugc_hotspots(content_id);

CREATE INDEX IF NOT EXISTS idx_ugc_inbox_content_id ON ugc_inbox(content_id);
CREATE INDEX IF NOT EXISTS idx_ugc_inbox_status ON ugc_inbox(status);

-- Create RLS policies
ALTER TABLE ugc_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE ugc_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ugc_influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ugc_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ugc_voiceovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ugc_hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ugc_inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_user_memory ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (you may want to customize these based on your auth requirements)
CREATE POLICY "Enable read access for all users" ON ugc_content FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON ugc_content FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON ugc_content FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON ugc_content FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON ugc_campaigns FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON ugc_campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON ugc_campaigns FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON ugc_campaigns FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON ugc_influencers FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON ugc_influencers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON ugc_influencers FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON ugc_influencers FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON ugc_edits FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON ugc_edits FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON ugc_edits FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON ugc_edits FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON ugc_voiceovers FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON ugc_voiceovers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON ugc_voiceovers FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON ugc_voiceovers FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON ugc_hotspots FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON ugc_hotspots FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON ugc_hotspots FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON ugc_hotspots FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON ugc_inbox FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON ugc_inbox FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON ugc_inbox FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON ugc_inbox FOR DELETE USING (true);

CREATE POLICY "Enable read access for authenticated users" ON ai_user_memory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert access for authenticated users" ON ai_user_memory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update access for authenticated users" ON ai_user_memory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete access for authenticated users" ON ai_user_memory FOR DELETE USING (auth.uid() = user_id);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_ugc_content_updated_at BEFORE UPDATE ON ugc_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ugc_campaigns_updated_at BEFORE UPDATE ON ugc_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ugc_influencers_updated_at BEFORE UPDATE ON ugc_influencers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ugc_inbox_updated_at BEFORE UPDATE ON ugc_inbox FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_user_memory_updated_at BEFORE UPDATE ON ai_user_memory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
