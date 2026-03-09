import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { API } from '@/config/api';

// Safe device detection with fallback
const getDeviceId = () => {
  try {
    const Device = require('expo-device').default;
    return Device.osName || 'unknown';
  } catch (error) {
    return Platform.OS === 'web' ? 'web' : 'mobile';
  }
};

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface DeviceInfo {
  userId: string;
  token: string;
  platform: string;
}

class PushNotificationService {
  private static isInitialized = false;

  // Initialize push notifications
  static async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Safe device check with fallback
      let isDevice = true;
      try {
        const Device = require('expo-device').default;
        isDevice = Device.isDevice;
      } catch (error) {
        isDevice = Platform.OS !== 'web';
      }

      if (!isDevice) {
        console.log('Push notifications require physical device');
        return false;
      }

      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Push notification permission denied');
        return false;
      }

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          enableVibrate: true,
        });
      }

      this.isInitialized = true;
      console.log('Push notifications initialized');
      return true;
    } catch (error) {
      console.error('Push notification initialization failed:', error);
      return false;
    }
  }

  // Get push token for device
  static async getPushToken(): Promise<string | null> {
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;
      console.log('Push token obtained:', token);
      return token;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  // Register device for push notifications
  static async registerDevice(userId: string): Promise<boolean> {
    try {
      // Skip push notifications in development mode
      if (__DEV__) {
        console.log('Push notifications disabled in development mode');
        return true;
      }

      const isInitialized = await this.initialize();
      if (!isInitialized) return false;

      const token = await this.getPushToken();
      if (!token) return false;

      // Send token to backend
      const response = await fetch(`${API.baseURL}/register-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          token,
          platform: Platform.OS,
        }),
      });

      if (response.ok) {
        console.log('Device registered for push notifications');
        return true;
      } else {
        console.error('Failed to register device');
        return false;
      }
    } catch (error) {
      console.error('Device registration failed:', error);
      return false;
    }
  }

  // Logout device - deactivate device on logout
  static async logoutDevice(): Promise<boolean> {
    try {
      // Skip push notifications in development mode
      if (__DEV__) {
        console.log('Push notifications disabled in development mode');
        return true;
      }

      const isInitialized = await this.initialize();
      if (!isInitialized) return false;

      const token = await this.getPushToken();
      if (!token) return false;

      // Deactivate device on backend
      const response = await fetch(`${API.baseURL}/logout-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
        }),
      });

      if (response.ok) {
        console.log('Device deactivated on logout');
        return true;
      } else {
        console.error('Failed to deactivate device');
        return false;
      }
    } catch (error) {
      console.error('Device logout failed:', error);
      return false;
    }
  }

  // Send local notification (fallback)
  static async sendLocalNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Failed to send local notification:', error);
    }
  }

  // Handle incoming notifications
  static setupNotificationListener(): void {
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      // Handle notification tap (e.g., navigate to orders screen)
    });

    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });
  }
}

export default PushNotificationService;
