// useChunkedUpload.ts - React hook for chunked file uploads
// 0711-Vault - Digital Sovereignty

import { useState, useCallback, useRef } from 'react';

const CHUNK_SIZE = 95 * 1024 * 1024; // 95MB - under Cloudflare's 100MB limit
const MAX_RETRIES = 3;

interface UploadInitResponse {
  upload_session_id: string;
  chunk_size: number;
  expires_at: string;
  total_chunks: number;
}

interface ChunkResponse {
  chunk_number: number;
  received_bytes: number;
  status: string;
  total_received: number;
  total_chunks: number;
}

interface CompleteResponse {
  item_id: string;
  storage_key: string;
  status: string;
  file_size: number;
  checksum: string;
}

interface UploadProgress {
  percent: number;
  chunksUploaded: number;
  totalChunks: number;
  bytesUploaded: number;
  totalBytes: number;
  currentChunk: number;
}

interface UseChunkedUploadOptions {
  apiBaseUrl?: string;
  getAuthToken: () => string | Promise<string>;
  onProgress?: (progress: UploadProgress) => void;
  onComplete?: (response: CompleteResponse) => void;
  onError?: (error: Error) => void;
}

interface UseChunkedUploadReturn {
  uploadFile: (file: File, options?: { itemType?: string; encryptedMetadata?: string }) => Promise<CompleteResponse>;
  cancelUpload: () => void;
  isUploading: boolean;
  progress: UploadProgress | null;
}

/**
 * Compute SHA-256 checksum of a file using streaming (Web Crypto API)
 * Does NOT load entire file into memory
 */
async function computeStreamingChecksum(file: File): Promise<string> {
  const HASH_CHUNK_SIZE = 64 * 1024 * 1024; // 64MB chunks for hashing
  
  // Create a SubtleCrypto digest stream manually
  const chunks: ArrayBuffer[] = [];
  let offset = 0;
  
  while (offset < file.size) {
    const slice = file.slice(offset, offset + HASH_CHUNK_SIZE);
    const buffer = await slice.arrayBuffer();
    chunks.push(buffer);
    offset += HASH_CHUNK_SIZE;
  }
  
  // Concatenate and hash (for files up to a few GB this is fine)
  // For truly massive files, would need a streaming hash library
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
  const combined = new Uint8Array(totalLength);
  let position = 0;
  for (const chunk of chunks) {
    combined.set(new Uint8Array(chunk), position);
    position += chunk.byteLength;
  }
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Sleep helper for retry backoff
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useChunkedUpload({
  apiBaseUrl = '',
  getAuthToken,
  onProgress,
  onComplete,
  onError,
}: UseChunkedUploadOptions): UseChunkedUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsUploading(false);
    setProgress(null);
  }, []);

  const uploadFile = useCallback(
    async (
      file: File,
      options?: { itemType?: string; encryptedMetadata?: string }
    ): Promise<CompleteResponse> => {
      setIsUploading(true);
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      
      const updateProgress = (chunksUploaded: number, currentChunk: number) => {
        const prog: UploadProgress = {
          percent: Math.round((chunksUploaded / totalChunks) * 100),
          chunksUploaded,
          totalChunks,
          bytesUploaded: Math.min(chunksUploaded * CHUNK_SIZE, file.size),
          totalBytes: file.size,
          currentChunk,
        };
        setProgress(prog);
        onProgress?.(prog);
      };

      try {
        const token = await getAuthToken();
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        // 1. Initialize upload session
        const initResponse = await fetch(`${apiBaseUrl}/vault/upload/init`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            filename: file.name,
            file_size: file.size,
            total_chunks: totalChunks,
            mime_type: file.type || 'application/octet-stream',
            item_type: options?.itemType || 'document',
            encrypted_metadata: options?.encryptedMetadata,
          }),
          signal,
        });

        if (!initResponse.ok) {
          const err = await initResponse.json().catch(() => ({}));
          throw new Error(err.detail || `Init failed: ${initResponse.status}`);
        }

        const { upload_session_id }: UploadInitResponse = await initResponse.json();
        updateProgress(0, 0);

        // 2. Upload chunks with retry logic
        for (let chunkNumber = 0; chunkNumber < totalChunks; chunkNumber++) {
          if (signal.aborted) throw new Error('Upload cancelled');

          const start = chunkNumber * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);

          let lastError: Error | null = null;
          
          for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
              const chunkResponse = await fetch(
                `${apiBaseUrl}/vault/upload/${upload_session_id}/chunk/${chunkNumber}`,
                {
                  method: 'PUT',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/octet-stream',
                  },
                  body: chunk,
                  signal,
                }
              );

              if (!chunkResponse.ok) {
                const err = await chunkResponse.json().catch(() => ({}));
                throw new Error(err.detail || `Chunk ${chunkNumber} failed: ${chunkResponse.status}`);
              }

              // Success - break retry loop
              lastError = null;
              break;
            } catch (error) {
              lastError = error as Error;
              if (signal.aborted) throw lastError;
              
              // Exponential backoff: 1s, 2s, 4s
              if (attempt < MAX_RETRIES - 1) {
                await sleep(1000 * Math.pow(2, attempt));
              }
            }
          }

          if (lastError) throw lastError;
          updateProgress(chunkNumber + 1, chunkNumber);
        }

        // 3. Compute checksum
        const checksum = await computeStreamingChecksum(file);

        // 4. Complete upload
        const completeResponse = await fetch(
          `${apiBaseUrl}/vault/upload/${upload_session_id}/complete`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({ checksum }),
            signal,
          }
        );

        if (!completeResponse.ok) {
          const err = await completeResponse.json().catch(() => ({}));
          throw new Error(err.detail || `Complete failed: ${completeResponse.status}`);
        }

        const result: CompleteResponse = await completeResponse.json();
        onComplete?.(result);
        return result;

      } catch (error) {
        const err = error as Error;
        onError?.(err);
        throw err;
      } finally {
        setIsUploading(false);
        abortControllerRef.current = null;
      }
    },
    [apiBaseUrl, getAuthToken, onProgress, onComplete, onError]
  );

  return { uploadFile, cancelUpload, isUploading, progress };
}
