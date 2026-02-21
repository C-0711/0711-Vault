/**
 * PROJEKT GENESIS: Space List Component
 * Displays all Git spaces (repos) for the current tenant
 */

import React, { useState, useEffect } from 'react';
import { getSpaces, createSpace } from '../../lib/api';

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
  const [newSpace, setNewSpace] = useState({ name: '', description: '', visibility: 'private' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchSpaces();
  }, []);

  const fetchSpaces = async () => {
    try {
      const data = await getSpaces();
      setSpaces(data.spaces || []);
    } catch (err) {
      console.error('Failed to fetch spaces:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newSpace.name.trim()) return;
    setCreating(true);
    try {
      await createSpace(newSpace.name, newSpace.description, newSpace.visibility);
      setShowCreate(false);
      setNewSpace({ name: '', description: '', visibility: 'private' });
      fetchSpaces();
    } catch (err) {
      console.error('Failed to create space:', err);
    } finally {
      setCreating(false);
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return '🌐';
      case 'internal': return '🏢';
      default: return '🔒';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
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

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Space</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={newSpace.name}
                  onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
                  className="w-full bg-gray-700 rounded px-3 py-2 text-white"
                  placeholder="my-project"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={newSpace.description}
                  onChange={(e) => setNewSpace({ ...newSpace, description: e.target.value })}
                  className="w-full bg-gray-700 rounded px-3 py-2 text-white h-20"
                  placeholder="Optional description..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Visibility</label>
                <select
                  value={newSpace.visibility}
                  onChange={(e) => setNewSpace({ ...newSpace, visibility: e.target.value })}
                  className="w-full bg-gray-700 rounded px-3 py-2 text-white"
                >
                  <option value="private">🔒 Private</option>
                  <option value="internal">🏢 Internal</option>
                  <option value="public">🌐 Public</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newSpace.name.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded"
              >
                {creating ? 'Creating...' : 'Create Space'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Space Grid */}
      {spaces.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <div className="text-4xl mb-4">📁</div>
          <h3 className="text-lg font-medium mb-2">No spaces yet</h3>
          <p className="text-gray-400 mb-4">Create your first space to start versioning your data</p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
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
              className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-750 border border-gray-700 hover:border-blue-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-blue-400">{space.name}</h3>
                <span title={space.visibility}>{getVisibilityIcon(space.visibility)}</span>
              </div>
              {space.description && (
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">{space.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>🌿 {space.branch_count} branches</span>
                <span>📸 {space.snapshot_count} commits</span>
              </div>
              <div className="text-xs text-gray-600 mt-2">
                Updated {formatDate(space.updated_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SpaceList;
