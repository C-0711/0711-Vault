/**
 * Account Setup Wizard - Registration, Login, Server Config
 */

import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Server, Cloud, Fingerprint, Shield, Key } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';

// Crypto utilities for zero-knowledge auth
async function deriveAuthHash(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  
  return btoa(String.fromCharCode(...new Uint8Array(derivedBits)));
}

function generateSalt(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

function generateMasterKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

// Setup wrapper with back navigation
function SetupLayout({ children, title, onBack }: { children: React.ReactNode; title: string; onBack?: () => void }) {
  const navigate = useNavigate();
  
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="h-12 flex items-center px-4 app-drag">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-8">{title}</h1>
        {children}
      </div>
    </div>
  );
}

// Server Configuration
function ServerConfig() {
  const navigate = useNavigate();
  const [serverUrl, setServerUrl] = useState('https://api-vault.0711.io');
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  
  const testConnection = async () => {
    setTesting(true);
    setError('');
    
    try {
      api.setBaseUrl(serverUrl);
      const response = await api.get('/health');
      
      if (response.data.status === 'healthy' || response.data.status === 'degraded') {
        localStorage.setItem('api_url', serverUrl);
        navigate('/setup/login');
      } else {
        setError('Server is not healthy');
      }
    } catch (err) {
      setError('Could not connect to server');
    } finally {
      setTesting(false);
    }
  };
  
  return (
    <SetupLayout title="Connect to Server" onBack={() => navigate('/')}>
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-4">
          <button
            onClick={() => {
              setServerUrl('https://api-vault.0711.io');
              api.setBaseUrl('https://api-vault.0711.io');
              navigate('/setup/login');
            }}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-purple-600 hover:bg-purple-700 transition-colors"
          >
            <Cloud className="w-6 h-6" />
            <div className="text-left">
              <div className="font-semibold">0711 Cloud</div>
              <div className="text-sm text-purple-200">api-vault.0711.io (recommended)</div>
            </div>
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-800 text-slate-400">or self-hosted</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Server URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="https://your-server.com"
                className="flex-1 px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 focus:border-purple-500 focus:outline-none"
              />
              <button
                onClick={testConnection}
                disabled={testing}
                className="px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
              >
                {testing ? '...' : 'Test'}
              </button>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
        </div>
      </div>
    </SetupLayout>
  );
}

// Registration Flow
function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const passwordStrength = () => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };
  
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  
  const handleCreateAccount = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (passwordStrength() < 2) {
      setError('Password is too weak');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const salt = generateSalt();
      const authHash = await deriveAuthHash(password, salt);
      const masterKey = generateMasterKey();
      const encryptedMasterKey = masterKey; // TODO: Actually encrypt with password-derived key
      
      // Generate recovery phrase (simplified - use BIP39 in production)
      const words = ['apple', 'banana', 'cherry', 'dolphin', 'eagle', 'forest', 'garden', 'harbor', 'island', 'jungle', 'kitchen', 'lemon'];
      const phrase = Array.from({ length: 12 }, () => words[Math.floor(Math.random() * words.length)]).join(' ');
      setRecoveryPhrase(phrase);
      
      await register(email, authHash, salt, encryptedMasterKey);
      setStep(3); // Show recovery phrase
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };
  
  if (step === 1) {
    return (
      <SetupLayout title="Create Account" onBack={() => navigate('/')}>
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 focus:border-purple-500 focus:outline-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full px-4 py-3 pr-12 rounded-lg bg-slate-700 border border-slate-600 focus:border-purple-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password strength meter */}
              {password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded ${i < passwordStrength() ? strengthColors[passwordStrength() - 1] : 'bg-slate-600'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">{strengthLabels[passwordStrength() - 1] || 'Too weak'}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 focus:border-purple-500 focus:outline-none"
              />
            </div>
            
            {error && <p className="text-red-400 text-sm">{error}</p>}
            
            <button
              onClick={handleCreateAccount}
              disabled={loading || !email || !password || !confirmPassword}
              className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 font-semibold"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
          
          <p className="text-center text-sm text-slate-400">
            Already have an account?{' '}
            <button onClick={() => navigate('/setup/login')} className="text-purple-400 hover:underline">
              Sign in
            </button>
          </p>
        </div>
      </SetupLayout>
    );
  }
  
  // Recovery phrase step
  return (
    <SetupLayout title="Save Your Recovery Phrase" onBack={() => {}}>
      <div className="w-full max-w-md space-y-6">
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <div className="flex items-start gap-3">
            <Key className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-500">Important!</p>
              <p className="text-sm text-slate-300">Write down these words and keep them safe. This is the only way to recover your account if you forget your password.</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-lg bg-slate-700 font-mono text-lg text-center">
          {recoveryPhrase}
        </div>
        
        <button
          onClick={() => navigate('/')}
          className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 font-semibold"
        >
          I've saved my recovery phrase
        </button>
      </div>
    </SetupLayout>
  );
}

// Login Flow
function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [canUseTouchId, setCanUseTouchId] = useState(false);
  
  React.useEffect(() => {
    window.electronAPI?.canUseTouchId().then(setCanUseTouchId);
  }, []);
  
  const handleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Get salt from server
      const saltResponse = await api.get(`/auth/salt/${encodeURIComponent(email)}`);
      const salt = saltResponse.data.salt;
      
      // Derive auth hash
      const authHash = await deriveAuthHash(password, salt);
      
      await login(email, authHash);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTouchId = async () => {
    try {
      const success = await window.electronAPI?.authenticateWithTouchId('Unlock 0711 Vault');
      if (success) {
        // Get saved credentials from keychain
        const savedEmail = localStorage.getItem('saved_email');
        const savedAuthHash = await window.electronAPI?.getSecureValue('saved_auth_hash');
        
        if (savedEmail && savedAuthHash) {
          await login(savedEmail, savedAuthHash);
          navigate('/');
        }
      }
    } catch (err) {
      setError('Touch ID failed');
    }
  };
  
  return (
    <SetupLayout title="Sign In" onBack={() => navigate('/')}>
      <div className="w-full max-w-md space-y-6">
        {canUseTouchId && (
          <button
            onClick={handleTouchId}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-slate-700 hover:bg-slate-600"
          >
            <Fingerprint className="w-6 h-6" />
            <span>Sign in with Touch ID</span>
          </button>
        )}
        
        {canUseTouchId && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-800 text-slate-400">or with password</span>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 focus:border-purple-500 focus:outline-none"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full px-4 py-3 pr-12 rounded-lg bg-slate-700 border border-slate-600 focus:border-purple-500 focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          {error && <p className="text-red-400 text-sm">{error}</p>}
          
          <button
            onClick={handleLogin}
            disabled={loading || !email || !password}
            className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 font-semibold"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
        
        <p className="text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <button onClick={() => navigate('/setup/register')} className="text-purple-400 hover:underline">
            Create one
          </button>
        </p>
      </div>
    </SetupLayout>
  );
}

// Main Setup Router
export default function Setup() {
  return (
    <Routes>
      <Route path="register" element={<Register />} />
      <Route path="login" element={<Login />} />
      <Route path="self-hosted" element={<ServerConfig />} />
      <Route path="*" element={<Register />} />
    </Routes>
  );
}
