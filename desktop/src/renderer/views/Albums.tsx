/**
 * Albums View - Photo albums and smart collections
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  FolderPlus, Folder, Sparkles, MoreVertical, Edit2, Trash2, Plus, X, Image
} from 'lucide-react';

interface Album {
  id: string;
  name: string;
  encrypted_name?: string;
  description?: string;
  cover_item_id?: string;
  item_count: number;
  is_smart: boolean;
  created_at: string;
}

export default function Albums() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  
  const { data, isLoading } = useQuery({
    queryKey: ['albums'],
    queryFn: () => api.getAlbums().then(r => r.data),
  });
  
  const albums: Album[] = data?.albums || [];
  const smartAlbums: Album[] = albums.filter(a => a.is_smart);
  const userAlbums: Album[] = albums.filter(a => !a.is_smart);
  
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      return api.post('/vault/albums', { name, encrypted_name: name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      setShowCreateModal(false);
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/vault/albums/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      setSelectedAlbum(null);
    },
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Albums</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <FolderPlus className="w-4 h-4" />
          New Album
        </button>
      </div>
      
      {/* Smart Albums */}
      {smartAlbums.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Smart Albums
          </h2>
          <div className="grid grid-cols-4 gap-4">
            {smartAlbums.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                onClick={() => setSelectedAlbum(album)}
              />
            ))}
          </div>
        </section>
      )}
      
      {/* User Albums */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Folder className="w-5 h-5" />
          My Albums
        </h2>
        
        {userAlbums.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FolderPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No albums yet</p>
            <p className="text-sm mb-4">Create albums to organize your photos</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground"
            >
              Create Album
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {userAlbums.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                onClick={() => setSelectedAlbum(album)}
                onEdit={() => setEditingAlbum(album)}
                onDelete={() => deleteMutation.mutate(album.id)}
              />
            ))}
          </div>
        )}
      </section>
      
      {/* Create Album Modal */}
      {showCreateModal && (
        <CreateAlbumModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(name) => createMutation.mutate(name)}
          isLoading={createMutation.isPending}
        />
      )}
      
      {/* Album Detail View */}
      {selectedAlbum && (
        <AlbumDetailView
          album={selectedAlbum}
          onClose={() => setSelectedAlbum(null)}
        />
      )}
    </div>
  );
}

function AlbumCard({
  album,
  onClick,
  onEdit,
  onDelete,
}: {
  album: Album;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  
  return (
    <div
      onClick={onClick}
      className="group relative bg-card rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
    >
      {/* Cover image */}
      <div className="aspect-square bg-muted">
        {album.cover_item_id ? (
          <img
            src={`https://api-vault.0711.io/vault/items/${album.cover_item_id}/thumbnail`}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {album.is_smart ? (
              <Sparkles className="w-12 h-12 text-muted-foreground/50" />
            ) : (
              <Folder className="w-12 h-12 text-muted-foreground/50" />
            )}
          </div>
        )}
      </div>
      
      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium truncate">{album.encrypted_name || album.name}</h3>
        <p className="text-sm text-muted-foreground">{album.item_count} items</p>
      </div>
      
      {/* Context menu */}
      {!album.is_smart && (onEdit || onDelete) && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-1 py-1 w-32 rounded-lg bg-card border border-border shadow-lg z-10">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted text-sm"
                >
                  <Edit2 className="w-3 h-3" />
                  Rename
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDelete();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted text-sm text-red-500"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CreateAlbumModal({
  onClose,
  onCreate,
  isLoading,
}: {
  onClose: () => void;
  onCreate: (name: string) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState('');
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl p-6 w-96 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Create Album</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Album name"
          className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none mb-4"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && onCreate(name.trim())}
        />
        
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={() => name.trim() && onCreate(name.trim())}
            disabled={!name.trim() || isLoading}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AlbumDetailView({
  album,
  onClose,
}: {
  album: Album;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['album', album.id, 'items'],
    queryFn: () => api.get(`/vault/albums/${album.id}/items`).then(r => r.data),
  });
  
  const items = data?.items || [];
  
  return (
    <div className="fixed inset-0 z-40 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-xl font-semibold">{album.encrypted_name || album.name}</h2>
            <p className="text-sm text-muted-foreground">{items.length} items</p>
          </div>
        </div>
        
        {!album.is_smart && (
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground">
            <Plus className="w-4 h-4" />
            Add Photos
          </button>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Image className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg">No photos in this album</p>
            {!album.is_smart && (
              <button className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground">
                Add Photos
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-2">
            {items.map((item: any) => (
              <div key={item.id} className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={`https://api-vault.0711.io/vault/items/${item.id}/thumbnail`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
