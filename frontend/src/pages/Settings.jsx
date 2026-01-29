import { useState, useEffect } from 'react'
import api from '../lib/api'

export default function Settings() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHealth()
  }, [])

  async function loadHealth() {
    try {
      const data = await api.health()
      setHealth(data)
    } catch (err) {
      console.error('Health check failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-zinc-400">Manage your vault</p>
      </div>

      {/* Account */}
      <Section title="Account">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Email</label>
            <input
              type="email"
              value={localStorage.getItem('vault_user_email') || ''}
              disabled
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-400"
            />
          </div>
          <button className="text-red-400 hover:text-red-300 transition">
            Delete Account
          </button>
        </div>
      </Section>

      {/* Security */}
      <Section title="Security">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white">Two-Factor Authentication</div>
              <div className="text-zinc-500 text-sm">Add an extra layer of security</div>
            </div>
            <button className="bg-zinc-800 text-white px-4 py-2 rounded-lg hover:bg-zinc-700 transition">
              Enable
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white">Change Password</div>
              <div className="text-zinc-500 text-sm">Update your vault password</div>
            </div>
            <button className="bg-zinc-800 text-white px-4 py-2 rounded-lg hover:bg-zinc-700 transition">
              Change
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-white">Active Sessions</div>
              <div className="text-zinc-500 text-sm">Manage your logged in devices</div>
            </div>
            <button className="bg-zinc-800 text-white px-4 py-2 rounded-lg hover:bg-zinc-700 transition">
              View
            </button>
          </div>
        </div>
      </Section>

      {/* Privacy */}
      <Section title="Privacy">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white">Export Data</div>
              <div className="text-zinc-500 text-sm">Download all your vault data</div>
            </div>
            <button className="bg-zinc-800 text-white px-4 py-2 rounded-lg hover:bg-zinc-700 transition">
              Export
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-white">AI Training</div>
              <div className="text-zinc-500 text-sm">Allow anonymous pattern learning</div>
            </div>
            <Toggle defaultChecked={false} />
          </div>
        </div>
      </Section>

      {/* System Status */}
      <Section title="System Status">
        {loading ? (
          <div className="flex items-center gap-2 text-zinc-400">
            <div className="w-4 h-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
            Checking...
          </div>
        ) : health ? (
          <div className="space-y-3">
            <StatusItem
              label="API"
              status={health.status}
            />
            <StatusItem
              label="Database"
              status={health.services?.postgres}
            />
            <StatusItem
              label="Cache"
              status={health.services?.redis}
            />
            <StatusItem
              label="AI"
              status={health.services?.ollama}
            />
          </div>
        ) : (
          <div className="text-red-400">Failed to load status</div>
        )}
      </Section>

      {/* About */}
      <Section title="About">
        <div className="space-y-2 text-zinc-400">
          <div>0711 Vault v1.0.0</div>
          <div>Your data. Your AI. Your control.</div>
          <div className="pt-4">
            <a
              href="https://0711.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              Website
            </a>
            {' • '}
            <a
              href="https://github.com/0711io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              GitHub
            </a>
            {' • '}
            <a
              href="https://docs.0711.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              Docs
            </a>
          </div>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
      <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
      {children}
    </div>
  )
}

function StatusItem({ label, status }) {
  const isHealthy = status === 'healthy'
  const isUnknown = status === 'unknown' || status === 'unavailable'
  
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-400">{label}</span>
      <span className={`flex items-center gap-2 ${
        isHealthy ? 'text-green-400' : isUnknown ? 'text-yellow-400' : 'text-red-400'
      }`}>
        <span className={`w-2 h-2 rounded-full ${
          isHealthy ? 'bg-green-400' : isUnknown ? 'bg-yellow-400' : 'bg-red-400'
        }`} />
        {status || 'unknown'}
      </span>
    </div>
  )
}

function Toggle({ defaultChecked = false }) {
  const [checked, setChecked] = useState(defaultChecked)
  
  return (
    <button
      onClick={() => setChecked(!checked)}
      className={`w-12 h-6 rounded-full transition ${
        checked ? 'bg-blue-500' : 'bg-zinc-700'
      }`}
    >
      <div
        className={`w-5 h-5 bg-white rounded-full transition transform ${
          checked ? 'translate-x-6' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}
