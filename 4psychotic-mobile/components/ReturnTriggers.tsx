import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Bell, Clock, TrendingUp, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { getEngagementStats, updateStreak } from '../lib/engagementTracking';
import { getDailyGoal } from '../lib/sessionTracking';

const COLORS = {
  dark: '#0a0a0a',
  darkLight: '#1a1a1a',
  white: '#ffffff',
  white60: '#ffffff99',
  white40: '#ffffff66',
  neonTeal: '#00ffd1',
  neonRed: '#ff006e',
};

interface ReturnTrigger {
  id: string;
  type: 'streak' | 'goal' | 'new_content' | 'missed';
  title: string;
  message: string;
  action?: () => void;
  icon: typeof Bell;
  priority: number;
}

export default function ReturnTriggers() {
  const [triggers, setTriggers] = useState<ReturnTrigger[]>([]);

  useEffect(() => {
    loadTriggers();
  }, []);

  const loadTriggers = async () => {
    const stats = await getEngagementStats();
    const streak = await updateStreak();
    const dailyGoal = await getDailyGoal();
    
    const newTriggers: ReturnTrigger[] = [];
    
    // Streak reminder
    if (streak.currentStreak > 0 && streak.currentStreak < 7) {
      newTriggers.push({
        id: 'streak',
        type: 'streak',
        title: `🔥 ${streak.currentStreak}-day streak!`,
        message: streak.currentStreak === 1 
          ? 'Start your streak today!'
          : `Don't break your ${streak.currentStreak}-day streak!`,
        icon: Sparkles,
        priority: 1,
      });
    }
    
    // Daily goal reminder
    if (dailyGoal.currentMinutes < dailyGoal.targetMinutes) {
      const remaining = Math.round(dailyGoal.targetMinutes - dailyGoal.currentMinutes);
      newTriggers.push({
        id: 'goal',
        type: 'goal',
        title: 'Daily Goal',
        message: `${remaining} minutes left to reach your goal`,
        icon: TrendingUp,
        priority: 2,
      });
    }
    
    // New content (mock - would come from backend)
    if (Math.random() > 0.5) {
      newTriggers.push({
        id: 'new_content',
        type: 'new_content',
        title: 'New Content',
        message: '3 new videos uploaded today',
        icon: Bell,
        priority: 3,
      });
    }
    
    // Sort by priority
    newTriggers.sort((a, b) => a.priority - b.priority);
    setTriggers(newTriggers.slice(0, 3)); // Show max 3
  };

  if (triggers.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Don't Miss Out</Text>
      {triggers.map((trigger) => {
        const IconComponent = trigger.icon;
        return (
          <TouchableOpacity
            key={trigger.id}
            style={styles.trigger}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              trigger.action?.();
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${COLORS.neonTeal}20` }]}>
              <IconComponent size={18} color={COLORS.neonTeal} />
            </View>
            <View style={styles.triggerContent}>
              <Text style={styles.triggerTitle}>{trigger.title}</Text>
              <Text style={styles.triggerMessage}>{trigger.message}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  title: TextStyle;
  trigger: ViewStyle;
  iconContainer: ViewStyle;
  triggerContent: ViewStyle;
  triggerTitle: TextStyle;
  triggerMessage: TextStyle;
}>({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: COLORS.darkLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffffff08',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: COLORS.dark,
    borderRadius: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  triggerContent: {
    flex: 1,
    gap: 2,
  },
  triggerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  triggerMessage: {
    fontSize: 11,
    color: COLORS.white60,
  },
});
