import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  ScrollView,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { Clock, Bell, Eye, Play, MessageCircle, TrendingUp, AlertCircle } from 'lucide-react-native';
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

// Import WebView for video preview
let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    WebView = require('react-native-webview').WebView;
  } catch {
    // WebView not available
  }
}

const COLORS = {
  dark: '#0a0e1a',
  darkLight: '#0f1420',
  neonRed: '#ff1744',
  neonTeal: '#00e5ff',
  white: '#ffffff',
  white60: '#ffffff99',
  white40: '#ffffff66',
  success: '#00ff88',
};

interface LiveStreamOptimizationProps {
  isLive: boolean;
  liveData?: {
    title: string;
    viewerCount: number;
    videoId?: string;
    thumbnail?: string;
  } | null;
  nextStreamTime?: Date;
  previousStreamHighlight?: {
    title: string;
    thumbnail: string;
    url: string;
    videoId?: string;
  } | null;
  bestClips?: Array<{
    title: string;
    thumbnail: string;
    url: string;
    timestamp?: string;
  }>;
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

export default function LiveStreamOptimization({
  isLive,
  liveData,
  nextStreamTime,
  previousStreamHighlight,
  bestClips = [],
}: LiveStreamOptimizationProps) {
  const [countdown, setCountdown] = useState<string>('');
  const [reminderSet, setReminderSet] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Pulse animation for live indicator
  useEffect(() => {
    if (isLive) {
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

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Countdown timer
  useEffect(() => {
    if (!isLive && nextStreamTime) {
      const updateCountdown = () => {
        const now = new Date();
        const diff = nextStreamTime.getTime() - now.getTime();

        if (diff <= 0) {
          setCountdown('Starting soon...');
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (hours > 0) {
          setCountdown(`${hours}h ${minutes}m`);
        } else if (minutes > 0) {
          setCountdown(`${minutes}m ${seconds}s`);
        } else {
          setCountdown(`${seconds}s`);
        }
      };

      updateCountdown();
      countdownIntervalRef.current = setInterval(updateCountdown, 1000);

      return () => {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
      };
    }
  }, [isLive, nextStreamTime]);

  // Set reminder notification
  const handleSetReminder = async () => {
    if (!nextStreamTime || !Notifications) {
      // Fallback: just show confirmation
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setReminderSet(true);
      setTimeout(() => setReminderSet(false), 3000);
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔴 Live Stream Starting!',
          body: '4PSYCHOTIC is going live now!',
          sound: true,
          data: { type: 'live_stream' },
        },
        trigger: nextStreamTime,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setReminderSet(true);
      setTimeout(() => setReminderSet(false), 3000);
    } catch (error) {
      console.error('Error setting reminder:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleWatchLive = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL('https://www.youtube.com/@sureshpokharel243/live');
  };

  const handleClipPress = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url);
  };

  // Mock live chat messages (in production, fetch from YouTube API)
  const liveChatMessages = [
    { user: 'GamerPro99', message: '🔥 This is insane!', time: 'now' },
    { user: 'StreamFan', message: 'Clutch play incoming!', time: '30s ago' },
    { user: 'PUBG_Master', message: 'Let\'s go! 🎮', time: '1m ago' },
  ];

  // LIVE STATE
  if (isLive && liveData) {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Live Stream Card */}
        <TouchableOpacity
          style={styles.liveCard}
          onPress={handleWatchLive}
          activeOpacity={0.9}
        >
          {/* Live Video Preview */}
          {showPreview && liveData.videoId && (
            <View style={styles.videoPreviewContainer}>
              {Platform.OS === 'web' ? (
                <iframe
                  src={`https://www.youtube.com/embed/${liveData.videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1`}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                  allow="autoplay; encrypted-media"
                />
              ) : WebView ? (
                <WebView
                  source={{
                    uri: `https://www.youtube.com/embed/${liveData.videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1`,
                  }}
                  style={styles.videoPreview}
                  mediaPlaybackRequiresUserAction={false}
                  allowsInlineMediaPlayback={true}
                  muted={true}
                  scrollEnabled={false}
                />
              ) : liveData.thumbnail ? (
                <Image
                  source={{ uri: liveData.thumbnail }}
                  style={styles.videoPreview}
                  contentFit="cover"
                />
              ) : null}
              
              {/* Live Overlay */}
              <View style={styles.liveOverlay}>
                <Animated.View
                  style={[
                    styles.liveIndicator,
                    {
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                >
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </Animated.View>
                
                {/* Viewer Count */}
                <View style={styles.viewerCountBadge}>
                  <Eye size={14} color={COLORS.white} />
                  <Text style={styles.viewerCountText}>
                    {liveData.viewerCount.toLocaleString()} watching
                  </Text>
                </View>
              </View>

              {/* Play Button Overlay */}
              <View style={styles.playOverlay}>
                <View style={styles.playButton}>
                  <Play size={24} color={COLORS.white} fill={COLORS.white} />
                </View>
              </View>
            </View>
          )}

          {/* Stream Info */}
          <View style={styles.streamInfo}>
            <Text style={styles.streamTitle} numberOfLines={2}>
              {liveData.title}
            </Text>
            
            {/* Join CTA */}
            <View style={styles.joinSection}>
              <View style={styles.joinBadge}>
                <Eye size={12} color={COLORS.neonRed} />
                <Text style={styles.joinText}>
                  Join {liveData.viewerCount.toLocaleString()} gamers live
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Live Chat Preview */}
        <View style={styles.chatPreview}>
          <View style={styles.chatHeader}>
            <MessageCircle size={16} color={COLORS.neonTeal} />
            <Text style={styles.chatHeaderText}>Live Chat</Text>
          </View>
          <ScrollView
            style={styles.chatMessages}
            showsVerticalScrollIndicator={false}
          >
            {liveChatMessages.map((msg, index) => (
              <View key={index} style={styles.chatMessage}>
                <Text style={styles.chatUser}>{msg.user}:</Text>
                <Text style={styles.chatText}> {msg.message}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </Animated.View>
    );
  }

  // OFFLINE STATE
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Countdown Card */}
      {nextStreamTime && (
        <View style={styles.countdownCard}>
          <View style={styles.countdownHeader}>
            <Clock size={20} color={COLORS.neonTeal} />
            <Text style={styles.countdownTitle}>Next Stream</Text>
          </View>
          <Text style={styles.countdownTime}>{countdown}</Text>
          
          <TouchableOpacity
            style={[styles.reminderButton, reminderSet && styles.reminderButtonActive]}
            onPress={handleSetReminder}
            activeOpacity={0.8}
          >
            <Bell size={16} color={reminderSet ? COLORS.white : COLORS.neonTeal} />
            <Text style={[styles.reminderText, reminderSet && styles.reminderTextActive]}>
              {reminderSet ? 'Reminder Set!' : 'Set Reminder'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FOMO Banner */}
      {previousStreamHighlight && (
        <TouchableOpacity
          style={styles.fomoBanner}
          onPress={() => handleClipPress(previousStreamHighlight.url)}
          activeOpacity={0.9}
        >
          <View style={styles.fomoContent}>
            <AlertCircle size={18} color={COLORS.neonRed} />
            <View style={styles.fomoTextContainer}>
              <Text style={styles.fomoTitle}>You missed yesterday's clutch play</Text>
              <Text style={styles.fomoSubtitle}>Watch the best moments now</Text>
            </View>
            <Play size={20} color={COLORS.neonRed} />
          </View>
        </TouchableOpacity>
      )}

      {/* Best Clips from Last Stream */}
      {bestClips.length > 0 && (
        <View style={styles.clipsSection}>
          <View style={styles.clipsHeader}>
            <TrendingUp size={18} color={COLORS.neonTeal} />
            <Text style={styles.clipsTitle}>Best Clips from Last Stream</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.clipsList}
          >
            {bestClips.map((clip, index) => (
              <TouchableOpacity
                key={index}
                style={styles.clipCard}
                onPress={() => handleClipPress(clip.url)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: clip.thumbnail }}
                  style={styles.clipThumbnail}
                  contentFit="cover"
                />
                <View style={styles.clipOverlay}>
                  <Play size={16} color={COLORS.white} fill={COLORS.white} />
                </View>
                <View style={styles.clipInfo}>
                  <Text style={styles.clipTitle} numberOfLines={2}>
                    {clip.title}
                  </Text>
                  {clip.timestamp && (
                    <Text style={styles.clipTimestamp}>{clip.timestamp}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Fallback: Show previous highlight if no clips */}
      {bestClips.length === 0 && previousStreamHighlight && (
        <TouchableOpacity
          style={styles.highlightCard}
          onPress={() => handleClipPress(previousStreamHighlight.url)}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: previousStreamHighlight.thumbnail }}
            style={styles.highlightThumbnail}
            contentFit="cover"
          />
          <View style={styles.highlightOverlay}>
            <Play size={24} color={COLORS.white} fill={COLORS.white} />
          </View>
          <View style={styles.highlightInfo}>
            <Text style={styles.highlightTitle} numberOfLines={2}>
              {previousStreamHighlight.title}
            </Text>
            <Text style={styles.highlightSubtitle}>Previous Stream Highlights</Text>
          </View>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  liveCard: ViewStyle;
  videoPreviewContainer: ViewStyle;
  videoPreview: ViewStyle;
  liveOverlay: ViewStyle;
  liveIndicator: ViewStyle;
  liveDot: ViewStyle;
  liveText: TextStyle;
  viewerCountBadge: ViewStyle;
  viewerCountText: TextStyle;
  playOverlay: ViewStyle;
  playButton: ViewStyle;
  streamInfo: ViewStyle;
  streamTitle: TextStyle;
  joinSection: ViewStyle;
  joinBadge: ViewStyle;
  joinText: TextStyle;
  chatPreview: ViewStyle;
  chatHeader: ViewStyle;
  chatHeaderText: TextStyle;
  chatMessages: ViewStyle;
  chatMessage: ViewStyle;
  chatUser: TextStyle;
  chatText: TextStyle;
  countdownCard: ViewStyle;
  countdownHeader: ViewStyle;
  countdownTitle: TextStyle;
  countdownTime: TextStyle;
  reminderButton: ViewStyle;
  reminderButtonActive: ViewStyle;
  reminderText: TextStyle;
  reminderTextActive: TextStyle;
  fomoBanner: ViewStyle;
  fomoContent: ViewStyle;
  fomoTextContainer: ViewStyle;
  fomoTitle: TextStyle;
  fomoSubtitle: TextStyle;
  clipsSection: ViewStyle;
  clipsHeader: ViewStyle;
  clipsTitle: TextStyle;
  clipsList: ViewStyle;
  clipCard: ViewStyle;
  clipThumbnail: ViewStyle;
  clipOverlay: ViewStyle;
  clipInfo: ViewStyle;
  clipTitle: TextStyle;
  clipTimestamp: TextStyle;
  highlightCard: ViewStyle;
  highlightThumbnail: ViewStyle;
  highlightOverlay: ViewStyle;
  highlightInfo: ViewStyle;
  highlightTitle: TextStyle;
  highlightSubtitle: TextStyle;
}>({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  liveCard: {
    backgroundColor: COLORS.darkLight,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.neonRed + '40',
  },
  videoPreviewContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
    backgroundColor: COLORS.dark,
  },
  videoPreview: {
    width: '100%',
    height: '100%',
  },
  liveOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.dark + 'E6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.neonRed,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.neonRed,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.neonRed,
    letterSpacing: 1,
  },
  viewerCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.dark + 'E6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewerCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.neonRed,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.neonRed,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  streamInfo: {
    padding: 16,
    gap: 12,
  },
  streamTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 22,
  },
  joinSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.neonRed + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.neonRed + '40',
  },
  joinText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.neonRed,
  },
  chatPreview: {
    marginTop: 12,
    backgroundColor: COLORS.darkLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ffffff08',
    maxHeight: 120,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  chatHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.neonTeal,
    letterSpacing: 0.5,
  },
  chatMessages: {
    maxHeight: 80,
  },
  chatMessage: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  chatUser: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.neonTeal,
  },
  chatText: {
    fontSize: 11,
    color: COLORS.white60,
  },
  countdownCard: {
    backgroundColor: COLORS.darkLight,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.neonTeal + '40',
    alignItems: 'center',
    gap: 12,
  },
  countdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countdownTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  countdownTime: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.neonTeal,
    letterSpacing: 2,
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.neonTeal + '20',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.neonTeal,
  },
  reminderButtonActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  reminderText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.neonTeal,
  },
  reminderTextActive: {
    color: COLORS.white,
  },
  fomoBanner: {
    backgroundColor: COLORS.neonRed + '20',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.neonRed + '40',
    marginTop: 12,
  },
  fomoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fomoTextContainer: {
    flex: 1,
    gap: 4,
  },
  fomoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  fomoSubtitle: {
    fontSize: 12,
    color: COLORS.white60,
  },
  clipsSection: {
    marginTop: 16,
  },
  clipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  clipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  clipsList: {
    gap: 12,
  },
  clipCard: {
    width: 200,
    backgroundColor: COLORS.darkLight,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff08',
    marginRight: 12,
  },
  clipThumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  clipOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.neonRed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clipInfo: {
    padding: 10,
    gap: 4,
  },
  clipTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
    lineHeight: 16,
  },
  clipTimestamp: {
    fontSize: 10,
    color: COLORS.white60,
  },
  highlightCard: {
    backgroundColor: COLORS.darkLight,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff08',
    marginTop: 12,
  },
  highlightThumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  highlightOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  highlightInfo: {
    padding: 16,
    gap: 6,
  },
  highlightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 18,
  },
  highlightSubtitle: {
    fontSize: 12,
    color: COLORS.neonTeal,
    fontWeight: '600',
  },
});
