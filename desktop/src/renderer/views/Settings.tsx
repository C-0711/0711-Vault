/**
 * Settings View - Account, Storage, Appearance, Privacy
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import {
  User, HardDrive, Shield, Palette, RefreshCw, Settings as SettingsIcon,
  LogOut, ChevronRight, Moon, Sun, Monitor, Key, Trash2, Download
} from 'lucide-react';

const settingsSections = [
  { path: '/settings', icon: User, label: 'Account', end: true },
  { path: '/settings/storage', icon: HardDrive, label: 'Storage' },
  { path: '/settings/privacy', icon: Shield, label: 'Privacy' },
  { path: '/settings/appearance', icon: Palette, label: 'Appearance' },
  { path: '/settings/sync', icon: RefreshCw, label: 'Sync' },
  { path: '/settings/advanced', icon: SettingsIcon, label: 'Advanced' },
];

export default function Settings() {
  return (
    <div className="h-full flex">
      {/* Settings sidebar */}
      <nav className="w-56 border-r border-border p-4">
        <h1 className="text-lg font-semibold mb-4 px-3">Settings</h1>
        <div className="space-y-1">
          {settingsSections.map((section) => (
            <NavLink
              key={section.path}
              to={section.path}
              end={section.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <section.icon className="w-4 h-4" />
              {section.label}
            </NavLink>
          ))}
        </div>
      </nav>
      
      {/* Settings content */}
      <div className="flex-1 overflow-auto p-6">
        <Routes>
          <Route index element={<AccountSettings />} />
          <Route path="storage" element={<StorageSettings />} />
          <Route path="privacy" element={<PrivacySettings />} />
          <Route path="appearance" element={<AppearanceSettings />} />
          <Route path="sync" element={<SyncSettings />} />
          <Route path="advanced" element={<AdvancedSettings />} />
        </Routes>
      </div>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SettingsRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="font-medium">{label}</div>
        {description && <div className="text-sm text-muted-foreground">{description}</div>}
      </div>
      {children}
    </div>
  );
}

function AccountSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  
  return (
    <div className="max-w-2xl">
      <SettingsSection title="Account">
        <div className="p-4 rounded-xl bg-muted">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <div className="font-semibold">{user?.email}</div>
              <div className="text-sm text-muted-foreground">Free Plan</div>
            </div>
          </div>
        </div>
        
        <button className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-muted">
          <span>Change Password</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
        
        <button className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-muted">
          <span>Two-Factor Authentication</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
        
        <button className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-muted">
          <span>Connected Devices</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </SettingsSection>
      
      <SettingsSection title="Plan">
        <div className="p-4 rounded-xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold">Free Plan</div>
              <div className="text-sm text-muted-foreground">5 GB storage</div>
            </div>
            <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
              Upgrade
            </button>
          </div>
        </div>
      </SettingsSection>
      
      <SettingsSection title="Danger Zone">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-red-500"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </SettingsSection>
    </div>
  );
}

function StorageSettings() {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.getStats().then(r => r.data),
  });
  
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => api.getSubscription().then(r => r.data),
  });
  
  const usedGB = stats?.total_gb || 0;
  const limitGB = (subscription?.storage_limit || 5368709120) / (1024 * 1024 * 1024);
  const usedPercent = Math.round((usedGB / limitGB) * 100);
  
  return (
    <div className="max-w-2xl">
      <SettingsSection title="Storage Usage">
        <div className="p-4 rounded-xl bg-muted">
          <div className="flex justify-between mb-2">
            <span>{usedGB.toFixed(2)} GB used</span>
            <span>{limitGB.toFixed(0)} GB total</span>
          </div>
          <div className="h-2 rounded-full bg-background overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(usedPercent, 100)}%` }}
            />
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            {usedPercent}% used
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-muted text-center">
            <div className="text-2xl font-bold">{stats?.photos || 0}</div>
            <div className="text-sm text-muted-foreground">Photos</div>
          </div>
          <div className="p-4 rounded-lg bg-muted text-center">
            <div className="text-2xl font-bold">{stats?.documents || 0}</div>
            <div className="text-sm text-muted-foreground">Documents</div>
          </div>
          <div className="p-4 rounded-lg bg-muted text-center">
            <div className="text-2xl font-bold">{stats?.videos || 0}</div>
            <div className="text-sm text-muted-foreground">Videos</div>
          </div>
        </div>
      </SettingsSection>
      
      <SettingsSection title="Local Cache">
        <SettingsRow
          label="Cache Size"
          description="Thumbnails and recent photos"
        >
          <span className="text-muted-foreground">245 MB</span>
        </SettingsRow>
        
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted text-red-500">
          <Trash2 className="w-4 h-4" />
          Clear Cache
        </button>
      </SettingsSection>
    </div>
  );
}

