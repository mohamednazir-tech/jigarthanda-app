import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useCart } from '@/context/CartContext';
import { useOrders } from '@/context/OrdersContext';
import { useAuth } from '@/context/AuthContext';

type PaymentMethod = 'cash' | 'upi';

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, addItem, removeItem, clearCart, subtotal } = useCart();
  const { settings, createOrder } = useOrders();
  const { user } = useAuth(); // Get user from auth context
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isGeneratingBill, setIsGeneratingBill] = useState(false);
  const [spinValue] = useState(new Animated.Value(0));

  // Debug: Log user state
  console.log('Checkout - User state:', user);
  console.log('Checkout - User ID:', user?.id);
  console.log('Checkout - User name:', user?.username);

  const grandTotal = subtotal;

  // Rotation animation for circular loader
  React.useEffect(() => {
    if (isGeneratingBill) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [isGeneratingBill, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to cart');
      return;
    }

    // Debug: Check user state before order
    console.log('=== ORDER DEBUG ===');
    console.log('User:', user);
    console.log('User ID:', user?.id);
    console.log('Items:', items);
    console.log('Payment Method:', paymentMethod);

    if (!user) {
      Alert.alert('Login Required', 'Please login to place an order');
      return;
    }

    setIsGeneratingBill(true);
    
    try {
      console.log('Creating order...');
      const order = await createOrder(items, paymentMethod);
      console.log('Order created:', order);
      
      if (!order) {
        console.log('Order creation failed - order is null');
        Alert.alert('Error', 'Failed to create order. Please try again.');
        setIsGeneratingBill(false);
        return;
      }
      
      console.log('Order successful, clearing cart...');
      clearCart();
      
      // Navigate immediately after successful order creation
      router.replace({
        pathname: '/bill',
        params: { orderId: order?.id || '' },
      });
    } catch (error) {
      console.log('Order creation error:', error);
      Alert.alert('Error', 'Failed to generate bill. Please try again.');
    } finally {
      console.log('Finally - setting generating bill to false');
      setIsGeneratingBill(false);
    }
  };

  const paymentOptions: { method: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { method: 'cash', label: 'Cash', icon: <Ionicons name="cash" size={20} color={paymentMethod === 'cash' ? Colors.white : Colors.text} /> },
    { method: 'upi', label: 'UPI', icon: <Ionicons name="phone-portrait" size={20} color={paymentMethod === 'upi' ? Colors.white : Colors.text} /> },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            {items.length > 0 && (
              <TouchableOpacity onPress={clearCart}>
                <Text style={styles.clearText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyCart}>
              <Ionicons name="receipt" size={48} color={Colors.border} />
              <Text style={styles.emptyText}>Your cart is empty</Text>
            </View>
          ) : (
            items.map((cartItem) => (
              <View key={cartItem.item.id} style={styles.cartItem}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName}>{cartItem.item.name}</Text>
                  <Text style={styles.cartItemPrice}>₹{cartItem.item.price}</Text>
                </View>
                <View style={styles.cartItemActions}>
                  <TouchableOpacity
                    onPress={() => removeItem(cartItem.item.id)}
                    style={styles.cartItemBtn}
                  >
                    {cartItem.quantity === 1 ? (
                      <Ionicons name="trash" size={16} color={Colors.error} />
                    ) : (
                      <Ionicons name="remove" size={16} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                  <Text style={styles.cartItemQty}>{cartItem.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => addItem(cartItem.item)}
                    style={styles.cartItemBtn}
                  >
                    <Ionicons name="add" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.cartItemTotal}>
                    ₹{cartItem.item.price * cartItem.quantity}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>


        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentOptions}>
            {paymentOptions.map((option) => (
              <TouchableOpacity
                key={option.method}
                style={[
                  styles.paymentOption,
                  paymentMethod === option.method && styles.paymentOptionActive,
                ]}
                onPress={() => setPaymentMethod(option.method)}
              >
                {option.icon}
                <Text
                  style={[
                    styles.paymentLabel,
                    paymentMethod === option.method && styles.paymentLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.billSection}>
          <View style={styles.billHeader}>
            <Text style={styles.billShopName}>{settings.name}</Text>
            <Text style={styles.billShopLocal}>{settings.nameLocal}</Text>
          </View>

          <View style={styles.billDivider} />

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal</Text>
            <Text style={styles.billValue}>₹{subtotal}</Text>
          </View>

          <View style={styles.billDivider} />

          <View style={styles.billRow}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>₹{grandTotal}</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Total</Text>
          <Text style={styles.footerTotalValue}>₹{grandTotal}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderBtn, items.length === 0 && styles.placeOrderBtnDisabled]}
          onPress={handlePlaceOrder}
          disabled={items.length === 0 || isGeneratingBill}
          activeOpacity={0.8}
        >
          {isGeneratingBill ? (
            <View style={styles.loadingContainer}>
              <Animated.View 
                style={[
                  styles.circleLoader,
                  { transform: [{ rotate: spin }] }
                ]}
              />
              <Text style={styles.placeOrderText}>Generating...</Text>
            </View>
          ) : (
            <View style={styles.normalContainer}>
              <Ionicons name="receipt" size={20} color={Colors.white} />
              <Text style={styles.placeOrderText}>Generate Bill</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: Colors.white,
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '600',
  },
  emptyCart: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 12,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  cartItemPrice: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartItemBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.creamDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartItemQty: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginHorizontal: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  cartItemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gold,
    marginLeft: 16,
    minWidth: 60,
    textAlign: 'right',
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 16,
  },
  paymentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.creamDark,
  },
  paymentOptionActive: {
    backgroundColor: Colors.primary,
  },
  paymentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  paymentLabelActive: {
    color: Colors.white,
  },
  billSection: {
    backgroundColor: Colors.white,
    marginTop: 12,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  billHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  billShopName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  billShopLocal: {
    fontSize: 14,
    color: Colors.textLight,
  },
  billDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  billValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  grandTotalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.gold,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 16,
  },
  footerTotal: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  footerTotalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  placeOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 12,
  },
  placeOrderBtnDisabled: {
    backgroundColor: Colors.textMuted,
  },
  placeOrderText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  normalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleLoader: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.white,
    borderTopColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
