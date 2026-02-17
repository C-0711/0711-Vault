-- 0711 Vault Migration 004: Account Management
-- Date: 2026-02-03
-- ADDITIVE ONLY - NO DROP STATEMENTS
-- Purpose: Email verification, password reset, DSGVO compliance

-- ===========================================
-- ADD COLUMNS TO USERS TABLE
-- ===========================================

-- Email verification
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'email_verified_at') THEN
        ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMPTZ;
    END IF;
END $$;

-- Profile fields
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'display_name') THEN
        ALTER TABLE users ADD COLUMN display_name VARCHAR(100);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'language') THEN
        ALTER TABLE users ADD COLUMN language VARCHAR(10) DEFAULT 'de';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'timezone') THEN
        ALTER TABLE users ADD COLUMN timezone VARCHAR(50) DEFAULT 'Europe/Berlin';
    END IF;
END $$;

-- Account deletion (DSGVO)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'deletion_requested_at') THEN
        ALTER TABLE users ADD COLUMN deletion_requested_at TIMESTAMPTZ;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'deletion_scheduled_at') THEN
        ALTER TABLE users ADD COLUMN deletion_scheduled_at TIMESTAMPTZ;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'deletion_reason') THEN
        ALTER TABLE users ADD COLUMN deletion_reason TEXT;
    END IF;
END $$;

-- Login security
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'login_attempts') THEN
        ALTER TABLE users ADD COLUMN login_attempts INTEGER DEFAULT 0;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'locked_until') THEN
        ALTER TABLE users ADD COLUMN locked_until TIMESTAMPTZ;
    END IF;
END $$;

-- 2FA (TOTP)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'totp_secret') THEN
        ALTER TABLE users ADD COLUMN totp_secret TEXT;  -- Encrypted
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'totp_enabled_at') THEN
        ALTER TABLE users ADD COLUMN totp_enabled_at TIMESTAMPTZ;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'recovery_codes') THEN
        ALTER TABLE users ADD COLUMN recovery_codes TEXT;  -- JSON array, encrypted
    END IF;
END $$;

-- Updated at
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- ===========================================
-- SESSIONS TABLE (for multi-device)
-- ===========================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,  -- SHA256 of token
    device_name VARCHAR(100),
    device_type VARCHAR(50),  -- ios, android, web, desktop
    ip_address INET,
    user_agent TEXT,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token_hash);

-- ===========================================
-- DATA EXPORTS (DSGVO)
-- ===========================================

CREATE TABLE IF NOT EXISTS data_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',  -- pending, processing, ready, expired, failed
    file_path TEXT,  -- Storage path when ready
    file_size BIGINT,
    download_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_exports_user ON data_exports(user_id);

-- ===========================================
-- SUBSCRIPTION / BILLING
-- ===========================================

-- Add Stripe fields to users if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(100);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'stripe_subscription_id') THEN
        ALTER TABLE users ADD COLUMN stripe_subscription_id VARCHAR(100);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'subscription_status') THEN
        ALTER TABLE users ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'free';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'subscription_ends_at') THEN
        ALTER TABLE users ADD COLUMN subscription_ends_at TIMESTAMPTZ;
    END IF;
END $$;

-- ===========================================
-- RATE LIMITING
-- ===========================================

CREATE TABLE IF NOT EXISTS rate_limits (
    id SERIAL PRIMARY KEY,
    key VARCHAR(200) NOT NULL,  -- e.g., "login:192.168.1.1" or "api:user_123"
    requests INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(key)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);

-- Cleanup old rate limit entries (run periodically)
-- DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '1 hour';

-- ===========================================
-- NOTIFICATIONS
-- ===========================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,  -- storage_full, share_accessed, security_alert, etc.
    title TEXT NOT NULL,
    message TEXT,
    data JSONB,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- ===========================================
-- DONE
-- ===========================================

-- Log migration
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'audit_log' AND column_name = 'details') THEN
        INSERT INTO audit_log (action, resource_type, details)
        VALUES ('migration', 'database', '{"version": "004", "name": "account_management"}');
    ELSE
        INSERT INTO audit_log (action, resource_type)
        VALUES ('migration', 'database');
    END IF;
END $$;
