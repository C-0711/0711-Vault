/**
 * macOS Menu Bar
 */

import { app, Menu, shell, BrowserWindow } from 'electron';

const isMac = process.platform === 'darwin';

export function createMenu(): Menu {
  const template: Electron.MenuItemConstructorOptions[] = [
    // App menu (macOS only)
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        {
          label: 'Preferences...',
          accelerator: 'Cmd+,',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('navigate', '/settings');
          },
        },
        { type: 'separator' as const },
        { role: 'services' as const },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const },
      ],
    }] : []),

    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New Upload',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('action', 'upload');
          },
        },
        { type: 'separator' },
        {
          label: 'Import from Apple Photos...',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('navigate', '/migration/apple-photos');
          },
        },
        {
          label: 'Import from Google Photos...',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('navigate', '/migration/google-photos');
          },
        },
        {
          label: 'Import Folder...',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('action', 'import-folder');
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close' as const } : { role: 'quit' as const },
      ],
    },

    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' as const },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        { role: 'selectAll' as const },
        { type: 'separator' as const },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('action', 'search');
          },
        },
      ],
    },

    // View menu
    {
      label: 'View',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('navigate', '/');
          },
        },
        {
          label: 'Photos',
          accelerator: 'CmdOrCtrl+2',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('navigate', '/photos');
          },
        },
        {
          label: 'Albums',
          accelerator: 'CmdOrCtrl+3',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('navigate', '/albums');
          },
        },
        {
          label: 'People',
          accelerator: 'CmdOrCtrl+4',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('navigate', '/people');
          },
        },
        {
          label: 'Documents',
          accelerator: 'CmdOrCtrl+5',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('navigate', '/documents');
          },
        },
        {
          label: 'AI Assistant',
          accelerator: 'CmdOrCtrl+6',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('navigate', '/assistant');
          },
        },
        { type: 'separator' as const },
        { role: 'reload' as const },
        { role: 'forceReload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' as const },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' as const },
        { role: 'togglefullscreen' as const },
      ],
    },

    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' as const },
        { role: 'zoom' as const },
        ...(isMac ? [
          { type: 'separator' as const },
          { role: 'front' as const },
        ] : [
          { role: 'close' as const },
        ]),
      ],
    },

    // Help menu
    {
      label: 'Help',
      submenu: [
        {
          label: '0711 Vault Documentation',
          click: async () => {
            await shell.openExternal('https://docs.0711.io');
          },
        },
        {
          label: 'Report an Issue',
          click: async () => {
            await shell.openExternal('https://github.com/0711-vault/issues');
          },
        },
        { type: 'separator' },
        {
          label: 'Privacy Policy',
          click: async () => {
            await shell.openExternal('https://get.0711.io/privacy.html');
          },
        },
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}
