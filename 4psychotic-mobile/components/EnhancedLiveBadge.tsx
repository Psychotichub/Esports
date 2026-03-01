import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Clock, Bell, Eye, Play } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Linking } from 'react-native';

// Optional notifications - only use if available
let Notifications: typeof import('expo-notifications') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications');
} catch {
  // Notifications not available
}

const COLORS = {
  dark: '#0a0e1a',
  darkLight: '#0f1420',
  neonRed: '#ff1744',
  neonTeal: '#00e5ff',
  white: '#ffffff',
  white60: '#ffffff99',
  white40: '#ffffff66',
};

interface EnhancedLiveBadgeProps {
  isLive: boolean;
  liveData?: {
    title: string;
    viewerCount: number;
  } | null;
  nextStreamTime?: Date; // Optional: When next stream starts
  previousStreamHighlight?: {
    title: string;
    thumbnail: string;
    url: string;
  } | null;
}

// Configure notification handler if available
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export default function EnhancedLiveBadge({
  isLive,
  liveData,
  nextStreamTime,
  previousStreamHighlight,
}: EnhancedLiveBadgeProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Calculate next stream time (default: 2 hours from now if not provided)
  const defaultNextStream = nextStreamTime || new Date(Date.now() + 2 * 60 * 60 * 1000);

  // Countdown timer
  useEffect(() => {
    if (isLive) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = defaultNextStream.getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeRemaining('Starting soon...');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [isLive, defaultNextStream]);

  // Pulse animation for live badge
  useEffect(() => {
    if (!isLive) return;

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
    pulse.start();

    return () => pulse.stop();
  }, [isLive, pulseAnim]);

  // Request notification permissions
  const requestNotificationPermission = async () => {
    if (!Notifications) {
      // Notifications not available - show message or handle gracefully
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        setNotificationEnabled(true);
        scheduleNotification();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  // Schedule notification for next stream
  const scheduleNotification = async () => {
    if (!Notifications) return;

    try {
      const now = new Date().getTime();
      const target = defaultNextStream.getTime();
      const diff = target - now;

      if (diff > 0) {
        // Schedule notification 5 minutes before stream
        const notificationTime = new Date(target - 5 * 60 * 1000);
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Stream Starting Soon! 🎮',
            body: '4PSYCHOTIC stream starts in 5 minutes',
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: notificationTime,
        });
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  const handleReminderPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    requestNotificationPermission();
  };

  const handlePreviousHighlightPress = () => {
    if (previousStreamHighlight) {
      Linking.openURL(previousStreamHighlight.url);
    }
  };

  // Live Badge
  if (isLive && liveData) {
    return (
      <TouchableOpacity
        style={[styles.liveBadge, { borderColor: COLORS.neonRed }]}
        onPress={() => Linking.openURL('https://www.youtube.com/@sureshpokharel243/live')}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.livePulse,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <View
            style={[
              styles.liveDot,
              { backgroundColor: COLORS.neonRed },
            ]}
          />
          <Text style={[styles.liveText, { color: COLORS.neonRed }]}>
            LIVE NOW
          </Text>
        </Animated.View>
        <Text style={styles.liveTitle}>{liveData.title}</Text>
        <View style={styles.viewerBadge}>
          <Eye size={12} color={COLORS.white60} />
          <Text style={styles.viewerCount}>
            {liveData.viewerCount} watching
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Next Stream Badge (when not live)
  return (
    <View style={styles.container}>
      <View style={[styles.nextStreamBadge, { borderColor: COLORS.neonTeal }]}>
        <View style={styles.nextStreamHeader}>
          <Clock size={16} color={COLORS.neonTeal} />
          <Text style={[styles.nextStreamLabel, { color: COLORS.neonTeal }]}>
            NEXT STREAM
          </Text>
        </View>
        <Text style={styles.nextStreamTime}>
          Stream starts in {timeRemaining}
        </Text>
        
        <TouchableOpacity
          style={styles.reminderButton}
          onPress={handleReminderPress}
          activeOpacity={0.8}
        >
          <Bell
            size={14}
            color={notificationEnabled ? COLORS.neonTeal : COLORS.white60}
            fill={notificationEnabled ? COLORS.neonTeal : 'none'}
          />
          <Text
            style={[
              styles.reminderButtonText,
              { color: notificationEnabled ? COLORS.neonTeal : COLORS.white60 },
            ]}
          >
            {notificationEnabled ? 'Reminder Set' : 'Set Reminder'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Previous Stream Highlight */}
      {previousStreamHighlight && (
        <TouchableOpacity
          style={styles.previousHighlight}
          onPress={handlePreviousHighlightPress}
          activeOpacity={0.8}
        >
          <View style={styles.previousHighlightContent}>
            <Play size={12} color={COLORS.white60} />
            <Text style={styles.previousHighlightText}>
              Watch Previous Stream Highlights
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  liveBadge: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    gap: 8,
    backgroundColor: `${COLORS.neonRed}08`,
  },
  livePulse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  liveTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white60,
  },
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewerCount: {
    fontSize: 11,
    color: COLORS.white60,
  },
  nextStreamBadge: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    gap: 8,
    backgroundColor: `${COLORS.neonTeal}08`,
  },
  nextStreamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nextStreamLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  nextStreamTime: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: COLORS.darkLight,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  reminderButtonText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  previousHighlight: {
    padding: 10,
    backgroundColor: COLORS.darkLight,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ffffff08',
  },
  previousHighlightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previousHighlightText: {
    fontSize: 11,
    color: COLORS.white60,
    fontWeight: '500',
  },
});
