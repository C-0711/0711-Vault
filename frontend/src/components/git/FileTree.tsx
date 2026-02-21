/**
 * PROJEKT GENESIS: File Tree Component
 */

import React, { useState, useEffect } from 'react';

interface TreeEntry {
  path: string;
  type: 'file' | 'directory';
  size_bytes?: number;
  mime_type?: string;
}

interface FileTreeProps {
  spaceId: string;
  branch: string;
  currentPath: string;
  onNavigate: (path: string) => void;
  onFileSelect?: (entry: TreeEntry) => void;
}

export function FileTree({ spaceId, branch, currentPath, onNavigate, onFileSelect }: FileTreeProps) {
  const [entries, setEntries] = useState<TreeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTree();
  }, [spaceId, branch, currentPath]);

  const fetchTree = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/git/spaces/${spaceId}/tree?ref=${branch}&path=${encodeURIComponent(currentPath)}`
      );
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (err) {
      console.error('Failed to fetch tree:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (entry: TreeEntry) => {
    if (entry.type === 'directory') return '📁';
    
    const ext = entry.path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '📄';
      case 'md': return '📝';
      case 'json': return '📋';
      case 'jpg': case 'jpeg': case 'png': case 'gif': return '🖼️';
      case 'mp4': case 'mov': return '🎬';
      default: return '📄';
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const getBasename = (path: string) => path.split('/').pop() || path;

  // Breadcrumb
  const pathParts = currentPath.split('/').filter(Boolean);
  const breadcrumbs = [
    { name: 'root', path: '/' },
    ...pathParts.map((part, i) => ({
      name: part,
      path: '/' + pathParts.slice(0, i + 1).join('/')
    }))
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm mb-4 text-gray-400">
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={crumb.path}>
            {i > 0 && <span>/</span>}
            <button
              onClick={() => onNavigate(crumb.path)}
              className="hover:text-white hover:underline"
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* File List */}
      <div className="border border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr className="text-left text-sm text-gray-400">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2 w-24">Size</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {currentPath !== '/' && (
              <tr
                onClick={() => {
                  const parent = '/' + pathParts.slice(0, -1).join('/') || '/';
                  onNavigate(parent);
                }}
                className="hover:bg-gray-800 cursor-pointer"
              >
                <td className="px-4 py-2">
                  <span className="flex items-center gap-2">
                    <span>📁</span>
                    <span>..</span>
                  </span>
                </td>
                <td></td>
              </tr>
            )}
            {entries.map((entry) => (
              <tr
                key={entry.path}
                onClick={() => {
                  if (entry.type === 'directory') {
                    onNavigate(entry.path);
                  } else {
                    onFileSelect?.(entry);
                  }
                }}
                className="hover:bg-gray-800 cursor-pointer"
              >
                <td className="px-4 py-2">
                  <span className="flex items-center gap-2">
                    <span>{getFileIcon(entry)}</span>
                    <span>{getBasename(entry.path)}</span>
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-gray-400">
                  {entry.type === 'file' && formatSize(entry.size_bytes)}
                </td>
              </tr>
            ))}
            {entries.length === 0 && currentPath === '/' && (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-gray-500">
                  This space is empty. Upload files or commit changes to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FileTree;
