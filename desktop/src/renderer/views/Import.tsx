/**
 * Import / Migration Tool - Import from Apple Photos, folders, etc.
 */

import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import {
  Apple, Folder, Cloud, ArrowRight, ArrowLeft, Check, X,
  Image, AlertCircle, Loader2, CheckCircle2, XCircle
} from 'lucide-react';

type ImportSource = 'apple-photos' | 'folder' | 'google-photos' | null;
type ImportStep = 'source' | 'options' | 'scanning' | 'review' | 'importing' | 'complete';

interface PhotoToImport {
  path: string;
  filename: string;
  size: number;
  date: string | null;
  selected: boolean;
}

interface ImportStats {
  total: number;
  imported: number;
  skipped: number;
  failed: number;
  currentFile: string;
}

export default function Import() {
  const navigate = useNavigate();
  const [source, setSource] = useState<ImportSource>(null);
  const [step, setStep] = useState<ImportStep>('source');
  const [folderPath, setFolderPath] = useState<string>('');
  const [photos, setPhotos] = useState<PhotoToImport[]>([]);
  const [options, setOptions] = useState({
    skipDuplicates: true,
    preserveDates: true,
    importAlbums: true,
    deleteAfterImport: false,
  });
  const [stats, setStats] = useState<ImportStats>({
    total: 0,
    imported: 0,
    skipped: 0,
    failed: 0,
    currentFile: '',
  });

  // Scan for photos
  const scanMutation = useMutation({
    mutationFn: async () => {
      if (source === 'apple-photos') {
        return window.electronAPI?.scanApplePhotos();
      } else if (source === 'folder' && folderPath) {
        return window.electronAPI?.scanFolder(folderPath);
      }
      return { photos: [] };
    },
    onSuccess: (data) => {
      if (data?.photos) {
        setPhotos(data.photos.map((p: any) => ({ ...p, selected: true })));
        setStep('review');
      }
    },
  });

  // Import photos
  const importMutation = useMutation({
    mutationFn: async () => {
      const selectedPhotos = photos.filter(p => p.selected);
      setStats(prev => ({ ...prev, total: selectedPhotos.length }));
      
      for (let i = 0; i < selectedPhotos.length; i++) {
        const photo = selectedPhotos[i];
        setStats(prev => ({ ...prev, currentFile: photo.filename }));
        
        try {
          // Read file and upload
          const fileData = await window.electronAPI?.readFile(photo.path);
          if (fileData) {
            // Create vault item
            const response = await api.createItem({
              item_type: 'photo',
              file_size: photo.size,
              mime_type: getMimeType(photo.filename),
              original_filename: photo.filename,
              captured_at: photo.date,
            });
            
            // Upload to presigned URL
            await fetch(response.data.upload_url, {
              method: 'PUT',
              body: fileData,
              headers: { 'Content-Type': getMimeType(photo.filename) },
            });
            
            setStats(prev => ({ ...prev, imported: prev.imported + 1 }));
          }
        } catch (error) {
          console.error('Failed to import:', photo.filename, error);
          setStats(prev => ({ ...prev, failed: prev.failed + 1 }));
        }
      }
      
      return true;
    },
    onSuccess: () => {
      setStep('complete');
    },
  });

  const selectSource = (s: ImportSource) => {
    setSource(s);
    if (s === 'folder') {
      // Show folder picker
      window.electronAPI?.showOpenDialog({
        properties: ['openDirectory'],
      }).then((result) => {
        if (result && !result.canceled && result.filePaths[0]) {
          setFolderPath(result.filePaths[0]);
          setStep('options');
        }
      });
    } else if (s === 'apple-photos') {
      setStep('options');
    }
  };

  const startScan = () => {
    setStep('scanning');
    scanMutation.mutate();
  };

  const startImport = () => {
    setStep('importing');
    importMutation.mutate();
  };

  const toggleAll = (selected: boolean) => {
    setPhotos(photos.map(p => ({ ...p, selected })));
  };

  const togglePhoto = (index: number) => {
    setPhotos(photos.map((p, i) => i === index ? { ...p, selected: !p.selected } : p));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border">
        <button
          onClick={() => step === 'source' ? navigate('/') : setStep('source')}
          className="p-2 rounded-lg hover:bg-muted"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold">Import Photos</h1>
          <p className="text-sm text-muted-foreground">
            {step === 'source' && 'Choose where to import from'}
            {step === 'options' && 'Configure import options'}
            {step === 'scanning' && 'Scanning for photos...'}
            {step === 'review' && 'Review photos to import'}
            {step === 'importing' && 'Importing photos...'}
            {step === 'complete' && 'Import complete!'}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{
            width: step === 'source' ? '16%' :
                   step === 'options' ? '33%' :
                   step === 'scanning' ? '50%' :
                   step === 'review' ? '66%' :
                   step === 'importing' ? '83%' : '100%'
          }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {step === 'source' && (
          <SourceSelection onSelect={selectSource} />
        )}

        {step === 'options' && (
          <ImportOptions
            source={source}
            folderPath={folderPath}
            options={options}
            setOptions={setOptions}
            onNext={startScan}
            onBack={() => setStep('source')}
          />
        )}

        {step === 'scanning' && (
          <ScanningProgress source={source} />
        )}

        {step === 'review' && (
          <ReviewPhotos
            photos={photos}
            onToggle={togglePhoto}
            onToggleAll={toggleAll}
            onImport={startImport}
            onBack={() => setStep('options')}
          />
        )}

        {step === 'importing' && (
          <ImportProgress stats={stats} />
        )}

        {step === 'complete' && (
          <ImportComplete stats={stats} onDone={() => navigate('/photos')} />
        )}
      </div>
    </div>
  );
}

