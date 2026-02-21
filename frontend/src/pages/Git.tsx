/**
 * PROJEKT GENESIS: Git Page
 * Main page for Vault-Git versioning system
 */

import React, { useState } from 'react';
import { SpaceList } from '../components/git/SpaceList';
import { BranchSelector } from '../components/git/BranchSelector';
import { FileTree } from '../components/git/FileTree';
import { DiffViewer } from '../components/git/DiffViewer';

interface Space {
  id: string;
  name: string;
  slug: string;
  description: string;
  default_branch: string;
  visibility: string;
}

export function GitPage() {
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>('main');
  const [selectedPath, setSelectedPath] = useState<string>('/');
  const [view, setView] = useState<'tree' | 'history' | 'diff'>('tree');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="text-2xl">📦</span>
              Vault-Git
            </h1>
            {selectedSpace && (
              <>
                <span className="text-gray-500">/</span>
                <span className="text-blue-400">{selectedSpace.name}</span>
                <span className="text-gray-500">/</span>
                <BranchSelector
                  spaceId={selectedSpace.id}
                  currentBranch={selectedBranch}
                  onBranchChange={setSelectedBranch}
                />
              </>
            )}
          </div>
          
          {selectedSpace && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView('tree')}
                className={`px-3 py-1 rounded ${view === 'tree' ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                📁 Files
              </button>
              <button
                onClick={() => setView('history')}
                className={`px-3 py-1 rounded ${view === 'history' ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                📜 History
              </button>
              <button
                onClick={() => setView('diff')}
                className={`px-3 py-1 rounded ${view === 'diff' ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                ⚡ Diff
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {!selectedSpace ? (
          <SpaceList onSpaceSelect={(space) => {
            setSelectedSpace(space);
            setSelectedBranch(space.default_branch || 'main');
          }} />
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm">
              <button 
                onClick={() => setSelectedSpace(null)}
                className="text-blue-400 hover:underline"
              >
                All Spaces
              </button>
              <span className="text-gray-500">→</span>
              <span>{selectedSpace.name}</span>
              {selectedPath !== '/' && (
                <>
                  <span className="text-gray-500">→</span>
                  <span className="text-gray-400">{selectedPath}</span>
                </>
              )}
            </div>

            {/* Content Area */}
            {view === 'tree' && (
              <FileTree
                spaceId={selectedSpace.id}
                branch={selectedBranch}
                path={selectedPath}
                onNavigate={setSelectedPath}
              />
            )}

            {view === 'history' && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h2 className="text-lg font-medium mb-4">Commit History</h2>
                <p className="text-gray-400">Coming soon: Interactive commit history</p>
              </div>
            )}

            {view === 'diff' && (
              <DiffViewer
                spaceId={selectedSpace.id}
                fromRef="main"
                toRef={selectedBranch}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default GitPage;
