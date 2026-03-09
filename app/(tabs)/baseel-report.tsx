import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5, FontAwesome } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SalesReport {
  timestamp: string;
  date: string;
  summary: {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    uniqueItems: number;
    peakTime: string;
  };
  timeAnalysis: {
    morning: { count: number; percentage: number };
    afternoon: { count: number; percentage: number };
    evening: { count: number; percentage: number };
    night: { count: number; percentage: number };
  };
  highSaleItems: Array<{
    rank: number;
    name: string;
    unitsSold: number;
    revenue: number;
    avgPrice: number;
    performance: string;
  }>;
  lowSaleItems: Array<{
    rank: number;
    name: string;
    unitsSold: number;
    revenue: number;
    avgPrice: number;
    recommendation: string;
  }>;
  insights: {
    topPerformer: string;
    worstPerformer: string;
    revenueConcentration: number;
    recommendation: string;
  };
}

export default function BaseelReportScreen() {
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const BASE_URL = 'https://jigarthanda-api.onrender.com';
  const BASEEL_USER_ID = 'usr_nazir_001';

  // Check current user on mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        setCurrentUser(userId);
        
        // If not Baseel, don't fetch report
        if (userId !== BASEEL_USER_ID) {
          setError('Access denied - This report is for Baseel only');
          setLoading(false);
          return;
        }
        
        await fetchReport();
      } catch (err) {
        console.error('Error checking user:', err);
        setError('Authentication error');
        setLoading(false);
      }
    };
    
    checkUser();
  }, []);

  const fetchReport = async () => {
    try {
      setRefreshing(true);
      setError(null);

      // Try to new Baseel report endpoint first
      let response = await fetch(
        `${BASE_URL}/api/baseel-sales-report?userId=${BASEEL_USER_ID}`
      );

      // If that fails, fall back to stats endpoint for demo
      if (!response.ok) {
        console.log('🔄 Baseel report endpoint not ready, falling back to stats endpoint');
        response = await fetch(`${BASE_URL}/api/orders/stats`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch any report data');
        }

        const data = await response.json();
        
        // Create a mock report structure from stats data
        const mockReport = {
          timestamp: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
          summary: {
            totalOrders: data.data?.totalOrders || 0,
            totalRevenue: data.data?.totalSales || 0,
            avgOrderValue: data.data?.totalSales && data.data?.totalOrders > 0 ? 
              Math.round((data.data.totalSales / data.data.totalOrders) * 100) / 100 : 0,
            uniqueItems: 0,
            peakTime: 'evening'
          },
          timeAnalysis: {
            morning: { count: 0, percentage: 0 },
            afternoon: { count: 0, percentage: 0 },
            evening: { count: data.data?.totalOrders || 0, percentage: 100 },
            night: { count: 0, percentage: 0 }
          },
          highSaleItems: [],
          lowSaleItems: [],
          insights: {
            topPerformer: 'No data available',
            worstPerformer: 'No data available',
            revenueConcentration: 0,
            recommendation: 'Server restarting - Please try again later'
          }
        };

        console.log('📊 Fallback report data:', mockReport);
        setReport(mockReport);
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('📊 Baseel report data received:', data.report);
        setReport(data.report);
      } else {
        setError('Failed to load report data');
      }

    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Network error - Please check connection');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    if (currentUser === BASEEL_USER_ID) {
      fetchReport();
    }
  };

  if (loading || !report) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>📊 Loading Baseel Sales Report...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <Text style={styles.retryText} onPress={onRefresh}>Tap to retry</Text>
      </View>
    );
  }

  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;
  const getPerformanceColor = (performance: string) => 
    performance.includes('🔥') ? '#FF6B6B' : '#4CAF50';

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <MaterialIcons name="bar-chart" size={28} color={Colors.white} />
          <Text style={styles.headerTitle}>Baseel Sales Report</Text>
        </View>
        <Text style={styles.headerDate}>
          {report.date} • Updated {new Date(report.timestamp).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summarySection}>
        <View style={styles.sectionTitleRow}>
          <FontAwesome5 name="money-bill-wave" size={20} color={Colors.primary} />
          <Ionicons name="trending-up" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Today's Summary</Text>
        </View>
        
        {/* Top Seller Highlight Card */}
        <View style={styles.topItemCard}>
          <FontAwesome5 name="trophy" size={24} color={Colors.gold} />
          <Text style={styles.topItemTitle}>Best Seller</Text>
          <Text style={styles.topItemName}>{report.insights.topPerformer}</Text>
        </View>
        
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <FontAwesome name="file-text" size={24} color={Colors.primary} />
            <Text style={styles.summaryLabel}>Orders</Text>
            <Text style={styles.summaryValue}>{report.summary.totalOrders}</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <FontAwesome5 name="coins" size={24} color={Colors.primary} />
            <Text style={styles.summaryLabel}>Revenue</Text>
            <Text style={styles.summaryValue}>{formatCurrency(report.summary.totalRevenue)}</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <MaterialIcons name="shopping-cart" size={24} color={Colors.primary} />
            <Text style={styles.summaryLabel}>Avg Order</Text>
            <Text style={styles.summaryValue}>{formatCurrency(report.summary.avgOrderValue)}</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <MaterialIcons name="schedule" size={24} color={Colors.primary} />
            <Text style={styles.summaryLabel}>Peak Time</Text>
            <Text style={styles.summaryValue}>{report.summary.peakTime}</Text>
          </View>
        </View>
      </View>

      {/* Time Analysis */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <MaterialIcons name="access-time" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Sales by Time</Text>
        </View>
        
        <View style={styles.timeGrid}>
          <View style={styles.timeCard}>
            <Ionicons name="sunny-outline" size={24} color={Colors.gold} />
            <Text style={styles.timeLabel}>Morning</Text>
            <Text style={styles.timeValue}>{report.timeAnalysis.morning.count} orders</Text>
            <Text style={styles.timePercent}>{report.timeAnalysis.morning.percentage}%</Text>
          </View>
          
          <View style={styles.timeCard}>
            <Ionicons name="sunny" size={24} color={Colors.gold} />
            <Text style={styles.timeLabel}>Afternoon</Text>
            <Text style={styles.timeValue}>{report.timeAnalysis.afternoon.count} orders</Text>
            <Text style={styles.timePercent}>{report.timeAnalysis.afternoon.percentage}%</Text>
          </View>
          
          <View style={styles.timeCard}>
            <MaterialIcons name="wb-twilight" size={24} color={Colors.gold} />
            <Text style={styles.timeLabel}>Evening</Text>
            <Text style={styles.timeValue}>{report.timeAnalysis.evening.count} orders</Text>
            <Text style={styles.timePercent}>{report.timeAnalysis.evening.percentage}%</Text>
          </View>
          
          <View style={styles.timeCard}>
            <Ionicons name="moon-outline" size={24} color={Colors.gold} />
            <Text style={styles.timeLabel}>Night</Text>
            <Text style={styles.timeValue}>{report.timeAnalysis.night.count} orders</Text>
            <Text style={styles.timePercent}>{report.timeAnalysis.night.percentage}%</Text>
          </View>
        </View>
      </View>

      {/* High Sale Items */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <MaterialIcons name="local-fire-department" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Top Performing Items</Text>
        </View>
        
        {report.highSaleItems.map((item, index) => (
          <View key={`${item.name}-${item.rank}`} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemRank}>#{item.rank}</Text>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={[styles.performance, { color: getPerformanceColor(item.performance) }]}>
                {item.performance}
              </Text>
            </View>
            
            <View style={styles.itemStats}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Units Sold:</Text>
                <Text style={styles.statValue}>{item.unitsSold}</Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Revenue:</Text>
                <Text style={styles.statValue}>{formatCurrency(item.revenue)}</Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Avg Price:</Text>
                <Text style={styles.statValue}>{formatCurrency(item.avgPrice)}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Low Sale Items */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="trending-down" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Low Performing Items</Text>
        </View>
        
        {report.lowSaleItems.map((item, index) => (
          <View key={`${item.name}-${item.rank}`} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemRank}>#{item.rank}</Text>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.recommendation}>{item.recommendation}</Text>
            </View>
            
            <View style={styles.itemStats}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Units Sold:</Text>
                <Text style={styles.statValue}>{item.unitsSold}</Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Revenue:</Text>
                <Text style={styles.statValue}>{formatCurrency(item.revenue)}</Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Avg Price:</Text>
                <Text style={styles.statValue}>{formatCurrency(item.avgPrice)}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Business Insights */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <MaterialIcons name="lightbulb" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Business Insights</Text>
        </View>
        
        <View style={styles.insightsCard}>
          <FontAwesome5 name="trophy" size={20} color={Colors.gold} />
          <Text style={styles.insightTitle}>Top Performer</Text>
          <Text style={styles.insightValue}>{report.insights.topPerformer}</Text>
        </View>
        
        <View style={styles.insightsCard}>
          <MaterialIcons name="campaign" size={20} color={Colors.rose} />
          <Text style={styles.insightTitle}>Needs Attention</Text>
          <Text style={styles.insightValue}>{report.insights.worstPerformer}</Text>
        </View>
        
        <View style={styles.insightsCard}>
          <FontAwesome5 name="bullseye" size={20} color={Colors.primary} />
          <Text style={styles.insightTitle}>Today's Recommendation</Text>
          <Text style={styles.insightValue}>{report.insights.recommendation}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    backgroundColor: Colors.primary,
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginLeft: 10,
  },
  headerDate: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.8,
  },
  loadingText: {
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 50,
  },
  errorText: {
    fontSize: 18,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 50,
  },
  retryText: {
    fontSize: 16,
    color: Colors.primary,
    textAlign: 'center',
    marginTop: 10,
    textDecorationLine: 'underline',
  },
  topItemCard: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    gap: 8,
  },
  topItemTitle: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: 'bold',
  },
  topItemName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  summarySection: {
    padding: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.text,
    marginBottom: 5,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeLabel: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 5,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 2,
  },
  timePercent: {
    fontSize: 12,
    color: Colors.secondary,
  },
  itemCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemRank: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
    backgroundColor: Colors.border,
    width: 30,
    height: 30,
    borderRadius: 15,
    textAlign: 'center',
    lineHeight: 30,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    marginLeft: 10,
  },
  performance: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  recommendation: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: 'bold',
  },
  itemStats: {
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text,
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  insightsCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    gap: 8,
  },
  insightTitle: {
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
  },
  insightValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
  },
});
