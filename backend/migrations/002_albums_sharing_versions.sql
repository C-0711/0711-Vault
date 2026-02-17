-- 0711 Vault Migration 002: Albums, Sharing, Versions
-- Date: 2026-02-03
-- ADDITIVE ONLY - NO DROP STATEMENTS

-- ===========================================
-- ALBUMS / FOLDERS
-- ===========================================

CREATE TABLE IF NOT EXISTS albums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    parent_id UUID REFERENCES albums(id),  -- For nested folders
    encrypted_name TEXT NOT NULL,
    encrypted_description TEXT,
    cover_item_id UUID REFERENCES vault_items(id),
    item_count INTEGER DEFAULT 0,
    is_smart_album BOOLEAN DEFAULT FALSE,  -- AI-generated albums
    smart_criteria JSONB,  -- For smart albums (e.g., {"faces": ["uuid"], "date_range": {...}})
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_albums_user ON albums(user_id);
CREATE INDEX IF NOT EXISTS idx_albums_parent ON albums(parent_id);

-- Album items junction table
CREATE TABLE IF NOT EXISTS album_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES vault_items(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(album_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_album_items_album ON album_items(album_id);
CREATE INDEX IF NOT EXISTS idx_album_items_item ON album_items(item_id);

-- ===========================================
-- SHARING
-- ===========================================

-- Share links (public links with optional password/expiry)
CREATE TABLE IF NOT EXISTS share_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    share_token VARCHAR(64) UNIQUE NOT NULL,  -- Public URL token
    
    -- What's being shared (one of these)
    item_id UUID REFERENCES vault_items(id),
    album_id UUID REFERENCES albums(id),
    
    -- Access controls
    encrypted_password TEXT,  -- Optional password protection
    expires_at TIMESTAMPTZ,
    max_downloads INTEGER,
    download_count INTEGER DEFAULT 0,
    
    -- Permissions
    allow_download BOOLEAN DEFAULT TRUE,
    allow_preview BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    encrypted_message TEXT,  -- Optional message to recipient
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    
    CONSTRAINT share_has_target CHECK (item_id IS NOT NULL OR album_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(share_token);
CREATE INDEX IF NOT EXISTS idx_share_links_user ON share_links(user_id);
CREATE INDEX IF NOT EXISTS idx_share_links_item ON share_links(item_id);
CREATE INDEX IF NOT EXISTS idx_share_links_album ON share_links(album_id);

-- Collaborators (shared access to albums)
CREATE TABLE IF NOT EXISTS collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id),  -- Who shared it
    collaborator_id UUID REFERENCES users(id),  -- Registered user
    collaborator_email VARCHAR(255),  -- Or invite by email
    
    -- Permissions
    can_view BOOLEAN DEFAULT TRUE,
    can_add BOOLEAN DEFAULT FALSE,
    can_remove BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_share BOOLEAN DEFAULT FALSE,
    
    -- Encrypted key for this collaborator (re-encrypted with their key)
    encrypted_album_key TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',  -- pending, accepted, declined
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    
    CONSTRAINT collaborator_has_identity CHECK (collaborator_id IS NOT NULL OR collaborator_email IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_collaborators_album ON collaborators(album_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user ON collaborators(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_email ON collaborators(collaborator_email);

-- ===========================================
-- VERSION HISTORY
-- ===========================================

CREATE TABLE IF NOT EXISTS item_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES vault_items(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    storage_key TEXT NOT NULL,  -- MinIO path for this version
    file_size BIGINT NOT NULL,
    encrypted_metadata TEXT,
    
    -- Who/when
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Optional: what changed
    change_type VARCHAR(50),  -- 'upload', 'edit', 'restore'
    change_note TEXT,
    deleted_at TIMESTAMPTZ,
    
    UNIQUE(item_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_versions_item ON item_versions(item_id);

-- ===========================================
-- STORAGE QUOTAS
-- ===========================================

CREATE TABLE IF NOT EXISTS storage_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id),
    plan_name VARCHAR(50) DEFAULT 'free',
    quota_bytes BIGINT DEFAULT 5368709120,  -- 5GB default
    used_bytes BIGINT DEFAULT 0,
    file_count INTEGER DEFAULT 0,
    
    -- Limits
    max_file_size BIGINT DEFAULT 104857600,  -- 100MB default
    max_versions_per_file INTEGER DEFAULT 10,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotas_user ON storage_quotas(user_id);

-- ===========================================
-- AUDIT LOG
-- ===========================================

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),  -- 'item', 'album', 'share', 'user'
    resource_id UUID,
    
    -- Details
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_log(resource_type, resource_id);

-- ===========================================
-- API KEYS (for integrations)
-- ===========================================

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(64) NOT NULL,  -- SHA256 of the key
    key_prefix VARCHAR(8) NOT NULL,  -- First 8 chars for identification
    
    -- Permissions
    scopes TEXT[] DEFAULT ARRAY['read'],  -- read, write, delete, admin
    
    -- Limits
    rate_limit INTEGER DEFAULT 1000,  -- requests per hour
    
    -- Status
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

-- ===========================================
-- ADD COLUMNS TO EXISTING TABLES (IF NOT EXISTS)
-- ===========================================

-- Add sync_version to vault_items if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'vault_items' AND column_name = 'sync_version') THEN
        ALTER TABLE vault_items ADD COLUMN sync_version INTEGER DEFAULT 1;
    END IF;
END $$;

-- Add current_version to vault_items
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'vault_items' AND column_name = 'current_version') THEN
        ALTER TABLE vault_items ADD COLUMN current_version INTEGER DEFAULT 1;
    END IF;
END $$;

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Function to update storage quota on upload
CREATE OR REPLACE FUNCTION update_storage_quota()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO storage_quotas (user_id, used_bytes, file_count)
        VALUES (NEW.user_id, NEW.file_size, 1)
        ON CONFLICT (user_id) DO UPDATE
        SET used_bytes = storage_quotas.used_bytes + NEW.file_size,
            file_count = storage_quotas.file_count + 1,
            updated_at = NOW();
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE storage_quotas 
        SET used_bytes = GREATEST(0, used_bytes - OLD.file_size),
            file_count = GREATEST(0, file_count - 1),
            updated_at = NOW()
        WHERE user_id = OLD.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_quota') THEN
        CREATE TRIGGER trigger_update_quota
        AFTER INSERT OR DELETE ON vault_items
        FOR EACH ROW EXECUTE FUNCTION update_storage_quota();
    END IF;
END $$;

-- Function to update album item count
CREATE OR REPLACE FUNCTION update_album_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE albums SET item_count = item_count + 1, updated_at = NOW()
        WHERE id = NEW.album_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE albums SET item_count = GREATEST(0, item_count - 1), updated_at = NOW()
        WHERE id = OLD.album_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_album_count') THEN
        CREATE TRIGGER trigger_update_album_count
        AFTER INSERT OR DELETE ON album_items
        FOR EACH ROW EXECUTE FUNCTION update_album_count();
    END IF;
END $$;

-- ===========================================
-- DONE
-- ===========================================

-- Log migration
INSERT INTO audit_log (action, resource_type, details)
VALUES ('migration', 'database', '{"version": "002", "name": "albums_sharing_versions"}');
