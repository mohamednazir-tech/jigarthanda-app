import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order, ShopSettings } from '@/types';

// For now, use local storage until API is properly configured
export interface SyncResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface CloudOrder extends Order {
  syncedAt?: Date;
  cloudId?: string;
}

class CloudSyncService {
  // Local storage keys (temporary solution)
  private static readonly ORDERS_KEY = 'hanifa_orders';
  private static readonly SETTINGS_KEY = 'hanifa_settings';

  // Sync orders to local storage (temporary - will be replaced with real API)
  static async syncOrdersToCloud(orders: Order[]): Promise<SyncResponse> {
    try {
      await AsyncStorage.setItem(this.ORDERS_KEY, JSON.stringify(orders));
      console.log('Orders saved locally:', orders.length);
      
      return {
        success: true,
        message: 'Orders saved locally'
      };
    } catch (error) {
      console.error('Failed to save orders:', error);
      return {
        success: false,
        message: 'Failed to save orders'
      };
    }
  }

  // Fetch orders from local storage
  static async fetchOrdersFromCloud(): Promise<CloudOrder[]> {
    try {
      const orders = await AsyncStorage.getItem(this.ORDERS_KEY);
      return orders ? JSON.parse(orders) : [];
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      return [];
    }
  }

  // Get sync status
  static async getSyncStatus(): Promise<{ synced: Order[]; pending: Order[] }> {
    try {
      const orders = await this.fetchOrdersFromCloud();
      return {
        synced: orders,
        pending: []
      };
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return { synced: [], pending: [] };
    }
  }

  // Auto-sync every 5 minutes
  static startAutoSync(orders: Order[]): void {
    setInterval(async () => {
      await this.syncOrdersToCloud(orders);
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Sync settings to local storage
  static async syncSettingsToCloud(settings: ShopSettings): Promise<SyncResponse> {
    try {
      await AsyncStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
      console.log('Settings saved locally:', settings.name);
      
      return {
        success: true,
        message: 'Settings saved locally'
      };
    } catch (error) {
      console.error('Failed to save settings:', error);
      return {
        success: false,
        message: 'Failed to save settings'
      };
    }
  }

  // Fetch settings from local storage
  static async fetchSettingsFromCloud(): Promise<ShopSettings | null> {
    try {
      const settings = await AsyncStorage.getItem(this.SETTINGS_KEY);
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      return null;
    }
  }
}

export default CloudSyncService;
