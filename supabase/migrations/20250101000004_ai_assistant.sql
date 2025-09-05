-- AI Assistant Database Migration
-- This migration creates tables for AI assistant features including user memory, action logs, model settings, and proactive triggers

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- AI User Memory Table
CREATE TABLE IF NOT EXISTS ai_user_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    last_prompt TEXT,
    preferences JSONB DEFAULT '{"theme": "dark", "language": "en"}'::jsonb,
    frequently_asked JSONB DEFAULT '[]'::jsonb,
    saved_actions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Action Logs Table
CREATE TABLE IF NOT EXISTS ai_action_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    action VARCHAR(255) NOT NULL,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

-- AI Model Settings Table
CREATE TABLE IF NOT EXISTS ai_model_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model VARCHAR(100) DEFAULT 'gpt-4',
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2048,
    allowed_actions JSONB DEFAULT '["read", "suggest"]'::jsonb,
    restricted_actions JSONB DEFAULT '["delete", "admin"]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Proactive Triggers Table
CREATE TABLE IF NOT EXISTS ai_proactive_triggers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trigger_type VARCHAR(100) NOT NULL,
    trigger_condition JSONB NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    action_payload JSONB,
    is_active BOOLEAN DEFAULT true,
    priority VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Conversation History Table
CREATE TABLE IF NOT EXISTS ai_conversation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    session_id UUID NOT NULL,
    message_type VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Integration Logs Table
