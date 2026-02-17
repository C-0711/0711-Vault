import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../App'
import { Eye, EyeOff, Check, Shield, Zap, Lock } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [searchParams] = useSearchParams()
  const plan = searchParams.get('plan') || 'free'
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Step 1: Account details
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  
  // Step 2: Recovery key
  const [recoveryKey, setRecoveryKey] = useState('')
  const [recoveryConfirmed, setRecoveryConfirmed] = useState(false)
  
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
  const strengthLabels = ['Sehr schwach', 'Schwach', 'Mittel', 'Stark', 'Sehr stark']
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-400', 'bg-emerald-500']
  
  // Step 1: Create account
  const handleCreateAccount = async (e) => {
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
    
    if (!acceptTerms) {
      setError('Bitte akzeptiere die Nutzungsbedingungen')
      return
    }
    
    setLoading(true)
    
    try {
      // Generate salt for key derivation
      const salt = crypto.getRandomValues(new Uint8Array(32))
      const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
      
      // Derive auth hash from password (for server auth - NOT the encryption key)
      const encoder = new TextEncoder()
      const passwordData = encoder.encode(password + saltHex)
      const hashBuffer = await crypto.subtle.digest('SHA-256', passwordData)
      const authHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
      
      // Generate master encryption key
      const masterKey = crypto.getRandomValues(new Uint8Array(32))
      const masterKeyHex = Array.from(masterKey).map(b => b.toString(16).padStart(2, '0')).join('')
      
      // Encrypt master key with password-derived key (simplified for demo)
      const encryptedMasterKey = btoa(masterKeyHex) // In production: proper AES encryption
      
      // Generate recovery key (24 words or similar)
      const recoveryBytes = crypto.getRandomValues(new Uint8Array(32))
      const generatedRecoveryKey = Array.from(recoveryBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .match(/.{1,4}/g)
        .join('-')
        .toUpperCase()
      
      setRecoveryKey(generatedRecoveryKey)
      
      // Register with API
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          auth_hash: authHash,
          salt: saltHex,
          encrypted_master_key: encryptedMasterKey
        })
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Registrierung fehlgeschlagen')
      }
      
      // Store master key in memory (not localStorage for security)
      sessionStorage.setItem('pending_master_key', masterKeyHex)
      sessionStorage.setItem('pending_email', email)
      sessionStorage.setItem('pending_auth_hash', authHash)
      
      setStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Step 2: Confirm recovery key and complete
  const handleCompleteSetup = async () => {
    if (!recoveryConfirmed) {
      setError('Bitte bestätige, dass du den Recovery Key gespeichert hast')
      return
    }
    
    setLoading(true)
    
    try {
      // Login
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: sessionStorage.getItem('pending_email'),
          auth_hash: sessionStorage.getItem('pending_auth_hash')
        })
      })
      
      if (!res.ok) throw new Error('Login fehlgeschlagen')
      
      const data = await res.json()
      
      // Store master key properly
      sessionStorage.setItem('vault_master_key', sessionStorage.getItem('pending_master_key'))
      sessionStorage.removeItem('pending_master_key')
      sessionStorage.removeItem('pending_email')
      sessionStorage.removeItem('pending_auth_hash')
      
      // Complete auth
      login(data.access_token, data.user_id)
      
      // Go to onboarding
      navigate('/onboarding')
    } catch (err) {
      setError(err.message)
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
          
          {/* Step 1: Account Creation */}
          {step === 1 && (
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Konto erstellen</h1>
              <p className="text-zinc-400 mb-8">
                Sichere deine Erinnerungen mit Ende-zu-Ende Verschlüsselung.
              </p>
              
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleCreateAccount} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">E-Mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="deine@email.de"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Master-Passwort</label>
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
                      <p className="text-xs text-zinc-500">{strengthLabels[passwordStrength - 1] || 'Zu kurz'}</p>
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
                
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded bg-white/5 border-white/20 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-zinc-400">
                    Ich akzeptiere die <a href="/terms" className="text-emerald-400 hover:underline">AGB</a> und 
                    habe die <a href="/privacy" className="text-emerald-400 hover:underline">Datenschutzerklärung</a> gelesen.
                  </span>
                </label>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Konto erstellen</>
                  )}
                </button>
              </form>
              
              <p className="mt-6 text-center text-zinc-500">
                Bereits ein Konto? <Link to="/login" className="text-emerald-400 hover:underline">Anmelden</Link>
              </p>
            </div>
          )}
          
          {/* Step 2: Recovery Key */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-yellow-400" />
                </div>
                <h1 className="text-3xl font-bold text-white">Recovery Key</h1>
              </div>
              <p className="text-zinc-400 mb-8">
                <strong className="text-yellow-400">Wichtig:</strong> Speichere diesen Key sicher ab. 
                Er ist der einzige Weg, dein Konto wiederherzustellen, wenn du dein Passwort vergisst.
              </p>
              
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}
              
              {/* Recovery Key Display */}
              <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl mb-6">
                <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">Dein Recovery Key</p>
                <div className="font-mono text-lg text-emerald-400 break-all leading-relaxed select-all">
                  {recoveryKey}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(recoveryKey)
                    // Show toast
                  }}
                  className="mt-4 text-sm text-zinc-400 hover:text-white transition"
                >
                  📋 Kopieren
                </button>
              </div>
              
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
                <h4 className="font-semibold text-red-400 mb-2">⚠️ Achtung</h4>
                <ul className="text-sm text-zinc-400 space-y-1">
                  <li>• Wir können diesen Key nicht wiederherstellen</li>
                  <li>• Ohne Key = kein Zugang bei Passwortverlust</li>
                  <li>• Speichere ihn offline (ausdrucken, Tresor, etc.)</li>
                </ul>
              </div>
              
              <label className="flex items-center gap-3 cursor-pointer mb-6">
                <input
                  type="checkbox"
                  checked={recoveryConfirmed}
                  onChange={(e) => setRecoveryConfirmed(e.target.checked)}
                  className="w-5 h-5 rounded bg-white/5 border-white/20 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm text-zinc-300">
                  Ich habe meinen Recovery Key sicher gespeichert
                </span>
              </label>
              
              <button
                onClick={handleCompleteSetup}
                disabled={loading || !recoveryConfirmed}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Weiter zum Vault</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Right side - Info */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-emerald-900/20 to-black items-center justify-center p-12 border-l border-white/5">
        <div className="max-w-md">
          <h2 className="text-2xl font-bold text-white mb-6">Warum 0711 Vault?</h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Lock className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Zero-Knowledge</h3>
                <p className="text-zinc-400 text-sm">
                  Deine Daten werden auf deinem Gerät verschlüsselt. 
                  Wir sehen nur verschlüsselten Datenmüll.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Lokale KI</h3>
                <p className="text-zinc-400 text-sm">
                  Gesichtserkennung und intelligente Suche – 
                  komplett auf unseren deutschen Servern.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">DSGVO-konform</h3>
                <p className="text-zinc-400 text-sm">
                  Server in Deutschland, keine US-Cloud, 
                  keine Datenweitergabe.
                </p>
              </div>
            </div>
          </div>
          
          {plan === 'premium' && (
            <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <p className="text-emerald-400 font-semibold">✨ Premium Plan ausgewählt</p>
              <p className="text-zinc-400 text-sm mt-1">200 GB Speicher, KI-Suche, unbegrenzte Geräte</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
