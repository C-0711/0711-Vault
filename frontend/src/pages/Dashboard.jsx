import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [processing, setProcessing] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    try {
      const [statsData, processingData] = await Promise.all([
        api.getStats(),
        api.getProcessingStatus(),
      ])
      setStats(statsData)
      setProcessing(processingData)
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Your Vault</h1>
        <p className="text-zinc-400 mt-1">Everything you own, secured.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Photos"
          value={stats?.photos || 0}
          icon="📷"
          href="/photos"
        />
        <StatCard
          label="Documents"
          value={stats?.documents || 0}
          icon="📄"
          href="/documents"
        />
        <StatCard
          label="People"
          value={stats?.face_clusters || 0}
          icon="👤"
          href="/photos?view=faces"
        />
        <StatCard
          label="Places"
          value={stats?.place_clusters || 0}
          icon="📍"
          href="/photos?view=places"
        />
      </div>

      {/* Storage */}
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Storage</h2>
          <span className="text-zinc-400">{stats?.total_gb || 0} GB used</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full"
            style={{ width: `${Math.min((stats?.total_gb || 0) / 10 * 100, 100)}%` }}
          />
        </div>
        <div className="mt-2 text-sm text-zinc-500">10 GB free tier</div>
      </div>

      {/* Processing Status */}
      {(processing?.pending > 0 || processing?.processing > 0) && (
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <h2 className="text-lg font-semibold text-white mb-4">Processing</h2>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <div>
              <div className="text-white">
                {processing?.processing || 0} items being processed
              </div>
              <div className="text-zinc-500 text-sm">
                {processing?.pending || 0} in queue
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/photos"
          className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 hover:border-zinc-700 transition group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-2xl">
              📷
            </div>
            <div>
              <div className="text-white font-medium group-hover:text-blue-400 transition">
                Upload Photos
              </div>
              <div className="text-zinc-500 text-sm">
                Import from your device
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/documents"
          className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 hover:border-zinc-700 transition group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-2xl">
              📄
            </div>
            <div>
              <div className="text-white font-medium group-hover:text-green-400 transition">
                Upload Documents
              </div>
              <div className="text-zinc-500 text-sm">
                Store securely
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Face Training Prompt */}
      {stats?.face_clusters === 0 && stats?.photos > 0 && (
        <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl p-6 border border-purple-500/30">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🧠</div>
            <div className="flex-1">
              <div className="text-white font-medium">Train Your AI</div>
              <div className="text-zinc-400 text-sm">
                Help your vault learn who's in your photos
              </div>
            </div>
            <Link
              to="/photos?view=train"
              className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-zinc-200 transition"
            >
              Start Training
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, href }) {
  return (
    <Link
      to={href}
      className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 hover:border-zinc-700 transition"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-3xl font-bold text-white">{value.toLocaleString()}</div>
      <div className="text-zinc-500">{label}</div>
    </Link>
  )
}
