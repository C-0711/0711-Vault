import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Folder, Image, FileText, Download, Lock, AlertCircle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function SharedView() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [password, setPassword] = useState('')
  const [needsPassword, setNeedsPassword] = useState(false)

  useEffect(() => {
    fetchSharedContent()
  }, [token])

  const fetchSharedContent = async (pwd = null) => {
    try {
      setLoading(true)
      const url = pwd 
        ? `${API_URL}/sharing/public/${token}?password=${encodeURIComponent(pwd)}`
        : `${API_URL}/sharing/public/${token}`
      
      const res = await fetch(url)
      
      if (res.status === 404) {
        setError('This link is invalid or has been revoked.')
        return
      }
      if (res.status === 410) {
        const err = await res.json()
        setError(err.detail || 'This link has expired.')
        return
      }
      
      if (res.ok) {
        const result = await res.json()
        if (result.requires_password) {
          setNeedsPassword(true)
        } else {
          setData(result)
          setNeedsPassword(false)
        }
      }
    } catch (err) {
      setError('Failed to load shared content.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    fetchSharedContent(password)
  }

  const Logo = () => (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center font-bold text-white text-lg">
        07
      </div>
      <span className="font-semibold text-white">0711 Vault</span>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Logo />
        <div className="mt-8 w-8 h-8 border-2 border-white/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <Logo />
        <div className="mt-8 bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Unable to Access</h2>
          <p className="text-zinc-400">{error}</p>
        </div>
      </div>
    )
  }

  if (needsPassword) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <Logo />
        <form onSubmit={handlePasswordSubmit} className="mt-8 bg-white/5 border border-white/10 rounded-xl p-6 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-semibold text-white">Password Required</h2>
          </div>
          <p className="text-zinc-400 mb-4">This shared content is protected. Enter the password to access.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password..."
            className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 mb-4"
            autoFocus
          />
          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition"
          >
            Unlock
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-white/10 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo />
          {data?.allow_download && (
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition">
              <Download className="w-5 h-5" />
              Download All
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        {data?.message && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
            <p className="text-emerald-300">{data.message}</p>
          </div>
        )}

        {data?.type === 'album' && (
          <>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <Folder className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{data.album?.encrypted_name}</h1>
                {data.album?.encrypted_description && (
                  <p className="text-zinc-400">{data.album.encrypted_description}</p>
                )}
                <p className="text-sm text-zinc-500">{data.items?.length || 0} items</p>
              </div>
            </div>

            {data.items?.length === 0 ? (
              <div className="bg-white/5 rounded-xl p-12 text-center border border-white/10">
                <Image className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
                <p className="text-zinc-500">This album is empty</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {data.items.map((item) => (
                  <div
                    key={item.id}
                    className="group aspect-square bg-white/5 rounded-lg overflow-hidden border border-white/10 hover:border-emerald-500/50 transition cursor-pointer relative"
                  >
                    {item.item_type === 'photo' ? (
                      <img
                        src={`${API_URL}/sharing/public/${token}/items/${item.id}/preview`}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 p-4">
                        <FileText className="w-8 h-8 mb-2" />
                        <span className="text-xs text-center truncate w-full">
                          {item.mime_type?.split('/')[1] || 'file'}
                        </span>
                      </div>
                    )}
                    
                    {data.allow_download && (
                      <button className="absolute bottom-2 right-2 p-2 bg-black/70 rounded-lg opacity-0 group-hover:opacity-100 transition">
                        <Download className="w-5 h-5 text-white" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {data?.type === 'item' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white/5 rounded-xl overflow-hidden border border-white/10">
              {data.item.item_type === 'photo' ? (
                <img
                  src={`${API_URL}/sharing/public/${token}/preview`}
                  alt=""
                  className="w-full"
                />
              ) : (
                <div className="p-12 flex flex-col items-center justify-center text-zinc-500">
                  <FileText className="w-16 h-16 mb-4" />
                  <p className="text-lg">{data.item.mime_type}</p>
                  <p className="text-sm">{Math.round(data.item.file_size / 1024)} KB</p>
                </div>
              )}
            </div>
            
            {data.allow_download && (
              <div className="mt-4 flex justify-center">
                <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition">
                  <Download className="w-5 h-5" />
                  Download
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 p-4 mt-12">
        <div className="max-w-6xl mx-auto text-center text-sm text-zinc-600">
          Shared via <span className="text-emerald-500">0711 Vault</span> — Sovereign Cloud Storage
        </div>
      </footer>
    </div>
  )
}
