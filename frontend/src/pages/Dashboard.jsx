import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [processing, setProcessing] = useState(null)
  const [events, setEvents] = useState([])
  const [recentItems, setRecentItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    try {
      const [statsData, processingData, eventsData, itemsData] = await Promise.all([
        api.getStats().catch(() => ({})),
        api.getProcessingStatus().catch(() => ({})),
        api.request('/calendar/upcoming?days=7').catch(() => ({ events: [] })),
        api.getItems(null, 5).catch(() => ({ items: [] }))
      ])
      setStats(statsData)
      setProcessing(processingData)
      setEvents(eventsData.events || [])
      setRecentItems(itemsData.items || [])
    } catch (err) {
      console.error('Failed to load dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(isoString) {
    const date = new Date(isoString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) return 'Heute'
    if (date.toDateString() === tomorrow.toDateString()) return 'Morgen'
    return date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  function formatTime(isoString) {
    return new Date(isoString).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dein Vault</h1>
        <p className="text-zinc-400 mt-1">Alles sicher an einem Ort</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Fotos" value={stats?.photos || 0} icon="📷" href="/photos" color="blue" />
        <StatCard label="Dokumente" value={stats?.documents || 0} icon="📄" href="/documents" color="green" />
        <StatCard label="Personen" value={stats?.face_clusters || 0} icon="👤" href="/photos?view=faces" color="purple" />
        <StatCard label="Events" value={events.length} icon="📅" href="/calendar" color="orange" />
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Storage */}
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Speicher</h2>
              <span className="text-zinc-400">{(stats?.total_gb || 0).toFixed(2)} GB verwendet</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                style={{ width: `${Math.min((stats?.total_gb || 0) / 5 * 100, 100)}%` }}
              />
            </div>
            <div className="mt-2 text-sm text-zinc-500">5 GB im Free-Tarif</div>
          </div>

          {/* Processing Status */}
          {(processing?.pending > 0 || processing?.processing > 0) && (
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h2 className="text-lg font-semibold text-white mb-4">Verarbeitung</h2>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <div>
                  <div className="text-white">{processing?.processing || 0} Dateien werden verarbeitet</div>
                  <div className="text-zinc-500 text-sm">{processing?.pending || 0} in Warteschlange</div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <QuickAction to="/photos" icon="📷" title="Fotos hochladen" subtitle="Von deinem Gerät" color="blue" />
            <QuickAction to="/documents" icon="📄" title="Dokument scannen" subtitle="Sicher speichern" color="green" />
            <QuickAction to="/calendar" icon="📅" title="Event erstellen" subtitle="Termin planen" color="orange" />
            <QuickAction to="/import" icon="📥" title="Import" subtitle="iMessage & mehr" color="purple" />
          </div>

          {/* Recent Activity */}
          {recentItems.length > 0 && (
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h2 className="text-lg font-semibold text-white mb-4">Zuletzt hinzugefügt</h2>
              <div className="space-y-3">
                {recentItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      item.item_type === 'photo' ? 'bg-blue-500/20' : 'bg-green-500/20'
                    }`}>
                      {item.item_type === 'photo' ? '📷' : '📄'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm truncate">
                        {item.item_type === 'photo' ? 'Foto' : 'Dokument'}
                      </div>
                      <div className="text-zinc-500 text-xs">
                        {new Date(item.created_at).toLocaleDateString('de-DE')}
                      </div>
                    </div>
                    <div className="text-zinc-500 text-xs">
                      {formatFileSize(item.file_size)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - 1/3 */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">📅 Termine</h2>
              <Link to="/calendar" className="text-zinc-400 text-sm hover:text-white transition">
                Alle →
              </Link>
            </div>
            
            {events.length === 0 ? (
              <div className="text-center py-6 text-zinc-500">
                <div className="text-3xl mb-2">📅</div>
                <p className="text-sm">Keine Termine diese Woche</p>
                <Link to="/calendar" className="text-orange-500 text-sm hover:underline mt-2 inline-block">
                  Event erstellen
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {events.slice(0, 5).map(event => (
                  <Link
                    key={event.id}
                    to="/calendar"
                    className="block p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-1 h-full min-h-[40px] rounded-full"
                        style={{ backgroundColor: getEventColor(event.color) }}
                      />
                      <div className="flex-1">
                        <div className="text-white text-sm font-medium">{event.title}</div>
                        <div className="text-zinc-500 text-xs mt-1">
                          {formatDate(event.date)}
                          {!event.all_day && ` • ${formatTime(event.date)}`}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* AI Training */}
          {stats?.face_clusters === 0 && stats?.photos > 0 && (
            <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl p-6 border border-purple-500/30">
              <div className="text-3xl mb-3">🧠</div>
              <h3 className="text-white font-semibold mb-2">AI trainieren</h3>
              <p className="text-zinc-400 text-sm mb-4">
                Hilf deinem Vault, Personen in Fotos zu erkennen
              </p>
              <Link
                to="/photos?view=train"
                className="block w-full text-center bg-white text-black py-2 rounded-lg font-medium hover:bg-zinc-200 transition"
              >
                Training starten
              </Link>
            </div>
          )}

          {/* Upgrade CTA */}
          {(!stats?.plan || stats?.plan === 'free') && (
            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-6 border border-orange-500/30">
              <div className="text-3xl mb-3">💎</div>
              <h3 className="text-white font-semibold mb-2">Mehr Speicher?</h3>
              <p className="text-zinc-400 text-sm mb-4">
                Upgrade auf Pro für 100 GB und mehr Features
              </p>
              <Link
                to="/pricing"
                className="block w-full text-center bg-orange-500 text-white py-2 rounded-lg font-medium hover:bg-orange-400 transition"
              >
                Plans ansehen
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, href, color }) {
  const colors = {
    blue: 'from-blue-500/20 to-blue-600/20 hover:border-blue-500/50',
    green: 'from-green-500/20 to-green-600/20 hover:border-green-500/50',
    purple: 'from-purple-500/20 to-purple-600/20 hover:border-purple-500/50',
    orange: 'from-orange-500/20 to-orange-600/20 hover:border-orange-500/50',
  }

  return (
    <Link
      to={href}
      className={`bg-gradient-to-br ${colors[color]} rounded-xl p-5 border border-zinc-800 transition`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-3xl font-bold text-white">{value.toLocaleString()}</div>
      <div className="text-zinc-400 text-sm">{label}</div>
    </Link>
  )
}

function QuickAction({ to, icon, title, subtitle, color }) {
  const colors = {
    blue: 'bg-blue-500/20',
    green: 'bg-green-500/20',
    purple: 'bg-purple-500/20',
    orange: 'bg-orange-500/20',
  }

  return (
    <Link
      to={to}
      className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 hover:border-zinc-700 transition group"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${colors[color]} rounded-lg flex items-center justify-center text-xl`}>
          {icon}
        </div>
        <div>
          <div className="text-white font-medium text-sm group-hover:text-zinc-300 transition">{title}</div>
          <div className="text-zinc-500 text-xs">{subtitle}</div>
        </div>
      </div>
    </Link>
  )
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function getEventColor(color) {
  const colors = {
    blue: '#3b82f6',
    red: '#ef4444',
    green: '#22c55e',
    purple: '#a855f7',
    orange: '#f97316',
    yellow: '#eab308',
    pink: '#ec4899',
    cyan: '#06b6d4'
  }
  return colors[color] || colors.blue
}
