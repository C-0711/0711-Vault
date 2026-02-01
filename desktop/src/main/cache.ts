/**
 * Cache Manager - Local thumbnail & file caching
 */

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface CacheEntry {
  key: string;
  path: string;
  size: number;
  accessedAt: number;
  createdAt: number;
}

interface CacheConfig {
  maxSizeMB: number;
  maxAgeDays: number;
}

export class CacheManager {
  private cacheDir: string;
  private indexPath: string;
  private index: Map<string, CacheEntry> = new Map();
  private config: CacheConfig = {
    maxSizeMB: 500,
    maxAgeDays: 30,
  };

  constructor() {
    this.cacheDir = path.join(app.getPath('userData'), 'cache');
    this.indexPath = path.join(this.cacheDir, 'index.json');
    this.ensureCacheDir();
    this.loadIndex();
  }

  private ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
    
    // Create subdirectories
    for (const sub of ['thumbnails', 'files', 'temp']) {
      const subDir = path.join(this.cacheDir, sub);
      if (!fs.existsSync(subDir)) {
        fs.mkdirSync(subDir);
      }
    }
  }

  private loadIndex() {
    try {
      if (fs.existsSync(this.indexPath)) {
        const data = JSON.parse(fs.readFileSync(this.indexPath, 'utf8'));
        this.index = new Map(Object.entries(data));
      }
    } catch (e) {
      console.error('Error loading cache index:', e);
      this.index = new Map();
    }
  }

  private saveIndex() {
    try {
      const data = Object.fromEntries(this.index);
      fs.writeFileSync(this.indexPath, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('Error saving cache index:', e);
    }
  }

  private getKeyHash(key: string): string {
    return crypto.createHash('md5').update(key).digest('hex');
  }

  async get(key: string, type: 'thumbnails' | 'files' = 'thumbnails'): Promise<Buffer | null> {
    const entry = this.index.get(key);
    if (!entry) {
      return null;
    }

    try {
      if (!fs.existsSync(entry.path)) {
        this.index.delete(key);
        this.saveIndex();
        return null;
      }

      // Update access time
      entry.accessedAt = Date.now();
      this.index.set(key, entry);

      return fs.readFileSync(entry.path);
    } catch (e) {
      console.error('Error reading cache:', key, e);
      return null;
    }
  }

  async set(key: string, data: Buffer, type: 'thumbnails' | 'files' = 'thumbnails'): Promise<void> {
    const hash = this.getKeyHash(key);
    const filePath = path.join(this.cacheDir, type, hash);

    try {
      fs.writeFileSync(filePath, data);

      const entry: CacheEntry = {
        key,
        path: filePath,
        size: data.length,
        accessedAt: Date.now(),
        createdAt: Date.now(),
      };

      this.index.set(key, entry);
      this.saveIndex();

      // Check if we need to evict old entries
      this.evictIfNeeded();
    } catch (e) {
      console.error('Error writing cache:', key, e);
    }
  }

  async delete(key: string): Promise<void> {
    const entry = this.index.get(key);
    if (!entry) {
      return;
    }

    try {
      if (fs.existsSync(entry.path)) {
        fs.unlinkSync(entry.path);
      }
      this.index.delete(key);
      this.saveIndex();
    } catch (e) {
      console.error('Error deleting cache:', key, e);
    }
  }

  async clear(): Promise<void> {
    try {
      for (const [key, entry] of this.index) {
        if (fs.existsSync(entry.path)) {
          fs.unlinkSync(entry.path);
        }
      }
      this.index.clear();
      this.saveIndex();
    } catch (e) {
      console.error('Error clearing cache:', e);
    }
  }

  getStats(): { count: number; sizeMB: number } {
    let totalSize = 0;
    for (const entry of this.index.values()) {
      totalSize += entry.size;
    }

    return {
      count: this.index.size,
      sizeMB: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
    };
  }

  private evictIfNeeded() {
    const stats = this.getStats();
    
    if (stats.sizeMB <= this.config.maxSizeMB) {
      return;
    }

    // Sort by last accessed time, oldest first
    const entries = Array.from(this.index.entries())
      .sort((a, b) => a[1].accessedAt - b[1].accessedAt);

    // Evict oldest until under limit
    let currentSize = stats.sizeMB;
    for (const [key, entry] of entries) {
      if (currentSize <= this.config.maxSizeMB * 0.8) {
        break;
      }

      try {
        if (fs.existsSync(entry.path)) {
          fs.unlinkSync(entry.path);
        }
        this.index.delete(key);
        currentSize -= entry.size / (1024 * 1024);
      } catch (e) {
        console.error('Error evicting cache entry:', key, e);
      }
    }

    this.saveIndex();
  }

  // Cleanup old entries
  async cleanup() {
    const maxAge = this.config.maxAgeDays * 24 * 60 * 60 * 1000;
    const now = Date.now();

    for (const [key, entry] of this.index) {
      if (now - entry.createdAt > maxAge) {
        await this.delete(key);
      }
    }
  }
}

export const cacheManager = new CacheManager();
