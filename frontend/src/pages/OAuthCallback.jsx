import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../App'
import { Loader2, XCircle } from 'lucide-react'
import { api } from '../lib/api'

export default function OAuthCallback() {
  const [error, setError] = useState('')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const errorParam = searchParams.get('error')

      if (errorParam) {
        setError(searchParams.get('error_description') || errorParam)
        return
      }

      if (!code) {
        setError('Kein Autorisierungscode erhalten')
        return
      }

      // Verify state matches what we stored
      const savedState = sessionStorage.getItem('oauth_state')
      if (state && savedState && state !== savedState) {
        setError('Ungültiger State-Parameter')
        return
      }
      sessionStorage.removeItem('oauth_state')

      // Get code verifier for PKCE
      const codeVerifier = sessionStorage.getItem('oauth_code_verifier')
      sessionStorage.removeItem('oauth_code_verifier')

      try {
        const redirectUri = `${window.location.origin}/auth/callback`
        const result = await api.oauthTokenExchange(code, redirectUri, codeVerifier)

        // Store OAuth login info for the unlock/setup step
        sessionStorage.setItem('oauth_result', JSON.stringify(result))

        // Set auth context (token is already set in api client)
        login(result.access_token, result.user_id)

        if (result.has_vault) {
          navigate('/unlock')
        } else {
          navigate('/setup-vault')
        }
      } catch (err) {
        setError(err.message || 'Anmeldung fehlgeschlagen')
      }
    }

    handleCallback()
  }, [searchParams, navigate, login])

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Anmeldung fehlgeschlagen</h2>
          <p className="text-zinc-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
          >
            Zurück zum Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="text-center">
        <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Anmeldung wird verarbeitet...</h2>
        <p className="text-zinc-400">Bitte warten</p>
      </div>
    </div>
  )
}
