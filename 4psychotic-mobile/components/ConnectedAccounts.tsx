/**
 * ConnectedAccounts
 *
 * Lets an authenticated user connect / disconnect their YouTube, Facebook
 * and TikTok accounts via the proper OAuth 2.0 flow.
 *
 * Flow:
 *  1. User taps "Connect YouTube"
 *  2. We call GET /api/oauth/youtube/authorize?userId={numericUserId}
 *     on the backend, which generates a Google OAuth URL with a secure state.
 *  3. We open that URL with Linking.openURL (launches the device browser).
 *  4. The user authorises on the platform; the platform redirects back to
 *     the backend callback route which saves the encrypted tokens to the DB.
 *  5. When the app comes back to the foreground (AppState change) we refetch
 *     trpc.social.getConnectionStatus, which reads the DB.
 *  6. The card flips to "Connected ✓" automatically.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
  Alert,
  AppState,
  AppStateStatus,
  ActivityIndicator,
} from 'react-native';
import { Youtube, Facebook, Music, ExternalLink, Link2, Unlink, RefreshCw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../lib/authContext';
import { trpc } from '../lib/trpc';

// ─── constants ────────────────────────────────────────────────
const COLORS = {
  dark:           '#0a0e1a',
  darkLight:      '#0f1420',
  neonRed:        '#ff1744',
  neonTeal:       '#00e5ff',
  white:          '#ffffff',
  white60:        '#ffffff99',
  white40:        '#ffffff66',
  facebookBlue:   '#1877f2',
  tiktokPink:     '#ff0050',
  youtubeRed:     '#ff0000',
};

const PLATFORM_CONFIG = {
  youtube: {
    name: 'YouTube',
    icon: Youtube,
    color: COLORS.youtubeRed,
    description: 'Go live on your YouTube channel',
    dashboardUrl: 'https://studio.youtube.com',
  },
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: COLORS.facebookBlue,
    description: 'Go live on your Facebook Page',
    dashboardUrl: 'https://www.facebook.com/live/producer',
  },
  tiktok: {
    name: 'TikTok',
    icon: Music,
    color: COLORS.tiktokPink,
    description: 'Go live on TikTok',
    dashboardUrl: 'https://www.tiktok.com/live',
  },
} as const;

type Platform = keyof typeof PLATFORM_CONFIG;

// ─── helpers ──────────────────────────────────────────────────

/** Derive the backend server base URL from EXPO_PUBLIC_API_URL */
function getServerBaseUrl(): string {
  const trpcUrl =
    process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/trpc';
  return trpcUrl.replace('/api/trpc', '').replace(/\/$/, '');
}

/**
 * Convert the mobile app's local user.id string to a stable 32-bit integer
 * that will be used as `appUserId` in the `socialConnections` table.
 *
 * - If the id is a small integer string (e.g. "1") we use it directly.
 * - Otherwise we djb2-hash the email address so it is deterministic across
 *   sessions and devices.
 */
function toNumericUserId(user: { id: string; email: string }): number {
  const direct = parseInt(user.id, 10);
  if (!isNaN(direct) && direct > 0 && direct < 2_147_483_647) {
    return direct;
  }
  // djb2 hash of email → positive 32-bit integer
  let hash = 5_381;
  for (let i = 0; i < user.email.length; i++) {
    hash = ((hash << 5) + hash) ^ user.email.charCodeAt(i);
    hash = hash & hash; // keep 32-bit
  }
  return (Math.abs(hash) % 2_147_483_646) + 1; // 1 … 2 147 483 646
}

// ─── PlatformCard ─────────────────────────────────────────────

interface Connection {
  platform: Platform;
  channelOrPageId: string;
  platformUserId: string;
  isLive: boolean;
  connectedAt: string | Date | null;
}

interface PlatformCardProps {
  platform: Platform;
  connection: Connection | null;
  connecting: boolean;
  onConnect: (p: Platform) => void;
  onDisconnect: (p: Platform) => void;
}

