-- PROJEKT GENESIS: Sprint 2 - Publishing & Rights Management
-- Created: 2026-02-21
-- Author: Fleet Admiral Bombas

-- ============================================
-- PUBLISHED SITES (GitBook-style)
-- ============================================
CREATE TABLE IF NOT EXISTS vault_published_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES vault_spaces(id) ON DELETE CASCADE,
    
    -- Site config
    slug VARCHAR(100) NOT NULL,
    custom_domain VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    favicon_url TEXT,
    
    -- Source
    branch VARCHAR(100) DEFAULT 'main',
    root_path VARCHAR(255) DEFAULT '/',
    
    -- Appearance
    theme VARCHAR(50) DEFAULT 'default',
    primary_color VARCHAR(7) DEFAULT '#2563eb',
    custom_css TEXT,
    custom_head TEXT,
    
    -- Navigation
    nav_config JSONB DEFAULT '{}',
    
    -- Access
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'password', 'private')),
    password_hash VARCHAR(255),
    allowed_emails TEXT[],
    
    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,
    og_image_url TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    last_published_at TIMESTAMP WITH TIME ZONE,
    last_published_snapshot_id UUID REFERENCES vault_snapshots(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    
    UNIQUE(slug),
    UNIQUE(space_id)
);

CREATE INDEX IF NOT EXISTS idx_sites_space ON vault_published_sites(space_id);
CREATE INDEX IF NOT EXISTS idx_sites_slug ON vault_published_sites(slug);

-- ============================================
-- SITE ANALYTICS
-- ============================================
CREATE TABLE IF NOT EXISTS vault_site_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES vault_published_sites(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    page_path TEXT NOT NULL,
    views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    avg_time_seconds INTEGER DEFAULT 0,
    referrers JSONB DEFAULT '{}',
    countries JSONB DEFAULT '{}',
    UNIQUE(site_id, date, page_path)
);

CREATE INDEX IF NOT EXISTS idx_analytics_site_date ON vault_site_analytics(site_id, date DESC);

-- ============================================
-- PERMISSION TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS vault_permission_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    can_read BOOLEAN DEFAULT TRUE,
    can_write BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_publish BOOLEAN DEFAULT FALSE,
    can_manage_permissions BOOLEAN DEFAULT FALSE,
    can_manage_branches BOOLEAN DEFAULT FALSE,
    can_approve_reviews BOOLEAN DEFAULT FALSE,
    branch_patterns TEXT[] DEFAULT '{}',
    path_patterns TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- ============================================
-- SPACE MEMBERS
-- ============================================
CREATE TABLE IF NOT EXISTS vault_space_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES vault_spaces(id) ON DELETE CASCADE,
    principal_type VARCHAR(20) NOT NULL CHECK (principal_type IN ('user', 'group', 'team')),
    principal_id UUID NOT NULL,
    principal_email VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    template_id UUID REFERENCES vault_permission_templates(id),
    custom_permissions JSONB DEFAULT '{}',
    invited_by UUID,
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(space_id, principal_type, principal_id)
);

CREATE INDEX IF NOT EXISTS idx_members_space ON vault_space_members(space_id);

-- ============================================
-- ACCESS TOKENS
-- ============================================
CREATE TABLE IF NOT EXISTS vault_access_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES vault_spaces(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    token_prefix VARCHAR(10) NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT '{read}',
    ip_allowlist INET[],
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    last_used_ip INET,
    use_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_tokens_space ON vault_access_tokens(space_id);

-- ============================================
-- TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS trigger_sites_updated ON vault_published_sites;
CREATE TRIGGER trigger_sites_updated
    BEFORE UPDATE ON vault_published_sites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- INITIAL TEMPLATES
-- ============================================
INSERT INTO vault_permission_templates (tenant_id, name, description, can_read, can_write, can_delete, can_publish, can_manage_permissions, can_manage_branches, can_approve_reviews)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Owner', 'Full access', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE),
    ('00000000-0000-0000-0000-000000000001', 'Admin', 'Manage content and users', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE),
    ('00000000-0000-0000-0000-000000000001', 'Editor', 'Create and edit', TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, FALSE),
    ('00000000-0000-0000-0000-000000000001', 'Reviewer', 'Review changes', TRUE, FALSE, FALSE, FALSE, FALSE, FALSE, TRUE),
    ('00000000-0000-0000-0000-000000000001', 'Viewer', 'Read-only', TRUE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE)
ON CONFLICT DO NOTHING;
