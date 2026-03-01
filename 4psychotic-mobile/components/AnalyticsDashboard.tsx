import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ViewStyle,
  TextStyle,
  RefreshControl,
} from 'react-native';
import { TrendingUp, TrendingDown, Minus, BarChart3, Target } from 'lucide-react-native';
import { getNorthStarMetrics } from '../lib/analytics';

const COLORS = {
  dark: '#0a0a0a',
  darkLight: '#1a1a1a',
  white: '#ffffff',
  white60: '#ffffff99',
  white40: '#ffffff66',
  neonTeal: '#00ffd1',
  neonRed: '#ff006e',
  neonYellow: '#ffd700',
  success: '#00ff88',
  warning: '#ffaa00',
};

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  isPrimary?: boolean;
}

function MetricCard({ title, value, unit = '', trend, isPrimary = false }: MetricCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? COLORS.success : trend === 'down' ? COLORS.neonRed : COLORS.white60;
  
  return (
    <View style={[styles.metricCard, isPrimary && styles.primaryMetricCard]}>
      <Text style={[styles.metricTitle, isPrimary && styles.primaryMetricTitle]}>{title}</Text>
      <View style={styles.metricValueRow}>
        <Text style={[styles.metricValue, isPrimary && styles.primaryMetricValue]}>
          {typeof value === 'number' ? value.toFixed(1) : value}
        </Text>
        {unit && <Text style={styles.metricUnit}>{unit}</Text>}
        {trend && (
          <TrendIcon size={16} color={trendColor} style={styles.trendIcon} />
        )}
      </View>
    </View>
  );
}

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMetrics = async () => {
    try {
      const data = await getNorthStarMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadMetrics();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading metrics...</Text>
      </View>
    );
  }

  if (!metrics) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No metrics available</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.neonTeal} />
      }
    >
      <View style={styles.header}>
        <BarChart3 size={24} color={COLORS.neonTeal} />
        <Text style={styles.headerTitle}>North Star Metrics</Text>
      </View>

      {/* Primary Metrics Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Target size={18} color={COLORS.neonTeal} />
          <Text style={styles.sectionTitle}>Primary Metrics</Text>
        </View>
        
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Avg Session Duration"
            value={metrics.averageSessionDuration}
            unit="min"
            isPrimary
          />
          <MetricCard
            title="Videos per Session"
            value={metrics.videosWatchedPerSession}
            isPrimary
          />
          <MetricCard
            title="7-Day Retention"
            value={metrics.retention7Day}
            unit="%"
            isPrimary
          />
          <MetricCard
            title="30-Day Retention"
            value={metrics.retention30Day}
            unit="%"
            isPrimary
          />
          <MetricCard
            title="Return Visit Freq"
            value={metrics.returnVisitFrequency}
            unit="/week"
            isPrimary
          />
          <MetricCard
            title="Completion Rate"
            value={metrics.watchCompletionRate}
            unit="%"
            isPrimary
          />
        </View>
      </View>

      {/* Supporting Metrics Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <BarChart3 size={18} color={COLORS.neonYellow} />
          <Text style={styles.sectionTitle}>Supporting Metrics</Text>
        </View>
        
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Recommendation CTR"
            value={metrics.recommendationCTR}
            unit="%"
          />
          <MetricCard
            title="Avg Scroll Depth"
            value={metrics.averageScrollDepth}
            unit="px"
          />
          <MetricCard
            title="Search Usage"
            value={metrics.searchUsageRate}
            unit="%"
          />
          <MetricCard
            title="Playlist Usage"
            value={metrics.playlistUsageRate}
            unit="%"
          />
          <MetricCard
            title="Follows per 100 Users"
            value={metrics.followsPer100Users}
          />
          <MetricCard
            title="Share Rate"
            value={metrics.shareRate}
            unit="%"
          />
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Platform Health</Text>
        <Text style={styles.summaryText}>
          {metrics.averageSessionDuration >= 5 && metrics.videosWatchedPerSession >= 4
            ? '✅ Excellent engagement levels'
            : metrics.averageSessionDuration >= 3 && metrics.videosWatchedPerSession >= 2
            ? '⚠️ Good, but room for improvement'
            : '📊 Building engagement'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  header: ViewStyle;
  headerTitle: TextStyle;
  section: ViewStyle;
  sectionHeader: ViewStyle;
  sectionTitle: TextStyle;
  metricsGrid: ViewStyle;
  metricCard: ViewStyle;
  primaryMetricCard: ViewStyle;
  metricTitle: TextStyle;
  primaryMetricTitle: TextStyle;
  metricValueRow: ViewStyle;
  metricValue: TextStyle;
  primaryMetricValue: TextStyle;
  metricUnit: TextStyle;
  trendIcon: ViewStyle;
  summary: ViewStyle;
  summaryTitle: TextStyle;
  summaryText: TextStyle;
  loadingText: TextStyle;
  errorText: TextStyle;
}>({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff08',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.darkLight,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffffff08',
  },
  primaryMetricCard: {
    borderColor: COLORS.neonTeal,
    borderWidth: 2,
    backgroundColor: `${COLORS.neonTeal}10`,
  },
  metricTitle: {
    fontSize: 11,
    color: COLORS.white60,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  primaryMetricTitle: {
    color: COLORS.neonTeal,
    fontWeight: '700',
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
  },
  primaryMetricValue: {
    color: COLORS.neonTeal,
    fontSize: 28,
  },
  metricUnit: {
    fontSize: 12,
    color: COLORS.white60,
    fontWeight: '600',
  },
  trendIcon: {
    marginLeft: 4,
  },
  summary: {
    backgroundColor: COLORS.darkLight,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffffff08',
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 12,
    color: COLORS.white60,
    lineHeight: 18,
  },
  loadingText: {
    color: COLORS.white60,
    textAlign: 'center',
    marginTop: 40,
  },
  errorText: {
    color: COLORS.neonRed,
    textAlign: 'center',
    marginTop: 40,
  },
});