CREATE TABLE IF NOT EXISTS ai_integration_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    integration_type VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    payload JSONB,
    result JSONB,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    execution_time_ms INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_user_memory_user_id ON ai_user_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_action_logs_user_id ON ai_action_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_action_logs_timestamp ON ai_action_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_history_user_id ON ai_conversation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_history_session_id ON ai_conversation_history(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_integration_logs_user_id ON ai_integration_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_integration_logs_timestamp ON ai_integration_logs(timestamp);

-- Insert default model settings
INSERT INTO ai_model_settings (model, temperature, max_tokens, allowed_actions, restricted_actions)
VALUES (
    'gpt-4',
    0.7,
    2048,
    '["read", "suggest", "analyze", "generate", "optimize"]'::jsonb,
    '["delete", "admin", "billing", "system"]'::jsonb
) ON CONFLICT DO NOTHING;

-- Insert default proactive triggers
INSERT INTO ai_proactive_triggers (trigger_type, trigger_condition, action_type, action_payload, priority) VALUES
(
    'inventory_low_stock',
    '{"condition": "stock_level < reorder_point", "threshold": 5}'::jsonb,
    'notification',
    '{"type": "alert", "message": "Low stock detected", "action": "reorder_suggestion"}'::jsonb,
    'high'
),
(
    'campaign_performance',
    '{"condition": "roas < 2.0", "threshold": 2.0}'::jsonb,
    'optimization_suggestion',
    '{"type": "recommendation", "message": "Campaign optimization needed", "action": "optimize_campaigns"}'::jsonb,
    'medium'
),
(
    'user_engagement',
    '{"condition": "last_activity > 24h", "threshold": 86400}'::jsonb,
    'welcome_back',
    '{"type": "engagement", "message": "Welcome back! How can I help?", "action": "show_features"}'::jsonb,
    'low'
),
(
    'order_blocked',
    '{"condition": "blocked_orders > 0", "threshold": 1}'::jsonb,
    'order_resolution',
    '{"type": "alert", "message": "Orders blocked due to insufficient stock", "action": "resolve_orders"}'::jsonb,
    'high'
),
(
    'email_campaign_opportunity',
    '{"condition": "new_products > 0", "threshold": 1}'::jsonb,
    'marketing_suggestion',
    '{"type": "opportunity", "message": "New products available for marketing", "action": "create_campaign"}'::jsonb,
    'medium'
);

-- Create RLS policies
ALTER TABLE ai_user_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_proactive_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_integration_logs ENABLE ROW LEVEL SECURITY;

-- AI User Memory policies
CREATE POLICY "Users can view their own memory" ON ai_user_memory
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory" ON ai_user_memory
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memory" ON ai_user_memory
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI Action Logs policies
CREATE POLICY "Users can view their own action logs" ON ai_action_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own action logs" ON ai_action_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI Model Settings policies (read-only for users, full access for admins)
CREATE POLICY "Users can view model settings" ON ai_model_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can update model settings" ON ai_model_settings
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- AI Proactive Triggers policies (read-only for users, full access for admins)
CREATE POLICY "Users can view proactive triggers" ON ai_proactive_triggers
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage proactive triggers" ON ai_proactive_triggers
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- AI Conversation History policies
CREATE POLICY "Users can view their own conversation history" ON ai_conversation_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversation history" ON ai_conversation_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI Integration Logs policies
CREATE POLICY "Users can view their own integration logs" ON ai_integration_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integration logs" ON ai_integration_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create functions for AI assistant operations
CREATE OR REPLACE FUNCTION get_user_ai_context(user_id UUID)
RETURNS JSONB AS $$
DECLARE
    context JSONB;
    memory_record RECORD;
    recent_actions JSONB;
    recent_conversations JSONB;
BEGIN
    -- Get user memory
    SELECT * INTO memory_record FROM ai_user_memory WHERE ai_user_memory.user_id = get_user_ai_context.user_id;
    
    -- Get recent actions (last 10)
    SELECT json_agg(
        json_build_object(
            'action', action,
            'timestamp', timestamp,
            'success', success
        )
    ) INTO recent_actions
    FROM ai_action_logs 
    WHERE ai_action_logs.user_id = get_user_ai_context.user_id 
    ORDER BY timestamp DESC 
    LIMIT 10;
    
    -- Get recent conversations (last 5)
    SELECT json_agg(
        json_build_object(
            'message_type', message_type,
            'content', content,
            'timestamp', timestamp
        )
    ) INTO recent_conversations
    FROM ai_conversation_history 
    WHERE ai_conversation_history.user_id = get_user_ai_context.user_id 
    ORDER BY timestamp DESC 
    LIMIT 5;
    
    -- Build context
    context := json_build_object(
        'user_id', user_id,
        'memory', COALESCE(memory_record, '{}'::jsonb),
        'recent_actions', COALESCE(recent_actions, '[]'::jsonb),
        'recent_conversations', COALESCE(recent_conversations, '[]'::jsonb),
        'timestamp', NOW()
    );
    
    RETURN context;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log AI actions
CREATE OR REPLACE FUNCTION log_ai_action(
    p_user_id UUID,
    p_action VARCHAR(255),
    p_details JSONB DEFAULT NULL,
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    action_id UUID;
BEGIN
    INSERT INTO ai_action_logs (
        user_id, 
        action, 
        details, 
        success, 
        error_message,
        timestamp
    ) VALUES (
        p_user_id,
        p_action,
        p_details,
        p_success,
        p_error_message,
        NOW()
    ) RETURNING id INTO action_id;
    
    RETURN action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get proactive recommendations
CREATE OR REPLACE FUNCTION get_proactive_recommendations(user_id UUID)
RETURNS JSONB AS $$
DECLARE
    recommendations JSONB := '[]'::jsonb;
    trigger_record RECORD;
    context JSONB;
BEGIN
    -- Get user context
    context := get_user_ai_context(user_id);
    
    -- Check each active trigger
    FOR trigger_record IN 
        SELECT * FROM ai_proactive_triggers WHERE is_active = true
    LOOP
        -- This is a simplified version - in practice, you'd evaluate the trigger conditions
        -- against real data from other tables (inventory, campaigns, etc.)
        recommendations := recommendations || json_build_object(
            'trigger_id', trigger_record.id,
            'trigger_type', trigger_record.trigger_type,
            'action_type', trigger_record.action_type,
            'action_payload', trigger_record.action_payload,
            'priority', trigger_record.priority
        );
    END LOOP;
    
    RETURN recommendations;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_user_memory_updated_at 
    BEFORE UPDATE ON ai_user_memory 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_model_settings_updated_at 
    BEFORE UPDATE ON ai_model_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_proactive_triggers_updated_at 
    BEFORE UPDATE ON ai_proactive_triggers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO ai_user_memory (user_id, last_prompt, preferences, frequently_asked, saved_actions) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'How can I improve my ad performance?',
    '{"theme": "dark", "language": "en", "notifications": true}'::jsonb,
    '["How to optimize campaigns?", "What is my inventory status?", "How to create email campaigns?"]'::jsonb,
    '["reorder_inventory", "optimize_campaigns", "create_email_campaign"]'::jsonb
);

INSERT INTO ai_action_logs (user_id, action, details, success) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'inventory_view',
    '{"page": "products", "duration": 120}'::jsonb,
    true
),
(
    '00000000-0000-0000-0000-000000000001',
    'campaign_optimization',
    '{"campaign_id": "123", "improvement": "15%"}'::jsonb,
    true
);

INSERT INTO ai_conversation_history (user_id, session_id, message_type, content) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'user',
    'How can I improve my ad performance?'
),
(
    '00000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'assistant',
    'I can help you optimize your ad campaigns. Let me analyze your current performance and suggest improvements.'
); 