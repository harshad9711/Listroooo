-- Simple Google Veo 3 Database Setup
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Google Veo 3 videos table
CREATE TABLE IF NOT EXISTS google_veo3_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    style VARCHAR(50) DEFAULT 'cinematic',
    tone VARCHAR(50) DEFAULT 'energetic',
    aspect_ratio VARCHAR(20) DEFAULT '16:9',
    target_platform VARCHAR(100) DEFAULT 'Instagram Reels',
    duration INTEGER DEFAULT 15,
    resolution VARCHAR(20) DEFAULT '1080p',
    format VARCHAR(20) DEFAULT 'landscape',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    video_url TEXT,
    thumbnail_url TEXT,
    error TEXT,
    processing_time_ms INTEGER,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create Google Veo 3 quotas table
CREATE TABLE IF NOT EXISTS google_veo3_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    daily_limit INTEGER DEFAULT 10,
    monthly_limit INTEGER DEFAULT 100,
    daily_used INTEGER DEFAULT 0,
    monthly_used INTEGER DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    last_reset_month DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Google Veo 3 analytics table
CREATE TABLE IF NOT EXISTS google_veo3_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id UUID REFERENCES google_veo3_videos(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Google Veo 3 API logs table
CREATE TABLE IF NOT EXISTS google_veo3_api_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES google_veo3_videos(id) ON DELETE CASCADE,
    endpoint VARCHAR(200) NOT NULL,
    request_payload JSONB DEFAULT '{}',
    response_payload JSONB DEFAULT '{}',
    status_code INTEGER NOT NULL,
    response_time INTEGER NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_google_veo3_videos_user_id ON google_veo3_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_google_veo3_videos_status ON google_veo3_videos(status);
CREATE INDEX IF NOT EXISTS idx_google_veo3_videos_created_at ON google_veo3_videos(created_at);
CREATE INDEX IF NOT EXISTS idx_google_veo3_quotas_user_id ON google_veo3_quotas(user_id);
CREATE INDEX IF NOT EXISTS idx_google_veo3_analytics_user_id ON google_veo3_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_google_veo3_analytics_video_id ON google_veo3_analytics(video_id);
CREATE INDEX IF NOT EXISTS idx_google_veo3_api_logs_video_id ON google_veo3_api_logs(video_id);

-- Create RLS policies
ALTER TABLE google_veo3_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_veo3_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_veo3_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_veo3_api_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy for google_veo3_videos
CREATE POLICY "Users can view their own videos" ON google_veo3_videos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own videos" ON google_veo3_videos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos" ON google_veo3_videos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos" ON google_veo3_videos
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policy for google_veo3_quotas
CREATE POLICY "Users can view their own quotas" ON google_veo3_quotas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quotas" ON google_veo3_quotas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotas" ON google_veo3_quotas
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policy for google_veo3_analytics
CREATE POLICY "Users can view their own analytics" ON google_veo3_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics" ON google_veo3_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy for google_veo3_api_logs
CREATE POLICY "Users can view their own API logs" ON google_veo3_api_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API logs" ON google_veo3_api_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create functions for quota management
CREATE OR REPLACE FUNCTION check_user_veo3_quota(user_uuid UUID)
RETURNS TABLE(allowed BOOLEAN, message TEXT, daily_remaining INTEGER, monthly_remaining INTEGER) AS $$
BEGIN
    -- Check if user has a quota record, create one if not
    INSERT INTO google_veo3_quotas (user_id, daily_limit, monthly_limit)
    VALUES (user_uuid, 10, 100)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Reset daily quota if it's a new day
    UPDATE google_veo3_quotas 
    SET daily_used = 0, last_reset_date = CURRENT_DATE
    WHERE user_id = user_uuid AND last_reset_date < CURRENT_DATE;
    
    -- Reset monthly quota if it's a new month
    UPDATE google_veo3_quotas 
    SET monthly_used = 0, last_reset_month = DATE_TRUNC('month', CURRENT_DATE)
    WHERE user_id = user_uuid AND last_reset_month < DATE_TRUNC('month', CURRENT_DATE);
    
    -- Return quota status
    RETURN QUERY
    SELECT 
        q.daily_used < q.daily_limit AND q.monthly_used < q.monthly_limit as allowed,
        CASE 
            WHEN q.daily_used >= q.daily_limit THEN 'Daily quota exceeded'
            WHEN q.monthly_used >= q.monthly_limit THEN 'Monthly quota exceeded'
            ELSE 'Quota available'
        END as message,
        GREATEST(0, q.daily_limit - q.daily_used) as daily_remaining,
        GREATEST(0, q.monthly_limit - q.monthly_used) as monthly_remaining
    FROM google_veo3_quotas q
    WHERE q.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment quota usage
CREATE OR REPLACE FUNCTION increment_veo3_quota(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE google_veo3_quotas 
    SET 
        daily_used = daily_used + 1,
        monthly_used = monthly_used + 1,
        updated_at = NOW()
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log analytics
CREATE OR REPLACE FUNCTION log_veo3_analytics(
    user_uuid UUID,
    video_uuid UUID,
    event_type_param VARCHAR(100),
    event_data_param JSONB
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO google_veo3_analytics (user_id, video_id, event_type, event_data)
    VALUES (user_uuid, video_uuid, event_type_param, event_data_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log API calls
CREATE OR REPLACE FUNCTION log_veo3_api_call(
    video_uuid UUID,
    endpoint_param VARCHAR(200),
    request_payload_param JSONB,
    response_payload_param JSONB,
    status_code_param INTEGER,
    response_time_param INTEGER,
    error_message_param TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO google_veo3_api_logs (
        video_id, endpoint, request_payload, response_payload, 
        status_code, response_time, error_message
    )
    VALUES (
        video_uuid, endpoint_param, request_payload_param, response_payload_param,
        status_code_param, response_time_param, error_message_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON google_veo3_videos TO authenticated;
GRANT ALL ON google_veo3_quotas TO authenticated;
GRANT ALL ON google_veo3_analytics TO authenticated;
GRANT ALL ON google_veo3_api_logs TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION check_user_veo3_quota(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_veo3_quota(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_veo3_analytics(UUID, UUID, VARCHAR, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION log_veo3_api_call(UUID, VARCHAR, JSONB, JSONB, INTEGER, INTEGER, TEXT) TO authenticated;
