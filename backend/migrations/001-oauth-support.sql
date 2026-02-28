-- 001: Add 0711-I OAuth support to users table
-- Run against vault database on H200V (port 9500)

-- Add 0711-I subject identifier for OAuth-linked accounts
ALTER TABLE users ADD COLUMN IF NOT EXISTS o711i_sub VARCHAR(255);

-- Make local auth fields nullable (OAuth users set these up after first login)
ALTER TABLE users ALTER COLUMN auth_hash DROP NOT NULL;
ALTER TABLE users ALTER COLUMN salt DROP NOT NULL;
ALTER TABLE users ALTER COLUMN encrypted_master_key DROP NOT NULL;

-- Unique index on o711i_sub (only where set)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_o711i_sub ON users(o711i_sub) WHERE o711i_sub IS NOT NULL;
