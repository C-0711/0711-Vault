/**
 * Main Layout with Sidebar Navigation
 */

import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Image,
  FolderOpen,
  Users,
  FileText,
  Search,
  MessageSquare,
  Settings,
  Download,
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/photos', icon: Image, label: 'Photos' },
  { path: '/albums', icon: FolderOpen, label: 'Albums' },
  { path: '/people', icon: Users, label: 'People' },
  { path: '/documents', icon: FileText, label: 'Documents' },
  { path: '/search', icon: Search, label: 'Search' },
  { path: '/assistant', icon: MessageSquare, label: 'AI Assistant' },
];

export default function MainLayout() {
  return (
    <div className="h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-border bg-sidebar">
        {/* Draggable title bar area */}
        <div className="h-12 flex items-center px-4 app-drag">
          <span className="text-lg font-semibold text-primary">0711 Vault</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Import & Settings at bottom */}
        <div className="p-3 border-t border-border space-y-1">
          <NavLink
            to="/import"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <Download className="w-5 h-5" />
            <span>Import Photos</span>
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </NavLink>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Draggable top bar */}
        <div className="h-12 border-b border-border app-drag" />
        
        {/* Content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
