import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import api from '../lib/api'
import {
  generateSalt,
  generateMasterKey,
  deriveKeys,
  encryptMasterKey,
  storeMasterKey,
} from '../lib/crypto'

export default function SetupVault() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  async function handleSetup(e) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      // 1. Generate salt and master key
      const salt = generateSalt()
      const masterKey = generateMasterKey()

      // 2. Derive auth hash and encryption key from password
      const { authHash, encryptionKey } = await deriveKeys(password, salt)

      // 3. Encrypt master key with encryption key
      const encryptedMasterKey = await encryptMasterKey(masterKey, encryptionKey)

      // 4. Send to server
      await api.setupVault(authHash, salt, encryptedMasterKey)

      // 5. Store master key in session
      storeMasterKey(masterKey)

      // 6. Clean up and navigate
      sessionStorage.removeItem('oauth_result')
      navigate('/')
    } catch (err) {
      setError(err.message || 'Vault setup failed')
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('oauth_result')
    api.logout().catch(() => {})
    logout()
    navigate('/login')
  }

  if (!user) {
    navigate('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-white mb-2">0711</div>
          <div className="text-zinc-500">Set Up Your Vault</div>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Create a Vault Password</h2>
            <p className="text-zinc-400 text-sm">
              This password encrypts your data. It is separate from your
              0711 account password and never leaves this device.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Vault Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                placeholder="At least 8 characters"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                placeholder="Repeat your vault password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-zinc-200 transition disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                'Create Vault'
              )}
            </button>
          </form>

          <button
            onClick={handleLogout}
            className="w-full mt-4 text-zinc-500 hover:text-zinc-300 text-sm transition"
          >
            Sign out
          </button>
        </div>

        <div className="mt-6 text-center text-zinc-600 text-sm">
          If you lose this password, your encrypted data cannot be recovered.
        </div>
      </div>
    </div>
  )
}
