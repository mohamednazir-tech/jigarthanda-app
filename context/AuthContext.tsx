import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';
import { tamilNaduUsers } from '@/mocks/users';
import PushNotificationService from '@/services/PushNotificationService';

const AUTH_KEY = 'hanifa_auth_user';
const USERS_DB_KEY = 'hanifa_users_db';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const storedUsersDb = await AsyncStorage.getItem(USERS_DB_KEY);
      
      // Always reset to new users for now to ensure login works
      await AsyncStorage.setItem(USERS_DB_KEY, JSON.stringify(tamilNaduUsers));
      setUsers(tamilNaduUsers);
      console.log('Reset users database with new users:', tamilNaduUsers.map(u => u.username));
      
      const storedAuth = await AsyncStorage.getItem(AUTH_KEY);
      if (storedAuth) {
        const parsedUser = JSON.parse(storedAuth);
        setUser({ ...parsedUser, createdAt: new Date(parsedUser.createdAt) });
        console.log('User session restored:', parsedUser.username);
      }
    } catch (error) {
      console.log('Error initializing auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const storedUsersDb = await AsyncStorage.getItem(USERS_DB_KEY);
      const usersDb: User[] = storedUsersDb ? JSON.parse(storedUsersDb) : tamilNaduUsers;

      const foundUser = usersDb.find(
        (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
      );

      if (foundUser) {
        setUser(foundUser);
        await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(foundUser));
        console.log('Login successful:', foundUser.username);
        
        // Register device for push notifications
        try {
          await PushNotificationService.registerDevice(foundUser.id);
          console.log('Device registered for push notifications');
        } catch (error) {
          console.log('Push notification registration failed:', error);
        }
        
        return { success: true, message: `Welcome ${foundUser.name}!` };
      } else {
        console.log('Login failed: Invalid credentials');
        return { success: false, message: 'Invalid username or password' };
      }
    } catch (error) {
      console.log('Login error:', error);
      return { success: false, message: 'An error occurred during login' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Deactivate device for push notifications
      try {
        await PushNotificationService.logoutDevice();
      } catch (error) {
        console.log('Device logout failed:', error);
      }
      
      setUser(null);
      await AsyncStorage.removeItem(AUTH_KEY);
      console.log('User logged out');
    } catch (error) {
      console.log('Logout error:', error);
    }
  }, []);

  const addUser = useCallback(async (newUser: Omit<User, 'id' | 'createdAt'>): Promise<{ success: boolean; message: string }> => {
    try {
      const storedUsersDb = await AsyncStorage.getItem(USERS_DB_KEY);
      const usersDb: User[] = storedUsersDb ? JSON.parse(storedUsersDb) : [];

      const existingUser = usersDb.find((u) => u.username.toLowerCase() === newUser.username.toLowerCase());
      if (existingUser) {
        return { success: false, message: 'Username already exists' };
      }

      const userToAdd: User = {
        ...newUser,
        id: `usr_${Date.now()}`,
        createdAt: new Date(),
      };

      const updatedUsers = [...usersDb, userToAdd];
      await AsyncStorage.setItem(USERS_DB_KEY, JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
      
      console.log('New user added:', userToAdd.username);
      return { success: true, message: 'User created successfully' };
    } catch (error) {
      console.log('Add user error:', error);
      return { success: false, message: 'Failed to create user' };
    }
  }, []);

  const getAllUsers = useCallback(async (): Promise<User[]> => {
    try {
      const storedUsersDb = await AsyncStorage.getItem(USERS_DB_KEY);
      return storedUsersDb ? JSON.parse(storedUsersDb) : [];
    } catch (error) {
      console.log('Get users error:', error);
      return [];
    }
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    users,
    login,
    logout,
    addUser,
    getAllUsers,
  };
});