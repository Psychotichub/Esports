import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Bell, Star, Download, Search, X } from 'lucide-react-native';
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

interface TopNavBarProps {
  title?: string;
  showSearch?: boolean;
  showActions?: boolean;
}

export default function TopNavBar({ 
  title, 
  showSearch = true, 
  showActions = true 
}: TopNavBarProps) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef<{ [key: string]: Animated.Value }>({}).current;

  // Initialize scale animations for each button
  const getScaleAnim = (id: string) => {
    if (!scaleAnims[id]) {
      scaleAnims[id] = new Animated.Value(1);
    }
    return scaleAnims[id];
  };

  const handlePress = (actionId: string) => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Scale animation
    const scaleAnim = getScaleAnim(actionId);
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
    switch (actionId) {
      case 'notifications':
        // TODO: Navigate to notifications screen or show notification panel
        console.log('Notifications pressed');
        break;
      case 'favorites':
        navigation.navigate('videos', { filter: 'favorites' });
        break;
      case 'downloads':
        // TODO: Navigate to downloads screen
        console.log('Downloads pressed');
        break;
      case 'search':
        setIsSearchFocused(true);
        break;
    }
  };

  const handleSearchFocus = () => {
    // Hide action buttons immediately before animation
    setIsSearchFocused(true);
    Animated.spring(searchAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleSearchBlur = () => {
    if (!searchQuery) {
      setIsSearchFocused(false);
      Animated.spring(searchAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleSearchClear = () => {
    setSearchQuery('');
    setIsSearchFocused(false);
    Animated.spring(searchAnim, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigation.navigate('videos', { searchQuery: searchQuery.trim() });
      handleSearchBlur();
    }
  };

  const actions = [
    { id: 'notifications', icon: Bell, badge: 0, enabled: true },
    { id: 'favorites', icon: Star, badge: undefined, enabled: true },
    { id: 'downloads', icon: Download, badge: undefined, enabled: true },
  ];

  // Calculate total height: safe area top + content height
  const minHeight = Math.max(insets.top, 8) + 64; // 64px for content (12px padding * 2 + 40px height)

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 8),
          minHeight: minHeight,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Title - Hidden when search is focused */}
        {title && !isSearchFocused && (
          <Text 
            style={styles.title}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
        )}

        {/* Search Bar */}
        {showSearch && (
          <View
            style={[
              styles.searchContainer,
              {
                flex: isSearchFocused ? 1 : 0,
                width: isSearchFocused ? undefined : 40,
                minWidth: isSearchFocused ? undefined : 40,
                maxWidth: isSearchFocused ? undefined : 40,
              },
            ]}
          >
            {isSearchFocused ? (
              <View style={styles.searchExpanded}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search videos..."
                  placeholderTextColor={COLORS.white40}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  onSubmitEditing={handleSearchSubmit}
                  autoFocus
                  returnKeyType="search"
                />
                {searchQuery ? (
                  <TouchableOpacity
                    onPress={handleSearchClear}
                    style={styles.searchClearButton}
                  >
                    <X size={16} color={COLORS.white60} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => handlePress('search')}
                style={styles.searchButton}
              >
                <Search size={20} color={COLORS.neonTeal} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Action Buttons - Hidden when search is focused */}
        {showActions && !isSearchFocused && (
          <View style={styles.actionsContainer}>
            {actions.map((action) => {
              const IconComponent = action.icon;
              const scaleAnim = getScaleAnim(action.id);
              const isEnabled = action.enabled !== false;

              return (
                <TouchableOpacity
                  key={action.id}
                  style={styles.actionButton}
                  onPress={() => handlePress(action.id)}
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
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: COLORS.dark,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff08',
    zIndex: 1000,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flexWrap: 'nowrap',
    overflow: 'hidden',
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
    flexShrink: 1,
    flexGrow: 0,
    marginRight: 8,
    minWidth: 0,
  },
  searchContainer: {
    height: 40,
    justifyContent: 'center',
    flexShrink: 0,
    flexGrow: 0,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  searchExpanded: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    paddingHorizontal: 16,
    height: 40,
    flex: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  searchClearButton: {
    padding: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 0,
    flexGrow: 0,
    alignItems: 'center',
    width: 'auto',
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderColor: COLORS.dark,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
  },
});
