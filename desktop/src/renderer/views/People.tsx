/**
 * People View - Face clusters and recognition
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Users, User, Edit2, Merge, MoreVertical, X } from 'lucide-react';

interface FaceCluster {
  id: string;
  encrypted_name: string | null;
  face_count: number;
  sample_face_id: string;
  first_seen: string;
  last_seen: string;
}

export default function People() {
  const [selectedPerson, setSelectedPerson] = useState<FaceCluster | null>(null);
  const [editingPerson, setEditingPerson] = useState<FaceCluster | null>(null);
  const [newName, setNewName] = useState('');
  
  const queryClient = useQueryClient();
  
  const { data, isLoading } = useQuery({
    queryKey: ['face-clusters'],
    queryFn: () => api.getFaceClusters().then(r => r.data),
  });
  
  const clusters: FaceCluster[] = data?.clusters || [];
  
  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return api.put(`/faces/clusters/${id}`, { encrypted_name: name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['face-clusters'] });
      setEditingPerson(null);
      setNewName('');
    },
  });
  
  const handleRename = (person: FaceCluster) => {
    setEditingPerson(person);
    setNewName(person.encrypted_name || '');
  };
  
  const submitRename = () => {
    if (editingPerson && newName.trim()) {
      renameMutation.mutate({ id: editingPerson.id, name: newName.trim() });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (clusters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Users className="w-16 h-16 mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2">No People Found</h2>
        <p className="text-center max-w-md">
          Upload photos with faces and they'll be automatically detected and grouped here.
        </p>
      </div>
    );
  }
  
  return (
    <div className="h-full flex">
      {/* People Grid */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">People</h1>
          <span className="text-muted-foreground">{clusters.length} people found</span>
        </div>
        
        <div className="grid grid-cols-4 gap-6">
          {clusters.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              selected={selectedPerson?.id === person.id}
              onClick={() => setSelectedPerson(person)}
              onRename={() => handleRename(person)}
            />
          ))}
        </div>
      </div>
      
      {/* Person Detail Sidebar */}
      {selectedPerson && (
        <div className="w-80 border-l border-border p-6 overflow-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">
                {selectedPerson.encrypted_name || 'Unknown Person'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedPerson.face_count} photos
              </p>
            </div>
            <button
              onClick={() => setSelectedPerson(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Face preview */}
          <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-muted mb-6">
            <img
              src={`https://api-vault.0711.io/faces/${selectedPerson.sample_face_id}/thumbnail`}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          
          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => handleRename(selectedPerson)}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted"
            >
              <Edit2 className="w-4 h-4" />
              Rename
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted">
              <Merge className="w-4 h-4" />
              Merge with another person
            </button>
          </div>
          
          {/* Timeline */}
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="font-semibold mb-3">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">First seen</span>
                <span>{new Date(selectedPerson.first_seen).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last seen</span>
                <span>{new Date(selectedPerson.last_seen).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Rename Modal */}
      {editingPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Rename Person</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter name"
              className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && submitRename()}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setEditingPerson(null)}
                className="px-4 py-2 rounded-lg hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={submitRename}
                disabled={!newName.trim() || renameMutation.isPending}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {renameMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PersonCard({
  person,
  selected,
  onClick,
  onRename,
}: {
  person: FaceCluster;
  selected: boolean;
  onClick: () => void;
  onRename: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  
  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-xl p-4 transition-all ${
        selected ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-muted'
      }`}
    >
      {/* Face circle */}
      <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-muted mb-3">
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-10 h-10 text-muted-foreground" />
          </div>
        ) : (
          <img
            src={`https://api-vault.0711.io/faces/${person.sample_face_id}/thumbnail`}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        )}
      </div>
      
      {/* Name */}
      <h3 className="text-center font-medium truncate">
        {person.encrypted_name || 'Unknown'}
      </h3>
      
      {/* Photo count */}
      <p className="text-center text-sm text-muted-foreground">
        {person.face_count} photos
      </p>
      
      {/* Quick rename on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRename();
        }}
        className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
    </div>
  );
}
