-- 0711 Vault Database Schema
-- Zero-knowledge encrypted storage

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-----------------------------------------------------------
-- USERS & AUTH
-----------------------------------------------------------

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    auth_hash VARCHAR(255) NOT NULL,  -- PBKDF2 hash for auth (never the real password)
    salt VARCHAR(255) NOT NULL,        -- For client-side key derivation
    encrypted_master_key TEXT NOT NULL, -- Master key encrypted with user's key
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    storage_quota_bytes BIGINT DEFAULT 10737418240,  -- 10GB default
    storage_used_bytes BIGINT DEFAULT 0
);

CREATE INDEX idx_users_email ON users(email);

-----------------------------------------------------------
-- VAULT ITEMS (Photos, Documents, etc.)
-----------------------------------------------------------

CREATE TABLE vault_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL,  -- 'photo', 'document', 'video', 'audio'
    
    -- Encrypted metadata (client encrypts before sending)
    encrypted_metadata TEXT,  -- JSON: filename, description, tags, etc.
    
    -- Storage
    storage_key VARCHAR(500) NOT NULL,  -- Path in MinIO/S3
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    captured_at TIMESTAMP,  -- Original capture date (from EXIF etc.)
    deleted_at TIMESTAMP,   -- Soft delete
    
    -- Sync
    sync_version BIGINT DEFAULT 1,
    device_id VARCHAR(100),
    
    -- Processing status
    processing_status VARCHAR(50) DEFAULT 'pending',  -- pending, processing, complete, failed
    processed_at TIMESTAMP
);

CREATE INDEX idx_vault_items_user ON vault_items(user_id);
CREATE INDEX idx_vault_items_type ON vault_items(item_type);
CREATE INDEX idx_vault_items_status ON vault_items(processing_status);
CREATE INDEX idx_vault_items_sync ON vault_items(user_id, sync_version);

-----------------------------------------------------------
-- EMBEDDINGS (for semantic search)
-----------------------------------------------------------

CREATE TABLE embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES vault_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    embedding_type VARCHAR(50) NOT NULL,  -- 'clip', 'text', 'face'
    embedding vector(768),  -- nomic-embed-text is 768 dim
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_embeddings_item ON embeddings(item_id);
CREATE INDEX idx_embeddings_user ON embeddings(user_id);
CREATE INDEX idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-----------------------------------------------------------
-- FACES
-----------------------------------------------------------

CREATE TABLE face_clusters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- User-provided label (encrypted)
    encrypted_name TEXT,  -- "Mom", "Dad", etc.
    relationship VARCHAR(50),  -- 'family', 'friend', 'colleague', 'self'
    
    -- Stats
    photo_count INT DEFAULT 0,
    
    -- Representative face embedding for matching
    centroid vector(512),  -- Face embeddings are typically 512 dim
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_face_clusters_user ON face_clusters(user_id);

CREATE TABLE faces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES vault_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cluster_id UUID REFERENCES face_clusters(id) ON DELETE SET NULL,
    
    -- Bounding box (normalized 0-1)
    bbox_x FLOAT NOT NULL,
    bbox_y FLOAT NOT NULL,
    bbox_width FLOAT NOT NULL,
    bbox_height FLOAT NOT NULL,
    
    -- Face embedding for matching
    embedding vector(512),
    
    -- Confidence
    detection_confidence FLOAT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_faces_item ON faces(item_id);
CREATE INDEX idx_faces_cluster ON faces(cluster_id);
CREATE INDEX idx_faces_user ON faces(user_id);
CREATE INDEX idx_faces_vector ON faces USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-----------------------------------------------------------
-- PLACES
-----------------------------------------------------------

