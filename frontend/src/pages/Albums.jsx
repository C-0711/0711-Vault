import { useState, useEffect } from 'react'
import { useAuth } from '../App'
import { Plus, Folder, Share2, Trash2, Image } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function Albums() {
  const { user } = useAuth()
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newAlbumName, setNewAlbumName] = useState('')
  const [selectedAlbum, setSelectedAlbum] = useState(null)
  const [albumItems, setAlbumItems] = useState([])

  useEffect(() => {
    fetchAlbums()
  }, [user])

  const fetchAlbums = async () => {
    try {
      const res = await fetch(`${API_URL}/albums`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setAlbums(data)
      }
    } catch (err) {
      console.error('Failed to fetch albums:', err)
    } finally {
      setLoading(false)
    }
  }

  const createAlbum = async () => {
    if (!newAlbumName.trim()) return
    try {
      const res = await fetch(`${API_URL}/albums`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          encrypted_name: newAlbumName,
          encrypted_description: ''
        })
      })
      if (res.ok) {
        setNewAlbumName('')
        setShowCreate(false)
        fetchAlbums()
      }
    } catch (err) {
      console.error('Failed to create album:', err)
    }
  }

  const deleteAlbum = async (albumId) => {
    if (!confirm('Delete this album? Items will NOT be deleted.')) return
    try {
      const res = await fetch(`${API_URL}/albums/${albumId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      if (res.ok) {
        fetchAlbums()
        if (selectedAlbum?.id === albumId) {
          setSelectedAlbum(null)
          setAlbumItems([])
        }
      }
    } catch (err) {
      console.error('Failed to delete album:', err)
    }
  }

  const selectAlbum = async (album) => {
    setSelectedAlbum(album)
    try {
      const res = await fetch(`${API_URL}/albums/${album.id}/items`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setAlbumItems(data.items || [])
      }
    } catch (err) {
      console.error('Failed to fetch album items:', err)
    }
  }

  const shareAlbum = async (albumId) => {
    try {
      const res = await fetch(`${API_URL}/sharing/links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          album_id: albumId,
          expires_in_hours: 168,
          allow_download: true
        })
      })
      if (res.ok) {
        const data = await res.json()
        navigator.clipboard.writeText(data.share_url)
        alert(`Share link copied!\n${data.share_url}`)
      }
    } catch (err) {
      console.error('Failed to create share link:', err)
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Albums</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          New Album
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-xl w-full max-w-md border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Create Album</h2>
            <input
              type="text"
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              placeholder="Album name..."
              className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setShowCreate(false); setNewAlbumName('') }}
                className="px-4 py-2 text-zinc-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={createAlbum}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Album List */}
        <div className="lg:col-span-1 space-y-3">
          {albums.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No albums yet</p>
              <p className="text-sm mt-1">Create your first album to organize your files</p>
            </div>
          ) : (
            albums.map((album) => (
              <div
                key={album.id}
                onClick={() => selectAlbum(album)}
                className={`p-4 rounded-xl cursor-pointer transition border ${
                  selectedAlbum?.id === album.id
                    ? 'bg-emerald-600/20 border-emerald-500/50'
                    : 'bg-white/5 border-transparent hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Folder className="w-8 h-8 text-emerald-400" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{album.encrypted_name}</h3>
                    <p className="text-sm text-zinc-500">{album.item_count} items</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); shareAlbum(album.id) }}
                      className="p-2 text-zinc-500 hover:text-emerald-400 transition"
                      title="Share"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteAlbum(album.id) }}
                      className="p-2 text-zinc-500 hover:text-red-400 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Album Content */}
        <div className="lg:col-span-2">
          {selectedAlbum ? (
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">{selectedAlbum.encrypted_name}</h2>
                <span className="text-sm text-zinc-500">{albumItems.length} items</span>
              </div>

              {albumItems.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>This album is empty</p>
                  <p className="text-sm mt-1">Add items from Photos or Documents</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {albumItems.map((item) => (
                    <div
                      key={item.id}
                      className="aspect-square bg-black/30 rounded-lg overflow-hidden border border-white/5 hover:border-emerald-500/50 transition cursor-pointer"
                    >
                      {item.item_type === 'photo' ? (
                        <img
                          src={`${API_URL}/vault/items/${item.id}/thumbnail`}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500">
                          <span className="text-xs">{item.mime_type?.split('/')[1] || 'file'}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/5 rounded-xl p-12 border border-white/10 text-center text-zinc-500">
              <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Select an album to view its contents</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
