import { useState, useRef, useEffect } from 'react'
import api from '../lib/api'

export default function Messages() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Hallo! Ich bin dein Vault AI Assistent. Ich kann dir helfen, Informationen in deinem Vault zu finden. Frag mich zum Beispiel:\n\n• "Zeig mir Fotos vom letzten Sommer"\n• "Finde Dokumente mit Rechnungen"\n• "Wer ist auf meinen Fotos?"',
      time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
      time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Search in vault using semantic search
      const searchResults = await api.semanticSearch(userMessage.content, 10)
      
      let responseContent = ''
      
      if (searchResults.results && searchResults.results.length > 0) {
        responseContent = `Ich habe ${searchResults.results.length} relevante Einträge in deinem Vault gefunden:\n\n`
        
        const photos = searchResults.results.filter(r => r.item_type === 'photo')
        const docs = searchResults.results.filter(r => r.item_type === 'document')
        
        if (photos.length > 0) {
          responseContent += `📷 **${photos.length} Fotos**\n`
          photos.slice(0, 3).forEach((p, i) => {
            responseContent += `  ${i + 1}. Ähnlichkeit: ${Math.round((p.similarity || 0) * 100)}%\n`
          })
          responseContent += '\n'
        }
        
        if (docs.length > 0) {
          responseContent += `📄 **${docs.length} Dokumente**\n`
          docs.slice(0, 3).forEach((d, i) => {
            responseContent += `  ${i + 1}. Ähnlichkeit: ${Math.round((d.similarity || 0) * 100)}%\n`
          })
          responseContent += '\n'
        }
        
        responseContent += 'Gehe zu **Fotos** oder **Dokumente** um die Ergebnisse zu sehen.'
      } else {
        responseContent = 'Ich konnte leider keine passenden Einträge in deinem Vault finden. Versuche eine andere Suchanfrage oder lade mehr Inhalte hoch.'
      }

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: responseContent,
        time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      console.error('Search failed:', err)
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Entschuldigung, es gab einen Fehler bei der Suche. Bitte versuche es erneut.',
        time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-white">Vault AI</h1>
          <p className="text-zinc-400">Frag mich alles über deinen Vault</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-zinc-400 text-sm">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-white'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              <div className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-blue-200' : 'text-zinc-500'
              }`}>
                {message.time}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="pt-4 border-t border-zinc-800">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nachricht eingeben..."
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2 mt-3">
          <QuickAction onClick={() => setInput('Zeig mir meine neuesten Fotos')}>
            📷 Neueste Fotos
          </QuickAction>
          <QuickAction onClick={() => setInput('Finde Rechnungen')}>
            📄 Rechnungen
          </QuickAction>
          <QuickAction onClick={() => setInput('Wer ist auf meinen Fotos?')}>
            👤 Personen
          </QuickAction>
        </div>
      </form>
    </div>
  )
}

function QuickAction({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs bg-zinc-800 text-zinc-400 px-3 py-1.5 rounded-full hover:bg-zinc-700 hover:text-white transition"
    >
      {children}
    </button>
  )
}
