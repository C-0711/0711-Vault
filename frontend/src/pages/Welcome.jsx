import { Link } from 'react-router-dom'
import { Shield, Lock, Image, FileText, MessageSquare, ChevronRight } from 'lucide-react'
import { useState } from 'react'

const features = [
  {
    icon: Lock,
    title: 'Ende-zu-Ende verschlüsselt',
    desc: 'Deine Daten verlassen niemals unverschlüsselt dein Gerät.'
  },
  {
    icon: Image,
    title: 'Fotos & Videos sicher',
    desc: 'Importiere aus iCloud oder Google Photos.'
  },
  {
    icon: FileText,
    title: 'Dokumente organisiert',
    desc: 'Alberts Erkennung und Sortierung.'
  },
  {
    icon: MessageSquare,
    title: 'Private Nachrichten',
    desc: 'Chats und Anrufe die niemand mitlesen kann.'
  },
]

export default function Welcome() {
  const [step, setStep] = useState(0)

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Skip */}
      <div className="flex justify-end p-4">
        <Link to="/login" className="text-gray-500 hover:text-white transition-colors">
          Überspringen
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-32">
        {/* Icon */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full" />
          <div className="relative w-32 h-32 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-full flex items-center justify-center">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center">
              {step === 0 && <Lock className="w-12 h-12 text-white" />}
              {step === 1 && <Image className="w-12 h-12 text-white" />}
              {step === 2 && <FileText className="w-12 h-12 text-white" />}
              {step === 3 && <MessageSquare className="w-12 h-12 text-white" />}
            </div>
          </div>
        </div>

        {/* Text */}
        <h1 className="text-3xl font-bold text-center mb-4 animate-fade-in">
          {features[step].title}
        </h1>
        <p className="text-gray-400 text-center max-w-sm animate-fade-in">
          {features[step].desc}
        </p>

        {/* Dots */}
        <div className="flex gap-2 mt-12">
          {features.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all ${
                i === step ? 'w-6 bg-white' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="p-8 space-y-4">
        {step < features.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            Weiter
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <Link to="/register" className="w-full btn-primary flex items-center justify-center gap-2">
            Vault erstellen
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
        
        {step === features.length - 1 && (
          <Link to="/login" className="block text-center text-gray-500 hover:text-white transition-colors">
            Bereits einen Vault? Anmelden
          </Link>
        )}
      </div>
    </div>
  )
}
