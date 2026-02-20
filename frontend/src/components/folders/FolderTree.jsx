import React, { useState, useEffect } from 'react'

export function FolderTree({ onFolderSelect, selectedFolderId, onCreateFolder }) {
  const [folders, setFolders] = useState([])
  const [expanded, setExpanded] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFolders()
  }, [])

  async function loadFolders() {
    try {
      const res = await fetch('/api/folders/tree')
      if (res.ok) {
        const tree = await res.json()
        setFolders(tree)
      }
    } catch (err) {
      console.error('Failed to load folders:', err)
    }
    setLoading(false)
  }

  function toggleExpand(folderId) {
    setExpanded(prev => ({ ...prev, [folderId]: !prev[folderId] }))
  }

  function renderFolder(folder, depth = 0) {
    const isExpanded = expanded[folder.id]
    const isSelected = selectedFolderId === folder.id
    const hasChildren = folder.children && folder.children.length > 0
    const paddingLeft = depth * 16 + 8

    return (
      <div key={folder.id}>
        <div
          className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-800 ${isSelected ? 'bg-gray-700' : ''}`}
          style={{ paddingLeft }}
          onClick={() => onFolderSelect?.(folder)}
        >
          {hasChildren && (
            <button onClick={(e) => { e.stopPropagation(); toggleExpand(folder.id) }}>
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          <span>{isExpanded ? '📂' : '📁'}</span>
          <span className="flex-1 truncate text-sm">{folder.name}</span>
          {folder.item_count > 0 && <span className="text-xs text-gray-500">{folder.item_count}</span>}
        </div>
        {isExpanded && hasChildren && folder.children.map(child => renderFolder(child, depth + 1))}
      </div>
    )
  }

  if (loading) return <div className="p-4 text-gray-500">Loading...</div>

  return (
    <div>
      <button onClick={() => onCreateFolder?.(null)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-800 rounded mb-2">
        + New Folder
      </button>
      <div className="space-y-0.5">
        {folders.length === 0 ? <div className="text-gray-500 text-sm px-3">No folders</div> : folders.map(f => renderFolder(f))}
      </div>
    </div>
  )
}

export default FolderTree
