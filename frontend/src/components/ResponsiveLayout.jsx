import React from 'react'

/**
 * Responsive Layout Wrapper
 * Handles mobile/tablet/desktop layouts
 */

export function ResponsiveLayout({ children, sidebar, header }) {
  const [isMobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <div className="min-h-screen bg-black">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-gray-800">
        <button
          onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-gray-800 rounded"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {header}
      </header>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-gray-900 p-4">
            {sidebar}
          </div>
        </div>
      )}

      {/* Desktop Layout */}
      <div className="hidden md:flex">
        {/* Desktop Sidebar */}
        <aside className="w-64 min-h-screen border-r border-gray-800 p-4">
          {sidebar}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      {/* Mobile Content */}
      <main className="md:hidden p-4">
        {children}
      </main>
    </div>
  )
}

export default ResponsiveLayout
