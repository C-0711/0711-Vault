/**
 * PROJEKT GENESIS: Branch Selector Component
 * Dropdown for selecting/creating branches
 */

import React, { useState, useEffect, useRef } from 'react';
import { getBranches, createBranch } from '../../lib/api';

interface Branch {
  id: string;
  name: string;
  head_snapshot_id: string | null;
  protected: boolean;
}

interface BranchSelectorProps {
  spaceId: string;
  currentBranch: string;
  onBranchChange: (branch: string) => void;
}

export function BranchSelector({ spaceId, currentBranch, onBranchChange }: BranchSelectorProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBranches();
  }, [spaceId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchBranches = async () => {
    try {
      const data = await getBranches(spaceId);
      setBranches(data.branches || []);
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  };

  const handleCreate = async () => {
    if (!search.trim() || branches.some(b => b.name === search)) return;
    setCreating(true);
    try {
      await createBranch(spaceId, search, currentBranch);
      await fetchBranches();
      onBranchChange(search);
      setSearch('');
      setOpen(false);
    } catch (err) {
      console.error('Failed to create branch:', err);
    } finally {
      setCreating(false);
    }
  };

  const filtered = branches.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const showCreateOption = search.trim() && !branches.some(b => b.name === search);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-sm"
      >
        <span>🌿</span>
        <span>{currentBranch}</span>
        <span className="text-gray-400">▼</span>
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
          <div className="p-2 border-b border-gray-700">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find or create branch..."
              className="w-full bg-gray-700 rounded px-3 py-1.5 text-sm"
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-y-auto">
            {showCreateOption && (
              <button
                onClick={handleCreate}
                disabled={creating}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2 text-green-400"
              >
                <span>+</span>
                <span>Create branch: <strong>{search}</strong></span>
              </button>
            )}

            {filtered.map((branch) => (
              <button
                key={branch.id}
                onClick={() => {
                  onBranchChange(branch.name);
                  setOpen(false);
                  setSearch('');
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2 ${
                  branch.name === currentBranch ? 'bg-gray-700' : ''
                }`}
              >
                <span>{branch.protected ? '🔒' : '🌿'}</span>
                <span>{branch.name}</span>
                {branch.name === currentBranch && <span className="ml-auto">✓</span>}
              </button>
            ))}

            {filtered.length === 0 && !showCreateOption && (
              <div className="px-3 py-2 text-sm text-gray-500">
                No branches found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BranchSelector;
