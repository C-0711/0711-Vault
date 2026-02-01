/**
 * Upload Queue - Background upload manager with retry
 */

import { app, BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

interface QueuedUpload {
  id: string;
  filePath: string;
  filename: string;
  size: number;
  mimeType: string;
  capturedAt: string | null;
  status: 'pending' | 'uploading' | 'complete' | 'failed';
  retries: number;
  error?: string;
  addedAt: number;
  completedAt?: number;
}

interface QueueConfig {
  maxConcurrent: number;
  maxRetries: number;
  retryDelayMs: number;
}

export class UploadQueue extends EventEmitter {
  private queuePath: string;
  private queue: QueuedUpload[] = [];
  private config: QueueConfig = {
    maxConcurrent: 3,
    maxRetries: 3,
    retryDelayMs: 5000,
  };
  private activeUploads: number = 0;
  private isOnline: boolean = true;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.queuePath = path.join(app.getPath('userData'), 'upload-queue.json');
    this.loadQueue();
  }

  private loadQueue() {
    try {
      if (fs.existsSync(this.queuePath)) {
        const data = JSON.parse(fs.readFileSync(this.queuePath, 'utf8'));
        this.queue = data.queue || [];
        
        // Reset uploading items to pending (crashed uploads)
        for (const item of this.queue) {
          if (item.status === 'uploading') {
            item.status = 'pending';
          }
        }
        this.saveQueue();
      }
    } catch (e) {
      console.error('Error loading upload queue:', e);
      this.queue = [];
    }
  }

  private saveQueue() {
    try {
      fs.writeFileSync(this.queuePath, JSON.stringify({ queue: this.queue }, null, 2));
    } catch (e) {
      console.error('Error saving upload queue:', e);
    }
  }

  setOnline(online: boolean) {
    this.isOnline = online;
    if (online) {
      this.processQueue();
    }
  }

  add(upload: Omit<QueuedUpload, 'id' | 'status' | 'retries' | 'addedAt'>): string {
    const id = `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    
    const item: QueuedUpload = {
      ...upload,
      id,
      status: 'pending',
      retries: 0,
      addedAt: Date.now(),
    };

    this.queue.push(item);
    this.saveQueue();
    this.emit('added', item);
    this.processQueue();

    return id;
  }

  remove(id: string): boolean {
    const index = this.queue.findIndex(item => item.id === id);
    if (index === -1) {
      return false;
    }

    const item = this.queue[index];
    if (item.status === 'uploading') {
      return false; // Can't remove while uploading
    }

    this.queue.splice(index, 1);
    this.saveQueue();
    this.emit('removed', item);
    return true;
  }

  retry(id: string): boolean {
    const item = this.queue.find(item => item.id === id);
    if (!item || item.status === 'uploading') {
      return false;
    }

    item.status = 'pending';
    item.retries = 0;
    item.error = undefined;
    this.saveQueue();
    this.processQueue();
    return true;
  }

  retryAll(): void {
    for (const item of this.queue) {
      if (item.status === 'failed') {
        item.status = 'pending';
        item.retries = 0;
        item.error = undefined;
      }
    }
    this.saveQueue();
    this.processQueue();
  }

  clearCompleted(): void {
    this.queue = this.queue.filter(item => item.status !== 'complete');
    this.saveQueue();
    this.emit('cleared');
  }

  getQueue(): QueuedUpload[] {
    return [...this.queue];
  }

  getStats(): { pending: number; uploading: number; complete: number; failed: number } {
    return {
      pending: this.queue.filter(item => item.status === 'pending').length,
      uploading: this.queue.filter(item => item.status === 'uploading').length,
      complete: this.queue.filter(item => item.status === 'complete').length,
      failed: this.queue.filter(item => item.status === 'failed').length,
    };
  }

  start() {
    if (this.processingInterval) {
      return;
    }

    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 5000);

    this.processQueue();
  }

  stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  private async processQueue() {
    if (!this.isOnline) {
      return;
    }

    if (this.activeUploads >= this.config.maxConcurrent) {
      return;
    }

    // Find pending items
    const pendingItems = this.queue.filter(item => item.status === 'pending');
    if (pendingItems.length === 0) {
      return;
    }

    // Start uploads up to max concurrent
    const toStart = pendingItems.slice(0, this.config.maxConcurrent - this.activeUploads);
    
    for (const item of toStart) {
      this.uploadItem(item);
    }
  }

  private async uploadItem(item: QueuedUpload) {
    item.status = 'uploading';
    this.activeUploads++;
    this.saveQueue();
    this.emit('progress', item);

    try {
      // Read file
      if (!fs.existsSync(item.filePath)) {
        throw new Error('File not found');
      }

      const fileBuffer = fs.readFileSync(item.filePath);

      // Get auth token from storage
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Create vault item
      const createResponse = await fetch('https://api-vault.0711.io/vault/items', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_type: item.mimeType.startsWith('image/') ? 'photo' : 'document',
          file_size: item.size,
          mime_type: item.mimeType,
          original_filename: item.filename,
          captured_at: item.capturedAt,
        }),
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create item: ${createResponse.status}`);
      }

      const { upload_url } = await createResponse.json();

      // Upload to storage
      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        headers: {
          'Content-Type': item.mimeType,
        },
        body: fileBuffer,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload: ${uploadResponse.status}`);
      }

      // Success!
      item.status = 'complete';
      item.completedAt = Date.now();
      this.emit('complete', item);

    } catch (e) {
      console.error('Upload error:', item.filename, e);
      item.retries++;
      item.error = String(e);

      if (item.retries >= this.config.maxRetries) {
        item.status = 'failed';
        this.emit('failed', item);
      } else {
        item.status = 'pending';
        // Exponential backoff
        setTimeout(() => this.processQueue(), this.config.retryDelayMs * item.retries);
      }
    } finally {
      this.activeUploads--;
      this.saveQueue();
    }
  }

  private async getAuthToken(): Promise<string | null> {
    // Get token from main window's localStorage via IPC
    const windows = BrowserWindow.getAllWindows();
    if (windows.length === 0) {
      return null;
    }

    try {
      const result = await windows[0].webContents.executeJavaScript(
        'localStorage.getItem("auth_token")'
      );
      return result;
    } catch (e) {
      return null;
    }
  }
}

export const uploadQueue = new UploadQueue();
