import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Youtube, Facebook, Music, Check, X, ExternalLink } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import LiveBadge from './LiveBadge';
import { useLiveStatus, useSocialConnections } from '../lib/hooks/useLiveStatus';
import { trpc } from '../lib/trpc';

const COLORS = {
  dark: '#0a0e1a',
  darkLight: '#0f1420',
  neonRed: '#ff1744',
  neonTeal: '#00e5ff',
  white: '#ffffff',
  white60: '#ffffff99',
  white40: '#ffffff66',
  facebookBlue: '#1877f2',
  tiktokPink: '#ff0050',
};

interface SocialConnectionCardProps {
  platform: 'youtube' | 'facebook' | 'tiktok';
  userId: number;
  onConnect?: () => void;
}

export default function SocialConnectionCard({
  platform,
  userId,
  onConnect,
}: SocialConnectionCardProps) {
  const { data: connections } = useSocialConnections();
  const { data: liveStatus } = useLiveStatus(userId);
  const disconnectMutation = trpc.social.disconnect.useMutation();
  const getAuthUrlQuery = trpc.social.getAuthUrl.useQuery(
    { platform },
    { enabled: false } // Only fetch when button is clicked
  );

  const connection = connections?.find(conn => conn.platform === platform);
  const platformLiveStatus = liveStatus?.find(status => status.platform === platform);

  const platformConfig = {
    youtube: {
      name: 'YouTube',
      icon: Youtube,
      color: COLORS.neonRed,
      url: connection ? `https://www.youtube.com/channel/${connection.channelOrPageId}` : null,
    },
    facebook: {
      name: 'Facebook',
      icon: Facebook,
      color: COLORS.facebookBlue,
      url: connection ? `https://www.facebook.com/${connection.channelOrPageId}` : null,
    },
    tiktok: {
      name: 'TikTok',
      icon: Music,
      color: COLORS.tiktokPink,
      url: connection ? `https://www.tiktok.com/@${connection.channelOrPageId}` : null,
    },
  };

  const config = platformConfig[platform];
  const Icon = config.icon;
  const isConnected = !!connection;
  const isLive = platformLiveStatus?.isLive || false;

  const handleConnect = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await getAuthUrlQuery.refetch();
      if (result.data?.authUrl) {
        await Linking.openURL(result.data.authUrl);
        onConnect?.();
      }
    } catch (error) {
      console.error('Failed to get auth URL:', error);
    }
  };

  const handleDisconnect = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await disconnectMutation.mutateAsync({ platform });
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const handleOpenProfile = () => {
    if (config.url) {
      Linking.openURL(config.url);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.platformInfo}>
          <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
            <Icon size={24} color={config.color} />
          </View>
          <View style={styles.platformDetails}>
            <Text style={styles.platformName}>{config.name}</Text>
            {isConnected ? (
              <View style={styles.statusRow}>
                <Check size={14} color={COLORS.neonTeal} />
                <Text style={styles.statusText}>Connected</Text>
                {isLive && platformLiveStatus && (
                  <LiveBadge liveStatus={[platformLiveStatus]} size="small" />
                )}
              </View>
            ) : (
              <Text style={styles.statusText}>Not connected</Text>
            )}
          </View>
        </View>

        {isConnected && (
          <View style={styles.actions}>
            {config.url && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleOpenProfile}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ExternalLink size={16} color={COLORS.white60} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDisconnect}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={COLORS.neonRed} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {!isConnected && (
        <TouchableOpacity
          style={[styles.connectButton, { backgroundColor: config.color }]}
          onPress={handleConnect}
        >
          <Text style={styles.connectButtonText}>Connect {config.name}</Text>
        </TouchableOpacity>
      )}

      {isConnected && connection.lastCheckedAt && (
        <Text style={styles.lastChecked}>
          Last checked: {new Date(connection.lastCheckedAt).toLocaleTimeString()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.darkLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffffff08',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  platformDetails: {
    flex: 1,
  },
  platformName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.white60,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  lastChecked: {
    fontSize: 10,
    color: COLORS.white40,
    marginTop: 8,
  },
});
