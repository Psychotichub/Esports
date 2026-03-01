import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { LiveStatus } from '../lib/hooks/useLiveStatus';

const COLORS = {
  neonRed: '#ff1744',
  white: '#ffffff',
  dark: '#0a0e1a',
};

interface LiveBadgeProps {
  liveStatus: LiveStatus[];
  viewerCount?: number;
  size?: 'small' | 'medium' | 'large';
  showViewerCount?: boolean;
}

export default function LiveBadge({
  liveStatus,
  viewerCount,
  size = 'medium',
  showViewerCount = false,
}: LiveBadgeProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isLive = liveStatus.some(status => status.isLive);

  useEffect(() => {
    if (isLive) {
      // Create pulsing animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
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
    }
  }, [isLive, pulseAnim]);

  if (!isLive) {
    return null;
  }

  const sizeStyles = {
    small: {
      container: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
      dot: { width: 4, height: 4, borderRadius: 2 },
      text: { fontSize: 8, marginLeft: 4 },
      viewerText: { fontSize: 7, marginLeft: 4 },
    },
    medium: {
      container: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
      dot: { width: 6, height: 6, borderRadius: 3 },
      text: { fontSize: 10, marginLeft: 6 },
      viewerText: { fontSize: 9, marginLeft: 6 },
    },
    large: {
      container: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
      dot: { width: 8, height: 8, borderRadius: 4 },
      text: { fontSize: 12, marginLeft: 8 },
      viewerText: { fontSize: 10, marginLeft: 8 },
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={[styles.container, currentSize.container]}>
      <Animated.View style={[styles.pulseContainer, { transform: [{ scale: pulseAnim }] }]}>
        <View style={[styles.dot, currentSize.dot, { backgroundColor: COLORS.neonRed }]} />
      </Animated.View>
      <Text style={[styles.text, currentSize.text, { color: COLORS.neonRed }]}>LIVE</Text>
      {showViewerCount && viewerCount !== undefined && (
        <Text style={[styles.viewerText, currentSize.viewerText, { color: COLORS.white }]}>
          {viewerCount >= 1000 ? `${(viewerCount / 1000).toFixed(1)}K` : viewerCount}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: 1,
    borderColor: COLORS.neonRed + '40',
  },
  pulseContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    backgroundColor: COLORS.neonRed,
  },
  text: {
    fontWeight: '900',
    letterSpacing: 0.5,
    color: COLORS.neonRed,
  },
  viewerText: {
    fontWeight: '600',
    color: COLORS.white,
    opacity: 0.8,
  },
});
