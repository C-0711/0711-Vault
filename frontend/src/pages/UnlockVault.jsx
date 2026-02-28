import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import api from '../lib/api'
import { deriveKeys, decryptMasterKey, storeMasterKey } from '../lib/crypto'

export default function UnlockVault() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [vaultInfo, setVaultInfo] = useState(null)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    // Try to get vault info from OAuth result or fetch it
    const oauthResult = sessionStorage.getItem('oauth_result')
    if (oauthResult) {
      const parsed = JSON.parse(oauthResult)
      if (parsed.salt && parsed.encrypted_master_key) {
        setVaultInfo({ salt: parsed.salt, encrypted_master_key: parsed.encrypted_master_key, email: parsed.email })
        return
      }
    }

    // Fetch vault info from API
    api.getVaultInfo().then(info => {
      if (!info.has_vault) {
        navigate('/setup-vault')
        return
      }
      setVaultInfo(info)
    }).catch(() => {
      setError('Failed to load vault info')
    })
  }, [user, navigate])

  async function handleUnlock(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { authHash, encryptionKey } = await deriveKeys(password, vaultInfo.salt)
      const masterKey = await decryptMasterKey(vaultInfo.encrypted_master_key, encryptionKey)
      storeMasterKey(masterKey)
      sessionStorage.removeItem('oauth_result')
      navigate('/')
    } catch (err) {
      setError('Wrong vault password. Please try again.')
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

  if (!vaultInfo) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-white mb-2">0711</div>
          <div className="text-zinc-500">Unlock Your Vault</div>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-zinc-400 text-sm">
              Signed in as <span className="text-white">{vaultInfo.email}</span>
            </p>
            <p className="text-zinc-500 text-xs mt-1">
              Enter your vault password to decrypt your data
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Vault Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                placeholder="Enter your vault password"
                autoFocus
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
                'Unlock Vault'
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
          Your vault password never leaves this device.
        </div>
      </div>
    </div>
  )
}
