import { Link } from 'react-router-dom'
import { Shield, Zap, Lock, Cloud, ArrowRight, Check } from 'lucide-react'

export default function Welcome() {
  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center font-bold text-white">
              07
            </div>
            <span className="text-xl font-bold text-white">0711 Vault</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-zinc-400 hover:text-white transition font-medium">
              Anmelden
            </Link>
            <Link 
              to="/register" 
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition"
            >
              Kostenlos starten
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-8">
            <Shield className="w-4 h-4" />
            Ende-zu-Ende verschlüsselt
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Deine Daten.<br />
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
              Deine Kontrolle.
            </span>
          </h1>
          
          <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
            Sichere Fotos, Dokumente und Erinnerungen mit Zero-Knowledge Verschlüsselung.
            Nur du hast den Schlüssel.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/register" 
              className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 text-lg"
            >
              Kostenlos starten <ArrowRight className="w-5 h-5" />
            </Link>
            <a 
              href="https://vault.0711.io"
              className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition text-lg"
            >
              Mehr erfahren
            </a>
          </div>
          
          <div className="flex items-center justify-center gap-8 mt-12 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              5 GB gratis
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              Keine Kreditkarte
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              DSGVO-konform
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Zero-Knowledge</h3>
              <p className="text-zinc-400">
                Deine Daten werden auf deinem Gerät verschlüsselt. 
                Wir können deine Dateien nicht sehen.
              </p>
            </div>
            
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Lokale KI</h3>
              <p className="text-zinc-400">
                Gesichtserkennung und intelligente Suche – 
                komplett auf deutschen Servern.
              </p>
            </div>
            
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                <Cloud className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Einfache Migration</h3>
              <p className="text-zinc-400">
                Import von Google Photos, Dropbox, iCloud 
                mit einem Klick.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Einfache Preise</h2>
          <p className="text-zinc-400 mb-12">Starte kostenlos, upgrade wenn du mehr brauchst.</p>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-left">
              <h3 className="font-semibold text-white mb-1">Free</h3>
              <div className="text-3xl font-bold text-white mb-4">€0<span className="text-lg text-zinc-500 font-normal">/Monat</span></div>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> 5 GB Speicher</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Ende-zu-Ende Verschlüsselung</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> 3 Geräte</li>
              </ul>
            </div>
            
            <div className="p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 text-left relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                Beliebt
              </div>
              <h3 className="font-semibold text-white mb-1">Premium</h3>
              <div className="text-3xl font-bold text-white mb-4">€4,99<span className="text-lg text-zinc-500 font-normal">/Monat</span></div>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> 200 GB Speicher</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> KI-Suche & Gesichtserkennung</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Unbegrenzte Geräte</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Bereit für echte Privatsphäre?
          </h2>
          <p className="text-zinc-400 mb-8">
            Starte kostenlos mit 5 GB Speicher. Keine Kreditkarte erforderlich.
          </p>
          <Link 
            to="/register" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition text-lg"
          >
            Jetzt starten <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <div>© 2026 0711.io GmbH</div>
          <div className="flex gap-6">
            <a href="https://vault.0711.io/privacy" className="hover:text-white transition">Datenschutz</a>
            <a href="https://vault.0711.io/terms" className="hover:text-white transition">AGB</a>
            <a href="https://vault.0711.io/imprint" className="hover:text-white transition">Impressum</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
