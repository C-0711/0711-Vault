/**
 * 0711 Vault Desktop - Main App Component
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';

// Views
import Welcome from './views/Welcome';
import Setup from './views/Setup';
import Dashboard from './views/Dashboard';
import Photos from './views/Photos';
import Albums from './views/Albums';
import People from './views/People';
import Documents from './views/Documents';
import Search from './views/Search';
import Assistant from './views/Assistant';
import Settings from './views/Settings';
import Import from './views/Import';

// Layout
import MainLayout from './components/MainLayout';

// Auth context
import { AuthProvider, useAuth } from './hooks/useAuth';

function AppRoutes() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // Listen for menu navigation
  useEffect(() => {
    window.electronAPI?.onNavigate((path) => {
      navigate(path);
    });

    window.electronAPI?.onAction((action) => {
      switch (action) {
        case 'search':
          navigate('/search');
          break;
        case 'upload':
          // TODO: Open upload dialog
          break;
        case 'import-folder':
          // TODO: Open folder import
          break;
      }
    });
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not authenticated - show welcome/setup flow
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/setup/*" element={<Setup />} />
        <Route path="*" element={<Welcome />} />
      </Routes>
    );
  }

  // Authenticated - show main app
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/photos" element={<Photos />} />
        <Route path="/albums" element={<Albums />} />
        <Route path="/people" element={<People />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/search" element={<Search />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/settings/*" element={<Settings />} />
        <Route path="/import" element={<Import />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  const [isDark, setIsDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    // Listen for system theme changes
    window.electronAPI?.onThemeChanged(setIsDark);
    
    // Also listen for media query changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <div className={isDark ? 'dark' : ''}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}
