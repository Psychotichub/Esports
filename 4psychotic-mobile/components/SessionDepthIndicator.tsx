import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle, TextStyle } from 'react-native';
import { Zap, TrendingUp } from 'lucide-react-native';
import { getSessionDepth, shouldShowKeepWatchingPrompt, getDailyGoal } from '../lib/sessionTracking';

const COLORS = {
  dark: '#0a0a0a',
  darkLight: '#1a1a1a',
  white: '#ffffff',
  white60: '#ffffff99',
  neonTeal: '#00ffd1',
  neonRed: '#ff006e',
  neonYellow: '#ffd700',
};

interface SessionDepthIndicatorProps {
  compact?: boolean;
}

export default function SessionDepthIndicator({ compact = false }: SessionDepthIndicatorProps) {
  const [depth, setDepth] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dailyGoal, setDailyGoal] = useState({ currentMinutes: 0, targetMinutes: 30, achieved: false });
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const currentDepth = await getSessionDepth();
    setDepth(currentDepth);
    
    const shouldShow = await shouldShowKeepWatchingPrompt();
    setShowPrompt(shouldShow);
    
    const goal = await getDailyGoal();
    setDailyGoal(goal);
    
    // Pulse animation when depth increases
    if (currentDepth > 0) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  if (compact) {
    if (depth === 0) return null;
    return (
      <View style={styles.compactContainer}>
        <Zap size={12} color={COLORS.neonTeal} fill={COLORS.neonTeal} />
        <Text style={styles.compactText}>{depth}</Text>
      </View>
    );
  }

  const progress = Math.min((dailyGoal.currentMinutes / dailyGoal.targetMinutes) * 100, 100);

  return (
    <View style={styles.container}>
      {depth > 0 && (
        <Animated.View style={[styles.depthBadge, { transform: [{ scale: pulseAnim }] }]}>
          <Zap size={16} color={COLORS.neonYellow} fill={COLORS.neonYellow} />
          <View style={styles.depthInfo}>
            <Text style={styles.depthNumber}>{depth}</Text>
            <Text style={styles.depthLabel}>videos in chain</Text>
          </View>
        </Animated.View>
      )}
      
      {showPrompt && (
        <View style={styles.prompt}>
          <TrendingUp size={14} color={COLORS.neonTeal} />
          <Text style={styles.promptText}>Keep watching! 🔥</Text>
        </View>
      )}
      
      <View style={styles.goalContainer}>
        <Text style={styles.goalLabel}>Daily Goal</Text>
        <View style={styles.goalProgress}>
          <View style={[styles.goalBar, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.goalText}>
          {Math.round(dailyGoal.currentMinutes)} / {dailyGoal.targetMinutes} min
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  compactContainer: ViewStyle;
  compactText: TextStyle;
  depthBadge: ViewStyle;
  depthInfo: ViewStyle;
  depthNumber: TextStyle;
  depthLabel: TextStyle;
  prompt: ViewStyle;
  promptText: TextStyle;
  goalContainer: ViewStyle;
  goalLabel: TextStyle;
  goalProgress: ViewStyle;
  goalBar: ViewStyle;
  goalText: TextStyle;
}>({
  container: {
    gap: 8,
    padding: 12,
    backgroundColor: COLORS.darkLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffffff08',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.neonTeal,
  },
  depthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: COLORS.dark,
    borderRadius: 6,
  },
  depthInfo: {
    gap: 2,
  },
  depthNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.neonYellow,
  },
  depthLabel: {
    fontSize: 9,
    color: COLORS.white60,
    fontWeight: '600',
  },
  prompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    backgroundColor: `${COLORS.neonTeal}20`,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.neonTeal,
  },
  promptText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.neonTeal,
  },
  goalContainer: {
    gap: 4,
  },
  goalLabel: {
    fontSize: 10,
    color: COLORS.white60,
    fontWeight: '600',
  },
  goalProgress: {
    height: 4,
    backgroundColor: COLORS.dark,
    borderRadius: 2,
    overflow: 'hidden',
  },
  goalBar: {
    height: '100%',
    backgroundColor: COLORS.neonTeal,
    borderRadius: 2,
  },
  goalText: {
    fontSize: 9,
    color: COLORS.white60,
    fontWeight: '600',
  },
});
