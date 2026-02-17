import { useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Password strength
  const getPasswordStrength = (pwd) => {
    let score = 0
    if (pwd.length >= 8) score++
    if (pwd.length >= 12) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    return score
  }

  const passwordStrength = getPasswordStrength(password)
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-400', 'bg-emerald-500']

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      return
    }

    if (passwordStrength < 2) {
      setError('Bitte wähle ein stärkeres Passwort')
      return
    }

    setLoading(true)

    try {
      // Generate new salt
      const salt = crypto.getRandomValues(new Uint8Array(32))
      const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')

      // Derive auth hash
      const encoder = new TextEncoder()
      const passwordData = encoder.encode(password + saltHex)
      const hashBuffer = await crypto.subtle.digest('SHA-256', passwordData)
      const authHash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      // Generate new master key
      const masterKey = crypto.getRandomValues(new Uint8Array(32))
      const masterKeyHex = Array.from(masterKey).map(b => b.toString(16).padStart(2, '0')).join('')
      const encryptedMasterKey = btoa(masterKeyHex)

      const res = await fetch(`${API_URL}/account/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          new_password_hash: authHash,
          new_salt: saltHex,
          new_encrypted_master_key: encryptedMasterKey
        })
      })

      if (res.ok) {
        setSuccess(true)
      } else {
        const data = await res.json()
        throw new Error(data.detail || 'Reset fehlgeschlagen')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Ungültiger Link</h1>
          <p className="text-zinc-400 mb-6">
            Dieser Reset-Link ist ungültig oder abgelaufen.
          </p>
          <Link 
            to="/forgot-password"
            className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition"
          >
            Neuen Link anfordern
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Passwort geändert!</h1>
          <p className="text-zinc-400 mb-6">
            Du kannst dich jetzt mit deinem neuen Passwort anmelden.
          </p>
          <Link 
            to="/login"
            className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition"
          >
            Zum Login →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center font-bold text-white text-xl">
            07
          </div>
          <span className="text-2xl font-bold text-white">0711 Vault</span>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Neues Passwort setzen</h1>
        <p className="text-zinc-400 mb-8">
          Wähle ein starkes Passwort für deinen Vault.
        </p>

        {/* Warning */}
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-400 font-semibold">Wichtig</p>
              <p className="text-sm text-zinc-400">
                Beim Passwort-Reset wird dein Master-Key neu generiert. 
                Du benötigst deinen Recovery Key, um auf bestehende Daten zuzugreifen.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Neues Passwort</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password strength */}
            {password && (
              <div className="mt-3">
                <div className="flex gap-1 mb-2">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition ${
                        i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-zinc-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Passwort bestätigen</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••••••"
              className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-zinc-500 focus:outline-none transition ${
                confirmPassword && password !== confirmPassword
                  ? 'border-red-500'
                  : confirmPassword && password === confirmPassword
                  ? 'border-emerald-500'
                  : 'border-white/10 focus:border-emerald-500'
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Passwort ändern'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
