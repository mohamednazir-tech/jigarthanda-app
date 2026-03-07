import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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

// Request permissions
export const requestNotificationPermission = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      enableVibrate: true,
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

// Show order notification for Baseel
export const showOrderNotification = async (order: any) => {
  const hasPermission = await requestNotificationPermission();
  
  if (!hasPermission) {
    console.log('Notification permission denied');
    return;
  }

  // Get item names for notification
  const itemNames = order.items.map((item: any) => item.item.name).slice(0, 3);
  const itemsText = itemNames.length > 2 
    ? `${itemNames.join(', ')} + ${order.items.length - 2} more`
    : itemNames.join(', ');

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🧾 New Order - Hanifa Jigarthanda',
      body: `${itemsText} • ₹${order.total}`,
      data: { orderId: order.id, type: 'new_order' },
    },
    trigger: null, // Show immediately
  });
};

// Show daily summary notification for Baseel
export const showDailySummaryNotification = async (orderCount: number, totalRevenue: number) => {
  const hasPermission = await requestNotificationPermission();
  
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📊 Daily Business Summary',
      body: `${orderCount} orders • ₹${totalRevenue} revenue today`,
      data: { type: 'daily_summary' },
    },
    trigger: null,
  });
};