function PlatformCard({
  platform,
  connection,
  connecting,
  onConnect,
  onDisconnect,
}: PlatformCardProps) {
  const config = PLATFORM_CONFIG[platform];
  const Icon = config.icon;
  const isConnected = !!connection;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isConnected && connection?.isLive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,   duration: 900, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
    pulseAnim.setValue(1);
  }, [isConnected, connection?.isLive, pulseAnim]);

  const channelLabel = connection
    ? connection.platformUserId || connection.channelOrPageId
    : null;

  return (
    <View style={[styles.card, isConnected && styles.cardConnected]}>
      <View style={styles.cardRow}>
        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: config.color + '22' }]}>
          <Icon size={22} color={config.color} />
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.platformName}>{config.name}</Text>
            {isConnected && connection!.isLive && (
              <Animated.View
                style={[styles.liveDot, { backgroundColor: config.color, transform: [{ scale: pulseAnim }] }]}
              />
            )}
            {isConnected && connection!.isLive && (
              <Text style={[styles.livePill, { color: config.color }]}>LIVE</Text>
            )}
          </View>

          {isConnected ? (
            <>
              <Text style={[styles.statusText, { color: COLORS.neonTeal }]}>✓ Connected</Text>
              {channelLabel ? (
                <Text style={styles.channelLabel} numberOfLines={1}>{channelLabel}</Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.descriptionText}>{config.description}</Text>
          )}
        </View>

        {/* Action icons */}
        <View style={styles.actionButtons}>
          {isConnected ? (
            <>
              {/* Open dashboard */}
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => Linking.openURL(config.dashboardUrl)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ExternalLink size={15} color={COLORS.white60} />
              </TouchableOpacity>
              {/* Disconnect */}
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => onDisconnect(platform)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Unlink size={15} color={COLORS.neonRed} />
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>

      {/* Connect button */}
      {!isConnected && (
        <TouchableOpacity
          style={[styles.connectBtn, { backgroundColor: config.color }, connecting && styles.connectBtnDisabled]}
          onPress={() => onConnect(platform)}
          activeOpacity={0.8}
          disabled={connecting}
        >
          {connecting ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Link2 size={16} color={COLORS.white} />
              <Text style={styles.connectBtnText}>Connect {config.name}</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── ConnectedAccounts ────────────────────────────────────────

export default function ConnectedAccounts() {
  const { user } = useAuth();
  const [connectingPlatform, setConnectingPlatform] = useState<Platform | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const pendingPlatformRef = useRef<Platform | null>(null);

  const numericUserId = user ? toNumericUserId(user) : 0;
  const serverBase = getServerBaseUrl();

  // ── Fetch connections from backend ────────────────────────
  const {
    data: connections,
    isLoading,
    refetch,
  } = trpc.social.getConnectionStatus.useQuery(
    { appUserId: numericUserId },
    {
      enabled: numericUserId > 0,
      refetchInterval: 30_000, // background refresh every 30 s
    }
  );

  // ── Disconnect mutation ───────────────────────────────────
  const disconnectMutation = trpc.social.publicDisconnect.useMutation({
    onSuccess: () => refetch(),
  });

  // ── AppState — refetch when app comes back to foreground ──
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (
          appStateRef.current.match(/inactive|background/) &&
          nextState === 'active' &&
          pendingPlatformRef.current
        ) {
          // User just returned from the browser — check if OAuth succeeded
          refetch();
          setConnectingPlatform(null);
          pendingPlatformRef.current = null;
        }
        appStateRef.current = nextState;
      }
    );
    return () => subscription.remove();
  }, [refetch]);

  // ── Connect handler ───────────────────────────────────────
  const handleConnect = useCallback(
    async (platform: Platform) => {
      if (!user) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const config = PLATFORM_CONFIG[platform];

      try {
        setConnectingPlatform(platform);

        // 1. Ask the backend to generate the OAuth URL for this user
        const res = await fetch(
          `${serverBase}/api/oauth/${platform}/authorize?userId=${numericUserId}`
        );

        if (!res.ok) {
          throw new Error(`Backend returned ${res.status}`);
        }

        const { authUrl } = (await res.json()) as { authUrl: string; state: string };

        // 2. Tell the user what's about to happen
        Alert.alert(
          `Connect ${config.name}`,
          `A browser window will open so you can authorise ${config.name}. Come back to the app when you're done.`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setConnectingPlatform(null),
            },
            {
              text: `Open ${config.name}`,
              onPress: async () => {
                // 3. Mark which platform is pending so AppState handler knows
                pendingPlatformRef.current = platform;
                await Linking.openURL(authUrl);
                // After URL opens the app goes to background.
                // AppState handler will refetch when it returns.
              },
            },
          ]
        );
      } catch (error) {
        console.error('[ConnectedAccounts] OAuth initiation failed:', error);
        setConnectingPlatform(null);
        Alert.alert(
          'Connection Failed',
          'Could not reach the server to start the OAuth flow. Make sure the backend is running.',
          [{ text: 'OK' }]
        );
      }
    },
    [user, serverBase, numericUserId]
  );

  // ── Disconnect handler ────────────────────────────────────
  const handleDisconnect = useCallback(
    (platform: Platform) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const config = PLATFORM_CONFIG[platform];

      Alert.alert(
        `Disconnect ${config.name}`,
        `Remove your ${config.name} connection? Your account on ${config.name} will not be affected.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: () => {
              disconnectMutation.mutate({ appUserId: numericUserId, platform });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            },
          },
        ]
      );
    },
    [numericUserId, disconnectMutation]
  );

  // ── Render ────────────────────────────────────────────────
  const platforms: Platform[] = ['youtube', 'facebook', 'tiktok'];
  const connectedCount = connections?.length ?? 0;
  const liveCount = connections?.filter(c => c.isLive).length ?? 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Connected Accounts</Text>
        <View style={styles.badges}>
          {connectedCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{connectedCount} linked</Text>
            </View>
          )}
          {liveCount > 0 && (
            <View style={[styles.badge, styles.liveBadge]}>
              <Text style={[styles.badgeText, { color: COLORS.neonRed }]}>
                🔴 {liveCount} live
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.sectionSubtitle}>
        Connect your streaming accounts. When you go live, you'll automatically appear in the Live Streams feed — visible to everyone.
      </Text>

      {/* How it works */}
      <View style={styles.howItWorks}>
        <Text style={styles.howItWorksText}>
          {'① Connect below  →  ② Go live on the platform  →  ③ Appear in the feed automatically'}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={COLORS.neonTeal}
          style={{ marginVertical: 20 }}
        />
      ) : (
        platforms.map(platform => (
          <PlatformCard
            key={platform}
            platform={platform}
            connection={
              (connections?.find(c => c.platform === platform) as Connection | undefined) ?? null
            }
            connecting={connectingPlatform === platform}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        ))
      )}

      {/* Manual refresh (in case AppState didn't fire) */}
      <TouchableOpacity
        style={styles.refreshBtn}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          refetch();
        }}
      >
        <RefreshCw size={13} color={COLORS.white40} />
        <Text style={styles.refreshText}>Refresh status</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff08',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    backgroundColor: COLORS.neonTeal + '20',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.neonTeal + '40',
  },
  liveBadge: {
    backgroundColor: COLORS.neonRed + '15',
    borderColor: COLORS.neonRed + '40',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.neonTeal,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.white40,
    lineHeight: 18,
    marginBottom: 12,
  },
  howItWorks: {
    backgroundColor: COLORS.neonTeal + '0D',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.neonTeal + '25',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  howItWorksText: {
    fontSize: 11,
    color: COLORS.neonTeal,
    lineHeight: 16,
  },
  // ── Card ──────────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.darkLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ffffff08',
  },
  cardConnected: {
    borderColor: COLORS.neonTeal + '35',
    backgroundColor: COLORS.neonTeal + '07',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  platformName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  livePill: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  channelLabel: {
    fontSize: 11,
    color: COLORS.white40,
  },
  descriptionText: {
    fontSize: 12,
    color: COLORS.white60,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 8,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ── Connect button ─────────────────────────────────────────
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  connectBtnDisabled: {
    opacity: 0.6,
  },
  connectBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  // ── Refresh ────────────────────────────────────────────────
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 8,
  },
  refreshText: {
    fontSize: 11,
    color: COLORS.white40,
  },
});
