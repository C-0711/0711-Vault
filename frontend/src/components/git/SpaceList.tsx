/**
 * PROJEKT GENESIS: Space List Component
 * Displays all Git spaces (repos) for the current tenant
 */

import React, { useState, useEffect } from 'react';

interface Space {
  id: string;
  name: string;
  slug: string;
  description: string;
  default_branch: string;
  visibility: 'private' | 'internal' | 'public';
  branch_count: number;
  snapshot_count: number;
  updated_at: string;
}

interface SpaceListProps {
  onSpaceSelect?: (space: Space) => void;
}

export function SpaceList({ onSpaceSelect }: SpaceListProps) {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchSpaces();
  }, []);

  const fetchSpaces = async () => {
    try {
      const res = await fetch('/api/git/spaces');
      const data = await res.json();
      setSpaces(data.spaces || []);
    } catch (err) {
      console.error('Failed to fetch spaces:', err);
    } finally {
      setLoading(false);
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return '🌐';
      case 'internal': return '🏢';
      default: return '🔒';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Spaces</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <span>+</span>
          <span>New Space</span>
        </button>
      </div>

      {/* Space Grid */}
      {spaces.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <div className="text-4xl mb-4">📁</div>
          <h3 className="text-lg font-medium mb-2">No spaces yet</h3>
          <p className="text-gray-400 mb-4">Create your first space to start versioning your data</p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Create Space
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spaces.map((space) => (
            <div
              key={space.id}
              onClick={() => onSpaceSelect?.(space)}
              className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 cursor-pointer transition-colors border border-gray-700 hover:border-blue-500"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg">{space.name}</h3>
                <span title={space.visibility}>{getVisibilityIcon(space.visibility)}</span>
              </div>
              
              {space.description && (
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{space.description}</p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <span>🌿</span>
                  <span>{space.branch_count} branches</span>
                </span>
                <span className="flex items-center gap-1">
                  <span>📝</span>
                  <span>{space.snapshot_count} commits</span>
                </span>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
                Updated {new Date(space.updated_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateSpaceModal
          onClose={() => setShowCreate(false)}
          onCreated={(space) => {
            setSpaces([space, ...spaces]);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}

interface CreateSpaceModalProps {
  onClose: () => void;
  onCreated: (space: Space) => void;
}

function CreateSpaceModal({ onClose, onCreated }: CreateSpaceModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'internal' | 'public'>('private');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    
    setCreating(true);
    try {
      const res = await fetch('/api/git/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, visibility })
      });
      const space = await res.json();
      onCreated(space);
    } catch (err) {
      console.error('Failed to create space:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create New Space</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
              placeholder="my-product-catalog"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
              rows={3}
              placeholder="What's in this space?"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as any)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
            >
              <option value="private">🔒 Private</option>
              <option value="internal">🏢 Internal</option>
              <option value="public">🌐 Public</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || creating}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg"
          >
            {creating ? 'Creating...' : 'Create Space'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SpaceList;
