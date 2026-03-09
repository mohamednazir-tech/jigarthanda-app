import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import Colors from '../../constants/colors';

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

  const fetchReport = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('https://jigarthanda-api.onrender.com/api/baseel-sales-report');
      const data = await response.json();
      
      if (data.success) {
        setReport(data.report);
      } else {
        console.error('Failed to fetch report:', data.error);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const onRefresh = () => {
    fetchReport();
  };

  if (loading || !report) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>📊 Loading Baseel Sales Report...</Text>
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
        <Text style={styles.headerTitle}>📊 Baseel Sales Report</Text>
        <Text style={styles.headerDate}>{report.date}</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>📈 Today's Summary</Text>
        
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Orders</Text>
            <Text style={styles.summaryValue}>{report.summary.totalOrders}</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={styles.summaryValue}>{formatCurrency(report.summary.totalRevenue)}</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Avg Order Value</Text>
            <Text style={styles.summaryValue}>{formatCurrency(report.summary.avgOrderValue)}</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Peak Time</Text>
            <Text style={styles.summaryValue}>{report.summary.peakTime}</Text>
          </View>
        </View>
      </View>

      {/* Time Analysis */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🕐 Sales by Time</Text>
        
        <View style={styles.timeGrid}>
          <View style={styles.timeCard}>
            <Text style={styles.timeLabel}>🌅 Morning</Text>
            <Text style={styles.timeValue}>{report.timeAnalysis.morning.count} orders</Text>
            <Text style={styles.timePercent}>{report.timeAnalysis.morning.percentage}%</Text>
          </View>
          
          <View style={styles.timeCard}>
            <Text style={styles.timeLabel}>☀️ Afternoon</Text>
            <Text style={styles.timeValue}>{report.timeAnalysis.afternoon.count} orders</Text>
            <Text style={styles.timePercent}>{report.timeAnalysis.afternoon.percentage}%</Text>
          </View>
          
          <View style={styles.timeCard}>
            <Text style={styles.timeLabel}>🌆 Evening</Text>
            <Text style={styles.timeValue}>{report.timeAnalysis.evening.count} orders</Text>
            <Text style={styles.timePercent}>{report.timeAnalysis.evening.percentage}%</Text>
          </View>
          
          <View style={styles.timeCard}>
            <Text style={styles.timeLabel}>🌙 Night</Text>
            <Text style={styles.timeValue}>{report.timeAnalysis.night.count} orders</Text>
            <Text style={styles.timePercent}>{report.timeAnalysis.night.percentage}%</Text>
          </View>
        </View>
      </View>

      {/* High Sale Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔥 Top Performing Items</Text>
        
        {report.highSaleItems.map((item, index) => (
          <View key={item.name} style={styles.itemCard}>
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
        <Text style={styles.sectionTitle}>📉 Low Performing Items</Text>
        
        {report.lowSaleItems.map((item, index) => (
          <View key={item.name} style={styles.itemCard}>
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
        <Text style={styles.sectionTitle}>💡 Business Insights</Text>
        
        <View style={styles.insightsCard}>
          <Text style={styles.insightTitle}>🏆 Top Performer</Text>
          <Text style={styles.insightValue}>{report.insights.topPerformer}</Text>
        </View>
        
        <View style={styles.insightsCard}>
          <Text style={styles.insightTitle}>📉 Needs Attention</Text>
          <Text style={styles.insightValue}>{report.insights.worstPerformer}</Text>
        </View>
        
        <View style={styles.insightsCard}>
          <Text style={styles.insightTitle}>🎯 Today's Recommendation</Text>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 5,
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
  summarySection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 15,
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
  },
  insightTitle: {
    fontSize: 12,
    color: Colors.text,
    marginBottom: 5,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
  },
});
