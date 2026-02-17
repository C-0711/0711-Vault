-- 0711 Vault Migration 003: Import Connectors
-- Date: 2026-02-03
-- ADDITIVE ONLY - NO DROP STATEMENTS
-- Purpose: Support for importing from Dropbox, Google Drive, OneDrive, etc.

-- ===========================================
-- IMPORT CONNECTIONS
-- ===========================================

CREATE TABLE IF NOT EXISTS import_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    provider VARCHAR(50) NOT NULL,  -- dropbox, google_drive, onedrive, nextcloud, s3
    
    -- OAuth tokens (encrypted in production)
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    
    -- For WebDAV/S3 connections
    credentials JSONB,
    
    -- Stats
    files_imported INTEGER DEFAULT 0,
    bytes_imported BIGINT DEFAULT 0,
    last_sync TIMESTAMPTZ,
    
    -- Status
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    
    UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_import_connections_user ON import_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_import_connections_provider ON import_connections(provider);

-- ===========================================
-- IMPORT JOBS
-- ===========================================

CREATE TABLE IF NOT EXISTS import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    provider VARCHAR(50) NOT NULL,
    
    -- Configuration
    paths TEXT[],  -- Specific paths to import (NULL = all)
    include_shared BOOLEAN DEFAULT FALSE,
    preserve_folders BOOLEAN DEFAULT TRUE,
    delete_after_import BOOLEAN DEFAULT FALSE,
    
    -- Progress
    status VARCHAR(20) DEFAULT 'pending',  -- pending, running, complete, failed, cancelled
    total_files INTEGER DEFAULT 0,
    imported_files INTEGER DEFAULT 0,
    failed_files INTEGER DEFAULT 0,
    total_bytes BIGINT DEFAULT 0,
    imported_bytes BIGINT DEFAULT 0,
    current_file TEXT,
    errors TEXT[] DEFAULT '{}',
    
    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_user ON import_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON import_jobs(status);

-- ===========================================
-- ADD SOURCE TRACKING TO VAULT ITEMS
-- ===========================================

-- Track where imported items came from
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'vault_items' AND column_name = 'source_provider') THEN
        ALTER TABLE vault_items ADD COLUMN source_provider VARCHAR(50);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'vault_items' AND column_name = 'source_path') THEN
        ALTER TABLE vault_items ADD COLUMN source_path TEXT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_vault_items_source ON vault_items(source_provider) WHERE source_provider IS NOT NULL;

-- ===========================================
-- IMPORT HISTORY (for deduplication)
-- ===========================================

CREATE TABLE IF NOT EXISTS import_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    provider VARCHAR(50) NOT NULL,
    source_id TEXT NOT NULL,  -- Provider's file ID
    source_hash TEXT,  -- Content hash if available
    vault_item_id UUID REFERENCES vault_items(id),
    imported_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, provider, source_id)
);

CREATE INDEX IF NOT EXISTS idx_import_history_lookup ON import_history(user_id, provider, source_id);

-- ===========================================
-- DONE
-- ===========================================

-- Log migration
INSERT INTO audit_log (action, resource_type, details)
VALUES ('migration', 'database', '{"version": "003", "name": "import_connectors"}');