function SourceSelection({ onSelect }: { onSelect: (s: ImportSource) => void }) {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold mb-6">Where would you like to import from?</h2>
      
      <div className="space-y-4">
        <button
          onClick={() => onSelect('apple-photos')}
          className="w-full flex items-center gap-4 p-6 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-left"
        >
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
            <Apple className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-lg">Apple Photos</div>
            <div className="text-muted-foreground">Import your entire Photos library with albums and metadata</div>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground" />
        </button>

        <button
          onClick={() => onSelect('folder')}
          className="w-full flex items-center gap-4 p-6 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-left"
        >
          <div className="w-14 h-14 rounded-xl bg-blue-500 flex items-center justify-center">
            <Folder className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-lg">Folder</div>
            <div className="text-muted-foreground">Import photos from a folder on your computer</div>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground" />
        </button>

        <button
          disabled
          className="w-full flex items-center gap-4 p-6 rounded-xl bg-muted/50 text-left opacity-50 cursor-not-allowed"
        >
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
            <Cloud className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-lg">Google Photos</div>
            <div className="text-muted-foreground">Coming soon - Import via Google Takeout</div>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-muted-foreground/20">Soon</span>
        </button>
      </div>
    </div>
  );
}

function ImportOptions({
  source,
  folderPath,
  options,
  setOptions,
  onNext,
  onBack,
}: {
  source: ImportSource;
  folderPath: string;
  options: any;
  setOptions: (o: any) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold mb-6">Import Options</h2>

      {source === 'folder' && (
        <div className="p-4 rounded-lg bg-muted mb-6">
          <div className="text-sm text-muted-foreground mb-1">Selected folder</div>
          <div className="font-mono">{folderPath}</div>
        </div>
      )}

      <div className="space-y-4">
        <label className="flex items-center justify-between p-4 rounded-lg bg-muted cursor-pointer">
          <div>
            <div className="font-medium">Skip duplicates</div>
            <div className="text-sm text-muted-foreground">Don't import photos that already exist in your vault</div>
          </div>
          <input
            type="checkbox"
            checked={options.skipDuplicates}
            onChange={(e) => setOptions({ ...options, skipDuplicates: e.target.checked })}
            className="w-5 h-5 rounded"
          />
        </label>

        <label className="flex items-center justify-between p-4 rounded-lg bg-muted cursor-pointer">
          <div>
            <div className="font-medium">Preserve dates</div>
            <div className="text-sm text-muted-foreground">Keep original capture dates from EXIF data</div>
          </div>
          <input
            type="checkbox"
            checked={options.preserveDates}
            onChange={(e) => setOptions({ ...options, preserveDates: e.target.checked })}
            className="w-5 h-5 rounded"
          />
        </label>

        {source === 'apple-photos' && (
          <label className="flex items-center justify-between p-4 rounded-lg bg-muted cursor-pointer">
            <div>
              <div className="font-medium">Import albums</div>
              <div className="text-sm text-muted-foreground">Recreate your Apple Photos albums in 0711 Vault</div>
            </div>
            <input
              type="checkbox"
              checked={options.importAlbums}
              onChange={(e) => setOptions({ ...options, importAlbums: e.target.checked })}
              className="w-5 h-5 rounded"
            />
          </label>
        )}

        <label className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/30 cursor-pointer">
          <div>
            <div className="font-medium text-red-500">Delete after import</div>
            <div className="text-sm text-muted-foreground">Remove photos from source after successful import</div>
          </div>
          <input
            type="checkbox"
            checked={options.deleteAfterImport}
            onChange={(e) => setOptions({ ...options, deleteAfterImport: e.target.checked })}
            className="w-5 h-5 rounded"
          />
        </label>
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={onBack} className="px-6 py-2 rounded-lg hover:bg-muted">
          Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Scan Photos
        </button>
      </div>
    </div>
  );
}

