import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import api from '../lib/api'

export default function Settings() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [health, setHealth] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [healthData, subData, statsData] = await Promise.all([
        api.health().catch(() => null),
        api.request('/billing/subscription').catch(() => ({ plan: 'free', storage_limit: 5 * 1024 * 1024 * 1024 })),
        api.getStats().catch(() => ({ photos: 0, documents: 0, total_bytes: 0 }))
      ])
      setHealth(healthData)
      setSubscription(subData)
      setStats(statsData)
    } catch (err) {
      console.error('Failed to load settings data:', err)
    } finally {
      setLoading(false)
    }
  }

  function formatBytes(bytes) {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  async function handleLogout() {
    try {
      await api.logout()
    } finally {
      logout()
      navigate('/login')
    }
  }

  async function handleExport() {
    alert('Export wird vorbereitet... (In Entwicklung)')
  }

  async function handleDeleteAccount() {
    if (!confirm('Bist du sicher? Alle Daten werden unwiderruflich gelöscht!')) return
    if (!confirm('Wirklich? Das kann nicht rückgängig gemacht werden!')) return
    alert('Account-Löschung wird bearbeitet... (In Entwicklung)')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  const storagePercent = subscription?.storage_limit 
    ? Math.round((stats?.total_bytes || 0) / subscription.storage_limit * 100)
    : 0

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Einstellungen</h1>
        <p className="text-zinc-400">Verwalte deinen Vault</p>
      </div>

      {/* Subscription */}
      <Section title="Abo & Speicher" icon="💎">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">
                {subscription?.plan === 'free' ? 'Free' : subscription?.plan === 'pro' ? 'Pro' : 'Family'} Plan
              </div>
              <div className="text-zinc-500 text-sm">
                {subscription?.plan === 'free' ? '5 GB Speicher' : subscription?.plan === 'pro' ? '100 GB Speicher' : '500 GB Speicher'}
              </div>
            </div>
            {subscription?.plan === 'free' && (
              <button 
                onClick={() => navigate('/pricing')}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-400 transition"
              >
                Upgrade
              </button>
            )}
            {subscription?.plan !== 'free' && (
              <button 
                onClick={async () => {
                  try {
                    const { portal_url } = await api.request('/billing/portal', {
                      method: 'POST',
                      body: JSON.stringify({})
                    })
                    window.location.href = portal_url
                  } catch (err) {
                    alert('Konnte Abo-Portal nicht öffnen')
                  }
                }}
                className="bg-zinc-800 text-white px-4 py-2 rounded-lg hover:bg-zinc-700 transition"
              >
                Verwalten
              </button>
            )}
          </div>

          {/* Storage Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-400">Speicher verwendet</span>
              <span className="text-white">
                {formatBytes(stats?.total_bytes)} / {formatBytes(subscription?.storage_limit)}
              </span>
            </div>
            <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${storagePercent > 90 ? 'bg-red-500' : storagePercent > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(storagePercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-white">{stats?.photos || 0}</div>
              <div className="text-xs text-zinc-500">Fotos</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-white">{stats?.documents || 0}</div>
              <div className="text-xs text-zinc-500">Dokumente</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-white">{stats?.faces || 0}</div>
              <div className="text-xs text-zinc-500">Personen</div>
            </div>
          </div>
        </div>
      </Section>

      {/* Account */}
      <Section title="Account" icon="👤">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Email</label>
            <input
              type="email"
              value={localStorage.getItem('vault_user_email') || 'demo@example.com'}
              disabled
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-400"
            />
          </div>
        </div>
      </Section>

      {/* Security */}
      <Section title="Sicherheit" icon="🔐">
        <div className="space-y-4">
          <SettingRow
            title="Passwort ändern"
            description="Aktualisiere dein Vault-Passwort"
            action="Ändern"
            onClick={() => alert('Passwort ändern... (In Entwicklung)')}
          />
          <SettingRow
            title="Zwei-Faktor-Authentifizierung"
            description="Zusätzliche Sicherheitsebene"
            action="Aktivieren"
            onClick={() => alert('2FA Setup... (In Entwicklung)')}
          />
          <SettingRow
            title="Aktive Sitzungen"
            description="Eingeloggte Geräte verwalten"
            action="Anzeigen"
            onClick={() => alert('Sitzungen... (In Entwicklung)')}
          />
        </div>
      </Section>

      {/* Sync */}
      <Section title="Synchronisation" icon="🔄">
        <div className="space-y-4">
          <SettingRow
            title="Apple Kalender"
            description="Kalender-Events synchronisieren"
            action="Verbinden"
            onClick={() => alert('CalDAV Setup... (In Entwicklung)')}
          />
          <SettingRow
            title="iCloud Fotos"
            description="Fotos aus iCloud importieren"
            action="Verbinden"
            onClick={() => navigate('/import')}
          />
          <SettingRow
            title="Google Photos"
            description="Von Google Photos migrieren"
            action="Verbinden"
            comingSoon
          />
        </div>
      </Section>

      {/* Privacy */}
      <Section title="Datenschutz" icon="🛡️">
        <div className="space-y-4">
          <SettingRow
            title="Daten exportieren"
            description="Alle Vault-Daten herunterladen"
            action="Exportieren"
            onClick={handleExport}
          />
          <SettingRow
            title="AI-Training"
            description="Anonymes Muster-Lernen erlauben"
            action="Deaktiviert"
            disabled
          />
        </div>
      </Section>

      {/* System */}
      <Section title="System" icon="⚙️">
        <div className="space-y-4">
          {/* Health Status */}
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-medium">System Status</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                health?.status === 'healthy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {health?.status === 'healthy' ? 'Healthy' : 'Error'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Database</span>
                <span className={health?.database ? 'text-green-400' : 'text-red-400'}>
                  {health?.database ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Storage</span>
                <span className={health?.storage ? 'text-green-400' : 'text-red-400'}>
                  {health?.storage ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">AI Service</span>
                <span className={health?.ai ? 'text-green-400' : 'text-red-400'}>
                  {health?.ai ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Cache</span>
                <span className={health?.redis ? 'text-green-400' : 'text-red-400'}>
                  {health?.redis ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-sm text-zinc-500">
            Version 1.0.0 • Made in Stuttgart 🚗
          </div>
        </div>
      </Section>

      {/* Danger Zone */}
      <Section title="Gefahrenzone" icon="⚠️" danger>
        <div className="space-y-4">
          <SettingRow
            title="Abmelden"
            description="Von diesem Gerät abmelden"
            action="Abmelden"
            onClick={handleLogout}
          />
          <SettingRow
            title="Account löschen"
            description="Alle Daten unwiderruflich löschen"
            action="Löschen"
            danger
            onClick={handleDeleteAccount}
          />
        </div>
      </Section>
    </div>
  )
}

function Section({ title, icon, danger, children }) {
  return (
    <div className={`bg-zinc-900 rounded-2xl border p-6 ${danger ? 'border-red-500/30' : 'border-zinc-800'}`}>
      <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${danger ? 'text-red-400' : 'text-white'}`}>
        <span>{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  )
}

function SettingRow({ title, description, action, onClick, danger, disabled, comingSoon }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-white">{title}</div>
        <div className="text-zinc-500 text-sm">{description}</div>
      </div>
      {comingSoon ? (
        <span className="text-xs bg-zinc-800 text-zinc-500 px-3 py-1.5 rounded-lg">
          Bald
        </span>
      ) : (
        <button
          onClick={onClick}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg transition text-sm font-medium ${
            danger
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : disabled
              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              : 'bg-zinc-800 text-white hover:bg-zinc-700'
          }`}
        >
          {action}
        </button>
      )}
    </div>
  )
}