CREATE TABLE place_clusters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- User-provided label (encrypted)
    encrypted_name TEXT,  -- "Home", "Office", etc.
    place_type VARCHAR(50),  -- 'home', 'work', 'travel', 'other'
    
    -- Centroid location
    latitude FLOAT,
    longitude FLOAT,
    radius_meters FLOAT DEFAULT 100,
    
    -- Reverse geocoded (can be plaintext, it's public data)
    city VARCHAR(100),
    country VARCHAR(100),
    
    -- Stats
    photo_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_place_clusters_user ON place_clusters(user_id);

CREATE TABLE item_places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES vault_items(id) ON DELETE CASCADE,
    cluster_id UUID REFERENCES place_clusters(id) ON DELETE SET NULL,
    
    -- Original coordinates
    latitude FLOAT,
    longitude FLOAT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_item_places_item ON item_places(item_id);
CREATE INDEX idx_item_places_cluster ON item_places(cluster_id);

-----------------------------------------------------------
-- DOCUMENTS (extra metadata)
-----------------------------------------------------------

CREATE TABLE document_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES vault_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- AI-extracted (encrypted)
    encrypted_summary TEXT,
    encrypted_entities TEXT,  -- JSON: names, dates, amounts, etc.
    
    -- Category
    category VARCHAR(100),  -- 'invoice', 'contract', 'receipt', 'medical', etc.
    
    -- OCR text for search (encrypted)
    encrypted_ocr_text TEXT,
    
    -- Key dates extracted
    document_date DATE,
    expiry_date DATE,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_document_metadata_item ON document_metadata(item_id);
CREATE INDEX idx_document_metadata_category ON document_metadata(category);

-----------------------------------------------------------
-- SHARING
-----------------------------------------------------------

CREATE TABLE shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES vault_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Share settings
    share_token VARCHAR(100) UNIQUE NOT NULL,
    expires_at TIMESTAMP,
    max_views INT,
    view_count INT DEFAULT 0,
    burn_after_view BOOLEAN DEFAULT FALSE,
    
    -- Access log
    created_at TIMESTAMP DEFAULT NOW(),
    last_accessed TIMESTAMP
);

CREATE INDEX idx_shares_token ON shares(share_token);
CREATE INDEX idx_shares_item ON shares(item_id);

-----------------------------------------------------------
-- AUDIT LOG
-----------------------------------------------------------

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    action VARCHAR(100) NOT NULL,  -- 'login', 'upload', 'download', 'share', 'delete', etc.
    resource_type VARCHAR(50),
    resource_id UUID,
    
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-----------------------------------------------------------
-- SYNC TOKENS (for multi-device)
-----------------------------------------------------------

CREATE TABLE sync_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(100) NOT NULL,
    device_name VARCHAR(255),
    
    -- Encrypted device public key
    device_public_key TEXT NOT NULL,
    
    last_sync_version BIGINT DEFAULT 0,
    last_sync_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, device_id)
);

CREATE INDEX idx_sync_tokens_user ON sync_tokens(user_id);

-----------------------------------------------------------
-- PROCESSING QUEUE
-----------------------------------------------------------

CREATE TABLE processing_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES vault_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    task_type VARCHAR(50) NOT NULL,  -- 'face_detection', 'embedding', 'ocr', 'categorize'
    priority INT DEFAULT 5,
    
    status VARCHAR(50) DEFAULT 'pending',  -- pending, processing, complete, failed
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_processing_queue_status ON processing_queue(status, priority);
CREATE INDEX idx_processing_queue_item ON processing_queue(item_id);

-----------------------------------------------------------
-- FUNCTIONS
-----------------------------------------------------------

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER vault_items_updated_at BEFORE UPDATE ON vault_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER face_clusters_updated_at BEFORE UPDATE ON face_clusters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER place_clusters_updated_at BEFORE UPDATE ON place_clusters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Semantic search function
CREATE OR REPLACE FUNCTION semantic_search(
    p_user_id UUID,
    p_query_embedding vector(768),
    p_limit INT DEFAULT 20
)
RETURNS TABLE (
    item_id UUID,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.item_id,
        1 - (e.embedding <=> p_query_embedding) as similarity
    FROM embeddings e
    JOIN vault_items v ON e.item_id = v.id
    WHERE e.user_id = p_user_id
      AND v.deleted_at IS NULL
    ORDER BY e.embedding <=> p_query_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Face search function
CREATE OR REPLACE FUNCTION find_similar_faces(
    p_user_id UUID,
    p_face_embedding vector(512),
    p_threshold FLOAT DEFAULT 0.6,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    face_id UUID,
    item_id UUID,
    cluster_id UUID,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id as face_id,
        f.item_id,
        f.cluster_id,
        1 - (f.embedding <=> p_face_embedding) as similarity
    FROM faces f
    WHERE f.user_id = p_user_id
      AND 1 - (f.embedding <=> p_face_embedding) > p_threshold
    ORDER BY f.embedding <=> p_face_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-----------------------------------------------------------
-- SEED DATA (for testing)
-----------------------------------------------------------

-- Test user (password: "test123" - in production, this would be properly hashed client-side)
-- INSERT INTO users (email, auth_hash, salt, encrypted_master_key)
-- VALUES ('test@0711.io', 'test_auth_hash', 'test_salt', 'test_encrypted_key');
