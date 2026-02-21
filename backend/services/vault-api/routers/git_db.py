"""
PROJEKT GENESIS: Git Database Operations
Full database integration for Vault-Git
"""

import asyncpg
from typing import Optional, List, Dict, Any
from datetime import datetime
import hashlib
import json
import uuid

class GitDB:
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool
    
    # ============================================
    # SPACES
    # ============================================
    
    async def create_space(
        self,
        tenant_id: str,
        name: str,
        slug: str,
        description: str = None,
        visibility: str = "private",
        created_by: str = None
    ) -> Dict[str, Any]:
        """Create a new space and its main branch."""
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                # Create space
                space = await conn.fetchrow('''
                    INSERT INTO vault_spaces 
                    (tenant_id, name, slug, description, visibility, created_by)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *
                ''', tenant_id, name, slug, description, visibility, 
                    uuid.UUID(created_by) if created_by else None)
                
                # Create main branch
                await conn.execute('''
                    INSERT INTO vault_branches (space_id, name, created_by)
                    VALUES ($1, 'main', $2)
                ''', space['id'], uuid.UUID(created_by) if created_by else None)
                
                # Log activity
                await self._log_activity(conn, space['id'], created_by, 
                    'create', 'space', space['id'])
                
                return dict(space)
    
    async def get_space(self, space_id: str) -> Optional[Dict[str, Any]]:
        """Get space by ID."""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                'SELECT * FROM vault_spaces WHERE id = $1',
                uuid.UUID(space_id)
            )
            return dict(row) if row else None
    
    async def get_space_by_slug(self, tenant_id: str, slug: str) -> Optional[Dict[str, Any]]:
        """Get space by tenant and slug."""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow('''
                SELECT * FROM vault_spaces 
                WHERE tenant_id = $1 AND slug = $2
            ''', uuid.UUID(tenant_id), slug)
            return dict(row) if row else None
    
    async def list_spaces(
        self, 
        tenant_id: str, 
        limit: int = 50, 
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """List spaces for a tenant."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch('''
                SELECT s.*, 
                    (SELECT COUNT(*) FROM vault_branches WHERE space_id = s.id) as branch_count,
                    (SELECT COUNT(*) FROM vault_snapshots WHERE space_id = s.id) as snapshot_count
                FROM vault_spaces s
                WHERE tenant_id = $1
                ORDER BY updated_at DESC
                LIMIT $2 OFFSET $3
            ''', uuid.UUID(tenant_id), limit, offset)
            return [dict(row) for row in rows]
    
    # ============================================
    # BRANCHES
    # ============================================
    
    async def create_branch(
        self,
        space_id: str,
        name: str,
        from_branch: str = "main",
        created_by: str = None
    ) -> Dict[str, Any]:
        """Create a new branch from an existing branch."""
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                # Get source branch head
                source = await conn.fetchrow('''
                    SELECT id, head_snapshot_id FROM vault_branches
                    WHERE space_id = $1 AND name = $2
                ''', uuid.UUID(space_id), from_branch)
                
                if not source:
                    raise ValueError(f"Source branch '{from_branch}' not found")
                
                # Create new branch
                branch = await conn.fetchrow('''
                    INSERT INTO vault_branches 
                    (space_id, name, parent_branch_id, head_snapshot_id, created_by)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING *
                ''', uuid.UUID(space_id), name, source['id'], 
                    source['head_snapshot_id'],
                    uuid.UUID(created_by) if created_by else None)
                
                await self._log_activity(conn, space_id, created_by,
                    'create', 'branch', branch['id'], {'from': from_branch})
                
                return dict(branch)
    
    async def get_branch(self, space_id: str, name: str) -> Optional[Dict[str, Any]]:
        """Get branch by name."""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow('''
                SELECT b.*, s.message as head_message, s.created_at as head_date
                FROM vault_branches b
                LEFT JOIN vault_snapshots s ON b.head_snapshot_id = s.id
                WHERE b.space_id = $1 AND b.name = $2
            ''', uuid.UUID(space_id), name)
            return dict(row) if row else None
    
    async def list_branches(self, space_id: str) -> List[Dict[str, Any]]:
        """List all branches in a space."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch('''
                SELECT b.*, s.message as head_message, s.created_at as head_date
                FROM vault_branches b
                LEFT JOIN vault_snapshots s ON b.head_snapshot_id = s.id
                WHERE b.space_id = $1
                ORDER BY b.name
            ''', uuid.UUID(space_id))
            return [dict(row) for row in rows]
    
    # ============================================
    # SNAPSHOTS (COMMITS)
    # ============================================
    
    async def create_snapshot(
        self,
        space_id: str,
        branch_name: str,
        message: str,
        files: List[Dict[str, Any]],
        author_id: str,
        author_name: str = None,
        author_email: str = None
    ) -> Dict[str, Any]:
        """Create a new snapshot (commit)."""
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                # Get branch
                branch = await conn.fetchrow('''
                    SELECT id, head_snapshot_id FROM vault_branches
                    WHERE space_id = $1 AND name = $2
                ''', uuid.UUID(space_id), branch_name)
                
                if not branch:
                    raise ValueError(f"Branch '{branch_name}' not found")
                
                # Compute tree hash
                tree_hash = self._compute_tree_hash(files)
                
                # Create snapshot
                snapshot = await conn.fetchrow('''
                    INSERT INTO vault_snapshots
                    (space_id, branch_id, parent_snapshot_id, message, 
                     author_id, author_name, author_email, tree_hash)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING *
                ''', uuid.UUID(space_id), branch['id'], branch['head_snapshot_id'],
                    message, uuid.UUID(author_id), author_name, author_email, tree_hash)
                
                # Create/update file versions and tree entries
                for file in files:
                    await self._process_file(conn, space_id, snapshot['id'], file)
                
                # Update branch head
                await conn.execute('''
                    UPDATE vault_branches SET head_snapshot_id = $1, updated_at = NOW()
                    WHERE id = $2
                ''', snapshot['id'], branch['id'])
                
                await self._log_activity(conn, space_id, author_id,
                    'commit', 'snapshot', snapshot['id'], {'message': message})
                
                return dict(snapshot)
    
    async def get_snapshot(self, snapshot_id: str) -> Optional[Dict[str, Any]]:
        """Get snapshot by ID."""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                'SELECT * FROM vault_snapshots WHERE id = $1',
                uuid.UUID(snapshot_id)
            )
            return dict(row) if row else None
    
    async def get_history(
        self,
        space_id: str,
        branch_name: str = "main",
        path: str = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get commit history for a branch."""
        async with self.pool.acquire() as conn:
            # Get branch head
            branch = await self.get_branch(space_id, branch_name)
            if not branch or not branch.get('head_snapshot_id'):
                return []
            
            # Walk commit history
            commits = []
            current_id = branch['head_snapshot_id']
            
            while current_id and len(commits) < limit:
                row = await conn.fetchrow('''
                    SELECT s.*, 
                        (SELECT COUNT(*) FROM vault_trees WHERE snapshot_id = s.id) as file_count
                    FROM vault_snapshots s
                    WHERE s.id = $1
                ''', current_id)
                
                if not row:
                    break
                
                commits.append(dict(row))
                current_id = row['parent_snapshot_id']
            
            return commits
    
    # ============================================
    # TREE & FILES
    # ============================================
    
    async def get_tree(
        self,
        space_id: str,
        ref: str = "main",
        path: str = "/"
    ) -> List[Dict[str, Any]]:
        """Get directory listing at a ref."""
        async with self.pool.acquire() as conn:
            # Resolve ref to snapshot
            snapshot_id = await self._resolve_ref(conn, space_id, ref)
            if not snapshot_id:
                return []
            
            # Get tree entries at path
            if path == "/":
                path_pattern = "/%"
            else:
                path_pattern = path.rstrip("/") + "/%"
            
            rows = await conn.fetch('''
                SELECT t.*, fv.size_bytes, fv.mime_type
                FROM vault_trees t
                LEFT JOIN vault_file_versions fv ON t.file_version_id = fv.id
                WHERE t.snapshot_id = $1 
                AND t.path LIKE $2
                AND t.path NOT LIKE $3
                ORDER BY t.type DESC, t.path
            ''', snapshot_id, path_pattern, path_pattern + "/%")
            
            return [dict(row) for row in rows]
    
    async def get_blob(
        self,
        space_id: str,
        path: str,
        ref: str = "main"
    ) -> Optional[Dict[str, Any]]:
        """Get file content at a ref."""
        async with self.pool.acquire() as conn:
            snapshot_id = await self._resolve_ref(conn, space_id, ref)
            if not snapshot_id:
                return None
            
            row = await conn.fetchrow('''
                SELECT t.*, fv.*
                FROM vault_trees t
                JOIN vault_file_versions fv ON t.file_version_id = fv.id
                WHERE t.snapshot_id = $1 AND t.path = $2
            ''', snapshot_id, path)
            
            return dict(row) if row else None
    
    # ============================================
    # HELPERS
    # ============================================
    
    async def _resolve_ref(self, conn, space_id: str, ref: str) -> Optional[uuid.UUID]:
        """Resolve a ref (branch name or snapshot ID) to snapshot ID."""
        # Try as branch name first
        branch = await conn.fetchrow('''
            SELECT head_snapshot_id FROM vault_branches
            WHERE space_id = $1 AND name = $2
        ''', uuid.UUID(space_id), ref)
        
        if branch:
            return branch['head_snapshot_id']
        
        # Try as snapshot ID
        try:
            snapshot_id = uuid.UUID(ref)
            exists = await conn.fetchval(
                'SELECT 1 FROM vault_snapshots WHERE id = $1',
                snapshot_id
            )
            return snapshot_id if exists else None
        except ValueError:
            return None
    
    async def _process_file(self, conn, space_id: str, snapshot_id: uuid.UUID, file: Dict):
        """Process a file change in a commit."""
        action = file.get('action', 'add')  # add, modify, delete
        path = file['path']
        
        if action == 'delete':
            # Just don't include in tree
            return
        
        content_hash = file.get('content_hash')
        blob_id = file.get('blob_id')
        size_bytes = file.get('size_bytes', 0)
        mime_type = file.get('mime_type')
        metadata = file.get('metadata', {})
        
        # Upsert file version
        file_version = await conn.fetchrow('''
            INSERT INTO vault_file_versions 
            (space_id, content_hash, blob_id, size_bytes, mime_type, metadata)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (space_id, content_hash) DO UPDATE SET
                blob_id = EXCLUDED.blob_id,
                metadata = EXCLUDED.metadata
            RETURNING id
        ''', uuid.UUID(space_id), content_hash, 
            uuid.UUID(blob_id) if blob_id else None,
            size_bytes, mime_type, json.dumps(metadata))
        
        # Create tree entry
        await conn.execute('''
            INSERT INTO vault_trees (snapshot_id, path, type, file_version_id)
            VALUES ($1, $2, 'file', $3)
        ''', snapshot_id, path, file_version['id'])
        
        # Create parent directories
        parts = path.strip('/').split('/')
        for i in range(len(parts) - 1):
            dir_path = '/' + '/'.join(parts[:i+1])
            await conn.execute('''
                INSERT INTO vault_trees (snapshot_id, path, type)
                VALUES ($1, $2, 'directory')
                ON CONFLICT (snapshot_id, path) DO NOTHING
            ''', snapshot_id, dir_path)
    
    def _compute_tree_hash(self, files: List[Dict]) -> str:
        """Compute Merkle root hash."""
        sorted_files = sorted(files, key=lambda f: f.get('path', ''))
        content = json.dumps(sorted_files, sort_keys=True)
        return hashlib.sha256(content.encode()).hexdigest()
    
    async def _log_activity(
        self, 
        conn, 
        space_id: str, 
        actor_id: str,
        action: str,
        resource_type: str,
        resource_id: uuid.UUID,
        details: Dict = None
    ):
        """Log activity for audit trail."""
        await conn.execute('''
            INSERT INTO vault_activity 
            (space_id, actor_id, action, resource_type, resource_id, details)
            VALUES ($1, $2, $3, $4, $5, $6)
        ''', uuid.UUID(space_id) if space_id else None,
            uuid.UUID(actor_id) if actor_id else None,
            action, resource_type, resource_id,
            json.dumps(details) if details else None)

