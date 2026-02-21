/**
 * PROJEKT GENESIS: Diff Viewer Component
 * Side-by-side comparison of file changes
 */

import React, { useState, useEffect } from 'react';

interface DiffLine {
  type: 'context' | 'addition' | 'deletion';
  oldLine?: number;
  newLine?: number;
  content: string;
}

interface FileDiff {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  oldPath?: string;
  additions: number;
  deletions: number;
  lines: DiffLine[];
}

interface DiffViewerProps {
  spaceId: string;
  fromRef: string;
  toRef: string;
}

export function DiffViewer({ spaceId, fromRef, toRef }: DiffViewerProps) {
  const [diff, setDiff] = useState<{
    files: FileDiff[];
    totalAdditions: number;
    totalDeletions: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('unified');

  useEffect(() => {
    fetchDiff();
  }, [spaceId, fromRef, toRef]);

  const fetchDiff = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/git/spaces/${spaceId}/diff?from_ref=${fromRef}&to_ref=${toRef}`
      );
      const data = await res.json();
      setDiff(data);
      // Expand first 3 files by default
      const firstFiles = (data.files || []).slice(0, 3).map((f: FileDiff) => f.path);
      setExpandedFiles(new Set(firstFiles));
    } catch (err) {
      console.error('Failed to fetch diff:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFile = (path: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFiles(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'added': return <span className="text-green-500">A</span>;
      case 'modified': return <span className="text-yellow-500">M</span>;
      case 'deleted': return <span className="text-red-500">D</span>;
      case 'renamed': return <span className="text-blue-500">R</span>;
      default: return null;
    }
  };

  const getLineClass = (type: string) => {
    switch (type) {
      case 'addition': return 'bg-green-900/30 text-green-300';
      case 'deletion': return 'bg-red-900/30 text-red-300';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!diff || diff.files.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="text-4xl mb-4">📝</div>
        <p>No changes between {fromRef} and {toRef}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm">
            {fromRef.slice(0, 7)} → {toRef.slice(0, 7)}
          </span>
          <span className="text-green-500">+{diff.totalAdditions}</span>
          <span className="text-red-500">-{diff.totalDeletions}</span>
          <span className="text-gray-500">{diff.files.length} files</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('unified')}
            className={`px-3 py-1 rounded ${viewMode === 'unified' ? 'bg-gray-700' : ''}`}
          >
            Unified
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1 rounded ${viewMode === 'split' ? 'bg-gray-700' : ''}`}
          >
            Split
          </button>
        </div>
      </div>

      {/* File list */}
      <div className="space-y-2">
        {diff.files.map((file) => (
          <div key={file.path} className="border border-gray-700 rounded-lg overflow-hidden">
            {/* File header */}
            <div
              onClick={() => toggleFile(file.path)}
              className="flex items-center justify-between px-4 py-2 bg-gray-800 cursor-pointer hover:bg-gray-750"
            >
              <div className="flex items-center gap-3">
                <span>{expandedFiles.has(file.path) ? '▼' : '▶'}</span>
                {getStatusIcon(file.status)}
                <span className="font-mono text-sm">{file.path}</span>
                {file.oldPath && file.oldPath !== file.path && (
                  <span className="text-gray-500 text-sm">← {file.oldPath}</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-500">+{file.additions}</span>
                <span className="text-red-500">-{file.deletions}</span>
              </div>
            </div>

            {/* File diff content */}
            {expandedFiles.has(file.path) && (
              <div className="overflow-x-auto">
                <table className="w-full font-mono text-sm">
                  <tbody>
                    {file.lines.map((line, i) => (
                      <tr key={i} className={getLineClass(line.type)}>
                        <td className="w-12 text-right px-2 text-gray-500 select-none border-r border-gray-700">
                          {line.oldLine || ''}
                        </td>
                        <td className="w-12 text-right px-2 text-gray-500 select-none border-r border-gray-700">
                          {line.newLine || ''}
                        </td>
                        <td className="w-6 text-center select-none">
                          {line.type === 'addition' ? '+' : line.type === 'deletion' ? '-' : ' '}
                        </td>
                        <td className="px-2 whitespace-pre">{line.content}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DiffViewer;
