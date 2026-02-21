/**
 * PROJEKT GENESIS: Diff Viewer Component
 * Compare two refs (branches, commits)
 */

import React, { useState, useEffect } from 'react';
import { getDiff, getBranches } from '../../lib/api';

interface Change {
  path: string;
  status: 'added' | 'modified' | 'deleted';
}

interface DiffResult {
  from_ref: string;
  to_ref: string;
  files_changed: number;
  additions: number;
  deletions: number;
  changes: Change[];
}

interface DiffViewerProps {
  spaceId: string;
  fromRef: string;
  toRef: string;
}

export function DiffViewer({ spaceId, fromRef: initialFrom, toRef: initialTo }: DiffViewerProps) {
  const [fromRef, setFromRef] = useState(initialFrom);
  const [toRef, setToRef] = useState(initialTo);
  const [branches, setBranches] = useState<string[]>([]);
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBranches();
  }, [spaceId]);

  useEffect(() => {
    if (fromRef && toRef && fromRef !== toRef) {
      fetchDiff();
    }
  }, [fromRef, toRef]);

  const fetchBranches = async () => {
    try {
      const data = await getBranches(spaceId);
      setBranches((data.branches || []).map((b: any) => b.name));
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  };

  const fetchDiff = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDiff(spaceId, fromRef, toRef);
      setDiff(data);
    } catch (err: any) {
      setError(err.message || 'Failed to compute diff');
      setDiff(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'added': return '➕';
      case 'deleted': return '➖';
      case 'modified': return '📝';
      default: return '📄';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'added': return 'text-green-400';
      case 'deleted': return 'text-red-400';
      case 'modified': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Ref Selectors */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Base:</label>
          <select
            value={fromRef}
            onChange={(e) => setFromRef(e.target.value)}
            className="bg-gray-700 rounded px-3 py-1.5 text-sm"
          >
            {branches.map((branch) => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>
        </div>

        <span className="text-gray-500">←</span>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Compare:</label>
          <select
            value={toRef}
            onChange={(e) => setToRef(e.target.value)}
            className="bg-gray-700 rounded px-3 py-1.5 text-sm"
          >
            {branches.map((branch) => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setFromRef(toRef);
            setToRef(fromRef);
          }}
          className="text-gray-400 hover:text-white px-2"
          title="Swap"
        >
          ⇄
        </button>
      </div>

      {/* Results */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-red-400">
          <p>{error}</p>
        </div>
      )}

      {fromRef === toRef && (
        <div className="text-center py-12 text-gray-500">
          <p>Select different branches to compare</p>
        </div>
      )}

      {diff && !loading && (
        <>
          {/* Summary */}
          <div className="flex items-center gap-6 mb-6 p-4 bg-gray-700 rounded">
            <div className="text-center">
              <div className="text-2xl font-bold">{diff.files_changed}</div>
              <div className="text-sm text-gray-400">Files Changed</div>
            </div>
            <div className="text-center text-green-400">
              <div className="text-2xl font-bold">+{diff.additions}</div>
              <div className="text-sm">Additions</div>
            </div>
            <div className="text-center text-red-400">
              <div className="text-2xl font-bold">-{diff.deletions}</div>
              <div className="text-sm">Deletions</div>
            </div>
          </div>

          {/* File List */}
          {diff.changes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No differences between these branches</p>
            </div>
          ) : (
            <div className="space-y-1">
              {diff.changes.map((change, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded"
                >
                  <span>{getStatusIcon(change.status)}</span>
                  <span className={getStatusColor(change.status)}>
                    {change.path}
                  </span>
                  <span className="ml-auto text-xs text-gray-500 uppercase">
                    {change.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DiffViewer;
