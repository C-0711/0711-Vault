import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../App'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function OAuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const [status, setStatus] = useState('processing')
  const [error, setError] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    const refresh = searchParams.get('refresh')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setStatus('error')
      setError(errorParam)
      return
    }

    if (token && refresh) {
      // Store tokens and redirect
      localStorage.setItem('vault_token', token)
      localStorage.setItem('vault_refresh_token', refresh)
      
      // Decode token to get user_id
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        login(token, payload.user_id)
        setStatus('success')
        setTimeout(() => navigate('/'), 1500)
      } catch (e) {
        setStatus('error')
        setError('Token ungültig')
      }
    } else {
      setStatus('error')
      setError('Keine Anmeldedaten erhalten')
    }
  }, [searchParams, login, navigate])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Anmeldung wird verarbeitet...</h2>
            <p className="text-zinc-400">Bitte warten</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Erfolgreich angemeldet!</h2>
            <p className="text-zinc-400">Du wirst weitergeleitet...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Anmeldung fehlgeschlagen</h2>
            <p className="text-zinc-400 mb-4">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
            >
              Zurück zum Login
            </button>
          </>
        )}
      </div>
    </div>
  )
}