function PrivacySettings() {
  return (
    <div className="max-w-2xl">
      <SettingsSection title="Encryption">
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-green-500" />
            <div>
              <div className="font-semibold text-green-500">End-to-End Encrypted</div>
              <div className="text-sm text-muted-foreground">
                Your data is encrypted with AES-256. Only you have the keys.
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>
      
      <SettingsSection title="Recovery">
        <button className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-muted">
          <div className="flex items-center gap-3">
            <Key className="w-4 h-4" />
            <span>View Recovery Phrase</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </SettingsSection>
      
      <SettingsSection title="Data Export">
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted">
          <Download className="w-4 h-4" />
          Export All Data
        </button>
      </SettingsSection>
    </div>
  );
}

function AppearanceSettings() {
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');
  
  useEffect(() => {
    const saved = localStorage.getItem('theme') as typeof theme || 'system';
    setTheme(saved);
  }, []);
  
  const changeTheme = (newTheme: typeof theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Apply theme
    if (newTheme === 'system') {
      document.documentElement.classList.remove('dark');
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      }
    } else if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  return (
    <div className="max-w-2xl">
      <SettingsSection title="Theme">
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: 'system', icon: Monitor, label: 'System' },
            { value: 'light', icon: Sun, label: 'Light' },
            { value: 'dark', icon: Moon, label: 'Dark' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => changeTheme(option.value as typeof theme)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                theme === option.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <option.icon className="w-6 h-6" />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}

function SyncSettings() {
  const [watchFolders, setWatchFolders] = useState<string[]>([]);
  
  const addWatchFolder = async () => {
    const result = await window.electronAPI?.showOpenDialog({
      properties: ['openDirectory'],
    });
    
    if (result && !result.canceled && result.filePaths[0]) {
      setWatchFolders([...watchFolders, result.filePaths[0]]);
    }
  };
  
  return (
    <div className="max-w-2xl">
      <SettingsSection title="Auto-Upload Folders">
        <p className="text-muted-foreground mb-4">
          Photos in these folders will be automatically uploaded to your vault.
        </p>
        
        {watchFolders.length > 0 ? (
          <div className="space-y-2 mb-4">
            {watchFolders.map((folder, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2 rounded-lg bg-muted">
                <span className="truncate">{folder}</span>
                <button
                  onClick={() => setWatchFolders(watchFolders.filter((_, j) => j !== i))}
                  className="text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
        
        <button
          onClick={addWatchFolder}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Add Folder
        </button>
      </SettingsSection>
    </div>
  );
}

function AdvancedSettings() {
  const [apiUrl, setApiUrl] = useState('');
  
  useEffect(() => {
    setApiUrl(localStorage.getItem('api_url') || 'https://api-vault.0711.io');
  }, []);
  
  return (
    <div className="max-w-2xl">
      <SettingsSection title="Server">
        <SettingsRow
          label="API Server"
          description="The server your vault connects to"
        >
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => {
              setApiUrl(e.target.value);
              localStorage.setItem('api_url', e.target.value);
              api.setBaseUrl(e.target.value);
            }}
            className="px-3 py-1 rounded-lg bg-muted border border-border w-64 text-right"
          />
        </SettingsRow>
      </SettingsSection>
      
      <SettingsSection title="Debug">
        <button className="px-4 py-2 rounded-lg hover:bg-muted">
          View Debug Logs
        </button>
        <button className="px-4 py-2 rounded-lg hover:bg-muted text-red-500">
          Reset App
        </button>
      </SettingsSection>
      
      <SettingsSection title="About">
        <SettingsRow label="Version">
          <span className="text-muted-foreground">1.0.0</span>
        </SettingsRow>
        <SettingsRow label="Electron">
          <span className="text-muted-foreground">40.1.0</span>
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}
