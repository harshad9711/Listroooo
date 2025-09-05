-- Veo3 Production Tables
-- This migration creates the database schema for production-ready Veo3 AI generation

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Veo3 Jobs Table
CREATE TABLE IF NOT EXISTS veo3_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('video', 'image', 'ad', 'batch')),
    prompts TEXT[] NOT NULL,
    options JSONB DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    results JSONB DEFAULT '[]',
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Veo3 Results Table
CREATE TABLE IF NOT EXISTS veo3_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES veo3_jobs(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    generated_content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('video', 'image', 'ad')),
    url TEXT,
    thumbnail TEXT,
    metadata JSONB DEFAULT '{}',
    feedback JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Veo3 Feedback Table
CREATE TABLE IF NOT EXISTS veo3_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    result_id UUID NOT NULL REFERENCES veo3_results(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Veo3 Analytics Table (for monitoring and insights)
CREATE TABLE IF NOT EXISTS veo3_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES veo3_jobs(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_veo3_jobs_user_id ON veo3_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_veo3_jobs_status ON veo3_jobs(status);
CREATE INDEX IF NOT EXISTS idx_veo3_jobs_created_at ON veo3_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_veo3_results_job_id ON veo3_results(job_id);
CREATE INDEX IF NOT EXISTS idx_veo3_feedback_result_id ON veo3_feedback(result_id);
CREATE INDEX IF NOT EXISTS idx_veo3_feedback_user_id ON veo3_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_veo3_analytics_user_id ON veo3_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_veo3_analytics_event_type ON veo3_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_veo3_analytics_created_at ON veo3_analytics(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_veo3_jobs_updated_at 
    BEFORE UPDATE ON veo3_jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE veo3_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE veo3_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE veo3_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE veo3_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for veo3_jobs
CREATE POLICY "Users can view their own jobs" ON veo3_jobs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own jobs" ON veo3_jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs" ON veo3_jobs
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies for veo3_results
CREATE POLICY "Users can view results from their jobs" ON veo3_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM veo3_jobs 
            WHERE veo3_jobs.id = veo3_results.job_id 
            AND veo3_jobs.user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert results" ON veo3_results
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own results" ON veo3_results
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM veo3_jobs 
            WHERE veo3_jobs.id = veo3_results.job_id 
            AND veo3_jobs.user_id = auth.uid()
        )
    );

-- Policies for veo3_feedback
CREATE POLICY "Users can view feedback on their results" ON veo3_feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM veo3_results 
            JOIN veo3_jobs ON veo3_jobs.id = veo3_results.job_id
            WHERE veo3_results.id = veo3_feedback.result_id 
            AND veo3_jobs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create feedback" ON veo3_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for veo3_analytics
CREATE POLICY "Users can view their own analytics" ON veo3_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert analytics" ON veo3_analytics
    FOR INSERT WITH CHECK (true);

-- Function to get user quota information
CREATE OR REPLACE FUNCTION get_user_veo3_quota(user_uuid UUID)
RETURNS TABLE(
    daily_usage INTEGER,
    daily_limit INTEGER,
    monthly_usage INTEGER,
    monthly_limit INTEGER,
    allowed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(daily.count, 0)::INTEGER as daily_usage,
        50::INTEGER as daily_limit, -- Adjust based on pricing tier
        COALESCE(monthly.count, 0)::INTEGER as monthly_usage,
        1000::INTEGER as monthly_limit, -- Adjust based on pricing tier
        CASE 
            WHEN COALESCE(daily.count, 0) < 50 AND COALESCE(monthly.count, 0) < 1000 THEN true
            ELSE false
        END as allowed
    FROM (
        SELECT COUNT(*) as count
        FROM veo3_jobs 
        WHERE user_id = user_uuid 
        AND created_at >= NOW() - INTERVAL '24 hours'
    ) daily
    CROSS JOIN (
        SELECT COUNT(*) as count
        FROM veo3_jobs 
        WHERE user_id = user_uuid 
        AND created_at >= NOW() - INTERVAL '30 days'
    ) monthly;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get job statistics
CREATE OR REPLACE FUNCTION get_veo3_job_stats(user_uuid UUID DEFAULT NULL)
RETURNS TABLE(
    total_jobs BIGINT,
    completed_jobs BIGINT,
    failed_jobs BIGINT,
    success_rate NUMERIC,
    avg_processing_time NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_jobs,
        COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_jobs,
        COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed_jobs,
        ROUND(
            (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*)::NUMERIC) * 100, 
            2
        ) as success_rate,
        ROUND(
            AVG(
                EXTRACT(EPOCH FROM (completed_at - created_at))
            ) FILTER (WHERE status = 'completed' AND completed_at IS NOT NULL),
            2
        ) as avg_processing_time
    FROM veo3_jobs
    WHERE user_uuid IS NULL OR user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get feedback statistics
CREATE OR REPLACE FUNCTION get_veo3_feedback_stats(user_uuid UUID DEFAULT NULL)
RETURNS TABLE(
    total_feedback BIGINT,
    avg_rating NUMERIC,
    rating_distribution JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_feedback,
        ROUND(AVG(rating), 2) as avg_rating,
        jsonb_object_agg(
            rating::TEXT, 
            count
        ) as rating_distribution
    FROM (
        SELECT 
            rating,
            COUNT(*) as count
        FROM veo3_feedback
        WHERE user_uuid IS NULL OR user_id = user_uuid
        GROUP BY rating
        ORDER BY rating
    ) rating_counts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample data for testing (optional)
INSERT INTO veo3_jobs (user_id, type, prompts, options, status, created_at) VALUES
(
    '00000000-0000-0000-0000-000000000000', -- Replace with actual user ID for testing
    'batch',
    ARRAY['Create a cinematic product showcase for wireless earbuds', 'Generate a social media ad for fitness smartwatch'],
    '{"style": "cinematic", "tone": "energetic", "aspectRatio": "16:9", "targetPlatform": "Instagram Reels"}',
    'completed',
    NOW() - INTERVAL '1 hour'
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON veo3_jobs TO authenticated;
GRANT ALL ON veo3_results TO authenticated;
GRANT ALL ON veo3_feedback TO authenticated;
GRANT ALL ON veo3_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_veo3_quota(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_veo3_job_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_veo3_feedback_stats(UUID) TO authenticated; 