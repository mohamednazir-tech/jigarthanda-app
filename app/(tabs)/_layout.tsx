import { Tabs } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabLayout() {
  const [currentUser, setCurrentUser] = React.useState<string | null>(null);

  React.useEffect(() => {
    const checkUser = async () => {
      const userId = await AsyncStorage.getItem('userId');
      console.log('🔍 TabLayout - Current userId:', userId);
      
      // For debugging, allow access like the report page
      // If userId is null, treat as admin for testing
      setCurrentUser(userId || 'usr_admin_001');
    };
    
    // Check user on mount
    checkUser();
    
    // Set up interval to check for user changes (for debugging)
    const interval = setInterval(checkUser, 2000); // Check every 2 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Determine which tabs to show
  const shouldShowOrders = currentUser !== 'usr_admin_001';
  const shouldShowReport = currentUser === 'usr_nazir_001';
  
  console.log('🔍 Navigation Logic - currentUser:', currentUser);
  console.log('🔍 Show Orders:', shouldShowOrders);
  console.log('🔍 Show Report:', shouldShowReport);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          paddingTop: 8,
          height: 88,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Menu",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons 
                name="restaurant" 
                size={24} 
                color={color}
              />
            </View>
          ),
        }}
      />
      
      {shouldShowOrders && (
        <Tabs.Screen
          name="orders"
          options={{
            title: "Orders",
            tabBarIcon: ({ color, size, focused }) => (
              <View style={styles.iconContainer}>
                <Ionicons 
                  name="list" 
                  size={24} 
                  color={color}
                />
              </View>
            ),
          }}
        />
      )}
      
      {shouldShowReport && (
        <Tabs.Screen
          name="baseel-report"
          options={{
            title: "Report",
            tabBarIcon: ({ color, size, focused }) => (
              <View style={styles.iconContainer}>
                <Ionicons 
                  name="analytics" 
                  size={24} 
                  color={color}
                />
              </View>
            ),
          }}
        />
      )}
      
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons 
                name="settings" 
                size={24} 
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
});
