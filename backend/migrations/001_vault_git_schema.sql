-- PROJEKT GENESIS: Vault-Git Schema
-- Created: 2026-02-21
-- Author: Fleet Admiral Bombas

-- ============================================
-- SPACES (like Git repositories)
-- ============================================
CREATE TABLE IF NOT EXISTS vault_spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    default_branch VARCHAR(100) DEFAULT 'main',
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'internal', 'public')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_spaces_tenant ON vault_spaces(tenant_id);
CREATE INDEX idx_spaces_slug ON vault_spaces(slug);

-- ============================================
-- BRANCHES (like Git branches)
-- ============================================
CREATE TABLE IF NOT EXISTS vault_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES vault_spaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parent_branch_id UUID REFERENCES vault_branches(id),
    head_snapshot_id UUID,  -- Points to latest snapshot
    protected BOOLEAN DEFAULT FALSE,
    protection_rules JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    UNIQUE(space_id, name)
);

CREATE INDEX idx_branches_space ON vault_branches(space_id);
CREATE INDEX idx_branches_head ON vault_branches(head_snapshot_id);

-- ============================================
-- SNAPSHOTS (like Git commits)
-- ============================================
CREATE TABLE IF NOT EXISTS vault_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES vault_spaces(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES vault_branches(id),
    parent_snapshot_id UUID REFERENCES vault_snapshots(id),
    message TEXT NOT NULL,
    author_id UUID NOT NULL,
    author_name VARCHAR(255),
    author_email VARCHAR(255),
    tree_hash VARCHAR(64) NOT NULL,  -- Merkle root of all files
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_snapshots_space ON vault_snapshots(space_id);
CREATE INDEX idx_snapshots_branch ON vault_snapshots(branch_id);
CREATE INDEX idx_snapshots_parent ON vault_snapshots(parent_snapshot_id);
CREATE INDEX idx_snapshots_created ON vault_snapshots(created_at DESC);

-- ============================================
-- TREES (directory structure at a snapshot)
-- ============================================
CREATE TABLE IF NOT EXISTS vault_trees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_id UUID NOT NULL REFERENCES vault_snapshots(id) ON DELETE CASCADE,
    path TEXT NOT NULL,  -- '/products/bosch/7739617397'
    type VARCHAR(20) NOT NULL CHECK (type IN ('directory', 'file')),
    file_version_id UUID,  -- NULL for directories
    mode VARCHAR(10) DEFAULT '644',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_trees_snapshot ON vault_trees(snapshot_id);
CREATE INDEX idx_trees_path ON vault_trees(path);
CREATE UNIQUE INDEX idx_trees_snapshot_path ON vault_trees(snapshot_id, path);

-- ============================================
-- FILE VERSIONS (like Git blobs)
-- ============================================
CREATE TABLE IF NOT EXISTS vault_file_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES vault_spaces(id) ON DELETE CASCADE,
    content_hash VARCHAR(64) NOT NULL,  -- SHA-256 of content
    blob_id UUID,  -- Reference to encrypted storage
    size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(255),
    metadata JSONB DEFAULT '{}',  -- ETIM data, citations, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(space_id, content_hash)
);

CREATE INDEX idx_file_versions_space ON vault_file_versions(space_id);
CREATE INDEX idx_file_versions_hash ON vault_file_versions(content_hash);

-- ============================================
-- REVIEWS (like Pull Requests)
-- ============================================
CREATE TABLE IF NOT EXISTS vault_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES vault_spaces(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,  -- Sequential per space
    title VARCHAR(500) NOT NULL,
    description TEXT,
    source_branch_id UUID NOT NULL REFERENCES vault_branches(id),
    target_branch_id UUID NOT NULL REFERENCES vault_branches(id),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'approved', 'merged', 'closed')),
    created_by UUID NOT NULL,
    reviewers UUID[] DEFAULT '{}',
    labels TEXT[] DEFAULT '{}',
    merged_at TIMESTAMP WITH TIME ZONE,
    merged_by UUID,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(space_id, number)
);

CREATE INDEX idx_reviews_space ON vault_reviews(space_id);
CREATE INDEX idx_reviews_status ON vault_reviews(status);
CREATE INDEX idx_reviews_source ON vault_reviews(source_branch_id);
CREATE INDEX idx_reviews_target ON vault_reviews(target_branch_id);

-- ============================================
-- REVIEW COMMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS vault_review_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES vault_reviews(id) ON DELETE CASCADE,
    author_id UUID NOT NULL,
    body TEXT NOT NULL,
    path TEXT,  -- File path for inline comments
    line_number INTEGER,  -- Line number for inline comments
    reply_to_id UUID REFERENCES vault_review_comments(id),
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_review_comments_review ON vault_review_comments(review_id);
CREATE INDEX idx_review_comments_path ON vault_review_comments(path);

-- ============================================
-- PERMISSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS vault_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES vault_spaces(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES vault_branches(id),  -- NULL = space-level
    path_pattern TEXT DEFAULT '*',  -- '/products/**' or specific
    principal_type VARCHAR(20) NOT NULL CHECK (principal_type IN ('user', 'group', 'role', 'everyone')),
    principal_id UUID,  -- NULL for 'everyone'
    permissions JSONB NOT NULL DEFAULT '{read: true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID
);

CREATE INDEX idx_permissions_space ON vault_permissions(space_id);
CREATE INDEX idx_permissions_branch ON vault_permissions(branch_id);
CREATE INDEX idx_permissions_principal ON vault_permissions(principal_type, principal_id);

-- ============================================
-- ROLES
-- ============================================
CREATE TABLE IF NOT EXISTS vault_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- ============================================
-- ACTIVITY LOG
-- ============================================
CREATE TABLE IF NOT EXISTS vault_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID REFERENCES vault_spaces(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_space ON vault_activity(space_id);
CREATE INDEX idx_activity_actor ON vault_activity(actor_id);
CREATE INDEX idx_activity_created ON vault_activity(created_at DESC);

-- ============================================
-- OPENCLAW WORKSPACES (auto-generated)
-- ============================================
CREATE TABLE IF NOT EXISTS vault_openclaw_workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES vault_spaces(id) ON DELETE CASCADE,
    agents_md TEXT,
    soul_md TEXT,
    tools_md TEXT,
    readme_md TEXT,
    config_yaml TEXT,
    gateway_port INTEGER,
    gateway_status VARCHAR(20) DEFAULT 'stopped',
    last_generated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(space_id)
);

CREATE INDEX idx_openclaw_ws_space ON vault_openclaw_workspaces(space_id);

-- ============================================
-- JOB QUEUE (for H200V processing)
-- ============================================
CREATE TABLE IF NOT EXISTS vault_processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES vault_spaces(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL,  -- 'extract', 'embed', 'ocr'
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    priority INTEGER DEFAULT 5,
    input_data JSONB NOT NULL,
    output_data JSONB,
    error_message TEXT,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    worker_id VARCHAR(100),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_jobs_space ON vault_processing_jobs(space_id);
CREATE INDEX idx_jobs_status ON vault_processing_jobs(status);
CREATE INDEX idx_jobs_priority ON vault_processing_jobs(priority DESC, created_at ASC);

-- ============================================
-- UPDATE TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_spaces_updated
    BEFORE UPDATE ON vault_spaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_branches_updated
    BEFORE UPDATE ON vault_branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_reviews_updated
    BEFORE UPDATE ON vault_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- INITIAL DATA
-- ============================================

-- Done! Schema ready for Vault-Git.
-- Run with: psql -U vault -d vault -f 001_vault_git_schema.sql

