import { API, API_ENDPOINTS } from '@/config/api';
import { Order, ShopSettings } from '@/types';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

class ApiService {
  // Generic API request method
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      // DEBUG: Log raw response
      const responseText = await response.text();
      console.log(`=== API DEBUG [${endpoint}] ===`);
      console.log('URL:', `${API.baseURL}${endpoint}`);
      console.log('Status:', response.status);
      console.log('Raw Response:', responseText);
      console.log('================================');

      const data = JSON.parse(responseText);
      
      if (!response.ok) {
        throw new Error((data as any).message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      return {
        success: false,
        message: (error as Error).message || 'Network error',
      };
    }
  }

  // Orders API
  static async getOrders(): Promise<Order[]> {
    const response = await this.request<Order[]>(API_ENDPOINTS.ORDERS);
    return response.success ? response.data || [] : [];
  }

  static async createOrder(order: Omit<Order, 'id'>): Promise<Order | null> {
    const response = await this.request<Order>(API_ENDPOINTS.ORDERS, {
      method: 'POST',
      body: JSON.stringify({
        ...order,
        createdAt: new Date().toISOString(),
      }),
    });

    return response.success && response.data ? response.data : null;
  }

  static async updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
    const response = await this.request<Order>(`${API_ENDPOINTS.ORDERS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    return response.success && response.data ? response.data : null;
  }

  static async deleteOrder(id: string): Promise<boolean> {
    const response = await this.request(`${API_ENDPOINTS.ORDERS}/${id}`, {
      method: 'DELETE',
    });

    return response.success;
  }

  // Settings API
  static async getSettings(): Promise<ShopSettings | null> {
    const response = await this.request<ShopSettings>(API_ENDPOINTS.SETTINGS);
    return response.success && response.data ? response.data : null;
  }

  static async updateSettings(settings: Partial<ShopSettings>): Promise<ShopSettings | null> {
    const response = await this.request<ShopSettings>(API_ENDPOINTS.SETTINGS, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });

    return response.success && response.data ? response.data : null;
  }

  // Health check
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await this.request(API_ENDPOINTS.HEALTH);
      return response.success && response.data !== undefined;
      return response.success;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Sync multiple orders
  static async syncOrders(orders: Order[]): Promise<boolean> {
    try {
      const response = await this.request(API_ENDPOINTS.SYNC, {
        method: 'POST',
        body: JSON.stringify({ orders }),
      });

      return response.success;
    } catch (error) {
      console.error('Sync orders failed:', error);
      return false;
    }
  }
}

export default ApiService;
