import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { api } from '../lib/api'
import { Eye, EyeOff, Lock, Mail, LogIn } from 'lucide-react'
import { deriveKeys, decryptMasterKey, storeMasterKey } from '../lib/crypto'

const API_URL = import.meta.env.VITE_API_URL || ''
const O711I_ISSUER = import.meta.env.VITE_O711I_ISSUER || 'https://id.0711.io'
const O711I_CLIENT_ID = import.meta.env.VITE_O711I_CLIENT_ID || 'vaultclaw'

function generateState() {
  const array = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

async function generatePKCE() {
  const verifier = Array.from(crypto.getRandomValues(new Uint8Array(32)), b =>
    b.toString(16).padStart(2, '0')
  ).join('')
  const encoded = new TextEncoder().encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', encoded)
  const challenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return { verifier, challenge }
}

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Zero-knowledge flow: get salt, derive keys, login with auth hash
      const { salt } = await api.getSalt(email)
      const { authHash, encryptionKey } = await deriveKeys(password, salt)
      const result = await api.login(email, authHash)

      // Decrypt master key client-side
      const masterKey = await decryptMasterKey(result.encrypted_master_key, encryptionKey)
      storeMasterKey(masterKey)

      api.setToken(result.access_token)
      login(result.access_token, result.user_id)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Login fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuthLogin() {
    setOauthLoading(true)
    try {
      const state = generateState()
      sessionStorage.setItem('oauth_state', state)

      const { verifier, challenge } = await generatePKCE()
      sessionStorage.setItem('oauth_code_verifier', verifier)

      const redirectUri = `${window.location.origin}/auth/callback`
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: O711I_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: 'openid profile email',
        state,
        code_challenge: challenge,
        code_challenge_method: 'S256',
      })

      window.location.href = `${O711I_ISSUER}/oauth/authorize?${params}`
    } catch (err) {
      setError('OAuth-Anmeldung fehlgeschlagen')
      setOauthLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">0711 Vault</h1>
          <p className="text-zinc-400">Willkommen zurück</p>
        </div>

        {/* Login Form */}
        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* 0711-I OAuth — primary */}
          <button
            onClick={handleOAuthLogin}
            disabled={oauthLoading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {oauthLoading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Mit 0711 anmelden
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="px-4 bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition"
              >
                {showPasswordForm ? 'Ausblenden' : 'oder mit Vault-Passwort'}
              </button>
            </div>
          </div>

          {/* Password login — collapsed by default */}
          {showPasswordForm && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">E-Mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="email" id="email" name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">Vault-Passwort</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type={showPassword ? "text" : "password"} id="password" name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    placeholder="Dein Vault-Passwort"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-emerald-400 hover:text-emerald-300">
                  Passwort vergessen?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  'Anmelden'
                )}
              </button>
            </form>
          )}

          {/* Register Link */}
          <p className="mt-6 text-center text-zinc-400">
            Noch kein Konto?{' '}
            <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium">
              Registrieren
            </Link>
          </p>
        </div>

        {/* Security note */}
        <div className="mt-6 text-center text-zinc-600 text-sm">
          Dein Vault-Passwort verlässt niemals dieses Gerät.
        </div>
      </div>
    </div>
  )
}
