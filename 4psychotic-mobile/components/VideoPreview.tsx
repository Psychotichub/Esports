import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  ViewStyle,
  TextStyle,
  ImageStyle,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { Play, Eye, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const COLORS = {
  dark: '#0a0a0a',
  darkLight: '#1a1a1a',
  white: '#ffffff',
  white60: '#ffffff99',
  white40: '#ffffff66',
  neonTeal: '#00ffd1',
  neonRed: '#ff006e',
};

interface VideoPreviewProps {
  video: {
    id: number;
    title: string;
    category: string;
    views: string;
    date: string;
    url: string;
    color: string;
  };
  visible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onOpenFull: () => void;
}

// Import WebView for native platforms
let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    WebView = require('react-native-webview').WebView;
  } catch {
    console.warn('WebView not available');
  }
}

const getVideoId = (url: string): string | null => {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : null;
};

const getYouTubeThumbnail = (url: string, quality: 'default' | 'mqdefault' | 'hqdefault' = 'hqdefault'): string | null => {
  const videoId = getVideoId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};

export default function VideoPreview({ video, visible, position, onClose, onOpenFull }: VideoPreviewProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [previewStarted, setPreviewStarted] = useState(false);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      setPreviewStarted(false);
      // Start preview video playback after 2 seconds
      const startDelay = setTimeout(() => {
        setPreviewStarted(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 2000) as unknown as NodeJS.Timeout;

      // Auto-close preview after 7 seconds (2s delay + 5s playback)
      previewTimeoutRef.current = setTimeout(() => {
        onClose();
      }, 7000) as unknown as NodeJS.Timeout;

      // Animate in
      Animated.parallel([
        Animated.spring(fadeAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      return () => {
        clearTimeout(startDelay);
        if (previewTimeoutRef.current) {
          clearTimeout(previewTimeoutRef.current);
        }
      };
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setPreviewStarted(false);
    }
  }, [visible, fadeAnim, scaleAnim, onClose]);

  if (!visible) return null;

  const thumbnailUrl = getYouTubeThumbnail(video.url) || '';
  const videoId = getVideoId(video.url);
  const previewVideoUrl = videoId 
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&start=0&end=5&controls=0&modestbranding=1&rel=0&playsinline=1&loop=0`
    : null;

  // Calculate position for preview (center it near the card)
  const previewWidth = 400;
  const previewHeight = 300;
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 400;
  const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 600;
  
  let left = position.x - previewWidth / 2;
  let top = position.y - previewHeight - 20;

  // Adjust if preview goes off screen
  if (left < 20) left = 20;
  if (left + previewWidth > screenWidth - 20) left = screenWidth - previewWidth - 20;
  if (top < 20) top = position.y + 20;
  if (top + previewHeight > screenHeight - 20) top = screenHeight - previewHeight - 20;

  return (
    <Animated.View
      style={[
        styles.previewContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          left,
          top,
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={styles.previewCard}
        activeOpacity={0.95}
        onPress={onOpenFull}
      >
        {/* Preview Video Player */}
        <View style={styles.previewPlayer}>
          {previewStarted && previewVideoUrl ? (
            Platform.OS === 'web' ? (
              <iframe
                src={previewVideoUrl}
                style={styles.previewIframe as any}
                allow="autoplay; encrypted-media"
                allowFullScreen={false}
              />
            ) : WebView ? (
              <WebView
                source={{ uri: previewVideoUrl }}
                style={styles.previewWebView}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                domStorageEnabled
                originWhitelist={['*']}
                mixedContentMode="always"
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.previewFallback}>
                <Image
                  source={{ uri: thumbnailUrl }}
                  style={styles.previewThumbnail}
                  contentFit="cover"
                />
                <View style={styles.previewPlayOverlay}>
                  <View style={[styles.previewPlayButton, { backgroundColor: video.color }]}>
                    <Play size={32} color={COLORS.white} fill={COLORS.white} />
                  </View>
                </View>
              </View>
            )
          ) : (
            <View style={styles.previewFallback}>
              <Image
                source={{ uri: thumbnailUrl }}
                style={styles.previewThumbnail}
                contentFit="cover"
              />
              <View style={styles.previewPlayOverlay}>
                <View style={[styles.previewPlayButton, { backgroundColor: video.color }]}>
                  <Play size={32} color={COLORS.white} fill={COLORS.white} />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Video Info Overlay */}
        <View style={styles.previewInfo}>
          <View style={styles.previewInfoHeader}>
            <Text style={styles.previewCategory} numberOfLines={1}>
              {video.category}
            </Text>
            <View style={styles.previewMeta}>
              <View style={styles.previewMetaItem}>
                <Eye size={12} color={COLORS.white60} />
                <Text style={styles.previewMetaText}>{video.views}</Text>
              </View>
              <View style={styles.previewMetaItem}>
                <Clock size={12} color={COLORS.white60} />
                <Text style={styles.previewMetaText}>{video.date}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.previewTitle} numberOfLines={2}>
            {video.title}
          </Text>
          <View style={styles.previewActions}>
            <Text style={styles.previewHint}>
              {Platform.OS === 'web' ? 'Click to watch' : 'Release to watch'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create<{
  previewContainer: ViewStyle;
  previewCard: ViewStyle;
  previewPlayer: ViewStyle;
  previewIframe: ViewStyle;
  previewWebView: ViewStyle;
  previewFallback: ViewStyle;
  previewThumbnail: ImageStyle;
  previewPlayOverlay: ViewStyle;
  previewPlayButton: ViewStyle;
  previewInfo: ViewStyle;
  previewInfoHeader: ViewStyle;
  previewCategory: TextStyle;
  previewMeta: ViewStyle;
  previewMetaItem: ViewStyle;
  previewMetaText: TextStyle;
  previewTitle: TextStyle;
  previewActions: ViewStyle;
  previewHint: TextStyle;
}>({
  previewContainer: {
    position: 'absolute',
    zIndex: 10000,
    width: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
  },
  previewCard: {
    backgroundColor: COLORS.darkLight,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff08',
  },
  previewPlayer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: COLORS.dark,
    overflow: 'hidden',
  },
  previewIframe: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
  } as any,
  previewWebView: {
    flex: 1,
  },
  previewFallback: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  previewThumbnail: {
    width: '100%',
    height: '100%',
  },
  previewPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  previewPlayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  previewInfo: {
    padding: 16,
    gap: 8,
  },
  previewInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.neonTeal,
    letterSpacing: 0.5,
    flex: 1,
  },
  previewMeta: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  previewMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewMetaText: {
    fontSize: 10,
    color: COLORS.white60,
    fontWeight: '600',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 20,
  },
  previewActions: {
    marginTop: 4,
  },
  previewHint: {
    fontSize: 11,
    color: COLORS.white60,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
