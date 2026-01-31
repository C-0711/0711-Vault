import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import { encrypt, encryptFile, getMasterKey } from '../lib/crypto'

export default function Photos() {
  const [searchParams, setSearchParams] = useSearchParams()
  const view = searchParams.get('view') || 'grid'
  
  const [items, setItems] = useState([])
  const [faceClusters, setFaceClusters] = useState([])
  const [unlabeledFaces, setUnlabeledFaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFaces, setSelectedFaces] = useState([])
  const [labelName, setLabelName] = useState('')

  useEffect(() => {
    loadData()
  }, [view])

  async function loadData() {
    setLoading(true)
    try {
      if (view === 'faces') {
        const { clusters } = await api.getFaceClusters()
        setFaceClusters(clusters)
      } else if (view === 'train') {
        const { faces } = await api.getUnlabeledFaces(50)
        setUnlabeledFaces(faces)
      } else {
        const { items: photos } = await api.getItems('photo', 100)
        setItems(photos)
      }
    } catch (err) {
      console.error('Failed to load:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = useCallback(async (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer?.files || e.target.files || [])
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    
    if (imageFiles.length === 0) return
    
    setUploading(true)
    setUploadProgress(0)
    
    const masterKey = getMasterKey()
    let completed = 0
    
    for (const file of imageFiles) {
      try {
        // Encrypt metadata
        const metadata = JSON.stringify({
          filename: file.name,
          originalType: file.type,
        })
        const encryptedMetadata = masterKey ? await encrypt(metadata, masterKey) : null
        
        // Create item and get upload URL
        const { upload_url, item_id } = await api.createItem(
          'photo',
          file.size,
          file.type,
          encryptedMetadata
        )
        
        // Encrypt and upload file
        const encryptedFile = masterKey ? await encryptFile(file, masterKey) : file
        await api.uploadFile(upload_url, encryptedFile)
        
        completed++
        setUploadProgress(Math.round((completed / imageFiles.length) * 100))
      } catch (err) {
        console.error('Upload failed:', err)
      }
    }
    
    setUploading(false)
    loadData()
  }, [])

  async function handleTrainFaces() {
    if (selectedFaces.length === 0 || !labelName.trim()) return
    
    try {
      const masterKey = getMasterKey()
      const encryptedName = masterKey ? await encrypt(labelName, masterKey) : labelName
      
      await api.trainFaces(selectedFaces, null, encryptedName, 'unknown')
      
      setSelectedFaces([])
      setLabelName('')
      loadData()
    } catch (err) {
      console.error('Training failed:', err)
    }
  }

  function toggleFaceSelection(faceId) {
    setSelectedFaces(prev => 
      prev.includes(faceId)
        ? prev.filter(id => id !== faceId)
        : [...prev, faceId]
    )
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Photos</h1>
          <p className="text-zinc-400">{items.length} photos</p>
        </div>
        
        <div className="flex gap-2">
          <ViewButton active={view === 'grid'} onClick={() => setSearchParams({ view: 'grid' })}>
            Grid
          </ViewButton>
          <ViewButton active={view === 'faces'} onClick={() => setSearchParams({ view: 'faces' })}>
            People
          </ViewButton>
          <ViewButton active={view === 'train'} onClick={() => setSearchParams({ view: 'train' })}>
            Train
          </ViewButton>
        </div>
      </div>

      {/* Upload Zone */}
      {view === 'grid' && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center hover:border-zinc-500 transition cursor-pointer"
          onClick={() => document.getElementById('file-input').click()}
        >
          <input
            id="file-input"
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleDrop}
          />
          
          {uploading ? (
            <div>
              <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <div className="text-white">Uploading... {uploadProgress}%</div>
            </div>
          ) : (
            <>
              <div className="text-4xl mb-4">📷</div>
              <div className="text-white mb-2">Drop photos here or click to upload</div>
              <div className="text-zinc-500 text-sm">Photos are encrypted before upload</div>
            </>
          )}
        </div>
      )}

      {/* Grid View */}
      {view === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {items.map((item) => (
            <PhotoItem key={item.id} item={item} />
          ))}
          
          {items.length === 0 && (
            <div className="col-span-full text-center py-12 text-zinc-500">
              No photos yet. Upload some to get started!
            </div>
          )}
        </div>
      )}

      {/* Faces View */}
      {view === 'faces' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {faceClusters.map((cluster) => (
            <div
              key={cluster.id}
              className="bg-zinc-900 rounded-xl p-4 border border-zinc-800"
            >
              <div className="w-16 h-16 bg-zinc-800 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl">
                👤
              </div>
              <div className="text-center">
                <div className="text-white font-medium">
                  {cluster.encrypted_name ? '••••' : 'Unknown'}
                </div>
                <div className="text-zinc-500 text-sm">
                  {cluster.photo_count} photos
                </div>
              </div>
            </div>
          ))}
          
          {faceClusters.length === 0 && (
            <div className="col-span-full text-center py-12 text-zinc-500">
              No people identified yet. Upload photos and train your AI!
            </div>
          )}
        </div>
      )}

      {/* Training View */}
      {view === 'train' && (
        <div className="space-y-6">
          {unlabeledFaces.length > 0 ? (
            <>
              {/* Label Input */}
              {selectedFaces.length > 0 && (
                <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 flex gap-4 items-center">
                  <div className="text-zinc-400">
                    {selectedFaces.length} face(s) selected
                  </div>
                  <input
                    type="text"
                    value={labelName}
                    onChange={(e) => setLabelName(e.target.value)}
                    placeholder="Enter name..."
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                  />
                  <button
                    onClick={handleTrainFaces}
                    disabled={!labelName.trim()}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              )}

              {/* Face Grid */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {unlabeledFaces.map((face) => (
                  <button
                    key={face.id}
                    onClick={() => toggleFaceSelection(face.id)}
                    className={`aspect-square bg-zinc-800 rounded-xl overflow-hidden border-2 transition ${
                      selectedFaces.includes(face.id)
                        ? 'border-blue-500'
                        : 'border-transparent hover:border-zinc-600'
                    }`}
                  >
                    <div className="w-full h-full flex items-center justify-center text-3xl text-zinc-600">
                      👤
                    </div>
                  </button>
                ))}
              </div>

              <div className="text-center text-zinc-500">
                Click faces of the same person, then enter their name
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">✨</div>
              <div className="text-white text-lg mb-2">All faces are labeled!</div>
              <div className="text-zinc-500">Upload more photos to train your AI further</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PhotoItem({ item }) {
  const [imageUrl, setImageUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function loadImage() {
      try {
        const details = await api.getItem(item.id)
        if (details.download_url) {
          setImageUrl(details.download_url)
        }
      } catch (err) {
        console.error('Failed to load image:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    loadImage()
  }, [item.id])

  return (
    <div className="aspect-square bg-zinc-800 rounded-lg overflow-hidden">
      {loading ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="w-full h-full flex items-center justify-center text-4xl text-zinc-600">
          ❌
        </div>
      ) : imageUrl ? (
        <img 
          src={imageUrl} 
          alt="" 
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-4xl text-zinc-600">
          🖼️
        </div>
      )}
    </div>
  )
}

function ViewButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg transition ${
        active
          ? 'bg-white text-black'
          : 'bg-zinc-800 text-zinc-400 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}
