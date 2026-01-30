import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function Pricing() {
  const [plans, setPlans] = useState([])
  const [currentPlan, setCurrentPlan] = useState(null)
  const [billing, setBilling] = useState('monthly')
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [plansRes, subRes] = await Promise.all([
        api.request('/billing/plans'),
        api.request('/billing/subscription').catch(() => null)
      ])
      setPlans(plansRes.plans || [])
      setCurrentPlan(subRes?.plan || 'free')
    } catch (err) {
      console.error('Failed to load plans:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubscribe(plan) {
    if (plan.id === 'free') return
    
    const priceId = billing === 'monthly' 
      ? plan.stripe_price_monthly 
      : plan.stripe_price_yearly
    
    if (!priceId) {
      alert('Dieser Plan ist noch nicht verfügbar')
      return
    }
    
    setCheckoutLoading(plan.id)
    
    try {
      const { checkout_url } = await api.request('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ price_id: priceId })
      })
      
      window.location.href = checkout_url
    } catch (err) {
      console.error('Checkout failed:', err)
      alert('Checkout konnte nicht gestartet werden')
    } finally {
      setCheckoutLoading(null)
    }
  }

  async function handleManageSubscription() {
    try {
      const { portal_url } = await api.request('/billing/portal', {
        method: 'POST',
        body: JSON.stringify({})
      })
      window.location.href = portal_url
    } catch (err) {
      console.error('Portal failed:', err)
      alert('Konnte Abo-Verwaltung nicht öffnen')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white mb-4">Wähle deinen Plan</h1>
        <p className="text-zinc-400 mb-8">Starte kostenlos und upgrade wenn du mehr brauchst</p>
        
        {/* Billing Toggle */}
        <div className="inline-flex items-center bg-zinc-900 rounded-full p-1">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition ${
              billing === 'monthly' 
                ? 'bg-white text-black' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Monatlich
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition ${
              billing === 'yearly' 
                ? 'bg-white text-black' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Jährlich
            <span className="ml-2 text-xs text-green-500">-17%</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map(plan => {
          const isCurrent = currentPlan === plan.id
          const isPopular = plan.id === 'pro'
          const price = billing === 'monthly' ? plan.price_monthly : Math.round(plan.price_yearly / 12)
          
          return (
            <div
              key={plan.id}
              className={`relative bg-zinc-900 rounded-2xl border p-8 ${
                isPopular 
                  ? 'border-orange-500 scale-105' 
                  : 'border-zinc-800'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-orange-500 rounded-full text-xs font-bold text-white">
                  BELIEBT
                </div>
              )}
              
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{price}€</span>
                <span className="text-zinc-500">/Monat</span>
                {billing === 'yearly' && plan.price_yearly > 0 && (
                  <div className="text-sm text-zinc-500 mt-1">
                    {plan.price_yearly}€ jährlich abgerechnet
                  </div>
                )}
              </div>
              
              <div className="text-sm text-zinc-400 mb-6">
                {plan.storage_gb} GB Speicher
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              
              {isCurrent ? (
                <button
                  onClick={handleManageSubscription}
                  className="w-full py-3 rounded-xl font-medium bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition"
                >
                  Aktueller Plan
                </button>
              ) : plan.id === 'free' ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl font-medium bg-zinc-800 text-zinc-500"
                >
                  Kostenlos
                </button>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={checkoutLoading === plan.id}
                  className={`w-full py-3 rounded-xl font-medium transition ${
                    isPopular
                      ? 'bg-orange-500 text-white hover:bg-orange-400'
                      : 'bg-white text-black hover:bg-zinc-200'
                  } disabled:opacity-50`}
                >
                  {checkoutLoading === plan.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Wird geladen...
                    </span>
                  ) : (
                    `Upgrade zu ${plan.name}`
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* FAQ */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-white text-center mb-8">Häufige Fragen</h2>
        
        <div className="space-y-4 max-w-2xl mx-auto">
          <FAQ 
            question="Kann ich jederzeit kündigen?"
            answer="Ja, du kannst dein Abo jederzeit kündigen. Du behältst den Zugang bis zum Ende der Abrechnungsperiode."
          />
          <FAQ 
            question="Was passiert mit meinen Daten nach Kündigung?"
            answer="Deine Daten bleiben 30 Tage erhalten. Wenn du innerhalb des Free-Limits bist, kannst du weiter auf sie zugreifen."
          />
          <FAQ 
            question="Gibt es eine Geld-zurück-Garantie?"
            answer="Ja, innerhalb von 30 Tagen bekommst du dein Geld zurück – ohne Fragen."
          />
          <FAQ 
            question="Wie funktioniert die Familien-Freigabe?"
            answer="Im Family-Plan können bis zu 6 Personen den gemeinsamen Speicher nutzen, mit eigenen Accounts und privaten Bereichen."
          />
        </div>
      </div>

      {/* Trust Badges */}
      <div className="mt-16 text-center">
        <div className="flex items-center justify-center gap-8 text-zinc-500">
          <div className="flex items-center gap-2">
            <span>🔒</span>
            <span className="text-sm">SSL verschlüsselt</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🇩🇪</span>
            <span className="text-sm">Server in Deutschland</span>
          </div>
          <div className="flex items-center gap-2">
            <span>💳</span>
            <span className="text-sm">Sichere Zahlung via Stripe</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function FAQ({ question, answer }) {
  const [open, setOpen] = useState(false)
  
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 text-left flex items-center justify-between"
      >
        <span className="font-medium text-white">{question}</span>
        <span className={`text-zinc-500 transition ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {open && (
        <div className="px-6 pb-4 text-zinc-400 text-sm">
          {answer}
        </div>
      )}
    </div>
  )
}
