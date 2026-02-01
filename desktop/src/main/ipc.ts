/**
 * IPC Handlers for native macOS features
 */

import { ipcMain, dialog, shell, app, systemPreferences, Notification } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileWatcher } from './file-watcher';
import { uploadQueue } from './upload-queue';
import { cacheManager } from './cache';

// Dynamic import for native module
let keytar: typeof import('keytar') | null = null;
try {
  keytar = require('keytar');
} catch (e) {
  console.warn('keytar not available, secure storage disabled');
}

const SERVICE_NAME = '0711-vault';
const PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'];

export function setupIpcHandlers() {
  // File dialogs
  ipcMain.handle('show-open-dialog', async (_, options) => {
    return dialog.showOpenDialog(options);
  });

  ipcMain.handle('show-save-dialog', async (_, options) => {
    return dialog.showSaveDialog(options);
  });

  // Keychain (secure storage)
  ipcMain.handle('keychain-set', async (_, key: string, value: string) => {
    if (!keytar) {
      // Fallback to less secure storage
      return;
    }
    try {
      await keytar.setPassword(SERVICE_NAME, key, value);
    } catch (error) {
      console.error('Keychain set error:', error);
    }
  });

  ipcMain.handle('keychain-get', async (_, key: string) => {
    if (!keytar) {
      return null;
    }
    try {
      return await keytar.getPassword(SERVICE_NAME, key);
    } catch (error) {
      console.error('Keychain get error:', error);
      return null;
    }
  });

  ipcMain.handle('keychain-delete', async (_, key: string) => {
    if (!keytar) {
      return;
    }
    try {
      await keytar.deletePassword(SERVICE_NAME, key);
    } catch (error) {
      console.error('Keychain delete error:', error);
    }
  });

  // Touch ID
  ipcMain.handle('can-use-touch-id', async () => {
    if (process.platform !== 'darwin') return false;
    
    try {
      return systemPreferences.canPromptTouchID();
    } catch {
      return false;
    }
  });

  ipcMain.handle('authenticate-touch-id', async (_, reason: string) => {
    if (process.platform !== 'darwin') return false;
    
    try {
      await systemPreferences.promptTouchID(reason);
      return true;
    } catch {
      return false;
    }
  });

  // Notifications
  ipcMain.handle('show-notification', async (_, title: string, body: string) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
  });

  // App info
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  // External links
  ipcMain.handle('open-external', async (_, url: string) => {
    await shell.openExternal(url);
  });

  // Quit
  ipcMain.on('quit-app', () => {
    app.quit();
  });

  // Scan folder for photos
  ipcMain.handle('scan-folder', async (_, folderPath: string) => {
    const photos: Array<{
      path: string;
      filename: string;
      size: number;
      date: string | null;
    }> = [];

    const scanDir = (dir: string) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            scanDir(fullPath);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (PHOTO_EXTENSIONS.includes(ext)) {
              try {
                const stats = fs.statSync(fullPath);
                photos.push({
                  path: fullPath,
                  filename: entry.name,
                  size: stats.size,
                  date: stats.mtime.toISOString(),
                });
              } catch (e) {
                console.error('Error reading file:', fullPath, e);
              }
            }
          }
        }
      } catch (e) {
        console.error('Error scanning directory:', dir, e);
      }
    };

    scanDir(folderPath);
    return { photos };
  });

  // Scan Apple Photos library
  ipcMain.handle('scan-apple-photos', async () => {
    const photos: Array<{
      path: string;
      filename: string;
      size: number;
      date: string | null;
    }> = [];

    try {
      // Try to find Apple Photos library
      const homeDir = app.getPath('home');
      const photosLibPath = path.join(homeDir, 'Pictures', 'Photos Library.photoslibrary');
      
      if (!fs.existsSync(photosLibPath)) {
        return { photos: [], error: 'Photos library not found' };
      }

      // Use osxphotos or sqlite to read the library
      // For now, we'll use a simple AppleScript approach
      const script = `
        tell application "Photos"
          set photoList to {}
          repeat with p in (get every media item)
            set photoPath to filename of p
            set photoDate to date of p
            set end of photoList to {photoPath, photoDate as string}
          end repeat
          return photoList
        end tell
      `;

      try {
        const result = execSync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, {
          timeout: 60000,
          encoding: 'utf8',
        });
        // Parse result and build photos array
        // Note: Full implementation would need proper parsing
        console.log('AppleScript result:', result);
      } catch (e) {
        console.warn('AppleScript failed, falling back to filesystem scan');
        // Fallback: scan the originals folder
        const originalsPath = path.join(photosLibPath, 'originals');
        if (fs.existsSync(originalsPath)) {
          const scanDir = (dir: string) => {
            try {
              const entries = fs.readdirSync(dir, { withFileTypes: true });
              for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                  scanDir(fullPath);
                } else if (entry.isFile()) {
                  const ext = path.extname(entry.name).toLowerCase();
                  if (PHOTO_EXTENSIONS.includes(ext)) {
                    try {
                      const stats = fs.statSync(fullPath);
                      photos.push({
                        path: fullPath,
                        filename: entry.name,
                        size: stats.size,
                        date: stats.mtime.toISOString(),
                      });
                    } catch (e) {
                      // Skip files we can't read
                    }
                  }
                }
              }
            } catch (e) {
              // Skip directories we can't access
            }
          };
          scanDir(originalsPath);
        }
      }
    } catch (e) {
      console.error('Error scanning Apple Photos:', e);
      return { photos: [], error: String(e) };
    }

    return { photos };
  });

  // Read file as buffer
  ipcMain.handle('read-file', async (_, filePath: string) => {
    try {
      return fs.readFileSync(filePath);
    } catch (e) {
      console.error('Error reading file:', filePath, e);
      return null;
    }
  });

  // Get EXIF data
  ipcMain.handle('get-exif', async (_, filePath: string) => {
    try {
      // Use exiftool if available
      const result = execSync(`exiftool -json "${filePath}"`, {
        encoding: 'utf8',
        timeout: 5000,
      });
      return JSON.parse(result)[0];
    } catch (e) {
      return null;
    }
  });

  // === File Watcher ===
  ipcMain.handle('get-watch-folders', () => {
    return fileWatcher.getWatchFolders();
  });

  ipcMain.handle('add-watch-folder', async (_, folderPath: string) => {
    return fileWatcher.addWatchFolder(folderPath);
  });

  ipcMain.handle('remove-watch-folder', async (_, folderPath: string) => {
    return fileWatcher.removeWatchFolder(folderPath);
  });

  // === Upload Queue ===
  ipcMain.handle('get-upload-queue', () => {
    return uploadQueue.getQueue();
  });

  ipcMain.handle('get-upload-stats', () => {
    return uploadQueue.getStats();
  });

  ipcMain.handle('retry-upload', async (_, id: string) => {
    return uploadQueue.retry(id);
  });

  ipcMain.handle('retry-all-uploads', () => {
    uploadQueue.retryAll();
  });

  ipcMain.handle('remove-upload', async (_, id: string) => {
    return uploadQueue.remove(id);
  });

  ipcMain.handle('clear-completed-uploads', () => {
    uploadQueue.clearCompleted();
  });

  // === Cache ===
  ipcMain.handle('get-cache-stats', () => {
    return cacheManager.getStats();
  });

  ipcMain.handle('clear-cache', async () => {
    await cacheManager.clear();
  });

  ipcMain.handle('get-cached', async (_, key: string, type: 'thumbnails' | 'files' = 'thumbnails') => {
    return cacheManager.get(key, type);
  });

  ipcMain.handle('set-cached', async (_, key: string, data: Buffer, type: 'thumbnails' | 'files' = 'thumbnails') => {
    await cacheManager.set(key, data, type);
  });
}
