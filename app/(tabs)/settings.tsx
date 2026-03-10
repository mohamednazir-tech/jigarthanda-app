import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useOrders } from '@/context/OrdersContext';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const { settings, updateSettings } = useOrders();
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState(settings);
  const [saved, setSaved] = useState(false);

  // Username and password change states
  const [username, setUsername] = useState(user?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const BASE_URL = 'https://jigarthanda-api.onrender.com';

  // Check if user can edit settings (admin and staff)
  const canEditSettings = user?.role === 'admin' || user?.role === 'staff';

  const handleSave = async () => {
    if (!canEditSettings) return;
    
    try {
      // Save shop settings
      await updateSettings(formData);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      Alert.alert('Saved', 'All settings have been updated');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleUsernameChange = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`${BASE_URL}/api/update-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          newUsername: username.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update users database in AsyncStorage
        const USERS_DB_KEY = 'hanifa_users_db';
        const storedUsersDb = await AsyncStorage.getItem(USERS_DB_KEY);
        const usersDb = storedUsersDb ? JSON.parse(storedUsersDb) : [];
        
        // Update username in the users database
        const updatedUsersDb = usersDb.map((u: any) => 
          u.id === user?.id ? { ...u, username: username.trim() } : u
        );
        
        await AsyncStorage.setItem(USERS_DB_KEY, JSON.stringify(updatedUsersDb));
        
        // Update user context
        if (user) {
          user.username = username.trim();
        }

        Alert.alert('Success', 'Username updated successfully!');
      } else {
        Alert.alert('Error', data.message || 'Failed to update username');
      }
    } catch (error) {
      console.error('Username update error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all password fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`${BASE_URL}/api/update-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          currentPassword: currentPassword,
          newPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update users database in AsyncStorage
        const USERS_DB_KEY = 'hanifa_users_db';
        const storedUsersDb = await AsyncStorage.getItem(USERS_DB_KEY);
        const usersDb = storedUsersDb ? JSON.parse(storedUsersDb) : [];
        
        // Update password in the users database
        const updatedUsersDb = usersDb.map((u: any) => 
          u.id === user?.id ? { ...u, password: newPassword } : u
        );
        
        await AsyncStorage.setItem(USERS_DB_KEY, JSON.stringify(updatedUsersDb));
        
        Alert.alert('Success', 'Password updated successfully!');
        
        // Clear password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('Error', data.message || 'Failed to update password');
      }
    } catch (error) {
      console.error('Password update error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {user && (
            <View style={styles.userCard}>
              <View style={styles.userAvatar}>
                <Ionicons name="person" size={24} color={Colors.white} />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <View style={styles.userMeta}>
                  <Ionicons name="location" size={12} color={Colors.textMuted} />
                  <Text style={styles.userDistrict}>{user.district} • {user.districtTamil}</Text>
                </View>
                <View style={styles.roleBadge}>
                  <Ionicons name="shield" size={10} color={Colors.primary} />
                  <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.shopPreview}>
            <View style={styles.shopLogo}>
              <Text style={styles.shopLogoText}>ஜி</Text>
            </View>
            <Text style={styles.shopPreviewName}>{formData.name}</Text>
            <Text style={styles.shopPreviewLocal}>{formData.nameLocal}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shop Details</Text>

            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <Ionicons name="business" size={18} color={Colors.primary} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Shop Name (English)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  editable={canEditSettings}
                  placeholder="Enter shop name"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <Ionicons name="business" size={18} color={Colors.primary} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Shop Name (Tamil)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.nameLocal}
                  onChangeText={(text) => setFormData({ ...formData, nameLocal: text })}
                  editable={canEditSettings}
                  placeholder="கடை பெயர்"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <Ionicons name="location" size={18} color={Colors.primary} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  editable={canEditSettings}
                  placeholder="Enter shop address"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <Ionicons name="call" size={18} color={Colors.primary} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  editable={canEditSettings}
                  placeholder="Enter phone number"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>


          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Billing Details</Text>

            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <Ionicons name="document-text" size={18} color={Colors.primary} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>GST Number</Text>
                <TextInput
                  style={styles.input}
                  value={formData.gstNumber}
                  onChangeText={(text) => setFormData({ ...formData, gstNumber: text })}
                  editable={canEditSettings}
                  placeholder="Enter GST number"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="characters"
                />
              </View>
            </View>
          </View>

          {/* Account Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Settings</Text>

            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <MaterialIcons name="person" size={18} color={Colors.primary} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter username"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.accountBtn, { backgroundColor: Colors.primary }]}
              onPress={handleUsernameChange}
              disabled={loading}
            >
              <MaterialIcons name="edit" size={18} color={Colors.white} />
              <Text style={styles.accountBtnText}>Update Username</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <MaterialIcons name="lock" size={18} color={Colors.primary} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <MaterialIcons name="lock-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <MaterialIcons name="lock-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.accountBtn, { backgroundColor: Colors.success }]}
              onPress={handlePasswordChange}
              disabled={loading}
            >
              <MaterialIcons name="security" size={18} color={Colors.white} />
              <Text style={styles.accountBtnText}>Update Password</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saved && styles.saveBtnSaved, !canEditSettings && styles.saveBtnDisabled]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={!canEditSettings}
          >
            {saved ? (
              <>
                <Ionicons name="checkmark" size={20} color={Colors.white} />
                <Text style={styles.saveBtnText}>Saved!</Text>
              </>
            ) : (
              <>
                <Ionicons name="save" size={20} color={Colors.white} />
                <Text style={styles.saveBtnText}>Save Settings</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out" size={20} color={Colors.error} />
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  shopPreview: {
    alignItems: 'center',
    marginBottom: 24,
  },
  shopLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  shopLogoText: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.white,
  },
  shopPreviewName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  shopPreviewLocal: {
    fontSize: 16,
    color: Colors.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.creamDark,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  inputWrapper: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    fontSize: 16,
    color: Colors.text,
    padding: 0,
  },
  inputMultiline: {
    minHeight: 40,
    textAlignVertical: 'top',
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnSaved: {
    backgroundColor: Colors.success,
  },
  saveBtnDisabled: {
    backgroundColor: Colors.textMuted,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    borderWidth: 2,
    borderColor: Colors.error,
  },
  logoutBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.error,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  userDistrict: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.cream,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  accountBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  accountBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
  },
});
