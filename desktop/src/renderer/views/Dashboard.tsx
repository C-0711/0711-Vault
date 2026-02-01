/**
 * Dashboard - Stats overview, memories, quick actions
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { 
  Image, FileText, HardDrive, Sparkles, Users, Calendar,
  Upload, Search, MessageSquare, ArrowRight
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.getStats().then(r => r.data),
  });

  const { data: highlights } = useQuery({
    queryKey: ['highlights'],
    queryFn: () => api.getHighlights(30).then(r => r.data),
  });
  
  const { data: onThisDay } = useQuery({
    queryKey: ['on-this-day'],
    queryFn: () => api.getOnThisDay().then(r => r.data),
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
        <p className="text-muted-foreground">Here's what's happening in your vault</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard 
          icon={Image} 
          label="Photos" 
          value={stats?.photos || 0}
          loading={statsLoading}
          onClick={() => navigate('/photos')}
        />
        <StatCard 
          icon={FileText} 
          label="Documents" 
          value={stats?.documents || 0}
          loading={statsLoading}
          onClick={() => navigate('/documents')}
        />
        <StatCard 
          icon={Users} 
          label="People" 
          value={stats?.face_clusters || 0}
          loading={statsLoading}
          onClick={() => navigate('/people')}
        />
        <StatCard 
          icon={HardDrive} 
          label="Storage" 
          value={`${(stats?.total_gb || 0).toFixed(2)} GB`}
          loading={statsLoading}
        />
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <QuickAction
          icon={Upload}
          label="Upload Photos"
          description="Add new photos to your vault"
          onClick={() => {/* TODO */}}
        />
        <QuickAction
          icon={Search}
          label="Search"
          description="Find photos, documents, and memories"
          onClick={() => navigate('/search')}
        />
        <QuickAction
          icon={MessageSquare}
          label="AI Assistant"
          description="Ask about your memories"
          onClick={() => navigate('/assistant')}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-8">
        {/* On This Day */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              On This Day
            </h2>
          </div>
          
          {onThisDay?.memories?.length > 0 ? (
            <div className="space-y-4">
              {onThisDay.memories.slice(0, 3).map((memory: any) => (
                <div key={memory.year} className="p-4 rounded-xl bg-muted">
                  <div className="text-sm text-muted-foreground mb-2">
                    {memory.years_ago} {memory.years_ago === 1 ? 'year' : 'years'} ago
                  </div>
                  <div className="flex gap-2">
                    {memory.photos.slice(0, 4).map((photo: any) => (
                      <div key={photo.id} className="w-16 h-16 rounded-lg overflow-hidden bg-background">
                        <img
                          src={`https://api-vault.0711.io/vault/items/${photo.id}/thumbnail`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-muted text-center text-muted-foreground">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No memories from this day yet</p>
              <p className="text-sm">Keep uploading to build your history!</p>
            </div>
          )}
        </section>
        
        {/* Recent Highlights */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Recent Highlights
            </h2>
            <button 
              onClick={() => navigate('/photos')}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          {highlights?.highlights?.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {highlights.highlights.slice(0, 9).map((photo: any) => (
                <div 
                  key={photo.id} 
                  className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:ring-2 hover:ring-primary"
                  onClick={() => navigate('/photos')}
                >
                  <img
                    src={`https://api-vault.0711.io/vault/items/${photo.id}/thumbnail`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-muted text-center text-muted-foreground">
              <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No photos yet</p>
              <p className="text-sm">Upload photos to see highlights</p>
            </div>
          )}
        </section>
      </div>
      
      {/* Processing Status */}
      {(stats?.pending || 0) > 0 && (
        <div className="mt-8 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-500 border-t-transparent" />
            <span className="text-yellow-500">
              Processing {stats?.pending} items...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value,
  loading,
  onClick 
}: { 
  icon: any; 
  label: string; 
  value: string | number;
  loading?: boolean;
  onClick?: () => void;
}) {
  return (
    <div 
      onClick={onClick}
      className={`p-5 rounded-xl bg-card border border-border ${
        onClick ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <span className="text-muted-foreground">{label}</span>
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-muted rounded animate-pulse" />
      ) : (
        <div className="text-3xl font-bold">{value}</div>
      )}
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: any;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-4 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-left"
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div>
        <div className="font-semibold">{label}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
    </button>
  );
}
