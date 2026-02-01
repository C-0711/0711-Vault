/**
 * Welcome Screen - First launch experience
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Cloud, HardDrive } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Draggable title bar area */}
      <div className="h-12 flex items-center justify-center app-drag">
        <span className="text-sm text-slate-400">0711 Vault</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-2xl">
            <Shield className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold mb-2">Welcome to 0711 Vault</h1>
        <p className="text-lg text-slate-400 mb-12 text-center max-w-md">
          Your private, encrypted photo & document vault. 
          Your data stays yours.
        </p>

        {/* Options */}
        <div className="w-full max-w-md space-y-4">
          {/* Create Account */}
          <button
            onClick={() => navigate('/setup/register')}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-purple-600 hover:bg-purple-700 transition-colors"
          >
            <Cloud className="w-6 h-6" />
            <div className="text-left">
              <div className="font-semibold">Create Account</div>
              <div className="text-sm text-purple-200">Start with 5GB free storage</div>
            </div>
          </button>

          {/* Login */}
          <button
            onClick={() => navigate('/setup/login')}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            <Shield className="w-6 h-6" />
            <div className="text-left">
              <div className="font-semibold">Sign In</div>
              <div className="text-sm text-slate-400">Access your existing vault</div>
            </div>
          </button>

          {/* Self-hosted */}
          <button
            onClick={() => navigate('/setup/self-hosted')}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-700/50 hover:bg-slate-700 transition-colors"
          >
            <HardDrive className="w-6 h-6" />
            <div className="text-left">
              <div className="font-semibold">Self-Hosted Server</div>
              <div className="text-sm text-slate-400">Connect to your own server</div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-slate-500">
          <p>Zero-knowledge encryption • Open source • Made in Stuttgart</p>
        </div>
      </div>
    </div>
  );
}
