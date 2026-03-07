import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useOrders } from '@/context/OrdersContext';
import { useAuth } from '@/context/AuthContext';
import { Order, CartItem } from '@/types';

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentIcon = (method: string) => {
  switch(method) {
    case 'cash': return 'cash';
    case 'upi': return 'phone-portrait';
    default: return 'card';
  }
};

const PaymentIcon = Ionicons;

  return (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderIdContainer}>
          <Ionicons name="receipt" size={16} color={Colors.primary} />
          <Text style={styles.orderId}>{order.id.slice(-8)}</Text>
        </View>
        <View style={styles.orderMeta}>
          <View style={styles.paymentBadge}>
            <PaymentIcon name={getPaymentIcon(order.paymentMethod)} size={12} color={Colors.textLight} />
            <Text style={styles.paymentText}>{order.paymentMethod.toUpperCase()}</Text>
          </View>
          <Text style={styles.orderTime}>{formatTime(order.createdAt)}</Text>
        </View>
      </View>

      {expanded && (
        <View style={styles.orderItems}>
          {order.items.map((item: CartItem, idx: number) => (
            <View key={idx} style={styles.orderItem}>
              <Text style={styles.orderItemName}>
                {item.quantity}x {item.item.name}
              </Text>
              <Text style={styles.orderItemPrice}>
                ₹{item.item.price * item.quantity}
              </Text>
            </View>
          ))}
          <View style={styles.orderTotals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>₹{order.total}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.orderFooter}>
        <Text style={styles.itemCount}>
          {order.items.reduce((sum: number, i: CartItem) => sum + i.quantity, 0)} items
        </Text>
        <Text style={styles.orderTotal}>₹{order.grandTotal}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function OrdersScreen() {
  const { user } = useAuth();
  const { orders, todayOrders, todayTotal, deleteAllOrders, loadData } = useOrders();
  const [isLive, setIsLive] = useState(true); // Live indicator
  
  // Calculate today's cash and UPI totals (must be before early return)
  const todayCashTotal = useMemo(() => {
    return todayOrders
      .filter(order => order.paymentMethod === 'cash')
      .reduce((sum, order) => sum + Number(order.grandTotal || 0), 0);
  }, [todayOrders]);

  const todayUpiTotal = useMemo(() => {
    return todayOrders
      .filter(order => order.paymentMethod === 'upi')
      .reduce((sum, order) => sum + Number(order.grandTotal || 0), 0);
  }, [todayOrders]);
  
  // Hide entire Orders page for admin user (after all hooks)
  if (user?.id === 'usr_admin_001') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.accessDenied}>
          <Ionicons name="receipt" size={64} color={Colors.border} />
          <Text style={styles.accessDeniedTitle}>Orders Management</Text>
          <Text style={styles.accessDeniedText}>
            Admin users access orders through backend dashboard
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Hide orders from admin user (staff role) - only show to Baseel (admin role)
  if (user?.role === 'staff') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.accessDenied}>
          <Ionicons name="lock-closed" size={64} color={Colors.border} />
          <Text style={styles.accessDeniedTitle}>Access Restricted</Text>
          <Text style={styles.accessDeniedText}>
            Only Baseel can view orders
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Show all orders for Baseel (admin role)
  const displayOrders = orders;
  
  console.log('=== ORDERS SCREEN DEBUG ===');
  console.log('User role:', user?.role);
  console.log('User ID:', user?.id);
  console.log('Total orders loaded:', orders.length);
  console.log('Display orders:', displayOrders.length);
  console.log('Orders:', displayOrders);
  console.log('============================');

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  const groupedOrders = displayOrders.reduce<Record<string, Order[]>>((acc, order) => {
    const dateKey = formatDate(order.createdAt);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(order);
    return acc;
  }, {});

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Orders</Text>
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={() => {
                console.log('🔄 Manual refresh triggered');
                loadData();
              }}
            >
              <Ionicons name="refresh" size={16} color={Colors.primary} />
            </TouchableOpacity>
            {isLive && (
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>
          {user && (
            <View style={styles.userBadge}>
              <Ionicons name="person" size={12} color={Colors.cream} />
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userDistrict}>• {user.district}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Today&apos;s Orders</Text>
          <Text style={styles.summaryValue}>{todayOrders.length}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Today&apos;s Revenue</Text>
          <Text style={styles.summaryValueGold}>₹{todayTotal.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.paymentSummaryCard}>
        <View style={styles.paymentSummaryItem}>
          {user?.id !== 'usr_admin_001' && (
            <View style={styles.paymentIconContainer}>
              <Ionicons name="cash" size={24} color="#2ECC71" />
            </View>
          )}
          <View style={styles.paymentDetails}>
            <Text style={styles.paymentLabel}>Cash Payments</Text>
            <Text style={styles.paymentValue}>₹{todayCashTotal.toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.paymentSummaryDivider} />
        <View style={styles.paymentSummaryItem}>
          {user?.id !== 'usr_admin_001' && (
            <View style={styles.paymentIconContainer}>
              <Ionicons name="phone-portrait" size={24} color="#3498DB" />
            </View>
          )}
          <View style={styles.paymentDetails}>
            <Text style={styles.paymentLabel}>UPI Payments</Text>
            <Text style={styles.paymentValue}>₹{todayUpiTotal.toLocaleString()}</Text>
          </View>
        </View>
      </View>


      {displayOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt" size={64} color={Colors.border} />
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptyText}>
            Your orders will appear here once you start billing
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.ordersList}
          contentContainerStyle={styles.ordersContent}
          showsVerticalScrollIndicator={false}
        >
          {Object.entries(groupedOrders).map(([date, dateOrders]) => (
            <View key={date} style={styles.dateGroup}>
              <View style={styles.dateHeader}>
                <Ionicons name="calendar" size={14} color={Colors.textMuted} />
                <Text style={styles.dateText}>{date}</Text>
                <Text style={styles.dateTotal}>
                  ₹{(dateOrders as Order[]).reduce((sum: number, o: Order) => sum + o.grandTotal, 0).toLocaleString()}
                </Text>
              </View>
              {(dateOrders as Order[]).map((order: Order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </View>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.white,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  userName: {
    fontSize: 12,
    color: Colors.cream,
    fontWeight: '500' as const,
  },
  userDistrict: {
    fontSize: 12,
    color: '#B8D4E3',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  summaryValueGold: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.gold,
  },
  paymentSummaryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  paymentSummaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E8DDD5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentDetails: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  paymentValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  paymentSummaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  monthlyReportToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  monthlyReportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  monthlyReportTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
  },
  monthlyReportSection: {
    marginBottom: 12,
  },
  currentMonthCard: {
    backgroundColor: '#1E5B7B',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  currentMonthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  currentMonthTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  currentMonthStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  currentMonthStat: {
    alignItems: 'center',
    flex: 1,
  },
  currentMonthValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  currentMonthValueLarge: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  currentMonthLabel: {
    fontSize: 11,
    color: '#B8D4E3',
    marginTop: 4,
  },
  monthlyScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  monthCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    width: 180,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  monthName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  monthYear: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  monthStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthStat: {
    alignItems: 'center',
    flex: 1,
  },
  monthStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  monthStatValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  monthStatValueGold: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.gold,
  },
  monthStatLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 2,
  },
  noMonthlyData: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noMonthlyDataText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  ordersList: {
    flex: 1,
  },
  ordersContent: {
    paddingHorizontal: 16,
  },
  dateGroup: {
    marginBottom: 16,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginLeft: 6,
    flex: 1,
  },
  dateTotal: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textLight,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.creamDark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paymentText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textLight,
  },
  orderTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  customerName: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 8,
  },
  orderItems: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    marginTop: 8,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  orderItemName: {
    fontSize: 13,
    color: Colors.textLight,
  },
  orderItemPrice: {
    fontSize: 13,
    color: Colors.text,
  },
  orderTotals: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 8,
    paddingTop: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  totalValue: {
    fontSize: 12,
    color: Colors.textLight,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  itemCount: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.gold,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  accessDeniedTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  accessDeniedText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
