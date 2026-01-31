import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import api from '../lib/api'
import { clearMasterKey } from '../lib/crypto'

export default function Layout() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()

  async function handleSearch(e) {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const results = await api.semanticSearch(searchQuery, 20)
      setSearchResults(results)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setSearching(false)
    }
  }

  function clearSearch() {
    setSearchQuery('')
    setSearchResults(null)
  }

  function handleLogout() {
    api.logout()
    clearMasterKey()
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="text-2xl font-bold text-white">
            0711
          </NavLink>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-8">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search photos, people, places..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 pl-10 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
              <svg
                className="absolute left-3 top-2.5 w-5 h-5 text-zinc-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searching && (
                <div className="absolute right-3 top-2.5 w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
              )}
            </div>
          </form>

          {/* User Menu */}
          <button
            onClick={handleLogout}
            className="text-zinc-400 hover:text-white transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
        {/* Sidebar */}
        <nav className="w-48 flex-shrink-0">
          <div className="space-y-1">
            <SidebarLink to="/" icon="🏠">
              Home
            </SidebarLink>
            <SidebarLink to="/assistant" icon="🧠">
              AI Assistant
            </SidebarLink>
            <SidebarLink to="/photos" icon="📷">
              Photos
            </SidebarLink>
            <SidebarLink to="/documents" icon="📄">
              Documents
            </SidebarLink>
            <SidebarLink to="/messages" icon="💬">
              Messages
            </SidebarLink>
            <SidebarLink to="/calendar" icon="📅">
              Kalender
            </SidebarLink>
            <SidebarLink to="/import" icon="📥">
              Import
            </SidebarLink>
            <SidebarLink to="/pricing" icon="💎">
              Upgrade
            </SidebarLink>
            <SidebarLink to="/settings" icon="⚙️">
              Settings
            </SidebarLink>
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {/* Search Results Overlay */}
          {searchResults && (
            <div className="mb-8 bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  Results for "{searchResults.query}"
                </h2>
                <button
                  onClick={clearSearch}
                  className="text-zinc-400 hover:text-white"
                >
                  Clear
                </button>
              </div>
              
              {searchResults.results?.length > 0 ? (
                <div className="grid grid-cols-4 gap-4">
                  {searchResults.results.map((result) => (
                    <div
                      key={result.id}
                      className="aspect-square bg-zinc-800 rounded-lg flex items-center justify-center"
                    >
                      <span className="text-2xl">
                        {result.item_type === 'photo' ? '🖼️' : '📄'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-zinc-500 text-center py-8">
                  No results found
                </div>
              )}
            </div>
          )}

          <Outlet />
        </main>
      </div>
    </div>
  )
}

function SidebarLink({ to, icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg transition ${
          isActive
            ? 'bg-zinc-800 text-white'
            : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
        }`
      }
    >
      <span>{icon}</span>
      <span>{children}</span>
    </NavLink>
  )
}
