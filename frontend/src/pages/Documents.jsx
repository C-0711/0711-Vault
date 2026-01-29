import { useState } from 'react'
import { Plus, Search, FileText, Folder, MoreVertical, Download, Trash2, Eye, Calendar, Tag } from 'lucide-react'
import clsx from 'clsx'

const categories = [
  { id: 'all', label: 'Alle', count: 18 },
  { id: 'contracts', label: 'Verträge', count: 5 },
  { id: 'invoices', label: 'Rechnungen', count: 8 },
  { id: 'personal', label: 'Persönlich', count: 3 },
  { id: 'medical', label: 'Medizinisch', count: 2 },
]

const documents = [
  { id: 1, name: 'Mietvertrag_2024.pdf', category: 'contracts', date: '15.01.2024', size: '2.4 MB', tags: ['Wohnung', 'Wichtig'] },
  { id: 2, name: 'Stromrechnung_Dez.pdf', category: 'invoices', date: '02.01.2024', size: '156 KB', tags: ['EnBW'] },
  { id: 3, name: 'Personalausweis_Scan.pdf', category: 'personal', date: '10.12.2023', size: '1.2 MB', tags: ['Ausweis'] },
  { id: 4, name: 'Arbeitsvertrag.pdf', category: 'contracts', date: '01.03.2023', size: '890 KB', tags: ['Job', 'Wichtig'] },
  { id: 5, name: 'Impfpass.pdf', category: 'medical', date: '15.08.2023', size: '3.1 MB', tags: ['COVID', 'Impfung'] },
  { id: 6, name: 'Handyrechnung_Jan.pdf', category: 'invoices', date: '05.01.2024', size: '210 KB', tags: ['Telekom'] },
  { id: 7, name: 'Versicherungspolice.pdf', category: 'contracts', date: '20.11.2023', size: '1.8 MB', tags: ['Haftpflicht'] },
  { id: 8, name: 'Kontoauszug_Q4.pdf', category: 'invoices', date: '01.01.2024', size: '450 KB', tags: ['Bank'] },
]

export default function Documents() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedDoc, setSelectedDoc] = useState(null)

  const filteredDocs = documents.filter(doc => {
    const matchesCategory = activeCategory === 'all' || doc.category === activeCategory
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase()) ||
                          doc.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dokumente</h1>
          <p className="text-gray-500">{documents.length} Dokumente gesichert</p>
        </div>
        <button className="btn-primary flex items-center gap-2 w-full md:w-auto justify-center">
          <Plus className="w-5 h-5" />
          Dokument scannen
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Dokumente durchsuchen..."
          className="input pl-12"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors',
              activeCategory === cat.id
                ? 'bg-white text-black'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            )}
          >
            <Folder className="w-4 h-4" />
            {cat.label}
            <span className={clsx(
              'text-xs px-2 py-0.5 rounded-full',
              activeCategory === cat.id ? 'bg-black/10' : 'bg-white/10'
            )}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Document List */}
      <div className="card divide-y divide-white/10">
        {filteredDocs.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Keine Dokumente gefunden</p>
          </div>
        ) : (
          filteredDocs.map(doc => (
            <div 
              key={doc.id}
              className="flex items-center gap-4 py-4 first:pt-0 last:pb-0 hover:bg-white/5 -mx-4 px-4 transition-colors cursor-pointer"
              onClick={() => setSelectedDoc(doc)}
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{doc.name}</p>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {doc.date}
                  </span>
                  <span>{doc.size}</span>
                </div>
                {doc.tags.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {doc.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-gray-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Eye className="w-5 h-5 text-gray-500" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Download className="w-5 h-5 text-gray-500" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-500">18</p>
          <p className="text-sm text-gray-500">Dokumente</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-500">5</p>
          <p className="text-sm text-gray-500">Kategorien</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-purple-500">12.4</p>
          <p className="text-sm text-gray-500">MB Speicher</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-orange-500">24</p>
          <p className="text-sm text-gray-500">Tags</p>
        </div>
      </div>
    </div>
  )
}
