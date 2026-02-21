/**
 * PROJEKT GENESIS: Branch Selector Component
 */

import React, { useState, useEffect, useRef } from 'react';

interface Branch {
  id: string;
  name: string;
  protected: boolean;
  head_message?: string;
  head_date?: string;
}

interface BranchSelectorProps {
  spaceId: string;
  currentBranch: string;
  onBranchChange: (branch: string) => void;
}

export function BranchSelector({ spaceId, currentBranch, onBranchChange }: BranchSelectorProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBranches();
  }, [spaceId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await fetch(`/api/git/spaces/${spaceId}/branches`);
      const data = await res.json();
      setBranches(data.branches || []);
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  };

  const createBranch = async () => {
    if (!newBranchName.trim()) return;
    
    try {
      await fetch(`/api/git/spaces/${spaceId}/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBranchName, from_branch: currentBranch })
      });
      await fetchBranches();
      onBranchChange(newBranchName);
      setNewBranchName('');
      setShowCreate(false);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to create branch:', err);
    }
  };

  const currentBranchData = branches.find(b => b.name === currentBranch);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg border border-gray-600"
      >
        <span>🌿</span>
        <span className="font-medium">{currentBranch}</span>
        {currentBranchData?.protected && <span className="text-yellow-500">🔒</span>}
        <span className="text-gray-400">▼</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
          <div className="p-2 border-b border-gray-700">
            <input
              type="text"
              placeholder="Find or create branch..."
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newBranchName) {
                  createBranch();
                }
              }}
            />
          </div>

          <div className="max-h-64 overflow-y-auto">
            {branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => {
                  onBranchChange(branch.name);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-gray-700 flex items-center justify-between ${
                  branch.name === currentBranch ? 'bg-gray-700' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {branch.name === currentBranch && <span className="text-green-500">✓</span>}
                  <span>{branch.name}</span>
                  {branch.protected && <span className="text-yellow-500 text-xs">🔒</span>}
                </div>
                {branch.head_message && (
                  <span className="text-xs text-gray-500 truncate max-w-32">
                    {branch.head_message}
                  </span>
                )}
              </button>
            ))}
          </div>

          {newBranchName && !branches.find(b => b.name === newBranchName) && (
            <div className="p-2 border-t border-gray-700">
              <button
                onClick={createBranch}
                className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded text-blue-400"
              >
                <span>+ Create branch "{newBranchName}" from {currentBranch}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BranchSelector;
