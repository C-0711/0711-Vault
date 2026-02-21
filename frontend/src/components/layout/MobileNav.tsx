// V-10: Mobile-Responsive UI Fixes for 0711-Vault
// Path: frontend/src/components/layout/MobileNav.tsx

"use client"

import { useState } from 'react'

interface NavItem {
  id: string
  label: string
  icon: string
  href: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'files', label: 'Files', icon: '📁', href: '/files' },
  { id: 'shared', label: 'Shared', icon: '🔗', href: '/shared' },
  { id: 'recent', label: 'Recent', icon: '🕐', href: '/recent' },
  { id: 'trash', label: 'Trash', icon: '🗑️', href: '/trash' },
]

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={() => setIsOpen(!isOpen)} className="p-2">
            <span className="text-2xl">{isOpen ? '✕' : '☰'}</span>
          </button>
          <h1 className="text-lg font-semibold">0711 Vault</h1>
          <button className="p-2">
            <span className="text-2xl">👤</span>
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <nav className={`
        lg:hidden fixed top-14 left-0 bottom-0 z-40 w-64 bg-gray-900 border-r border-gray-800
        transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 space-y-2">
          {NAV_ITEMS.map(item => (
            <a
              key={item.id}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </div>
        
        {/* Storage Usage */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <div className="text-sm text-gray-400 mb-2">Storage</div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-blue-500" />
          </div>
          <div className="text-xs text-gray-500 mt-1">3.2 GB of 10 GB</div>
        </div>
      </nav>

      {/* Bottom Tab Bar (Mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800">
        <div className="flex justify-around py-2">
          {NAV_ITEMS.slice(0, 4).map(item => (
            <a
              key={item.id}
              href={item.href}
              className="flex flex-col items-center p-2 text-gray-400 hover:text-white"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </>
  )
}

// Mobile-optimized file grid
export function MobileFileGrid({ files }: { files: any[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4">
      {files.map(file => (
        <div 
          key={file.id}
          className="bg-gray-800 rounded-lg p-3 flex flex-col items-center touch-manipulation"
        >
          <div className="text-4xl mb-2">
            {file.type === 'folder' ? '📁' : '📄'}
          </div>
          <span className="text-sm text-center truncate w-full">{file.name}</span>
          <span className="text-xs text-gray-500">{file.size}</span>
        </div>
      ))}
    </div>
  )
}

// Responsive breakpoint utilities
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
}

export default MobileNav
