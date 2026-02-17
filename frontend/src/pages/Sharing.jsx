import { useState, useEffect } from 'react'
import { useAuth } from '../App'
import { Link, Clipboard, Trash2, Clock, Download } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function Sharing() {
  const { user } = useAuth()
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLinks()
  }, [user])

  const fetchLinks = async () => {
    try {
      const res = await fetch(`${API_URL}/sharing/links`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setLinks(data)
      }
    } catch (err) {
      console.error('Failed to fetch share links:', err)
    } finally {
      setLoading(false)
    }
  }

  const revokeLink = async (linkId) => {
    if (!confirm('Revoke this share link? Recipients will no longer have access.')) return
    try {
      const res = await fetch(`${API_URL}/sharing/links/${linkId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      if (res.ok) {
        fetchLinks()
      }
    } catch (err) {
      console.error('Failed to revoke link:', err)
    }
  }

  const copyLink = (url) => {
    navigator.clipboard.writeText(url)
    alert('Link copied!')
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = (dateStr) => {
    if (!dateStr) return false
    return new Date(dateStr) < new Date()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-white/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Shared Links</h1>
        <p className="text-sm text-zinc-500">Manage your share links</p>
      </div>

      {links.length === 0 ? (
        <div className="bg-white/5 rounded-xl p-12 border border-white/10 text-center">
          <Link className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
          <h2 className="text-xl font-semibold text-white mb-2">No shared links</h2>
          <p className="text-zinc-500">
            When you share items or albums, your links will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <div
              key={link.id}
              className={`p-4 rounded-xl border transition ${
                isExpired(link.expires_at)
                  ? 'bg-red-900/10 border-red-500/20'
                  : 'bg-white/5 border-white/10 hover:border-emerald-500/30'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${
                  link.album_id ? 'bg-purple-500/20' : 'bg-blue-500/20'
                }`}>
                  <Link className={`w-6 h-6 ${
                    link.album_id ? 'text-purple-400' : 'text-blue-400'
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white">
                      {link.album_id ? 'Album' : 'Item'} Share
                    </span>
                    {isExpired(link.expires_at) && (
                      <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
                        Expired
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-zinc-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Expires: {formatDate(link.expires_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      {link.download_count} downloads
                      {link.max_downloads && ` / ${link.max_downloads}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 p-2 bg-black/30 rounded-lg">
                    <code className="flex-1 text-sm text-emerald-400 truncate">
                      {link.share_url}
                    </code>
                    <button
                      onClick={() => copyLink(link.share_url)}
                      className="p-1.5 hover:bg-white/10 rounded transition"
                      title="Copy link"
                    >
                      <Clipboard className="w-5 h-5 text-zinc-400 hover:text-white" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => revokeLink(link.id)}
                  className="p-2 text-zinc-500 hover:text-red-400 transition"
                  title="Revoke link"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5 text-xs text-zinc-500">
                <span>Created: {formatDate(link.created_at)}</span>
                <span>•</span>
                <span>Download: {link.allow_download ? 'Allowed' : 'Disabled'}</span>
                <span>•</span>
                <span>Preview: {link.allow_preview ? 'Allowed' : 'Disabled'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
