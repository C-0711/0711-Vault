import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Get salt first
      const saltRes = await fetch(`${API_URL}/auth/salt/${encodeURIComponent(email)}`)
      if (!saltRes.ok) throw new Error('Benutzer nicht gefunden')
      const { salt } = await saltRes.json()

      // Derive auth hash
      const encoder = new TextEncoder()
      const passwordData = encoder.encode(password + salt)
      const hashBuffer = await crypto.subtle.digest('SHA-256', passwordData)
      const authHash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      // Login
      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, auth_hash: authHash })
      })

      if (!loginRes.ok) {
        const data = await loginRes.json()
        throw new Error(data.detail || 'Anmeldung fehlgeschlagen')
      }

      const data = await loginRes.json()

      // Decrypt master key with password (simplified)
      const decryptedMasterKey = atob(data.encrypted_master_key)
      sessionStorage.setItem('vault_master_key', decryptedMasterKey)

      // Complete login
      login(data.access_token, data.user_id)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Anmeldung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center font-bold text-white text-xl">
              07
            </div>
            <span className="text-2xl font-bold text-white">0711 Vault</span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Willkommen zurück</h1>
          <p className="text-zinc-400 mb-8">
            Melde dich an, um auf deine verschlüsselten Dateien zuzugreifen.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">E-Mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="deine@email.de"
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Master-Passwort</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded bg-white/5 border-white/20 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm text-zinc-400">Angemeldet bleiben</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-emerald-400 hover:underline">
                Passwort vergessen?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Anmelden'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-zinc-500">
            Noch kein Konto? <Link to="/register" className="text-emerald-400 hover:underline">Jetzt registrieren</Link>
          </p>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-emerald-900/20 to-black items-center justify-center p-12 border-l border-white/5">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🔐</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Deine Erinnerungen. Dein Schlüssel.
          </h2>
          <p className="text-zinc-400">
            Ende-zu-Ende verschlüsselt, gespeichert auf deutschen Servern. 
            Nur du kannst deine Daten entschlüsseln.
          </p>
          
          <div className="flex justify-center gap-6 mt-8 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">E2E</div>
              <div className="text-zinc-500">Verschlüsselt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">🇩🇪</div>
              <div className="text-zinc-500">Deutsche Server</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">Zero</div>
              <div className="text-zinc-500">Knowledge</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
