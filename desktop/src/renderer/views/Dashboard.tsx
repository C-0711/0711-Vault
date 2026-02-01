import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Image, FileText, HardDrive, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.getStats().then(r => r.data),
  });

  const { data: highlights } = useQuery({
    queryKey: ['highlights'],
    queryFn: () => api.getHighlights(30).then(r => r.data),
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard icon={Image} label="Photos" value={stats?.photos || 0} />
        <StatCard icon={FileText} label="Documents" value={stats?.documents || 0} />
        <StatCard icon={HardDrive} label="Storage" value={`${(stats?.total_gb || 0).toFixed(2)} GB`} />
        <StatCard icon={Sparkles} label="Processed" value={stats?.processed || 0} />
      </div>

      {/* Recent Highlights */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Recent Highlights</h2>
        <div className="grid grid-cols-5 gap-2">
          {highlights?.highlights?.slice(0, 10).map((photo: any) => (
            <div key={photo.id} className="aspect-square rounded-lg bg-muted overflow-hidden">
              <img 
                src={`https://api-vault.0711.io/vault/items/${photo.id}/thumbnail`}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-primary" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-bold mt-2">{value}</div>
    </div>
  );
}
