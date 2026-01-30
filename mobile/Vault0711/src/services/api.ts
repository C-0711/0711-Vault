/**
 * 0711 Vault API Service
 * React Native API client
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = __DEV__ 
  ? 'http://localhost:8000' 
  : 'https://api.vault.0711.io';

class VaultAPI {
  private token: string | null = null;

  async init() {
    this.token = await AsyncStorage.getItem('vault_token');
  }

  async setToken(token: string | null) {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem('vault_token', token);
    } else {
      await AsyncStorage.removeItem('vault_token');
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as any)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      await this.setToken(null);
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async getSalt(email: string) {
    return this.request(`/auth/salt/${encodeURIComponent(email)}`);
  }

  async register(email: string, authHash: string, salt: string, encryptedMasterKey: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        auth_hash: authHash,
        salt,
        encrypted_master_key: encryptedMasterKey,
      }),
    });
  }

  async login(email: string, authHash: string) {
    const result = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        auth_hash: authHash,
      }),
    });
    await this.setToken(result.access_token);
    return result;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      await this.setToken(null);
    }
  }

  // Vault Items
  async getItems(type: string | null = null, limit = 100, offset = 0) {
    let url = `/vault/items?limit=${limit}&offset=${offset}`;
    if (type) url += `&item_type=${type}`;
    return this.request(url);
  }

  async getItem(id: string) {
    return this.request(`/vault/items/${id}`);
  }

  async createItem(
    itemType: string,
    fileSize: number,
    mimeType: string,
    encryptedMetadata: string | null = null,
    capturedAt: string | null = null
  ) {
    return this.request('/vault/items', {
      method: 'POST',
      body: JSON.stringify({
        item_type: itemType,
        file_size: fileSize,
        mime_type: mimeType,
        encrypted_metadata: encryptedMetadata,
        captured_at: capturedAt,
      }),
    });
  }

  async deleteItem(id: string) {
    return this.request(`/vault/items/${id}`, { method: 'DELETE' });
  }

  async uploadFile(uploadUrl: string, fileUri: string, mimeType: string) {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType,
      },
      body: {
        uri: fileUri,
        type: mimeType,
        name: 'upload',
      } as any,
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
  }

  // Stats
  async getStats() {
    return this.request('/vault/stats');
  }

  async getProcessingStatus() {
    return this.request('/processing/status');
  }

  // Faces
  async getFaceClusters() {
    return this.request('/faces/clusters');
  }

  async getUnlabeledFaces(limit = 50) {
    return this.request(`/faces/unlabeled?limit=${limit}`);
  }

  async trainFaces(
    faceIds: string[],
    clusterId: string | null = null,
    encryptedName: string | null = null,
    relationship: string | null = null
  ) {
    return this.request('/faces/train', {
      method: 'POST',
      body: JSON.stringify({
        face_ids: faceIds,
        cluster_id: clusterId,
        encrypted_name: encryptedName,
        relationship,
      }),
    });
  }

  // Search
  async semanticSearch(query: string, limit = 20) {
    return this.request('/search/semantic', {
      method: 'POST',
      body: JSON.stringify({ query, limit }),
    });
  }

  async searchByFace(clusterId: string) {
    return this.request(`/search/faces/${clusterId}`);
  }

  // Health
  async health() {
    return this.request('/health');
  }
}

export const api = new VaultAPI();
export default api;
