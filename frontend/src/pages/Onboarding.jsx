import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { 
  Upload, Cloud, Smartphone, FolderSync, Check, ArrowRight, 
  Image, FileText, Video, ChevronRight
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function Onboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [selectedImport, setSelectedImport] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ total: 0, done: 0 })

  const totalSteps = 3

  // Step 1: Choose import source
  const importSources = [
    { 
      id: 'upload', 
      icon: Upload, 
      title: 'Dateien hochladen', 
      description: 'Fotos und Dokumente direkt hochladen',
      color: 'emerald'
    },
    { 
      id: 'google_drive', 
      icon: () => <span className="text-2xl">🔺</span>, 
      title: 'Google Drive', 
      description: 'Alle Dateien von Google importieren',
      color: 'blue'
    },
    { 
      id: 'dropbox', 
      icon: () => <span className="text-2xl">📦</span>, 
      title: 'Dropbox', 
      description: 'Von Dropbox migrieren',
      color: 'blue'
    },
    { 
      id: 'icloud', 
      icon: Cloud, 
      title: 'iCloud', 
      description: 'Fotos von iCloud importieren',
      color: 'zinc'
    },
    { 
      id: 'skip', 
      icon: ArrowRight, 
      title: 'Später', 
      description: 'Erstmal nur erkunden',
      color: 'zinc'
    }
  ]

  const handleImportSelect = async (sourceId) => {
    setSelectedImport(sourceId)
    
    if (sourceId === 'skip') {
      navigate('/')
      return
    }
    
    if (sourceId === 'upload') {
      setStep(2)
      return
    }
    
    // Cloud import - redirect to OAuth
    try {
      const res = await fetch(`${API_URL}/import/connect/${sourceId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      if (res.ok) {
        const data = await res.json()
        window.location.href = data.auth_url
      }
    } catch (err) {
      console.error('Failed to start import:', err)
    }
  }

  // Step 2: File upload
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploading(true)
    setUploadProgress({ total: files.length, done: 0 })

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
        // Determine item type
        let itemType = 'document'
        if (file.type.startsWith('image/')) itemType = 'photo'
        else if (file.type.startsWith('video/')) itemType = 'video'

        // Get upload URL
        const createRes = await fetch(`${API_URL}/vault/items`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            item_type: itemType,
            file_size: file.size,
            mime_type: file.type
          })
        })

        if (!createRes.ok) throw new Error('Failed to create item')

        const { upload_url, storage_key } = await createRes.json()

        // Upload file
        await fetch(upload_url, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file
        })

        setUploadProgress(prev => ({ ...prev, done: prev.done + 1 }))
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err)
      }
    }

    setUploading(false)
    setStep(3)
  }

  // Step 3: Install apps
  const apps = [
    { platform: 'iOS', icon: '📱', url: '#', available: false },
    { platform: 'Android', icon: '🤖', url: '#', available: false },
    { platform: 'Mac', icon: '💻', url: '#', available: true },
    { platform: 'Windows', icon: '🪟', url: '#', available: false }
  ]

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-white/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center font-bold text-white">
              07
            </div>
            <span className="text-xl font-bold text-white">0711 Vault</span>
          </div>
          
          {/* Progress */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition ${
                  s <= step ? 'bg-emerald-500' : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          
          {/* Step 1: Choose import source */}
          {step === 1 && (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-3">
                Willkommen in deinem Vault! 🎉
              </h1>
              <p className="text-zinc-400 text-lg mb-10">
                Wie möchtest du starten?
              </p>

              <div className="grid gap-4">
                {importSources.map((source) => {
                  const Icon = source.icon
                  return (
                    <button
                      key={source.id}
                      onClick={() => handleImportSelect(source.id)}
                      className={`flex items-center gap-4 p-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/50 rounded-2xl text-left transition group`}
                    >
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        source.color === 'emerald' ? 'bg-emerald-500/20' :
                        source.color === 'blue' ? 'bg-blue-500/20' : 'bg-zinc-800'
                      }`}>
                        {typeof Icon === 'function' && Icon.prototype ? (
                          <Icon className={`w-7 h-7 ${
                            source.color === 'emerald' ? 'text-emerald-400' :
                            source.color === 'blue' ? 'text-blue-400' : 'text-zinc-400'
                          }`} />
                        ) : (
                          <Icon />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-lg">{source.title}</h3>
                        <p className="text-zinc-500">{source.description}</p>
                      </div>
                      <ChevronRight className="w-6 h-6 text-zinc-600 group-hover:text-emerald-400 transition" />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 2: Upload files */}
          {step === 2 && (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-3">
                Dateien hochladen
              </h1>
              <p className="text-zinc-400 text-lg mb-10">
                Ziehe Dateien hierher oder klicke zum Auswählen
              </p>

              {!uploading ? (
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-zinc-700 hover:border-emerald-500 rounded-3xl p-16 transition">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Upload className="w-10 h-10 text-emerald-400" />
                    </div>
                    <p className="text-white text-lg font-medium mb-2">
                      Dateien auswählen
                    </p>
                    <p className="text-zinc-500">
                      Fotos, Videos, PDFs und Dokumente
                    </p>
                    
                    <div className="flex justify-center gap-4 mt-6">
                      <div className="flex items-center gap-2 text-zinc-500 text-sm">
                        <Image className="w-4 h-4" /> Fotos
                      </div>
                      <div className="flex items-center gap-2 text-zinc-500 text-sm">
                        <Video className="w-4 h-4" /> Videos
                      </div>
                      <div className="flex items-center gap-2 text-zinc-500 text-sm">
                        <FileText className="w-4 h-4" /> Dokumente
                      </div>
                    </div>
                  </div>
                </label>
              ) : (
                <div className="p-12 bg-white/5 rounded-3xl border border-white/10">
                  <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-6" />
                  <p className="text-white text-xl font-semibold mb-2">
                    Hochladen...
                  </p>
                  <p className="text-zinc-400 mb-6">
                    {uploadProgress.done} von {uploadProgress.total} Dateien
                  </p>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep(3)}
                className="mt-8 text-zinc-500 hover:text-white transition"
              >
                Überspringen →
              </button>
            </div>
          )}

          {/* Step 3: Install apps */}
          {step === 3 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-emerald-400" />
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-3">
                Alles bereit! 🚀
              </h1>
              <p className="text-zinc-400 text-lg mb-10">
                Installiere unsere Apps für automatischen Backup
              </p>

              <div className="grid grid-cols-2 gap-4 mb-10">
                {apps.map((app) => (
                  <a
                    key={app.platform}
                    href={app.url}
                    className={`p-6 rounded-2xl border text-center transition ${
                      app.available 
                        ? 'bg-white/5 border-white/10 hover:border-emerald-500/50' 
                        : 'bg-zinc-900/50 border-zinc-800 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-4xl block mb-3">{app.icon}</span>
                    <span className="font-medium text-white">{app.platform}</span>
                    {!app.available && (
                      <span className="block text-xs text-zinc-600 mt-1">Bald verfügbar</span>
                    )}
                  </a>
                ))}
              </div>

              <button
                onClick={() => navigate('/')}
                className="w-full max-w-xs py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition"
              >
                Zum Vault →
              </button>

              <p className="mt-4 text-zinc-600 text-sm">
                Du kannst die Apps auch später installieren
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto flex justify-between items-center text-sm text-zinc-600">
          <span>Schritt {step} von {totalSteps}</span>
          {step > 1 && step < 3 && (
            <button
              onClick={() => setStep(step - 1)}
              className="hover:text-white transition"
            >
              ← Zurück
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
