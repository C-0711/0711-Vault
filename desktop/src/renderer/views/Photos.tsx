/**
 * Photos View - Grid with infinite scroll
 */

import React, { useState, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Upload, Grid3X3, List, ZoomIn, ZoomOut, Trash2, Download } from 'lucide-react';

interface Photo {
  id: string;
  item_type: string;
  file_size: number;
  mime_type: string;
  captured_at: string | null;
  created_at: string;
  processing_status: string;
}

export default function Photos() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [thumbnailSize, setThumbnailSize] = useState(150);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);
  
  const { data, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['photos'],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await api.getItems({ item_type: 'photo', limit: 50, offset: pageParam });
      return response.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce((acc, page) => acc + page.items.length, 0);
      return lastPage.items.length === 50 ? totalLoaded : undefined;
    },
    initialPageParam: 0,
  });
  
  const photos = data?.pages.flatMap(page => page.items) || [];
  
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    if (e.shiftKey || e.metaKey) {
      setSelectedPhotos(prev => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    } else {
      setPreviewPhoto(photos.find(p => p.id === id) || null);
    }
  };
  
  const handleUpload = async () => {
    const result = await window.electronAPI?.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'] },
      ],
    });
    
    if (result && !result.canceled) {
      // TODO: Upload files
      console.log('Selected files:', result.filePaths);
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Photos</h1>
          <span className="text-sm text-muted-foreground">{photos.length} items</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Zoom slider */}
          <div className="flex items-center gap-2 px-2">
            <ZoomOut className="w-4 h-4 text-muted-foreground" />
            <input
              type="range"
              min="80"
              max="300"
              value={thumbnailSize}
              onChange={(e) => setThumbnailSize(Number(e.target.value))}
              className="w-24"
            />
            <ZoomIn className="w-4 h-4 text-muted-foreground" />
          </div>
          
          {/* View toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary/20 text-primary' : 'hover:bg-muted'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary/20 text-primary' : 'hover:bg-muted'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          {/* Upload button */}
          <button
            onClick={handleUpload}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
        </div>
      </div>
      
      {/* Selection toolbar */}
      {selectedPhotos.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-primary/10 border-b border-border">
          <span className="text-sm">{selectedPhotos.size} selected</span>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 px-3 py-1 rounded hover:bg-muted">
              <Download className="w-4 h-4" />
              Download
            </button>
            <button className="flex items-center gap-1 px-3 py-1 rounded hover:bg-muted text-red-500">
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      )}
      
      {/* Photo grid */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Upload className="w-12 h-12 mb-4" />
            <p className="text-lg">No photos yet</p>
            <p className="text-sm">Upload photos or import from Apple Photos</p>
            <button
              onClick={handleUpload}
              className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground"
            >
              Upload Photos
            </button>
          </div>
        ) : (
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(${thumbnailSize}px, 1fr))`,
            }}
          >
            {photos.map((photo) => (
              <PhotoThumbnail
                key={photo.id}
                photo={photo}
                size={thumbnailSize}
                selected={selectedPhotos.has(photo.id)}
                onClick={(e) => toggleSelect(photo.id, e)}
              />
            ))}
          </div>
        )}
        
        {/* Load more */}
        {hasNextPage && (
          <div className="flex justify-center py-4">
            <button
              onClick={() => fetchNextPage()}
              className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80"
            >
              Load more
            </button>
          </div>
        )}
      </div>
      
      {/* Preview modal */}
      {previewPhoto && (
        <PhotoPreview photo={previewPhoto} onClose={() => setPreviewPhoto(null)} />
      )}
    </div>
  );
}

function PhotoThumbnail({
  photo,
  size,
  selected,
  onClick,
}: {
  photo: Photo;
  size: number;
  selected: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  return (
    <div
      onClick={onClick}
      className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer group ${
        selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
      }`}
      style={{ width: size, height: size }}
    >
      {!loaded && !error && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      {error ? (
        <div className="absolute inset-0 bg-muted flex items-center justify-center text-muted-foreground">
          <span className="text-xs">Error</span>
        </div>
      ) : (
        <img
          src={`https://api-vault.0711.io/vault/items/${photo.id}/thumbnail`}
          alt=""
          className={`w-full h-full object-cover transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
      
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Selection checkbox */}
      <div className={`absolute top-2 left-2 w-5 h-5 rounded border-2 ${
        selected ? 'bg-primary border-primary' : 'border-white/70 group-hover:border-white'
      }`}>
        {selected && (
          <svg className="w-full h-full text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      
      {/* Processing indicator */}
      {photo.processing_status === 'pending' && (
        <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-yellow-500" title="Processing" />
      )}
    </div>
  );
}

function PhotoPreview({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white"
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <img
        src={`https://api-vault.0711.io/vault/items/${photo.id}/download`}
        alt=""
        className="max-w-[90vw] max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
