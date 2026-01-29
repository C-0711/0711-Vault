import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import api from '../lib/api'
import { generateSalt, deriveKeys, generateMasterKey, encryptMasterKey, storeMasterKey } from '../lib/crypto'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1: form, 2: processing, 3: done
  const navigate = useNavigate()
  const { login } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    setStep(2)

    try {
      // 1. Generate salt
      const salt = generateSalt()

      // 2. Derive auth hash and encryption key from password
      const { authHash, encryptionKey } = await deriveKeys(password, salt)

      // 3. Generate random master key
      const masterKey = generateMasterKey()

      // 4. Encrypt master key with user's encryption key
      const encryptedMasterKey = await encryptMasterKey(masterKey, encryptionKey)

      // 5. Register with server (server never sees password or encryption key)
      await api.register(email, authHash, salt, encryptedMasterKey)

      // 6. Log in
      const result = await api.login(email, authHash)

      // 7. Store master key in session (for encryption/decryption)
      storeMasterKey(masterKey)

      // 8. Update auth context
      login(result.access_token, result.user_id)

      setStep(3)
      setTimeout(() => navigate('/'), 1500)
    } catch (err) {
      setError(err.message)
      setStep(1)
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
          {step === 1 && (
            <>
              <h2 className="text-2xl font-semibold text-white mb-6">Create Account</h2>

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

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-zinc-200 transition disabled:opacity-50"
                >
                  Create Account
                </button>
              </form>

              <div className="mt-6 text-center text-zinc-500">
                Already have an account?{' '}
                <Link to="/login" className="text-white hover:underline">
                  Sign in
                </Link>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
              <div className="text-white text-lg mb-2">Creating your vault...</div>
              <div className="text-zinc-500 text-sm">Generating encryption keys</div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-white text-lg mb-2">Vault created!</div>
              <div className="text-zinc-500 text-sm">Redirecting...</div>
            </div>
          )}
        </div>

        {/* Security note */}
        <div className="mt-6 text-center text-zinc-600 text-sm">
          🔒 Your password never leaves this device.<br />
          We use zero-knowledge encryption.
        </div>
      </div>
    </div>
  )
}
