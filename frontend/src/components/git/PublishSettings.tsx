/**
 * PROJEKT GENESIS: Publish Settings Component
 * Configure and publish documentation sites
 */

import React, { useState, useEffect } from 'react';

interface Site {
  id: string;
  slug: string;
  title: string;
  description: string;
  url: string;
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'password' | 'private';
  branch: string;
  theme: string;
  primary_color: string;
  last_published_at: string | null;
}

interface PublishSettingsProps {
  spaceId: string;
  spaceName: string;
}

export function PublishSettings({ spaceId, spaceName }: PublishSettingsProps) {
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  
  // Create form
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchSite();
  }, [spaceId]);

  const fetchSite = async () => {
    try {
      const res = await fetch(`/publish/sites?space_id=${spaceId}`);
      const data = await res.json();
      if (data.sites && data.sites.length > 0) {
        // Fetch full details
        const detailRes = await fetch(`/publish/sites/${data.sites[0].id}`);
        const detail = await detailRes.json();
        setSite(detail);
      }
    } catch (err) {
      console.error('Failed to fetch site:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const res = await fetch('/publish/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: spaceId,
          slug: slug || spaceName.toLowerCase().replace(/\s+/g, '-'),
          title: title || spaceName,
          description
        })
      });
      const data = await res.json();
      setSite(data);
      setShowCreate(false);
    } catch (err) {
      console.error('Failed to create site:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!site) return;
    setPublishing(true);
    try {
      await fetch(`/publish/sites/${site.id}/publish`, { method: 'POST' });
      fetchSite();
    } catch (err) {
      console.error('Failed to publish:', err);
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!site && !showCreate) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <div className="text-5xl mb-4">📚</div>
        <h3 className="text-xl font-bold mb-2">Publish Your Documentation</h3>
        <p className="text-gray-400 mb-6">
          Create a beautiful documentation site from your space content.
          <br />Like GitBook, but with Git-style versioning.
        </p>
        <button
          onClick={() => {
            setTitle(spaceName);
            setSlug(spaceName.toLowerCase().replace(/\s+/g, '-'));
            setShowCreate(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-lg"
        >
          Create Documentation Site
        </button>
      </div>
    );
  }

  if (showCreate) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Create Documentation Site</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Site URL</label>
            <div className="flex items-center">
              <span className="bg-gray-700 px-3 py-2 rounded-l text-gray-400">https://</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="flex-1 bg-gray-700 px-3 py-2 text-white"
                placeholder="my-docs"
              />
              <span className="bg-gray-700 px-3 py-2 rounded-r text-gray-400">.vault.0711.io</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white"
              placeholder="My Documentation"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white h-20 resize-none"
              placeholder="What is this documentation about?"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-400">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !slug}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2 rounded"
          >
            {saving ? 'Creating...' : 'Create Site'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className={`rounded-lg p-4 flex items-center justify-between ${
        site.status === 'published' ? 'bg-green-900/50 border border-green-700' : 'bg-yellow-900/50 border border-yellow-700'
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{site.status === 'published' ? '🌐' : '📝'}</span>
          <div>
            <p className="font-medium">
              {site.status === 'published' ? 'Site is Live' : 'Draft - Not Published'}
            </p>
            <a href={site.url} target="_blank" className="text-sm text-blue-400 hover:underline">
              {site.url}
            </a>
          </div>
        </div>
        <button
          onClick={handlePublish}
          disabled={publishing}
          className={`px-4 py-2 rounded ${
            site.status === 'published' 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {publishing ? 'Publishing...' : site.status === 'published' ? 'Republish' : 'Publish Now'}
        </button>
      </div>

      {/* Settings */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4">Site Settings</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={site.title}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Branch</label>
            <input
              type="text"
              value={site.branch}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Visibility</label>
            <select className="w-full bg-gray-700 rounded px-3 py-2 text-white" value={site.visibility}>
              <option value="public">🌐 Public</option>
              <option value="password">🔑 Password Protected</option>
              <option value="private">🔒 Private (invite only)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Theme Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={site.primary_color}
                className="w-10 h-10 rounded cursor-pointer"
              />
              <span className="text-gray-400">{site.primary_color}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Last Published */}
      {site.last_published_at && (
        <div className="text-sm text-gray-500 text-center">
          Last published: {new Date(site.last_published_at).toLocaleString()}
        </div>
      )}
    </div>
  );
}

export default PublishSettings;
