-- Google Veo 3 Production Infrastructure
-- This migration creates the database schema for production-ready Google Veo 3

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Google Veo 3 Videos Table
CREATE TABLE IF NOT EXISTS google_veo3_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    style TEXT NOT NULL,
    tone TEXT NOT NULL,
    aspect_ratio TEXT NOT NULL,
    target_platform TEXT NOT NULL,
    duration INTEGER NOT NULL,
    resolution TEXT NOT NULL,
    format TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    video_url TEXT,
    thumbnail_url TEXT,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    api_response JSONB DEFAULT '{}',
    processing_time_ms INTEGER,
    file_size_bytes BIGINT,
    mime_type TEXT
);

-- Google Veo 3 User Quotas Table
CREATE TABLE IF NOT EXISTS google_veo3_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    daily_limit INTEGER NOT NULL DEFAULT 10,
    monthly_limit INTEGER NOT NULL DEFAULT 100,
    daily_used INTEGER NOT NULL DEFAULT 0,
    monthly_used INTEGER NOT NULL DEFAULT 0,
    last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
    last_reset_month DATE NOT NULL DEFAULT DATE_TRUNC('month', CURRENT_DATE),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Google Veo 3 Analytics Table
CREATE TABLE IF NOT EXISTS google_veo3_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES google_veo3_videos(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('generation_started', 'generation_completed', 'generation_failed', 'video_viewed', 'video_downloaded', 'video_shared')),
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Google Veo 3 API Logs Table
CREATE TABLE IF NOT EXISTS google_veo3_api_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES google_veo3_videos(id) ON DELETE CASCADE,
    api_endpoint TEXT NOT NULL,
    request_payload JSONB DEFAULT '{}',
    response_payload JSONB DEFAULT '{}',
    status_code INTEGER,
    response_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_google_veo3_videos_user_id ON google_veo3_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_google_veo3_videos_status ON google_veo3_videos(status);
CREATE INDEX IF NOT EXISTS idx_google_veo3_videos_created_at ON google_veo3_videos(created_at);
CREATE INDEX IF NOT EXISTS idx_google_veo3_videos_style ON google_veo3_videos(style);
CREATE INDEX IF NOT EXISTS idx_google_veo3_videos_platform ON google_veo3_videos(target_platform);

CREATE INDEX IF NOT EXISTS idx_google_veo3_quotas_user_id ON google_veo3_quotas(user_id);
CREATE INDEX IF NOT EXISTS idx_google_veo3_analytics_user_id ON google_veo3_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_google_veo3_analytics_video_id ON google_veo3_analytics(video_id);
CREATE INDEX IF NOT EXISTS idx_google_veo3_api_logs_video_id ON google_veo3_api_logs(video_id);

-- Create functions for quota management
CREATE OR REPLACE FUNCTION check_user_veo3_quota(user_uuid UUID)
RETURNS TABLE(allowed BOOLEAN, message TEXT, daily_remaining INTEGER, monthly_remaining INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Get or create user quota
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
            WHEN q.daily_used >= q.daily_limit THEN 'Daily limit reached. Try again tomorrow.'
            WHEN q.monthly_used >= q.monthly_limit THEN 'Monthly limit reached. Upgrade your plan.'
            ELSE 'Quota available.'
        END as message,
        GREATEST(0, q.daily_limit - q.daily_used) as daily_remaining,
        GREATEST(0, q.monthly_limit - q.monthly_used) as monthly_remaining
    FROM google_veo3_quotas q
    WHERE q.user_id = user_uuid;
END;
$$;

-- Function to increment quota usage
CREATE OR REPLACE FUNCTION increment_veo3_quota(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE google_veo3_quotas 
    SET daily_used = daily_used + 1, monthly_used = monthly_used + 1, updated_at = NOW()
    WHERE user_id = user_uuid;
    
    RETURN FOUND;
END;
$$;

-- Function to log analytics events
CREATE OR REPLACE FUNCTION log_veo3_analytics(
    user_uuid UUID,
    video_uuid UUID,
    event_type_param TEXT,
    event_data_param JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    analytics_id UUID;
BEGIN
    INSERT INTO google_veo3_analytics (user_id, video_id, event_type, event_data)
    VALUES (user_uuid, video_uuid, event_type_param, event_data_param)
    RETURNING id INTO analytics_id;
    
    RETURN analytics_id;
END;
$$;

-- Function to log API calls
CREATE OR REPLACE FUNCTION log_veo3_api_call(
    video_uuid UUID,
    endpoint_param TEXT,
    request_payload_param JSONB DEFAULT '{}',
    response_payload_param JSONB DEFAULT '{}',
    status_code_param INTEGER DEFAULT NULL,
    response_time_param INTEGER DEFAULT NULL,
    error_message_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO google_veo3_api_logs (
        video_id, api_endpoint, request_payload, response_payload, 
        status_code, response_time_ms, error_message
    )
    VALUES (
        video_uuid, endpoint_param, request_payload_param, response_payload_param,
        status_code_param, response_time_param, error_message_param
    )
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;

-- Row Level Security (RLS) policies
ALTER TABLE google_veo3_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_veo3_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_veo3_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_veo3_api_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for google_veo3_videos
CREATE POLICY "Users can view their own videos" ON google_veo3_videos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own videos" ON google_veo3_videos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos" ON google_veo3_videos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos" ON google_veo3_videos
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for google_veo3_quotas
CREATE POLICY "Users can view their own quotas" ON google_veo3_quotas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotas" ON google_veo3_quotas
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for google_veo3_analytics
CREATE POLICY "Users can view their own analytics" ON google_veo3_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics" ON google_veo3_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for google_veo3_api_logs
CREATE POLICY "Users can view their own API logs" ON google_veo3_api_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM google_veo3_videos 
            WHERE id = google_veo3_api_logs.video_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own API logs" ON google_veo3_api_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM google_veo3_videos 
            WHERE id = google_veo3_api_logs.video_id 
            AND user_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
