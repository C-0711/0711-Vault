import React, { useState, useCallback } from 'react'

export function DropZone({ onFilesSelected, accept = '*/*', multiple = true }) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }, [])

  const handleFiles = async (files) => {
    onFilesSelected?.(files)
    
    for (const file of files) {
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))
      
      // Simulate upload progress
      const formData = new FormData()
      formData.append('file', file)
      
      try {
        const res = await fetch('/api/vault/upload', {
          method: 'POST',
          body: formData,
        })
        
        if (res.ok) {
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
        }
      } catch (err) {
        console.error('Upload failed:', err)
        setUploadProgress(prev => ({ ...prev, [file.name]: -1 }))
      }
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-xl p-8 text-center transition-colors
        ${isDragging ? 'border-white bg-gray-800' : 'border-gray-700 hover:border-gray-500'}
      `}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        multiple={multiple}
        accept={accept}
        onChange={(e) => handleFiles(Array.from(e.target.files || []))}
      />
      
      <label htmlFor="file-upload" className="cursor-pointer">
        <div className="text-4xl mb-4">📁</div>
        <p className="text-lg text-gray-300">
          {isDragging ? 'Drop files here' : 'Drag & drop files or click to browse'}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Supports images, documents, and media files
        </p>
      </label>

      {Object.keys(uploadProgress).length > 0 && (
        <div className="mt-4 space-y-2">
          {Object.entries(uploadProgress).map(([name, progress]) => (
            <div key={name} className="flex items-center gap-2 text-sm">
              <span className="truncate flex-1">{name}</span>
              {progress === 100 && <span className="text-green-400">✓</span>}
              {progress === -1 && <span className="text-red-400">✗</span>}
              {progress >= 0 && progress < 100 && (
                <div className="w-24 h-2 bg-gray-700 rounded">
                  <div className="h-full bg-white rounded" style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DropZone
