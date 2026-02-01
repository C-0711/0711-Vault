/**
 * File Watcher - Auto-upload from watched folders
 */

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

const PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'];
const DEBOUNCE_MS = 1000;

interface WatchedFile {
  path: string;
  filename: string;
  size: number;
  mtime: Date;
}

export class FileWatcher extends EventEmitter {
  private watchers: Map<string, fs.FSWatcher> = new Map();
  private pendingFiles: Map<string, NodeJS.Timeout> = new Map();
  private configPath: string;
  private config: { watchFolders: string[] } = { watchFolders: [] };

  constructor() {
    super();
    this.configPath = path.join(app.getPath('userData'), 'watch-config.json');
    this.loadConfig();
  }

  private loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      }
    } catch (e) {
      console.error('Error loading watch config:', e);
    }
  }

  private saveConfig() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (e) {
      console.error('Error saving watch config:', e);
    }
  }

  getWatchFolders(): string[] {
    return this.config.watchFolders;
  }

  addWatchFolder(folderPath: string): boolean {
    if (this.config.watchFolders.includes(folderPath)) {
      return false;
    }

    if (!fs.existsSync(folderPath)) {
      return false;
    }

    this.config.watchFolders.push(folderPath);
    this.saveConfig();
    this.startWatching(folderPath);
    return true;
  }

  removeWatchFolder(folderPath: string): boolean {
    const index = this.config.watchFolders.indexOf(folderPath);
    if (index === -1) {
      return false;
    }

    this.config.watchFolders.splice(index, 1);
    this.saveConfig();
    this.stopWatching(folderPath);
    return true;
  }

  startAll() {
    for (const folder of this.config.watchFolders) {
      this.startWatching(folder);
    }
  }

  stopAll() {
    for (const [folder] of this.watchers) {
      this.stopWatching(folder);
    }
  }

  private startWatching(folderPath: string) {
    if (this.watchers.has(folderPath)) {
      return;
    }

    try {
      const watcher = fs.watch(folderPath, { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        
        const fullPath = path.join(folderPath, filename);
        const ext = path.extname(filename).toLowerCase();
        
        if (!PHOTO_EXTENSIONS.includes(ext)) {
          return;
        }

        // Debounce to handle multiple events for same file
        if (this.pendingFiles.has(fullPath)) {
          clearTimeout(this.pendingFiles.get(fullPath)!);
        }

        this.pendingFiles.set(fullPath, setTimeout(() => {
          this.pendingFiles.delete(fullPath);
          this.handleFileChange(fullPath);
        }, DEBOUNCE_MS));
      });

      this.watchers.set(folderPath, watcher);
      console.log('Started watching:', folderPath);
    } catch (e) {
      console.error('Error watching folder:', folderPath, e);
    }
  }

  private stopWatching(folderPath: string) {
    const watcher = this.watchers.get(folderPath);
    if (watcher) {
      watcher.close();
      this.watchers.delete(folderPath);
      console.log('Stopped watching:', folderPath);
    }
  }

  private handleFileChange(filePath: string) {
    try {
      if (!fs.existsSync(filePath)) {
        return; // File was deleted
      }

      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        return;
      }

      const file: WatchedFile = {
        path: filePath,
        filename: path.basename(filePath),
        size: stats.size,
        mtime: stats.mtime,
      };

      this.emit('file-added', file);
    } catch (e) {
      console.error('Error handling file change:', filePath, e);
    }
  }
}

export const fileWatcher = new FileWatcher();
