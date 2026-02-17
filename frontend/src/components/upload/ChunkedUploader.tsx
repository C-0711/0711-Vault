// ChunkedUploader.tsx - Drag-and-drop upload component
// 0711-Vault - Digital Sovereignty

import React, { useRef, useState, useCallback } from 'react';
import { useChunkedUpload } from './useChunkedUpload';

interface CompleteResponse {
  item_id: string;
  storage_key: string;
  status: string;
  file_size: number;
  checksum: string;
}

interface ChunkedUploaderProps {
  apiBaseUrl?: string;
  getAuthToken: () => string | Promise<string>;
  onUploadComplete?: (response: CompleteResponse) => void;
  onUploadError?: (error: Error) => void;
  accept?: string;
  maxSizeGB?: number;
  itemType?: 'photo' | 'video' | 'document';
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export const ChunkedUploader: React.FC<ChunkedUploaderProps> = ({
  apiBaseUrl = '',
  getAuthToken,
  onUploadComplete,
  onUploadError,
  accept,
  maxSizeGB = 10,
  itemType = 'document',
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const lastProgressRef = useRef<{ time: number; bytes: number }>({ time: 0, bytes: 0 });

  const { uploadFile, cancelUpload, isUploading, progress } = useChunkedUpload({
    apiBaseUrl,
    getAuthToken,
    onProgress: (prog) => {
      const now = Date.now();
      const timeDiff = (now - lastProgressRef.current.time) / 1000;
      const bytesDiff = prog.bytesUploaded - lastProgressRef.current.bytes;
      
      if (timeDiff > 0.5) {
        setUploadSpeed(bytesDiff / timeDiff);
        lastProgressRef.current = { time: now, bytes: prog.bytesUploaded };
      }
    },
    onComplete: (response) => {
      setSelectedFile(null);
      onUploadComplete?.(response);
    },
    onError: (error) => {
      onUploadError?.(error);
    },
  });

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const maxBytes = maxSizeGB * 1024 * 1024 * 1024;
    
    if (file.size > maxBytes) {
      onUploadError?.(new Error(`File too large. Maximum size is ${maxSizeGB}GB`));
      return;
    }
    
    setSelectedFile(file);
  }, [maxSizeGB, onUploadError]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    
    setStartTime(Date.now());
    lastProgressRef.current = { time: Date.now(), bytes: 0 };
    
    try {
      await uploadFile(selectedFile, { itemType });
    } catch (error) {
      // Error handled by onError callback
    }
  }, [selectedFile, uploadFile, itemType]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  }, [handleFileSelect]);

  const handleCancel = useCallback(() => {
    cancelUpload();
    setSelectedFile(null);
  }, [cancelUpload]);

  const remainingTime = progress && uploadSpeed > 0
    ? (progress.totalBytes - progress.bytesUploaded) / uploadSpeed
    : 0;

  return (
    <div className={`chunked-uploader ${className}`}>
      {/* Drop Zone */}
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? '#3b82f6' : '#cbd5e1'}`,
          borderRadius: '12px',
          padding: '40px 20px',
          textAlign: 'center',
          cursor: isUploading ? 'default' : 'pointer',
          backgroundColor: isDragging ? '#eff6ff' : '#f8fafc',
          transition: 'all 0.2s ease',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          style={{ display: 'none' }}
          disabled={isUploading}
        />

        {!selectedFile && !isUploading && (
          <>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#64748b"
              strokeWidth="1.5"
              style={{ margin: '0 auto 16px' }}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p style={{ margin: 0, color: '#475569', fontSize: '16px' }}>
              Drag & drop or click to select
            </p>
            <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '14px' }}>
              Max {maxSizeGB}GB • Supports large files via chunked upload
            </p>
          </>
        )}

        {selectedFile && !isUploading && (
          <>
            <p style={{ margin: 0, color: '#1e293b', fontSize: '16px', fontWeight: 500 }}>
              {selectedFile.name}
            </p>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>
              {formatBytes(selectedFile.size)}
            </p>
          </>
        )}

        {isUploading && progress && (
          <>
            <p style={{ margin: 0, color: '#1e293b', fontSize: '16px', fontWeight: 500 }}>
              Uploading... {progress.percent}%
            </p>
            <div
              style={{
                width: '100%',
                maxWidth: '300px',
                height: '8px',
                backgroundColor: '#e2e8f0',
                borderRadius: '4px',
                margin: '16px auto',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress.percent}%`,
                  height: '100%',
                  backgroundColor: '#3b82f6',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
              {formatBytes(progress.bytesUploaded)} / {formatBytes(progress.totalBytes)}
              {uploadSpeed > 0 && ` • ${formatBytes(uploadSpeed)}/s`}
              {remainingTime > 0 && ` • ~${formatTime(remainingTime)} remaining`}
            </p>
            <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '12px' }}>
              Chunk {progress.currentChunk + 1} of {progress.totalChunks}
            </p>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'center' }}>
        {selectedFile && !isUploading && (
          <>
            <button
              onClick={handleUpload}
              style={{
                padding: '10px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Upload
            </button>
            <button
              onClick={() => setSelectedFile(null)}
              style={{
                padding: '10px 24px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </>
        )}

        {isUploading && (
          <button
            onClick={handleCancel}
            style={{
              padding: '10px 24px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancel Upload
          </button>
        )}
      </div>
    </div>
  );
};

export default ChunkedUploader;
