/**
 * PROJEKT GENESIS: Commit History Component
 * Interactive timeline of commits (git log)
 */

import React, { useState, useEffect } from 'react';
import { getHistory } from '../../lib/api';

interface Commit {
  id: string;
  message: string;
  author_name: string;
  author_email: string;
  tree_hash: string;
  created_at: string;
}

interface CommitHistoryProps {
  spaceId: string;
  branch: string;
  onCommitSelect?: (commit: Commit) => void;
}

export function CommitHistory({ spaceId, branch, onCommitSelect }: CommitHistoryProps) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [spaceId, branch]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getHistory(spaceId, branch, 50);
      setCommits(data.commits || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500'];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <h2 className="font-medium flex items-center gap-2">
          <span>📜</span>
          Commit History
          <span className="text-sm text-gray-500">({commits.length})</span>
        </h2>
        <span className="text-sm text-gray-400">🌿 {branch}</span>
      </div>

      {/* Timeline */}
      {commits.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <div className="text-4xl mb-2">📭</div>
          <p>No commits yet</p>
          <p className="text-sm">Make your first commit to start tracking changes</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-700">
          {commits.map((commit, index) => (
            <div
              key={commit.id}
              onClick={() => {
                setSelectedId(commit.id);
                onCommitSelect?.(commit);
              }}
              className={`p-4 cursor-pointer hover:bg-gray-750 transition-colors ${
                selectedId === commit.id ? 'bg-gray-700' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Timeline dot */}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white ${getAvatarColor(commit.author_name)}`}>
                    {getInitials(commit.author_name)}
                  </div>
                  {index < commits.length - 1 && (
                    <div className="w-0.5 h-8 bg-gray-600 mt-1" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {commit.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                    <span>{commit.author_name}</span>
                    <span>•</span>
                    <span>{formatDate(commit.created_at)}</span>
                  </div>
                  <div className="mt-1">
                    <code className="text-xs text-gray-500 font-mono">
                      {commit.id.slice(0, 8)}
                    </code>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button 
                    className="text-gray-500 hover:text-white p-1"
                    title="View changes"
                  >
                    📋
                  </button>
                  <button 
                    className="text-gray-500 hover:text-white p-1"
                    title="Browse files"
                  >
                    📁
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CommitHistory;
