/**
 * IPC Handlers for native macOS features
 */

import { ipcMain, dialog, shell, app, systemPreferences, Notification } from 'electron';

// Dynamic import for native module
let keytar: typeof import('keytar') | null = null;
try {
  keytar = require('keytar');
} catch (e) {
  console.warn('keytar not available, secure storage disabled');
}

const SERVICE_NAME = '0711-vault';

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
}
