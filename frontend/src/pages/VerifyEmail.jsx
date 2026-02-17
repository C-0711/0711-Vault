import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  
  const [status, setStatus] = useState('loading') // loading, success, error
  const [error, setError] = useState('')

  useEffect(() => {
    if (token) {
      verifyEmail()
    } else {
      setStatus('error')
      setError('Kein Verifizierungstoken gefunden')
    }
  }, [token])

  const verifyEmail = async () => {
    try {
      const res = await fetch(`${API_URL}/account/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      if (res.ok) {
        setStatus('success')
      } else {
        const data = await res.json()
        throw new Error(data.detail || 'Verifizierung fehlgeschlagen')
      }
    } catch (err) {
      setStatus('error')
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center font-bold text-white text-xl">
            07
          </div>
          <span className="text-2xl font-bold text-white">0711 Vault</span>
        </div>

        {status === 'loading' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">E-Mail wird verifiziert...</h1>
            <p className="text-zinc-400">Bitte warten</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">E-Mail bestätigt! 🎉</h1>
            <p className="text-zinc-400 mb-6">
              Deine E-Mail-Adresse wurde erfolgreich verifiziert.
            </p>
            <Link 
              to="/login"
              className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition"
            >
              Zum Login →
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Verifizierung fehlgeschlagen</h1>
            <p className="text-zinc-400 mb-6">{error}</p>
            <p className="text-sm text-zinc-500 mb-6">
              Der Link ist möglicherweise abgelaufen oder wurde bereits verwendet.
            </p>
            <Link 
              to="/login"
              className="inline-block px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition"
            >
              Zum Login
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