function ScanningProgress({ source }: { source: ImportSource }) {
  return (
    <div className="max-w-md mx-auto text-center py-12">
      <div className="w-16 h-16 mx-auto mb-6">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Scanning...</h2>
      <p className="text-muted-foreground">
        {source === 'apple-photos'
          ? 'Reading your Apple Photos library...'
          : 'Scanning folder for photos...'}
      </p>
    </div>
  );
}

function ReviewPhotos({
  photos,
  onToggle,
  onToggleAll,
  onImport,
  onBack,
}: {
  photos: PhotoToImport[];
  onToggle: (i: number) => void;
  onToggleAll: (selected: boolean) => void;
  onImport: () => void;
  onBack: () => void;
}) {
  const selected = photos.filter(p => p.selected).length;
  const totalSize = photos.filter(p => p.selected).reduce((acc, p) => acc + p.size, 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Review Photos</h2>
          <p className="text-muted-foreground">
            {selected} of {photos.length} selected ({formatBytes(totalSize)})
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onToggleAll(true)}
            className="px-3 py-1 rounded hover:bg-muted text-sm"
          >
            Select All
          </button>
          <button
            onClick={() => onToggleAll(false)}
            className="px-3 py-1 rounded hover:bg-muted text-sm"
          >
            Deselect All
          </button>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No photos found</p>
        </div>
      ) : (
        <div className="grid grid-cols-6 gap-2 max-h-[400px] overflow-auto mb-6">
          {photos.map((photo, i) => (
            <div
              key={i}
              onClick={() => onToggle(i)}
              className={`aspect-square rounded-lg overflow-hidden cursor-pointer relative ${
                photo.selected ? 'ring-2 ring-primary' : 'opacity-50'
              }`}
            >
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Image className="w-6 h-6 text-muted-foreground" />
              </div>
              {photo.selected && (
                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={onBack} className="px-6 py-2 rounded-lg hover:bg-muted">
          Back
        </button>
        <button
          onClick={onImport}
          disabled={selected === 0}
          className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Import {selected} Photos
        </button>
      </div>
    </div>
  );
}

function ImportProgress({ stats }: { stats: ImportStats }) {
  const progress = stats.total > 0 ? ((stats.imported + stats.failed) / stats.total) * 100 : 0;

  return (
    <div className="max-w-md mx-auto text-center py-12">
      <div className="w-16 h-16 mx-auto mb-6">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Importing...</h2>
      <p className="text-muted-foreground mb-6">{stats.currentFile}</p>

      <div className="h-2 rounded-full bg-muted overflow-hidden mb-4">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-center gap-6 text-sm">
        <div>
          <span className="text-muted-foreground">Imported:</span>{' '}
          <span className="font-semibold text-green-500">{stats.imported}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Failed:</span>{' '}
          <span className="font-semibold text-red-500">{stats.failed}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Total:</span>{' '}
          <span className="font-semibold">{stats.total}</span>
        </div>
      </div>
    </div>
  );
}

function ImportComplete({ stats, onDone }: { stats: ImportStats; onDone: () => void }) {
  return (
    <div className="max-w-md mx-auto text-center py-12">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-green-500" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Import Complete!</h2>
      <p className="text-muted-foreground mb-6">
        Successfully imported {stats.imported} photos to your vault
      </p>

      <div className="flex justify-center gap-6 text-sm mb-8">
        <div className="p-4 rounded-lg bg-muted">
          <div className="text-2xl font-bold text-green-500">{stats.imported}</div>
          <div className="text-muted-foreground">Imported</div>
        </div>
        {stats.skipped > 0 && (
          <div className="p-4 rounded-lg bg-muted">
            <div className="text-2xl font-bold text-yellow-500">{stats.skipped}</div>
            <div className="text-muted-foreground">Skipped</div>
          </div>
        )}
        {stats.failed > 0 && (
          <div className="p-4 rounded-lg bg-muted">
            <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
            <div className="text-muted-foreground">Failed</div>
          </div>
        )}
      </div>

      <button
        onClick={onDone}
        className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
      >
        View Photos
      </button>
    </div>
  );
}

// Helpers
function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  const types: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
  };
  return types[ext || ''] || 'application/octet-stream';
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
