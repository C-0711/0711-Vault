/**
 * PROJEKT GENESIS: Git Page
 * Main page for Vault-Git versioning system
 */

import React, { useState } from 'react';
import { SpaceList } from '../components/git/SpaceList';
import { BranchSelector } from '../components/git/BranchSelector';
import { FileTree } from '../components/git/FileTree';
import { DiffViewer } from '../components/git/DiffViewer';
import { CommitHistory } from '../components/git/CommitHistory';
import { CommitModal } from '../components/git/CommitModal';

interface Space {
  id: string;
  name: string;
  slug: string;
  description: string;
  default_branch: string;
  visibility: string;
}

type ViewMode = 'tree' | 'history' | 'diff';

export function GitPage() {
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>('main');
  const [selectedPath, setSelectedPath] = useState<string>('/');
  const [view, setView] = useState<ViewMode>('tree');
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCommit = () => {
    setRefreshKey(k => k + 1);
  };

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
                <span className="text-blue-400 font-medium">{selectedSpace.name}</span>
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
            <div className="flex items-center gap-3">
              {/* View toggles */}
              <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setView('tree')}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${
                    view === 'tree' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  📁 Files
                </button>
                <button
                  onClick={() => setView('history')}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${
                    view === 'history' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  📜 History
                </button>
                <button
                  onClick={() => setView('diff')}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${
                    view === 'diff' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  ⚡ Compare
                </button>
              </div>

              {/* Commit button */}
              <button
                onClick={() => setShowCommitModal(true)}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
              >
                <span>+</span>
                New Commit
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
            setSelectedPath('/');
          }} />
        ) : (
          <div className="space-y-6">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm">
              <button 
                onClick={() => {
                  setSelectedSpace(null);
                  setSelectedPath('/');
                }}
                className="text-blue-400 hover:underline"
              >
                All Spaces
              </button>
              <span className="text-gray-500">→</span>
              <span className="text-white">{selectedSpace.name}</span>
              {view === 'tree' && selectedPath !== '/' && (
                <>
                  <span className="text-gray-500">→</span>
                  <span className="text-gray-400">{selectedPath}</span>
                </>
              )}
            </div>

            {/* Content Area */}
            {view === 'tree' && (
              <FileTree
                key={`tree-${refreshKey}`}
                spaceId={selectedSpace.id}
                branch={selectedBranch}
                path={selectedPath}
                onNavigate={setSelectedPath}
              />
            )}

            {view === 'history' && (
              <CommitHistory
                key={`history-${refreshKey}`}
                spaceId={selectedSpace.id}
                branch={selectedBranch}
                onCommitSelect={(commit) => {
                  console.log('Selected commit:', commit);
                }}
              />
            )}

            {view === 'diff' && (
              <DiffViewer
                spaceId={selectedSpace.id}
                fromRef="main"
                toRef={selectedBranch !== 'main' ? selectedBranch : 'main'}
              />
            )}
          </div>
        )}
      </main>

      {/* Commit Modal */}
      {showCommitModal && selectedSpace && (
        <CommitModal
          spaceId={selectedSpace.id}
          branch={selectedBranch}
          onClose={() => setShowCommitModal(false)}
          onCommit={handleCommit}
        />
      )}
    </div>
  );
}

export default GitPage;
