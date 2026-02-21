/**
 * PROJEKT GENESIS: File Tree Component
 * Displays directory structure at a specific ref
 */

import React, { useState, useEffect } from 'react';
import { getTree, getHistory } from '../../lib/api';

interface TreeEntry {
  path: string;
  type: 'file' | 'directory';
  file_version_id: string | null;
  mode: string;
}

interface Commit {
  id: string;
  message: string;
  author_name: string;
  created_at: string;
}

interface FileTreeProps {
  spaceId: string;
  branch: string;
  path: string;
  onNavigate: (path: string) => void;
}

export function FileTree({ spaceId, branch, path, onNavigate }: FileTreeProps) {
  const [entries, setEntries] = useState<TreeEntry[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTree();
    fetchHistory();
  }, [spaceId, branch, path]);

  const fetchTree = async () => {
    setLoading(true);
    try {
      const data = await getTree(spaceId, branch, path);
      setEntries(data.entries || []);
    } catch (err) {
      console.error('Failed to fetch tree:', err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await getHistory(spaceId, branch, 5);
      setCommits(data.commits || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const getIcon = (entry: TreeEntry) => {
    if (entry.type === 'directory') return '📁';
    const ext = entry.path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'md': return '📝';
      case 'pdf': return '📄';
      case 'jpg': case 'png': case 'gif': return '🖼️';
      case 'mp4': case 'mov': return '🎬';
      case 'json': return '📊';
      default: return '📄';
    }
  };

  const getName = (fullPath: string) => {
    const parts = fullPath.split('/').filter(Boolean);
    return parts[parts.length - 1] || fullPath;
  };

  const handleClick = (entry: TreeEntry) => {
    if (entry.type === 'directory') {
      onNavigate(entry.path);
    } else {
      // TODO: Open file viewer
      console.log('Open file:', entry.path);
    }
  };

  const navigateUp = () => {
    const parts = path.split('/').filter(Boolean);
    parts.pop();
    onNavigate('/' + parts.join('/'));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
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
    <div className="grid grid-cols-3 gap-6">
      {/* File List */}
      <div className="col-span-2 bg-gray-800 rounded-lg overflow-hidden">
        <div className="border-b border-gray-700 px-4 py-2 flex items-center gap-2 text-sm">
          {commits[0] && (
            <>
              <span className="text-blue-400">{commits[0].author_name}</span>
              <span className="text-gray-400 truncate flex-1">{commits[0].message}</span>
              <span className="text-gray-500">{formatDate(commits[0].created_at)}</span>
            </>
          )}
        </div>

        <div className="divide-y divide-gray-700">
          {path !== '/' && (
            <button
              onClick={navigateUp}
              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-700 text-left"
            >
              <span>📁</span>
              <span className="text-gray-400">..</span>
            </button>
          )}

          {entries.length === 0 && path === '/' && (
            <div className="px-4 py-8 text-center text-gray-500">
              <div className="text-4xl mb-2">📭</div>
              <p>This space is empty</p>
              <p className="text-sm">Upload files to get started</p>
            </div>
          )}

          {/* Directories first, then files */}
          {entries
            .sort((a, b) => {
              if (a.type === b.type) return a.path.localeCompare(b.path);
              return a.type === 'directory' ? -1 : 1;
            })
            .map((entry) => (
              <button
                key={entry.path}
                onClick={() => handleClick(entry)}
                className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-700 text-left"
              >
                <span>{getIcon(entry)}</span>
                <span className={entry.type === 'directory' ? 'text-blue-400' : ''}>
                  {getName(entry.path)}
                </span>
              </button>
            ))}
        </div>
      </div>

      {/* Recent Commits Sidebar */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <span>📜</span>
          Recent Commits
        </h3>
        {commits.length === 0 ? (
          <p className="text-sm text-gray-500">No commits yet</p>
        ) : (
          <div className="space-y-3">
            {commits.map((commit) => (
              <div key={commit.id} className="text-sm">
                <p className="text-gray-300 truncate">{commit.message}</p>
                <p className="text-gray-500 text-xs">
                  {commit.author_name} • {formatDate(commit.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FileTree;
