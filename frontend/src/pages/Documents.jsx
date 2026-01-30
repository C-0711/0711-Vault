import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import { encrypt, encryptFile, decrypt, getMasterKey } from '../lib/crypto'

const categories = [
  { id: 'all', label: 'Alle' },
  { id: 'contracts', label: 'Verträge' },
  { id: 'invoices', label: 'Rechnungen' },
  { id: 'personal', label: 'Persönlich' },
  { id: 'medical', label: 'Medizinisch' },
  { id: 'other', label: 'Sonstige' },
]

export default function Documents() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    loadDocuments()
  }, [])

  async function loadDocuments() {
    setLoading(true)
    try {
      const { items } = await api.getItems('document', 100)
      
      // Decrypt metadata for display
      const masterKey = getMasterKey()
      const decryptedDocs = await Promise.all(items.map(async (doc) => {
        let metadata = { filename: 'Document', category: 'other', tags: [] }
        if (doc.encrypted_metadata && masterKey) {
          try {
            metadata = JSON.parse(await decrypt(doc.encrypted_metadata, masterKey))
          } catch (e) {
            console.error('Failed to decrypt metadata:', e)
          }
        }
        return {
          ...doc,
          name: metadata.filename || 'Document',
          category: metadata.category || 'other',
          tags: metadata.tags || [],
          date: doc.created_at ? new Date(doc.created_at).toLocaleDateString('de-DE') : '-',
          size: formatFileSize(doc.file_size)
        }
      }))
      
      setDocuments(decryptedDocs)
    } catch (err) {
      console.error('Failed to load documents:', err)
    } finally {
      setLoading(false)
    }
  }

  function formatFileSize(bytes) {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const handleDrop = useCallback(async (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer?.files || e.target.files || [])
    const docFiles = files.filter(f => 
      f.type === 'application/pdf' || 
      f.type.includes('document') ||
      f.type.includes('text') ||
      f.name.endsWith('.pdf') ||
      f.name.endsWith('.doc') ||
      f.name.endsWith('.docx')
    )
    
    if (docFiles.length === 0) return
    
    setUploading(true)
    setUploadProgress(0)
    
    const masterKey = getMasterKey()
    let completed = 0
    
    for (const file of docFiles) {
      try {
        // Encrypt metadata
        const metadata = JSON.stringify({
          filename: file.name,
          originalType: file.type,
          category: 'other',
          tags: []
        })
        const encryptedMetadata = masterKey ? await encrypt(metadata, masterKey) : null
        
        // Create item and get upload URL
        const { upload_url } = await api.createItem(
          'document',
          file.size,
          file.type,
          encryptedMetadata
        )
        
        // Encrypt and upload file
        const encryptedFile = masterKey ? await encryptFile(file, masterKey) : file
        await api.uploadFile(upload_url, encryptedFile)
        
        completed++
        setUploadProgress(Math.round((completed / docFiles.length) * 100))
      } catch (err) {
        console.error('Upload failed:', err)
      }
    }
    
    setUploading(false)
    loadDocuments()
  }, [])

  const filteredDocs = documents.filter(doc => {
    const matchesCategory = activeCategory === 'all' || doc.category === activeCategory
    const matchesSearch = !search || 
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const categoryCounts = categories.map(cat => ({
    ...cat,
    count: cat.id === 'all' 
      ? documents.length 
      : documents.filter(d => d.category === cat.id).length
  }))

  const totalSize = documents.reduce((acc, doc) => acc + (doc.file_size || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dokumente</h1>
          <p className="text-zinc-400">{documents.length} Dokumente gesichert</p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center hover:border-zinc-500 transition cursor-pointer"
        onClick={() => document.getElementById('doc-file-input').click()}
      >
        <input
          id="doc-file-input"
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={handleDrop}
        />
        
        {uploading ? (
          <div>
            <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <div className="text-white">Hochladen... {uploadProgress}%</div>
          </div>
        ) : (
          <>
            <div className="text-4xl mb-4">📄</div>
            <div className="text-white mb-2">Dokumente hier ablegen oder klicken zum Hochladen</div>
            <div className="text-zinc-500 text-sm">PDF, DOC, DOCX, TXT • Verschlüsselt gespeichert</div>
          </>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Dokumente durchsuchen..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 pl-12 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categoryCounts.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition ${
              activeCategory === cat.id
                ? 'bg-white text-black'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            📁 {cat.label}
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeCategory === cat.id ? 'bg-black/10' : 'bg-zinc-700'
            }`}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Document List */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 divide-y divide-zinc-800">
        {filteredDocs.length === 0 ? (
          <div className="py-12 text-center text-zinc-500">
            <div className="text-4xl mb-4">📄</div>
            <p>Keine Dokumente gefunden</p>
          </div>
        ) : (
          filteredDocs.map(doc => (
            <div 
              key={doc.id}
              className="flex items-center gap-4 p-4 hover:bg-zinc-800/50 transition cursor-pointer"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-xl">📄</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{doc.name}</p>
                <div className="flex items-center gap-3 text-sm text-zinc-500">
                  <span>{doc.date}</span>
                  <span>{doc.size}</span>
                </div>
                {doc.tags?.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {doc.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 bg-zinc-800 rounded-full text-zinc-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <button className="p-2 hover:bg-zinc-700 rounded-lg transition text-zinc-400 hover:text-white">
                  👁️
                </button>
                <button className="p-2 hover:bg-zinc-700 rounded-lg transition text-zinc-400 hover:text-white">
                  ⬇️
                </button>
                <button className="p-2 hover:bg-zinc-700 rounded-lg transition text-zinc-400 hover:text-white">
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 text-center">
          <p className="text-3xl font-bold text-blue-400">{documents.length}</p>
          <p className="text-sm text-zinc-500">Dokumente</p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 text-center">
          <p className="text-3xl font-bold text-green-400">{categoryCounts.filter(c => c.count > 0 && c.id !== 'all').length}</p>
          <p className="text-sm text-zinc-500">Kategorien</p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 text-center">
          <p className="text-3xl font-bold text-purple-400">{formatFileSize(totalSize)}</p>
          <p className="text-sm text-zinc-500">Speicher</p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 text-center">
          <p className="text-3xl font-bold text-orange-400">{documents.reduce((acc, d) => acc + (d.tags?.length || 0), 0)}</p>
          <p className="text-sm text-zinc-500">Tags</p>
        </div>
      </div>
    </div>
  )
}
