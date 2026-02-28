import { Crown, ExternalLink } from 'lucide-react'

const PORTAL_URL = import.meta.env.VITE_O711I_ISSUER || 'https://id.0711.io'

export default function Pricing() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Abo & Abrechnung</h1>
      <p className="text-zinc-400 mb-8">
        Abos und Rechnungen werden über die 0711 Plattform verwaltet.
      </p>

      <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 text-center">
        <Crown className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">0711 Plattform</h2>
        <p className="text-zinc-400 mb-6">
          Verwalte dein Abo, deine Rechnungen und Zahlungsmethoden über das 0711 Portal.
        </p>
        <a
          href={`${PORTAL_URL}/billing`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition"
        >
          <ExternalLink className="w-4 h-4" />
          Zum 0711 Portal
        </a>
      </div>
    </div>
  )
}
