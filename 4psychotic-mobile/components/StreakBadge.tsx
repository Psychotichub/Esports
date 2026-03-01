import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle, TextStyle } from 'react-native';
import { Flame, Trophy } from 'lucide-react-native';
import { getEngagementStats, updateStreak } from '../lib/engagementTracking';

const COLORS = {
  dark: '#0a0a0a',
  darkLight: '#1a1a1a',
  white: '#ffffff',
  white60: '#ffffff99',
  neonTeal: '#00ffd1',
  neonRed: '#ff006e',
  neonYellow: '#ffd700',
};

interface StreakBadgeProps {
  compact?: boolean;
  showDetails?: boolean;
}

export default function StreakBadge({ compact = false, showDetails = false }: StreakBadgeProps) {
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadStreak();
    
    // Update streak on mount
    updateStreak().then(({ currentStreak, longestStreak }) => {
      setStreak(currentStreak);
      setLongestStreak(longestStreak);
      setIsLoading(false);
    });
    
    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    
    if (streak > 0) {
      pulse.start();
    }
    
    return () => pulse.stop();
  }, [streak, pulseAnim]);

  const loadStreak = async () => {
    const stats = await getEngagementStats();
    setStreak(stats.currentStreak);
    setLongestStreak(stats.longestStreak);
    setIsLoading(false);
  };

  if (isLoading || streak === 0) {
    if (compact) return null;
    return (
      <View style={styles.container}>
        <Text style={styles.startStreakText}>Start your streak today! 🔥</Text>
      </View>
    );
  }

  const getStreakTier = () => {
    if (streak >= 30) return { name: 'Legendary', color: COLORS.neonYellow, icon: Trophy };
    if (streak >= 14) return { name: 'Master', color: COLORS.neonTeal, icon: Flame };
    if (streak >= 7) return { name: 'Champion', color: COLORS.neonTeal, icon: Flame };
    return { name: 'Rising', color: COLORS.neonRed, icon: Flame };
  };

  const tier = getStreakTier();
  const IconComponent = tier.icon;

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <IconComponent size={16} color={tier.color} fill={tier.color} />
        </Animated.View>
        <Text style={[styles.compactStreakText, { color: tier.color }]}>
          {streak}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.badge, { transform: [{ scale: pulseAnim }] }]}>
        <IconComponent size={24} color={tier.color} fill={tier.color} />
        <View style={styles.streakInfo}>
          <Text style={[styles.streakNumber, { color: tier.color }]}>
            {streak} {streak === 1 ? 'day' : 'days'}
          </Text>
          <Text style={styles.streakLabel}>🔥 Streak</Text>
        </View>
      </Animated.View>
      
      {showDetails && (
        <View style={styles.details}>
          <Text style={styles.detailsText}>
            Best: {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
          </Text>
          <Text style={styles.tierText}>{tier.name}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  compactContainer: ViewStyle;
  badge: ViewStyle;
  streakInfo: ViewStyle;
  streakNumber: TextStyle;
  streakLabel: TextStyle;
  compactStreakText: TextStyle;
  startStreakText: TextStyle;
  details: ViewStyle;
  detailsText: TextStyle;
  tierText: TextStyle;
}>({
  container: {
    gap: 8,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.darkLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffffff08',
  },
  streakInfo: {
    gap: 2,
  },
  streakNumber: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  streakLabel: {
    fontSize: 10,
    color: COLORS.white60,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  compactStreakText: {
    fontSize: 12,
    fontWeight: '700',
  },
  startStreakText: {
    fontSize: 12,
    color: COLORS.white60,
    fontWeight: '600',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  detailsText: {
    fontSize: 11,
    color: COLORS.white60,
    fontWeight: '500',
  },
  tierText: {
    fontSize: 11,
    color: COLORS.neonTeal,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
