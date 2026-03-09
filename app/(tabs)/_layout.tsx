import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import Colors from '@/constants/colors';
import { StyleSheet } from "react-native";

export default function TabLayout() {
  const { user } = useAuth();
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Check current user on mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        console.log('🔍 TabLayout - Current userId:', userId);
        console.log('🔍 TabLayout - Auth context user:', user?.id);
        setCurrentUser(userId);
      } catch (err) {
        console.error('Error checking user in TabLayout:', err);
      }
    };
    
    checkUser();
  }, [user]); // Update when user changes

  // Use fallback from auth context if AsyncStorage is not ready
  const effectiveUser = currentUser || user?.id;
  console.log('🔍 TabLayout - Effective user:', effectiveUser);
  console.log('🔍 TabLayout - Show Orders?', effectiveUser !== 'usr_admin_001');
  console.log('🔍 TabLayout - Show Report?', effectiveUser === 'usr_nazir_001');

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
      
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarButton: (props) => {
            // Hide Orders tab from admin users
            if (effectiveUser === 'usr_admin_001') {
              return null;
            }
            // Default behavior for other users
            return undefined;
          },
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
      
      <Tabs.Screen
        name="baseel-report"
        options={{
          title: "Report",
          tabBarButton: (props) => {
            // Only show Report tab for Baseel users
            if (effectiveUser !== 'usr_nazir_001') {
              return null;
            }
            // Default behavior for Baseel users
            return undefined;
          },
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
