-- Add missing tables to existing Lyra AI database

-- Enable UUID extension for PostgreSQL (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid')),
    revenue_cat_app_user_id VARCHAR(255),
    revenue_cat_product_id VARCHAR(255),
    revenue_cat_transaction_id VARCHAR(255),
    revenue_cat_original_transaction_id VARCHAR(255),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for subscriptions
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_revenue_cat_app_user_id ON subscriptions(revenue_cat_app_user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_revenue_cat_transaction_id ON subscriptions(revenue_cat_transaction_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Google Fit connection table
CREATE TABLE IF NOT EXISTS google_fit_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    google_user_id VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    scope TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index for Google Fit connections
CREATE UNIQUE INDEX IF NOT EXISTS idx_google_fit_connections_user_id ON google_fit_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_google_fit_connections_google_user_id ON google_fit_connections(google_user_id);

-- Google Fit steps table
CREATE TABLE IF NOT EXISTS google_fit_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    step_count INTEGER NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    data_source VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for Google Fit steps
CREATE INDEX IF NOT EXISTS idx_google_fit_steps_user_id ON google_fit_steps(user_id);
CREATE INDEX IF NOT EXISTS idx_google_fit_steps_start_time ON google_fit_steps(start_time);
CREATE INDEX IF NOT EXISTS idx_google_fit_steps_end_time ON google_fit_steps(end_time);

-- Google Fit heart rate table
CREATE TABLE IF NOT EXISTS google_fit_heart_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    heart_rate_bpm INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    data_source VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for Google Fit heart rates
CREATE INDEX IF NOT EXISTS idx_google_fit_heart_rates_user_id ON google_fit_heart_rates(user_id);
CREATE INDEX IF NOT EXISTS idx_google_fit_heart_rates_timestamp ON google_fit_heart_rates(timestamp);

-- Google Fit activities table
CREATE TABLE IF NOT EXISTS google_fit_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    calories_burned INTEGER,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    data_source VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for Google Fit activities
CREATE INDEX IF NOT EXISTS idx_google_fit_activities_user_id ON google_fit_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_google_fit_activities_activity_type ON google_fit_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_google_fit_activities_start_time ON google_fit_activities(start_time);

-- Google Fit sleep table
CREATE TABLE IF NOT EXISTS google_fit_sleep (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sleep_duration_minutes INTEGER NOT NULL,
    sleep_efficiency DECIMAL(5,2),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    data_source VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for Google Fit sleep
CREATE INDEX IF NOT EXISTS idx_google_fit_sleep_user_id ON google_fit_sleep(user_id);
CREATE INDEX IF NOT EXISTS idx_google_fit_sleep_start_time ON google_fit_sleep(start_time);

-- Google Fit weight table
CREATE TABLE IF NOT EXISTS google_fit_weights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight_kg DECIMAL(5,2) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    data_source VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for Google Fit weights
CREATE INDEX IF NOT EXISTS idx_google_fit_weights_user_id ON google_fit_weights(user_id);
CREATE INDEX IF NOT EXISTS idx_google_fit_weights_timestamp ON google_fit_weights(timestamp);

-- Google Fit sync status table
CREATE TABLE IF NOT EXISTS google_fit_sync_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data_type VARCHAR(50) NOT NULL,
    last_sync_time TIMESTAMP WITH TIME ZONE NOT NULL,
    sync_status VARCHAR(20) DEFAULT 'success' CHECK (sync_status IN ('success', 'failed', 'partial')),
    error_message TEXT,
    records_synced INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for Google Fit sync status
CREATE INDEX IF NOT EXISTS idx_google_fit_sync_status_user_id ON google_fit_sync_status(user_id);
CREATE INDEX IF NOT EXISTS idx_google_fit_sync_status_data_type ON google_fit_sync_status(data_type);
CREATE INDEX IF NOT EXISTS idx_google_fit_sync_status_last_sync_time ON google_fit_sync_status(last_sync_time);

-- Create update triggers for updated_at columns (if function doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to new tables with updated_at columns
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_google_fit_connections_updated_at ON google_fit_connections;
CREATE TRIGGER update_google_fit_connections_updated_at BEFORE UPDATE ON google_fit_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_google_fit_sync_status_updated_at ON google_fit_sync_status;
CREATE TRIGGER update_google_fit_sync_status_updated_at BEFORE UPDATE ON google_fit_sync_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();