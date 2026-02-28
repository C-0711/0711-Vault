/**
 * 0711 Vault API Client
 * Handles all communication with the backend
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

class VaultAPI {
  constructor() {
    this.token = localStorage.getItem('vault_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('vault_token', token);
    } else {
      localStorage.removeItem('vault_token');
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.setToken(null);
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async getSalt(email) {
    return this.request(`/auth/salt/${encodeURIComponent(email)}`);
  }

  async register(email, authHash, salt, encryptedMasterKey) {
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

  async login(email, authHash) {
    const result = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        auth_hash: authHash,
      }),
    });
    this.setToken(result.access_token);
    return result;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  // OAuth2 / 0711-I
  async oauthTokenExchange(code, redirectUri, codeVerifier = null) {
    const body = { code, redirect_uri: redirectUri };
    if (codeVerifier) body.code_verifier = codeVerifier;
    const result = await this.request('/auth/oauth/token', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    this.setToken(result.access_token);
    return result;
  }

  async setupVault(authHash, salt, encryptedMasterKey) {
    return this.request('/auth/setup-vault', {
      method: 'POST',
      body: JSON.stringify({
        auth_hash: authHash,
        salt,
        encrypted_master_key: encryptedMasterKey,
      }),
    });
  }

  async getVaultInfo() {
    return this.request('/auth/vault-info');
  }

  // Vault Items
  async getItems(type = null, limit = 100, offset = 0) {
    let url = `/vault/items?limit=${limit}&offset=${offset}`;
    if (type) url += `&item_type=${type}`;
    return this.request(url);
  }

  async getItem(id) {
    return this.request(`/vault/items/${id}`);
  }

  async createItem(itemType, fileSize, mimeType, encryptedMetadata = null, capturedAt = null) {
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

  async deleteItem(id) {
    return this.request(`/vault/items/${id}`, { method: 'DELETE' });
  }

  async uploadFile(uploadUrl, file, onProgress = null) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);

      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error('Upload failed'));
        }
      };

      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.send(file);
    });
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

  async trainFaces(faceIds, clusterId = null, encryptedName = null, relationship = null) {
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

  async updateFaceCluster(clusterId, updates) {
    return this.request(`/faces/clusters/${clusterId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Places
  async getPlaceClusters() {
    return this.request('/places/clusters');
  }

  async createPlaceCluster(encryptedName, placeType = null, latitude = null, longitude = null) {
    return this.request('/places/clusters', {
      method: 'POST',
      body: JSON.stringify({
        encrypted_name: encryptedName,
        place_type: placeType,
        latitude,
        longitude,
      }),
    });
  }

  // Search
  async semanticSearch(query, limit = 20) {
    return this.request('/search/semantic', {
      method: 'POST',
      body: JSON.stringify({ query, limit }),
    });
  }

  async searchByFace(clusterId) {
    return this.request(`/search/faces/${clusterId}`);
  }

  async searchByPlace(clusterId) {
    return this.request(`/search/places/${clusterId}`);
  }

  // Health
  async health() {
    return this.request('/health');
  }
}

export const api = new VaultAPI();
export default api;

// ============================================
// GIT API - VAULT-GIT VERSIONING
// ============================================

// Spaces (repositories)
export async function getSpaces(tenantId = null) {
  const tenant = tenantId || localStorage.getItem('vault_tenant_id') || '00000000-0000-0000-0000-000000000001';
  return api.request(`/git/spaces?tenant_id=${tenant}`);
}

export async function createSpace(name, description = '', visibility = 'private') {
  const tenant = localStorage.getItem('vault_tenant_id') || '00000000-0000-0000-0000-000000000001';
  const userId = localStorage.getItem('vault_user_id') || '00000000-0000-0000-0000-000000000099';
  return api.request(`/git/spaces?tenant_id=${tenant}&user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify({ name, description, visibility }),
  });
}

export async function getSpace(spaceId) {
  return api.request(`/git/spaces/${spaceId}`);
}

// Branches
export async function getBranches(spaceId) {
  return api.request(`/git/spaces/${spaceId}/branches`);
}

export async function createBranch(spaceId, name, fromBranch = 'main') {
  const userId = localStorage.getItem('vault_user_id') || '00000000-0000-0000-0000-000000000099';
  return api.request(`/git/spaces/${spaceId}/branches?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify({ name, from_branch: fromBranch }),
  });
}

// Snapshots (commits)
export async function createSnapshot(spaceId, message, files, branch = 'main') {
  const userId = localStorage.getItem('vault_user_id') || '00000000-0000-0000-0000-000000000099';
  return api.request(`/git/spaces/${spaceId}/snapshots?branch=${encodeURIComponent(branch)}&user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify({ message, files }),
  });
}

export async function getHistory(spaceId, branch = 'main', limit = 50) {
  return api.request(`/git/spaces/${spaceId}/history?branch=${encodeURIComponent(branch)}&limit=${limit}`);
}

// Tree & Blobs
export async function getTree(spaceId, ref = 'main', path = '/') {
  return api.request(`/git/spaces/${spaceId}/tree?ref=${encodeURIComponent(ref)}&path=${encodeURIComponent(path)}`);
}

export async function getBlob(spaceId, path, ref = 'main') {
  return api.request(`/git/spaces/${spaceId}/blob/${encodeURIComponent(path)}?ref=${encodeURIComponent(ref)}`);
}

// Diff
export async function getDiff(spaceId, fromRef, toRef) {
  return api.request(`/git/spaces/${spaceId}/diff?from_ref=${encodeURIComponent(fromRef)}&to_ref=${encodeURIComponent(toRef)}`);
}

// Reviews (Pull Requests)
export async function getReviews(spaceId, status = null) {
  let url = `/git/spaces/${spaceId}/reviews`;
  if (status) url += `?status=${status}`;
  return api.request(url);
}

export async function createReview(spaceId, title, sourceBranch, targetBranch = 'main', description = '') {
  const userId = localStorage.getItem('vault_user_id') || '00000000-0000-0000-0000-000000000099';
  return api.request(`/git/spaces/${spaceId}/reviews?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify({ title, source_branch: sourceBranch, target_branch: targetBranch, description }),
  });
}

export async function mergeReview(spaceId, reviewId) {
  const userId = localStorage.getItem('vault_user_id') || '00000000-0000-0000-0000-000000000099';
  return api.request(`/git/spaces/${spaceId}/reviews/${reviewId}/merge?user_id=${userId}`, {
    method: 'POST',
  });
}
