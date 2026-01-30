import { useState, useEffect } from 'react'
import api from '../lib/api'

export default function Import() {
  const [source, setSource] = useState(null)
  const [imessageStatus, setImessageStatus] = useState(null)
  const [preview, setPreview] = useState(null)
  const [importing, setImporting] = useState(false)
  const [jobId, setJobId] = useState(null)
  const [jobStatus, setJobStatus] = useState(null)
  const [settings, setSettings] = useState({
    sinceDays: 30,
    includeSent: true,
    includeReceived: true
  })

  useEffect(() => {
    checkImessageAccess()
  }, [])

  useEffect(() => {
    if (jobId) {
      const interval = setInterval(pollJobStatus, 2000)
      return () => clearInterval(interval)
    }
  }, [jobId])

  async function checkImessageAccess() {
    try {
      const status = await api.request('/import/imessage/status')
      setImessageStatus(status)
    } catch (err) {
      setImessageStatus({ accessible: false, error: err.message })
    }
  }

  async function loadPreview() {
    try {
      const data = await api.request(
        `/import/imessage/preview?since_days=${settings.sinceDays}&include_sent=${settings.includeSent}&include_received=${settings.includeReceived}`
      )
      setPreview(data)
    } catch (err) {
      console.error('Preview failed:', err)
    }
  }

  async function startImport() {
    setImporting(true)
    try {
      const { job_id } = await api.request('/import/imessage/start', {
        method: 'POST',
        body: JSON.stringify({
          since_days: settings.sinceDays,
          include_sent: settings.includeSent,
          include_received: settings.includeReceived
        })
      })
      setJobId(job_id)
    } catch (err) {
      console.error('Import failed:', err)
      setImporting(false)
    }
  }

  async function pollJobStatus() {
    if (!jobId) return
    try {
      const status = await api.request(`/import/imessage/job/${jobId}`)
      setJobStatus(status)
      
      if (status.status === 'completed' || status.status.startsWith('error')) {
        setImporting(false)
        setJobId(null)
      }
    } catch (err) {
      console.error('Status poll failed:', err)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Import</h1>
        <p className="text-zinc-400">Importiere Fotos und Dokumente aus anderen Apps</p>
      </div>

      {/* Source Selection */}
      {!source && (
        <div className="grid md:grid-cols-3 gap-4">
          <SourceCard
            icon="💬"
            title="iMessage"
            description="Fotos aus iMessage Chats importieren"
            available={imessageStatus?.accessible}
            onClick={() => setSource('imessage')}
          />
          <SourceCard
            icon="📷"
            title="Fotos App"
            description="Aus Apple Fotos importieren"
            available={false}
            comingSoon
          />
          <SourceCard
            icon="☁️"
            title="Google Photos"
            description="Von Google Photos migrieren"
            available={false}
            comingSoon
          />
        </div>
      )}

      {/* iMessage Import */}
      {source === 'imessage' && (
        <div className="space-y-6">
          <button
            onClick={() => setSource(null)}
            className="text-zinc-400 hover:text-white transition flex items-center gap-2"
          >
            ← Zurück
          </button>

          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center text-3xl">
                💬
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">iMessage Import</h2>
                <p className="text-zinc-400">
                  {imessageStatus?.accessible 
                    ? `${imessageStatus.total_images?.toLocaleString()} Bilder verfügbar`
                    : 'Kein Zugriff auf iMessage'
                  }
                </p>
              </div>
            </div>

            {!imessageStatus?.accessible ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <h3 className="font-medium text-red-400 mb-2">Zugriff erforderlich</h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Um iMessage Fotos zu importieren, benötigt die App Zugriff auf die Nachrichten-Datenbank.
                </p>
                <ol className="text-sm text-zinc-400 space-y-2 list-decimal list-inside">
                  <li>Öffne <strong>Systemeinstellungen → Datenschutz & Sicherheit → Festplattenvollzugriff</strong></li>
                  <li>Aktiviere den Zugriff für Terminal oder deine IDE</li>
                  <li>Starte die App neu</li>
                </ol>
              </div>
            ) : (
              <>
                {/* Settings */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Zeitraum
                    </label>
                    <select
                      value={settings.sinceDays}
                      onChange={(e) => setSettings({ ...settings, sinceDays: parseInt(e.target.value) })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                    >
                      <option value={7}>Letzte 7 Tage</option>
                      <option value={30}>Letzte 30 Tage</option>
                      <option value={90}>Letzte 3 Monate</option>
                      <option value={365}>Letztes Jahr</option>
                      <option value={3650}>Alles</option>
                    </select>
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.includeReceived}
                        onChange={(e) => setSettings({ ...settings, includeReceived: e.target.checked })}
                        className="w-5 h-5 rounded bg-zinc-800 border-zinc-700 text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-white">Empfangene Fotos</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.includeSent}
                        onChange={(e) => setSettings({ ...settings, includeSent: e.target.checked })}
                        className="w-5 h-5 rounded bg-zinc-800 border-zinc-700 text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-white">Gesendete Fotos</span>
                    </label>
                  </div>
                </div>

                {/* Preview Button */}
                {!preview && !importing && (
                  <button
                    onClick={loadPreview}
                    className="w-full py-3 bg-zinc-800 text-white rounded-xl font-medium hover:bg-zinc-700 transition"
                  >
                    Vorschau laden
                  </button>
                )}

                {/* Preview Results */}
                {preview && !importing && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-zinc-800 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-white">{preview.total_attachments}</div>
                        <div className="text-sm text-zinc-500">Dateien</div>
                      </div>
                      <div className="bg-zinc-800 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-white">{preview.total_size_mb} MB</div>
                        <div className="text-sm text-zinc-500">Gesamt</div>
                      </div>
                      <div className="bg-zinc-800 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-white">{preview.by_type?.image || 0}</div>
                        <div className="text-sm text-zinc-500">Bilder</div>
                      </div>
                    </div>

                    {preview.sample?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-zinc-400 mb-2">Vorschau</h4>
                        <div className="bg-zinc-800 rounded-xl divide-y divide-zinc-700">
                          {preview.sample.slice(0, 5).map((item, i) => (
                            <div key={i} className="px-4 py-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-xl">
                                  {item.type?.includes('video') ? '🎬' : '🖼️'}
                                </span>
                                <div>
                                  <div className="text-white text-sm truncate max-w-[200px]">
                                    {item.filename}
                                  </div>
                                  <div className="text-zinc-500 text-xs">
                                    von {item.from} • {item.size_kb} KB
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={startImport}
                      className="w-full py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-400 transition"
                    >
                      {preview.total_attachments} Dateien importieren
                    </button>
                  </div>
                )}

                {/* Import Progress */}
                {importing && jobStatus && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">Importiere...</span>
                      <span className="text-zinc-400">
                        {jobStatus.imported} / {jobStatus.total}
                      </span>
                    </div>
                    
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 transition-all duration-300"
                        style={{ width: `${(jobStatus.imported / jobStatus.total) * 100}%` }}
                      />
                    </div>
                    
                    {jobStatus.current_file && (
                      <div className="text-sm text-zinc-500 truncate">
                        {jobStatus.current_file}
                      </div>
                    )}
                    
                    {jobStatus.failed > 0 && (
                      <div className="text-sm text-red-400">
                        {jobStatus.failed} Fehler
                      </div>
                    )}
                  </div>
                )}

                {/* Completed */}
                {jobStatus?.status === 'completed' && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                    <div className="text-4xl mb-2">✅</div>
                    <h3 className="font-medium text-green-400 mb-1">Import abgeschlossen!</h3>
                    <p className="text-sm text-zinc-400">
                      {jobStatus.imported} Dateien importiert
                      {jobStatus.failed > 0 && `, ${jobStatus.failed} fehlgeschlagen`}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SourceCard({ icon, title, description, available, comingSoon, onClick }) {
  return (
    <button
      onClick={available ? onClick : undefined}
      disabled={!available}
      className={`text-left p-6 rounded-2xl border transition ${
        available
          ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 cursor-pointer'
          : 'bg-zinc-900/50 border-zinc-800/50 cursor-not-allowed opacity-60'
      }`}
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="font-bold text-white mb-1">{title}</h3>
      <p className="text-sm text-zinc-400">{description}</p>
      {comingSoon && (
        <span className="inline-block mt-3 text-xs bg-zinc-800 text-zinc-500 px-2 py-1 rounded">
          Bald verfügbar
        </span>
      )}
    </button>
  )
}
