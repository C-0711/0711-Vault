import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import api from '../lib/api'
import { deriveKeys, decryptMasterKey, storeMasterKey } from '../lib/crypto'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 1. Get salt from server
      const { salt } = await api.getSalt(email)

      // 2. Derive auth hash and encryption key from password
      const { authHash, encryptionKey } = await deriveKeys(password, salt)

      // 3. Login with auth hash
      const result = await api.login(email, authHash)

      // 4. Decrypt master key
      const masterKey = await decryptMasterKey(result.encrypted_master_key, encryptionKey)

      // 5. Store master key in session
      storeMasterKey(masterKey)

      // 6. Update auth context
      login(result.access_token, result.user_id)

      navigate('/')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-white mb-2">0711</div>
          <div className="text-zinc-500">Your Personal Vault</div>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
          <h2 className="text-2xl font-semibold text-white mb-6">Welcome back</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
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
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-zinc-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-white hover:underline">
              Create one
            </Link>
          </div>
        </div>

        {/* Security note */}
        <div className="mt-6 text-center text-zinc-600 text-sm">
          🔒 Your password never leaves this device.
        </div>
      </div>
    </div>
  )
}
