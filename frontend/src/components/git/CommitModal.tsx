/**
 * PROJEKT GENESIS: Commit Modal Component
 * Create new snapshots (commits) with file changes
 */

import React, { useState, useCallback } from 'react';
import { createSnapshot } from '../../lib/api';

interface FileChange {
  path: string;
  content_hash: string;
  size_bytes: number;
  mime_type: string;
  action: 'add' | 'modify' | 'delete';
}

interface CommitModalProps {
  spaceId: string;
  branch: string;
  onClose: () => void;
  onCommit: () => void;
}

export function CommitModal({ spaceId, branch, onClose, onCommit }: CommitModalProps) {
  const [message, setMessage] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<FileChange[]>([]);
  const [committing, setCommitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const items = e.dataTransfer.files;
    const newFiles: FileChange[] = [];

    for (let i = 0; i < items.length; i++) {
      const file = items[i];
      // Generate content hash (simplified - in production, hash file content)
      const hash = await hashFile(file);
      
      newFiles.push({
        path: '/' + file.name,
        content_hash: hash,
        size_bytes: file.size,
        mime_type: file.type || 'application/octet-stream',
        action: 'add'
      });
    }

    setFiles([...files, ...newFiles]);
  }, [files]);

  const hashFile = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!message.trim() || files.length === 0) return;
    
    setCommitting(true);
    try {
      const fullMessage = description 
        ? `${message}\n\n${description}`
        : message;
      
      await createSnapshot(spaceId, fullMessage, files, branch);
      onCommit();
      onClose();
    } catch (err) {
      console.error('Failed to create commit:', err);
    } finally {
      setCommitting(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('json')) return '📊';
    if (mimeType.includes('text')) return '📝';
    return '📄';
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>📸</span>
            New Commit
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Branch indicator */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Committing to</span>
            <span className="bg-gray-700 px-2 py-0.5 rounded text-white">🌿 {branch}</span>
          </div>

          {/* Commit message */}
          <div>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Commit message (required)"
              className="w-full bg-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Extended description (optional)"
              className="w-full bg-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
            />
          </div>

          {/* File drop zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <div className="text-4xl mb-2">📁</div>
            <p className="text-gray-300">Drag & drop files here</p>
            <p className="text-sm text-gray-500 mt-1">or click to browse</p>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="bg-gray-700 rounded-lg divide-y divide-gray-600">
              {files.map((file, index) => (
                <div key={index} className="px-4 py-3 flex items-center gap-3">
                  <span>{getFileIcon(file.mime_type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white truncate">{file.path}</p>
                    <p className="text-xs text-gray-400">{formatSize(file.size_bytes)}</p>
                  </div>
                  <span className="text-green-400 text-xs uppercase">{file.action}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-500 hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {files.length} file{files.length !== 1 ? 's' : ''} staged
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={committing || !message.trim() || files.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg flex items-center gap-2"
            >
              {committing ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Committing...
                </>
              ) : (
                <>
                  <span>✓</span>
                  Commit
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommitModal;
