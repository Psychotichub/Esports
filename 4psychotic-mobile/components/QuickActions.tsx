import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Bell, Star, Download, Search } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  dark: '#0a0e1a',
  darkLight: '#0f1420',
  neonRed: '#ff1744',
  neonTeal: '#00e5ff',
  white: '#ffffff',
  white60: '#ffffff99',
  white40: '#ffffff66',
};

interface QuickAction {
  id: string;
  icon: typeof Bell;
  label: string;
  onPress: () => void;
  badge?: number;
  enabled?: boolean;
}

export default function QuickActions() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef<{ [key: string]: Animated.Value }>({}).current;

  // Initialize scale animations for each button
  const getScaleAnim = (id: string) => {
    if (!scaleAnims[id]) {
      scaleAnims[id] = new Animated.Value(1);
    }
    return scaleAnims[id];
  };

  // Slide in animation on mount
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const handlePress = (action: QuickAction, index: number) => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Scale animation
    const scaleAnim = getScaleAnim(action.id);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Execute action
    action.onPress();
  };

  // Define actions
  const actions: QuickAction[] = [
    {
      id: 'notifications',
      icon: Bell,
      label: 'Notifications',
      enabled: true, // TODO: Check notification permissions
      badge: 0, // TODO: Get unread count
      onPress: () => {
        // TODO: Navigate to notifications screen or show notification panel
        console.log('Notifications pressed');
      },
    },
    {
      id: 'favorites',
      icon: Star,
      label: 'Favorites',
      onPress: () => {
        // TODO: Navigate to favorites screen or show favorites modal
        console.log('Favorites pressed');
        // For now, navigate to Videos with favorites filter
        navigation.navigate('videos', { filter: 'favorites' });
      },
    },
    {
      id: 'downloads',
      icon: Download,
      label: 'Downloads',
      onPress: () => {
        // TODO: Navigate to downloads screen
        console.log('Downloads pressed');
      },
    },
    {
      id: 'search',
      icon: Search,
      label: 'Search',
      onPress: () => {
        // Navigate to Videos screen with search focus
        navigation.navigate('videos', { focusSearch: true });
      },
    },
  ];

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });

  // Calculate position above tab bar (60px height + safe area bottom)
  const tabBarHeight = 60;
  const bottomOffset = tabBarHeight + (Platform.OS === 'ios' ? Math.max(insets.bottom, 8) : Platform.OS === 'android' ? 8 : 0);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: bottomOffset,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.bar}>
        {actions.map((action, index) => {
          const IconComponent = action.icon;
          const scaleAnim = getScaleAnim(action.id);
          const isEnabled = action.enabled !== false;

          return (
            <TouchableOpacity
              key={action.id}
              style={styles.actionButton}
              onPress={() => handlePress(action, index)}
              activeOpacity={0.8}
              disabled={!isEnabled}
            >
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    opacity: isEnabled ? 1 : 0.5,
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                <IconComponent
                  size={20}
                  color={isEnabled ? COLORS.neonTeal : COLORS.white40}
                  strokeWidth={2}
                />
                {action.badge !== undefined && action.badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {action.badge > 99 ? '99+' : action.badge}
                    </Text>
                  </View>
                )}
              </Animated.View>
              <Text
                style={[
                  styles.label,
                  { color: isEnabled ? COLORS.white60 : COLORS.white40 },
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: COLORS.darkLight,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#ffffff08',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.neonTeal,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  iconContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.neonRed,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.darkLight,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
  },
});
