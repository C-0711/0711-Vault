import { useState, useEffect } from 'react'
import { useAuth } from '../App'
import { Cloud, Check, X, RefreshCw, Trash2, Play, Pause, ChevronRight } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function Import() {
  const { user } = useAuth()
  const [connectors, setConnectors] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedConnector, setSelectedConnector] = useState(null)
  const [importConfig, setImportConfig] = useState({
    include_shared: false,
    preserve_folders: true,
    delete_after_import: false
  })

  useEffect(() => {
    fetchConnectors()
    fetchJobs()
  }, [user])

  // Poll jobs every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (jobs.some(j => j.status === 'running' || j.status === 'pending')) {
        fetchJobs()
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [jobs])

  const fetchConnectors = async () => {
    try {
      const res = await fetch(`${API_URL}/import/connectors`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      if (res.ok) {
        setConnectors(await res.json())
      }
    } catch (err) {
      console.error('Failed to fetch connectors:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_URL}/import/jobs`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      if (res.ok) {
        setJobs(await res.json())
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err)
    }
  }

  const connectProvider = async (providerId) => {
    try {
      const res = await fetch(`${API_URL}/import/connect/${providerId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      if (res.ok) {
        const data = await res.json()
        // Redirect to OAuth
        window.location.href = data.auth_url
      }
    } catch (err) {
      console.error('Failed to connect:', err)
    }
  }

  const disconnectProvider = async (providerId) => {
    if (!confirm(`Disconnect from ${providerId}? Your imported files will remain.`)) return
    try {
      await fetch(`${API_URL}/import/disconnect/${providerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      fetchConnectors()
    } catch (err) {
      console.error('Failed to disconnect:', err)
    }
  }

  const startImport = async (providerId) => {
    try {
      const res = await fetch(`${API_URL}/import/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: providerId,
          ...importConfig
        })
      })
      if (res.ok) {
        setSelectedConnector(null)
        fetchJobs()
      }
    } catch (err) {
      console.error('Failed to start import:', err)
    }
  }

  const cancelJob = async (jobId) => {
    try {
      await fetch(`${API_URL}/import/jobs/${jobId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      fetchJobs()
    } catch (err) {
      console.error('Failed to cancel job:', err)
    }
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-white/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Import</h1>
        <p className="text-zinc-400">
          Migrate from other cloud services. Full sovereignty — your data comes home.
        </p>
      </div>

      {/* Cloud Connectors */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Cloud Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectors.map((connector) => (
            <div
              key={connector.id}
              className={`p-5 rounded-xl border transition ${
                connector.connected
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{connector.icon}</span>
                  <div>
                    <h3 className="font-medium text-white">{connector.name}</h3>
                    <p className="text-sm text-zinc-500">{connector.description}</p>
                  </div>
                </div>
                {connector.connected && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 rounded text-emerald-400 text-xs">
                    <Check className="w-3 h-3" />
                    Connected
                  </div>
                )}
              </div>

              {connector.connected ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-black/30 rounded-lg p-2">
                      <div className="text-zinc-500">Imported</div>
                      <div className="text-white font-medium">{connector.files_imported.toLocaleString()} files</div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2">
                      <div className="text-zinc-500">Size</div>
                      <div className="text-white font-medium">{formatBytes(connector.bytes_imported)}</div>
                    </div>
                  </div>
                  {connector.last_sync && (
                    <p className="text-xs text-zinc-500">Last sync: {formatDate(connector.last_sync)}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedConnector(connector)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition text-sm"
                    >
                      <Play className="w-4 h-4" />
                      Import Now
                    </button>
                    <button
                      onClick={() => disconnectProvider(connector.id)}
                      className="p-2 text-zinc-500 hover:text-red-400 transition"
                      title="Disconnect"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => connectProvider(connector.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition text-sm"
                >
                  <Cloud className="w-4 h-4" />
                  Connect
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Import Configuration Modal */}
      {selectedConnector && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl w-full max-w-md border border-white/10">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedConnector.icon}</span>
                <div>
                  <h2 className="text-xl font-semibold text-white">Import from {selectedConnector.name}</h2>
                  <p className="text-sm text-zinc-500">Configure your import settings</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={importConfig.preserve_folders}
                  onChange={(e) => setImportConfig({...importConfig, preserve_folders: e.target.checked})}
                  className="w-5 h-5 rounded bg-black/50 border-white/20 text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-white">Preserve folder structure</div>
                  <div className="text-sm text-zinc-500">Keep your original organization</div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={importConfig.include_shared}
                  onChange={(e) => setImportConfig({...importConfig, include_shared: e.target.checked})}
                  className="w-5 h-5 rounded bg-black/50 border-white/20 text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-white">Include shared files</div>
                  <div className="text-sm text-zinc-500">Import files shared with you</div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={importConfig.delete_after_import}
                  onChange={(e) => setImportConfig({...importConfig, delete_after_import: e.target.checked})}
                  className="w-5 h-5 rounded bg-black/50 border-white/20 text-red-500 focus:ring-red-500"
                />
                <div>
                  <div className="text-white flex items-center gap-2">
                    Delete from source
                    <span className="px-1.5 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">Dangerous</span>
                  </div>
                  <div className="text-sm text-zinc-500">Remove files from {selectedConnector.name} after import</div>
                </div>
              </label>
            </div>

            <div className="p-6 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setSelectedConnector(null)}
                className="flex-1 py-3 text-zinc-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={() => startImport(selectedConnector.id)}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition font-medium"
              >
                Start Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Jobs */}
      {jobs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Import Jobs</h2>
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.job_id}
                className={`p-4 rounded-xl border ${
                  job.status === 'running' ? 'bg-blue-500/10 border-blue-500/30' :
                  job.status === 'complete' ? 'bg-emerald-500/10 border-emerald-500/30' :
                  job.status === 'failed' ? 'bg-red-500/10 border-red-500/30' :
                  'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {connectors.find(c => c.id === job.provider)?.icon || '☁️'}
                    </span>
                    <div>
                      <div className="font-medium text-white capitalize">{job.provider.replace('_', ' ')}</div>
                      <div className="text-sm text-zinc-500">Started {formatDate(job.started_at)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      job.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
                      job.status === 'complete' ? 'bg-emerald-500/20 text-emerald-400' :
                      job.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                      job.status === 'cancelled' ? 'bg-zinc-500/20 text-zinc-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {job.status}
                    </span>
                    {(job.status === 'running' || job.status === 'pending') && (
                      <button
                        onClick={() => cancelJob(job.job_id)}
                        className="p-1 text-zinc-500 hover:text-red-400 transition"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress */}
                {(job.status === 'running' || job.status === 'pending') && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">
                        {job.imported_files.toLocaleString()} / {job.total_files.toLocaleString()} files
                      </span>
                      <span className="text-zinc-400">
                        {formatBytes(job.imported_bytes)} / {formatBytes(job.total_bytes)}
                      </span>
                    </div>
                    <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${job.total_files ? (job.imported_files / job.total_files) * 100 : 0}%` }}
                      />
                    </div>
                    {job.current_file && (
                      <p className="text-xs text-zinc-500 truncate">
                        {job.current_file}
                      </p>
                    )}
                  </div>
                )}

                {/* Completed Stats */}
                {job.status === 'complete' && (
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-black/30 rounded-lg p-2">
                      <div className="text-lg font-semibold text-white">{job.imported_files.toLocaleString()}</div>
                      <div className="text-xs text-zinc-500">Imported</div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2">
                      <div className="text-lg font-semibold text-white">{formatBytes(job.imported_bytes)}</div>
                      <div className="text-xs text-zinc-500">Size</div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2">
                      <div className={`text-lg font-semibold ${job.failed_files > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {job.failed_files}
                      </div>
                      <div className="text-xs text-zinc-500">Failed</div>
                    </div>
                  </div>
                )}

                {/* Errors */}
                {job.errors && job.errors.length > 0 && (
                  <div className="mt-3 p-2 bg-red-500/10 rounded-lg">
                    <div className="text-xs text-red-400 font-medium mb-1">Errors:</div>
                    <div className="text-xs text-zinc-400 max-h-20 overflow-y-auto">
                      {job.errors.slice(0, 5).map((err, i) => (
                        <div key={i} className="truncate">{err}</div>
                      ))}
                      {job.errors.length > 5 && (
                        <div className="text-zinc-500">...and {job.errors.length - 5} more</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-2">🏠 Digital Sovereignty</h3>
        <p className="text-zinc-400 mb-4">
          Your files are imported directly to your 0711 Vault. No third parties, no data mining, no ads.
          All processing happens on our sovereign H200 infrastructure in Germany.
        </p>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-zinc-300">DSGVO compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-zinc-300">End-to-end encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-zinc-300">German infrastructure</span>
          </div>
        </div>
      </div>
    </div>
  )
}
