/**
 * Documents View - PDFs, receipts, IDs with OCR
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  FileText, Upload, Grid3X3, List, Search, Filter, Calendar,
  File, FileImage, FileSpreadsheet, Folder, MoreVertical, Download, Trash2, Eye
} from 'lucide-react';

interface Document {
  id: string;
  item_type: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  processing_status: string;
  ocr_text?: string;
  category?: string;
}

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Folder },
  { id: 'receipt', label: 'Receipts', icon: FileText },
  { id: 'id', label: 'IDs', icon: FileImage },
  { id: 'contract', label: 'Contracts', icon: File },
  { id: 'invoice', label: 'Invoices', icon: FileSpreadsheet },
  { id: 'other', label: 'Other', icon: FileText },
];

export default function Documents() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  
  const { data, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => api.getItems({ item_type: 'document', limit: 100 }).then(r => r.data),
  });
  
  const documents: Document[] = data?.items || [];
  
  // Filter documents
  const filteredDocs = documents.filter(doc => {
    if (selectedCategory !== 'all' && doc.category !== selectedCategory) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        doc.original_filename?.toLowerCase().includes(query) ||
        doc.ocr_text?.toLowerCase().includes(query)
      );
    }
    return true;
  });
  
  const handleUpload = async () => {
    const result = await window.electronAPI?.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Documents', extensions: ['pdf', 'png', 'jpg', 'jpeg'] },
      ],
    });
    
    if (result && !result.canceled) {
      console.log('Selected files:', result.filePaths);
      // TODO: Upload documents
    }
  };
  
  return (
    <div className="h-full flex">
      {/* Sidebar with categories */}
      <aside className="w-56 border-r border-border p-4">
        <h2 className="font-semibold mb-4">Categories</h2>
        <nav className="space-y-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </button>
          ))}
        </nav>
      </aside>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Documents</h1>
            <span className="text-sm text-muted-foreground">{filteredDocs.length} items</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="pl-9 pr-4 py-2 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none w-64"
              />
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
            
            {/* Upload */}
            <button
              onClick={handleUpload}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
          </div>
        </div>
        
        {/* Documents */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <FileText className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg mb-2">No documents found</p>
              <p className="text-sm mb-4">
                {searchQuery ? 'Try a different search term' : 'Upload documents to get started'}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleUpload}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground"
                >
                  Upload Documents
                </button>
              )}
            </div>
          ) : viewMode === 'list' ? (
            <DocumentList
              documents={filteredDocs}
              onSelect={setSelectedDoc}
            />
          ) : (
            <DocumentGrid
              documents={filteredDocs}
              onSelect={setSelectedDoc}
            />
          )}
        </div>
      </div>
      
      {/* Document preview */}
      {selectedDoc && (
        <DocumentPreview
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
}

function DocumentList({
  documents,
  onSelect,
}: {
  documents: Document[];
  onSelect: (doc: Document) => void;
}) {
  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center px-4 py-2 text-sm text-muted-foreground border-b border-border">
        <div className="flex-1">Name</div>
        <div className="w-32">Size</div>
        <div className="w-40">Date</div>
        <div className="w-24">Status</div>
        <div className="w-10"></div>
      </div>
      
      {/* Rows */}
      {documents.map((doc) => (
        <DocumentRow key={doc.id} document={doc} onClick={() => onSelect(doc)} />
      ))}
    </div>
  );
}

function DocumentRow({
  document,
  onClick,
}: {
  document: Document;
  onClick: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  
  const getIcon = () => {
    if (document.mime_type?.includes('pdf')) return FileText;
    if (document.mime_type?.startsWith('image/')) return FileImage;
    return File;
  };
  
  const Icon = getIcon();
  
  return (
    <div
      onClick={onClick}
      className="flex items-center px-4 py-3 rounded-lg hover:bg-muted cursor-pointer group"
    >
      <div className="flex-1 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium truncate max-w-md">{document.original_filename}</p>
          {document.ocr_text && (
            <p className="text-xs text-muted-foreground truncate max-w-md">
              {document.ocr_text.slice(0, 100)}...
            </p>
          )}
        </div>
      </div>
      <div className="w-32 text-sm text-muted-foreground">
        {formatBytes(document.file_size)}
      </div>
      <div className="w-40 text-sm text-muted-foreground">
        {new Date(document.created_at).toLocaleDateString()}
      </div>
      <div className="w-24">
        <StatusBadge status={document.processing_status} />
      </div>
      <div className="w-10 relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-background"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        
        {showMenu && (
          <div className="absolute right-0 mt-1 py-1 w-32 rounded-lg bg-card border border-border shadow-lg z-10">
            <button className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted text-sm">
              <Eye className="w-3 h-3" />
              View
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted text-sm">
              <Download className="w-3 h-3" />
              Download
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted text-sm text-red-500">
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentGrid({
  documents,
  onSelect,
}: {
  documents: Document[];
  onSelect: (doc: Document) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-4">
      {documents.map((doc) => (
        <div
          key={doc.id}
          onClick={() => onSelect(doc)}
          className="bg-card rounded-xl p-4 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
        >
          <div className="aspect-[3/4] rounded-lg bg-muted mb-3 flex items-center justify-center">
            {doc.mime_type?.startsWith('image/') ? (
              <img
                src={`https://api-vault.0711.io/vault/items/${doc.id}/thumbnail`}
                alt=""
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <FileText className="w-12 h-12 text-muted-foreground/50" />
            )}
          </div>
          <h3 className="font-medium truncate text-sm">{doc.original_filename}</h3>
          <p className="text-xs text-muted-foreground">
            {formatBytes(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}

function DocumentPreview({
  document,
  onClose,
}: {
  document: Document;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white"
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <div className="max-w-4xl w-full max-h-[90vh] bg-card rounded-xl overflow-hidden">
        {/* Preview */}
        <div className="h-[60vh] bg-muted flex items-center justify-center">
          {document.mime_type?.startsWith('image/') ? (
            <img
              src={`https://api-vault.0711.io/vault/items/${document.id}/download`}
              alt=""
              className="max-w-full max-h-full object-contain"
            />
          ) : document.mime_type?.includes('pdf') ? (
            <iframe
              src={`https://api-vault.0711.io/vault/items/${document.id}/download`}
              className="w-full h-full"
              title="PDF Preview"
            />
          ) : (
            <FileText className="w-24 h-24 text-muted-foreground/50" />
          )}
        </div>
        
        {/* Info */}
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-2">{document.original_filename}</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Size:</span>{' '}
              {formatBytes(document.file_size)}
            </div>
            <div>
              <span className="text-muted-foreground">Type:</span>{' '}
              {document.mime_type}
            </div>
            <div>
              <span className="text-muted-foreground">Added:</span>{' '}
              {new Date(document.created_at).toLocaleString()}
            </div>
          </div>
          
          {/* OCR text */}
          {document.ocr_text && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Extracted Text</h3>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg max-h-32 overflow-auto">
                {document.ocr_text}
              </p>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground">
              <Download className="w-4 h-4" />
              Download
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted text-red-500">
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    complete: 'bg-green-500/10 text-green-500',
    pending: 'bg-yellow-500/10 text-yellow-500',
    processing: 'bg-blue-500/10 text-blue-500',
    failed: 'bg-red-500/10 text-red-500',
  };
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
