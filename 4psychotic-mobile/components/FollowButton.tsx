/**
 * FollowButton.tsx
 * Reusable follow / unfollow button.
 * Requires auth — shows AuthRequiredModal if user is a guest.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { UserPlus, UserCheck, Bell, BellOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { isFollowing, toggleFollowUser, setNotifications, getFollowing } from '../lib/userFollowSystem';
import { useAuth } from '../lib/authContext';

interface Props {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  showNotificationToggle?: boolean;
  onFollowChange?: (isNowFollowing: boolean) => void;
}

const NEON_RED  = '#ff1744';
const DARK_CARD = '#0f1420';
const WHITE     = '#ffffff';

export default function FollowButton({
  userId,
  size = 'md',
  showNotificationToggle = false,
  onFollowChange,
}: Props) {
  const { isAuthenticated, requireAuth } = useAuth();
  const [following, setFollowing]     = useState(false);
  const [notifOn, setNotifOn]         = useState(true);
  const [loading, setLoading]         = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let active = true;
    isFollowing(userId).then(f => { if (active) { setFollowing(f); setLoading(false); } });
    getFollowing().then(list => {
      const rel = list.find(r => r.userId === userId);
      if (active && rel) setNotifOn(rel.notificationsOn);
    });
    return () => { active = false; };
  }, [userId]);

  const pulse = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.18, useNativeDriver: true, speed: 40 }),
      Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 40 }),
    ]).start();
  };

  const handlePress = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    pulse();
    setLoading(true);
    const nowFollowing = await toggleFollowUser(userId);
    setFollowing(nowFollowing);
    setLoading(false);
    onFollowChange?.(nowFollowing);
  };

  const handleNotifToggle = async () => {
    const next = !notifOn;
    setNotifOn(next);
    await setNotifications(userId, next);
    Haptics.selectionAsync();
  };

  const sizeStyle = SIZE_STYLES[size];

  // Lazy-import to avoid circular dependency from AuthRequiredModal
  let AuthModal: any = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    AuthModal = require('./AuthRequiredModal').default;
  } catch {}

  return (
    <>
      <Animated.View style={{ transform: [{ scale: scaleAnim }], flexDirection: 'row', gap: 6 }}>
        <TouchableOpacity
          onPress={handlePress}
          style={[
            styles.btn,
            sizeStyle.btn,
            following ? styles.followingBtn : styles.followBtn,
          ]}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={following ? NEON_RED : WHITE} />
          ) : (
            <>
              {following
                ? <UserCheck size={sizeStyle.iconSize} color={NEON_RED} />
                : <UserPlus  size={sizeStyle.iconSize} color={WHITE} />}
              <Text style={[styles.btnText, sizeStyle.text, following ? styles.followingText : styles.followText]}>
                {following ? 'Following' : 'Follow'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Notification bell — shown only when following and prop is set */}
        {following && showNotificationToggle && (
          <TouchableOpacity
            onPress={handleNotifToggle}
            style={[styles.notifBtn, sizeStyle.btn]}
            activeOpacity={0.8}
          >
            {notifOn
              ? <Bell    size={sizeStyle.iconSize} color={NEON_RED} />
              : <BellOff size={sizeStyle.iconSize} color={'#ffffff40'} />}
          </TouchableOpacity>
        )}
      </Animated.View>

      {showAuthModal && AuthModal && (
        <AuthModal
          visible={showAuthModal}
          action="follow users"
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </>
  );
}

// ─── size variants ─────────────────────────────────────────────────────────────

const SIZE_STYLES = {
  sm: { btn: { paddingHorizontal: 10, paddingVertical: 5, gap: 4 }, iconSize: 12, text: { fontSize: 11 } },
  md: { btn: { paddingHorizontal: 16, paddingVertical: 8, gap: 6 }, iconSize: 14, text: { fontSize: 13 } },
  lg: { btn: { paddingHorizontal: 20, paddingVertical: 11, gap: 7 }, iconSize: 16, text: { fontSize: 15 } },
};

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
  },
  followBtn: {
    backgroundColor: NEON_RED,
    borderColor: NEON_RED,
  },
  followingBtn: {
    backgroundColor: `${NEON_RED}15`,
    borderColor: `${NEON_RED}60`,
  },
  btnText: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  followText: {
    color: WHITE,
  },
  followingText: {
    color: NEON_RED,
  },
  notifBtn: {
    backgroundColor: DARK_CARD,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ffffff15',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
