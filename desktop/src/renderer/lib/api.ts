/**
 * API Client for 0711 Vault
 */

import axios, { AxiosInstance } from 'axios';

class ApiClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = localStorage.getItem('api_url') || 'https://api-vault.0711.io';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
    this.client.defaults.baseURL = url;
    localStorage.setItem('api_url', url);
  }

  setToken(token: string | null) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  // Generic methods
  get<T = any>(url: string, config?: any) {
    return this.client.get<T>(url, config);
  }

  post<T = any>(url: string, data?: any, config?: any) {
    return this.client.post<T>(url, data, config);
  }

  put<T = any>(url: string, data?: any, config?: any) {
    return this.client.put<T>(url, data, config);
  }

  delete<T = any>(url: string, config?: any) {
    return this.client.delete<T>(url, config);
  }

  // Vault-specific methods
  async getStats() {
    return this.get('/vault/stats');
  }

  async getItems(params?: { item_type?: string; limit?: number; offset?: number }) {
    return this.get('/vault/items', { params });
  }

  async getItem(id: string) {
    return this.get(`/vault/items/${id}`);
  }

  async createItem(data: {
    item_type: string;
    file_size: number;
    mime_type: string;
    captured_at?: string;
  }) {
    return this.post('/vault/items', data);
  }

  async deleteItem(id: string) {
    return this.delete(`/vault/items/${id}`);
  }

  async search(query: string, limit = 20) {
    return this.post('/search/semantic', { query, limit });
  }

  async chat(message: string, conversationId?: string) {
    return this.post('/assistant/chat', {
      message,
      conversation_id: conversationId,
      include_context: true,
    });
  }

  async getHighlights(days = 7) {
    return this.get('/assistant/memories/highlights', { params: { days } });
  }

  async getOnThisDay() {
    return this.get('/assistant/memories/on-this-day');
  }

  async getFaceClusters() {
    return this.get('/faces/clusters');
  }

  async getPlans() {
    return this.get('/billing/plans');
  }

  async getSubscription() {
    return this.get('/billing/subscription');
  }
}

export const api = new ApiClient();
