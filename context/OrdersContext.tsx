import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order, CartItem, ShopSettings } from '@/types';
import { useAuth } from '@/context/AuthContext';
import CloudSyncService from '@/services/CloudSyncService';
import { showOrderNotification, showDailySummaryNotification } from '@/services/NotificationService';
import ApiService from '@/services/ApiService';
import PushNotificationService from '@/services/PushNotificationService';

const ORDERS_KEY = 'hanifa_orders';
const SETTINGS_KEY = 'hanifa_settings';

const defaultSettings: ShopSettings = {
  name: 'Madurai Vilakkuthoon Hanifa Jigarthanda',
  nameLocal: 'மதுரை விளக்குத்தூண் ஹனிஃபா ஜிகர்தண்டா',
  address: 'Chennai, Tamil Nadu - 600001',
  phone: '+91 98765 43210',
  gstNumber: '33AABCU9603R1ZM',
};

export const [OrdersProvider, useOrders] = createContextHook(() => {
  const { user } = useAuth();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  // Clean up orders older than 3 days
  useEffect(() => {
    const cleanupOldOrders = () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      threeDaysAgo.setHours(0, 0, 0, 0);

      const filteredOrders = allOrders.filter(order => 
        new Date(order.createdAt) >= threeDaysAgo
      );

      if (filteredOrders.length !== allOrders.length) {
        setAllOrders(filteredOrders);
        saveOrders(filteredOrders);
        console.log('Cleaned up orders older than 3 days. Removed:', allOrders.length - filteredOrders.length, 'orders');
      }
    };

    // Run cleanup on load and then every hour
    cleanupOldOrders();
    const cleanupInterval = setInterval(cleanupOldOrders, 60 * 60 * 1000); // Every hour

    return () => clearInterval(cleanupInterval);
  }, [allOrders]);

  // Daily summary notification for Nazir
  useEffect(() => {
    if (user?.role !== 'admin') return; // Only show for Nazir (admin)

    const checkDailySummary = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayOrders = allOrders.filter(order => 
        new Date(order.createdAt) >= today
      );

      if (todayOrders.length > 0) {
        const totalRevenue = todayOrders.reduce((sum, order) => sum + order.grandTotal, 0);
        showDailySummaryNotification(todayOrders.length, totalRevenue);
      }
    };

    // Check at 12 AM every day (midnight)
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    
    if (now > midnight) {
      midnight.setDate(midnight.getDate() + 1); // Schedule for tomorrow
    }
    
    const timeUntilMidnight = midnight.getTime() - now.getTime();
    const dailyTimeout = setTimeout(checkDailySummary, timeUntilMidnight);
    const dailyInterval = setInterval(checkDailySummary, 24 * 60 * 60 * 1000); // Every 24 hours

    return () => {
      clearTimeout(dailyTimeout);
      clearInterval(dailyInterval);
    };
  }, [allOrders, user]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Try to load from API first (multi-device support)
      const [apiOrders, apiSettings] = await Promise.all([
        ApiService.getOrders(),
        ApiService.getSettings(),
      ]);

      if (apiOrders.length > 0) {
        // Use API orders if available
        setAllOrders(apiOrders.map(order => ({
          ...order,
          createdAt: new Date(order.createdAt)
        })));
        console.log('Loaded orders from API:', apiOrders.length);
        
        // Also save to local storage as backup
        await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(apiOrders));
      } else {
        // Fallback to local storage
        const storedOrders = await AsyncStorage.getItem(ORDERS_KEY);
        if (storedOrders) {
          const parsed = JSON.parse(storedOrders);
          setAllOrders(parsed.map((o: Order) => ({ ...o, createdAt: new Date(o.createdAt) })));
          console.log('Loaded orders from local storage:', parsed.length);
        }
      }

      // Load settings with API support
      if (apiSettings) {
        setSettings(apiSettings);
        console.log('Loaded settings from API:', apiSettings.name);
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(apiSettings));
      } else {
        // Fallback to local storage
        const storedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
        if (!storedSettings) {
          setSettings(defaultSettings);
          await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
          await ApiService.updateSettings(defaultSettings);
          console.log('Set default shop settings:', defaultSettings.name);
        } else {
          const parsedSettings = JSON.parse(storedSettings);
          setSettings(parsedSettings);
          console.log('Loaded shop settings from local storage:', parsedSettings.name);
        }
      }
    } catch (error) {
      console.log('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveOrders = async (newOrders: Order[]) => {
    try {
      // Save to API first (multi-device sync)
      for (const order of newOrders) {
        await ApiService.createOrder(order);
      }
      
      // Also save to local storage as backup
      await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(newOrders));
      console.log('Orders saved to API and local storage:', newOrders.length);
    } catch (error) {
      console.log('Error saving orders:', error);
      // Fallback to local storage only
      await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(newOrders));
    }
  };

  const orders = useMemo(() => {
    if (!user) return [];
    return allOrders.filter(order => order.userId === user.id);
  }, [allOrders, user]);

  const createOrder = useCallback(async (items: CartItem[], paymentMethod: 'cash' | 'upi') => {
    if (!user) {
      console.log('Cannot create order: No user logged in');
      return null;
    }

    try {
      // Create order via API (with push notification)
      const order = await ApiService.createOrder({
        userId: user.id,
        items,
        total: items.reduce((sum, item) => sum + item.item.price * item.quantity, 0),
        tax: 0,
        grandTotal: items.reduce((sum, item) => sum + item.item.price * item.quantity, 0),
        paymentMethod,
        createdAt: new Date(),
      });

      if (order) {
        // Update local state
        const updatedOrders = [...allOrders, order];
        setAllOrders(updatedOrders);
        
        // Save to local storage as backup
        await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
        
        // Show local notification for admin user
        if (user.role === 'staff') {
          await showOrderNotification(order);
        }

        console.log('Order created for user:', user.username, 'Order ID:', order.id);
        return order;
      }

      return null;
    } catch (error) {
      console.error('Create order error:', error);
      return null;
    }
  }, [user, allOrders]);

  // Sync all orders to cloud - Temporarily disabled
  const syncAllOrders = useCallback(async () => {
    if (!user) return;
    
    // try {
    //   const response = await CloudSyncService.syncOrdersToCloud(allOrders);
    //   if (response.success) {
    //     console.log('All orders synced to cloud');
    //   }
    // } catch (error) {
    //   console.error('Failed to sync all orders:', error);
    // }
    console.log('Cloud sync temporarily disabled');
  }, [allOrders, user]);

  // Fetch orders from cloud - Temporarily disabled
  const fetchCloudOrders = useCallback(async () => {
    if (!user) return;
    
    // try {
    //   const cloudOrders = await CloudSyncService.fetchOrdersFromCloud();
    //   console.log('Fetched orders from cloud:', cloudOrders.length);
    //   return cloudOrders;
    // } catch (error) {
    //   console.error('Failed to fetch orders from cloud:', error);
    //   return [];
    // }
    console.log('Cloud sync temporarily disabled');
    return [];
  }, [user]);

  const updateSettings = useCallback(async (newSettings: Partial<ShopSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    try {
      // Save to API first (multi-device sync)
      await ApiService.updateSettings(updated);
      
      // Also save to local storage as backup
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      console.log('Settings saved to API and local storage:', updated.name);
    } catch (error) {
      console.log('Error saving settings:', error);
      // Fallback to local storage only
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    }
  }, [settings]);

  const todayOrders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return allOrders.filter(o => new Date(o.createdAt) >= today);
  }, [allOrders]);

  const todayTotal = useMemo(() => {
    return todayOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  }, [todayOrders]);


  const clearUserOrders = useCallback(async () => {
    if (!user) return;
    
    const filteredOrders = allOrders.filter(o => o.userId !== user.id);
    setAllOrders(filteredOrders);
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(filteredOrders));
    console.log('Cleared orders for user:', user.username);
  }, [allOrders, user]);

  return {
    orders,
    allOrders,
    settings,
    isLoading,
    createOrder,
    updateSettings,
    todayOrders,
    todayTotal,
    clearAllOrders: clearUserOrders,
  };
});
