/**
 * Preload Script - Bridge between main and renderer
 * Exposes safe APIs to the renderer process
 */

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform info
  platform: process.platform,
  
  // Theme
  onThemeChanged: (callback: (isDark: boolean) => void) => {
    ipcRenderer.on('theme-changed', (_, isDark) => callback(isDark));
  },
  
  // Navigation from menu
  onNavigate: (callback: (path: string) => void) => {
    ipcRenderer.on('navigate', (_, path) => callback(path));
  },
  
  // Actions from menu
  onAction: (callback: (action: string) => void) => {
    ipcRenderer.on('action', (_, action) => callback(action));
  },
  
  // File dialogs
  showOpenDialog: (options: Electron.OpenDialogOptions) => {
    return ipcRenderer.invoke('show-open-dialog', options);
  },
  
  showSaveDialog: (options: Electron.SaveDialogOptions) => {
    return ipcRenderer.invoke('show-save-dialog', options);
  },
  
  // Keychain (secure storage)
  setSecureValue: (key: string, value: string) => {
    return ipcRenderer.invoke('keychain-set', key, value);
  },
  
  getSecureValue: (key: string) => {
    return ipcRenderer.invoke('keychain-get', key);
  },
  
  deleteSecureValue: (key: string) => {
    return ipcRenderer.invoke('keychain-delete', key);
  },
  
  // Touch ID
  canUseTouchId: () => {
    return ipcRenderer.invoke('can-use-touch-id');
  },
  
  authenticateWithTouchId: (reason: string) => {
    return ipcRenderer.invoke('authenticate-touch-id', reason);
  },
  
  // Notifications
  showNotification: (title: string, body: string) => {
    return ipcRenderer.invoke('show-notification', title, body);
  },
  
  // App info
  getAppVersion: () => {
    return ipcRenderer.invoke('get-app-version');
  },
  
  // Open external links
  openExternal: (url: string) => {
    return ipcRenderer.invoke('open-external', url);
  },
  
  // Quit app
  quit: () => {
    ipcRenderer.send('quit-app');
  },
  
  // Import / Migration
  scanFolder: (folderPath: string) => {
    return ipcRenderer.invoke('scan-folder', folderPath);
  },
  
  scanApplePhotos: () => {
    return ipcRenderer.invoke('scan-apple-photos');
  },
  
  readFile: (filePath: string) => {
    return ipcRenderer.invoke('read-file', filePath);
  },
  
  getExif: (filePath: string) => {
    return ipcRenderer.invoke('get-exif', filePath);
  },
  
  // Watch folders
  getWatchFolders: () => ipcRenderer.invoke('get-watch-folders'),
  addWatchFolder: (path: string) => ipcRenderer.invoke('add-watch-folder', path),
  removeWatchFolder: (path: string) => ipcRenderer.invoke('remove-watch-folder', path),
  
  // Upload queue
  getUploadQueue: () => ipcRenderer.invoke('get-upload-queue'),
  getUploadStats: () => ipcRenderer.invoke('get-upload-stats'),
  retryUpload: (id: string) => ipcRenderer.invoke('retry-upload', id),
  retryAllUploads: () => ipcRenderer.invoke('retry-all-uploads'),
  removeUpload: (id: string) => ipcRenderer.invoke('remove-upload', id),
  clearCompletedUploads: () => ipcRenderer.invoke('clear-completed-uploads'),
  
  // Cache
  getCacheStats: () => ipcRenderer.invoke('get-cache-stats'),
  clearCache: () => ipcRenderer.invoke('clear-cache'),
  getCached: (key: string, type?: 'thumbnails' | 'files') => ipcRenderer.invoke('get-cached', key, type),
  setCached: (key: string, data: Buffer, type?: 'thumbnails' | 'files') => ipcRenderer.invoke('set-cached', key, data, type),
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      platform: string;
      onThemeChanged: (callback: (isDark: boolean) => void) => void;
      onNavigate: (callback: (path: string) => void) => void;
      onAction: (callback: (action: string) => void) => void;
      showOpenDialog: (options: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>;
      showSaveDialog: (options: Electron.SaveDialogOptions) => Promise<Electron.SaveDialogReturnValue>;
      setSecureValue: (key: string, value: string) => Promise<void>;
      getSecureValue: (key: string) => Promise<string | null>;
      deleteSecureValue: (key: string) => Promise<void>;
      canUseTouchId: () => Promise<boolean>;
      authenticateWithTouchId: (reason: string) => Promise<boolean>;
      showNotification: (title: string, body: string) => Promise<void>;
      getAppVersion: () => Promise<string>;
      openExternal: (url: string) => Promise<void>;
      quit: () => void;
      scanFolder: (folderPath: string) => Promise<{ photos: Array<{ path: string; filename: string; size: number; date: string | null }> }>;
      scanApplePhotos: () => Promise<{ photos: Array<{ path: string; filename: string; size: number; date: string | null }>; error?: string }>;
      readFile: (filePath: string) => Promise<Buffer | null>;
      getExif: (filePath: string) => Promise<any>;
      // Watch folders
      getWatchFolders: () => Promise<string[]>;
      addWatchFolder: (path: string) => Promise<boolean>;
      removeWatchFolder: (path: string) => Promise<boolean>;
      // Upload queue
      getUploadQueue: () => Promise<any[]>;
      getUploadStats: () => Promise<{ pending: number; uploading: number; complete: number; failed: number }>;
      retryUpload: (id: string) => Promise<boolean>;
      retryAllUploads: () => Promise<void>;
      removeUpload: (id: string) => Promise<boolean>;
      clearCompletedUploads: () => Promise<void>;
      // Cache
      getCacheStats: () => Promise<{ count: number; sizeMB: number }>;
      clearCache: () => Promise<void>;
      getCached: (key: string, type?: 'thumbnails' | 'files') => Promise<Buffer | null>;
      setCached: (key: string, data: Buffer, type?: 'thumbnails' | 'files') => Promise<void>;
    };
  }
}
