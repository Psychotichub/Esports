import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
// Import WebView for native autoplay
let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    WebView = require('react-native-webview').WebView;
  } catch {
    // WebView not available
  }
}
import { Image } from 'expo-image';
import { Play, Flame, TrendingUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { getTrendingVideos, TrendingVideo, getGrowthIndicator } from '../lib/trendingEngine';
import VideoPreview from './VideoPreview';

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

interface SmartTrendingCarouselProps {
  videos: Array<{
    videoId: string;
    title: string;
    thumbnail: string;
    category: string;
    url: string;
    views: string;
    date: string;
  }>;
  onVideoPress: (video: any) => void;
}

export default function SmartTrendingCarousel({
  videos,
  onVideoPress,
}: SmartTrendingCarouselProps) {
  const [trendingVideos, setTrendingVideos] = useState<TrendingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoPlayIndex, setAutoPlayIndex] = useState<number | null>(null);
  const [previewVideo, setPreviewVideo] = useState<TrendingVideo | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Load trending videos with smart algorithm
  const loadTrendingVideos = async () => {
    try {
      const trending = await getTrendingVideos(videos, 10);
      setTrendingVideos(trending);
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error loading trending videos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 60 seconds
  useEffect(() => {
    loadTrendingVideos();
    
    refreshIntervalRef.current = setInterval(() => {
      loadTrendingVideos();
    }, 60000); // 60 seconds
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
      }
    };
  }, [videos]);

  // Handle scroll for autoplay
  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const cardWidth = 280; // Card width + margin
    const currentIndex = Math.round(offsetX / cardWidth);
    
    // Clear previous timer and autoplay
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
    }
    setAutoPlayIndex(null);
    
    // Set new autoplay after 2 seconds of staying on a card
    autoPlayTimerRef.current = setTimeout(() => {
      if (currentIndex < trendingVideos.length && currentIndex >= 0) {
        setAutoPlayIndex(currentIndex);
        // Auto-stop after 2 seconds of playback (total 4 seconds)
        setTimeout(() => {
          setAutoPlayIndex(null);
        }, 2000);
      }
    }, 2000);
  };

  // Handle long press for preview
  const handleLongPress = (video: TrendingVideo, position: { x: number; y: number }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPreviewVideo(video);
    setPreviewPosition(position);
  };

  const handlePressOut = () => {
    setPreviewVideo(null);
  };

  const renderVideoCard = ({ item, index }: { item: TrendingVideo; index: number }) => {
    const growth = getGrowthIndicator(item.growthToday || 0);
    const isAutoPlaying = autoPlayIndex === index;
    
    return (
      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.videoCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onVideoPress(item);
          }}
          onLongPress={(e) => {
            const { pageX, pageY } = e.nativeEvent;
            handleLongPress(item, { x: pageX, y: pageY });
          }}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          {/* Thumbnail */}
          <View style={styles.thumbnailContainer}>
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.thumbnail}
              contentFit="cover"
              transition={200}
            />
            
            {/* Autoplay overlay (soundless 2-second preview) */}
            {isAutoPlaying && (
              <View style={styles.autoplayOverlay}>
                {Platform.OS === 'web' ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${item.videoId}?autoplay=1&mute=1&controls=0&start=0&end=2&loop=0&modestbranding=1&playsinline=1`}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      pointerEvents: 'none',
                    }}
                    allow="autoplay; encrypted-media"
                  />
                ) : WebView ? (
                  <WebView
                    source={{
                      uri: `https://www.youtube.com/embed/${item.videoId}?autoplay=1&mute=1&controls=0&start=0&end=2&loop=0&modestbranding=1&playsinline=1`,
                    }}
                    style={styles.autoplayWebView}
                    mediaPlaybackRequiresUserAction={false}
                    allowsInlineMediaPlayback={true}
                    muted={true}
                    scrollEnabled={false}
                    pointerEvents="none"
                  />
                ) : (
                  <View style={styles.autoplayIndicator}>
                    <Play size={24} color={COLORS.white} fill={COLORS.white} />
                    <Text style={styles.autoplayText}>Preview</Text>
                  </View>
                )}
              </View>
            )}
            
            {/* Trending Badge */}
            <View style={styles.trendingBadge}>
              <Flame size={12} color={COLORS.neonRed} fill={COLORS.neonRed} />
              <Text style={styles.trendingBadgeText}>TRENDING</Text>
            </View>
            
            {/* Micro Social Proof */}
            <View style={styles.socialProof}>
              <View style={styles.watchingNow}>
                <Flame size={10} color={COLORS.neonRed} />
                <Text style={styles.watchingNowText}>
                  {item.watchingNow} watching
                </Text>
              </View>
              <View style={[styles.growthBadge, { backgroundColor: `${growth.color}20` }]}>
                <Text style={[styles.growthText, { color: growth.color }]}>
                  {growth.text}
                </Text>
              </View>
            </View>
            
            {/* Play Button */}
            <View style={styles.playOverlay}>
              <View style={styles.playButton}>
                <Play size={20} color={COLORS.white} fill={COLORS.white} />
              </View>
            </View>
          </View>

          {/* Video Info */}
          <View style={styles.videoInfo}>
            <Text style={styles.videoTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.videoMeta}>
              <Text style={styles.category}>{item.category}</Text>
              <View style={styles.metricsRow}>
                <TrendingUp size={10} color={COLORS.neonTeal} />
                <Text style={styles.trendingScore}>
                  {Math.round(item.trendingScore).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading || trendingVideos.length === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Flame size={20} color={COLORS.neonRed} fill={COLORS.neonRed} />
          <Text style={styles.title}>Trending Now</Text>
        </View>
        <Text style={styles.subtitle}>Auto-refreshing every 60s</Text>
      </View>

      <FlatList
        data={trendingVideos}
        renderItem={renderVideoCard}
        keyExtractor={(item) => item.videoId}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        pagingEnabled={false}
        snapToInterval={280}
        decelerationRate="fast"
      />
      
      {/* Video Preview on Long Press */}
      {previewVideo && (
        <VideoPreview
          video={{
            id: previewVideo.videoId,
            title: previewVideo.title,
            category: previewVideo.category,
            url: previewVideo.url,
            views: previewVideo.views.toString(),
            date: previewVideo.date,
            color: COLORS.neonTeal,
          }}
          position={previewPosition}
          onClose={() => setPreviewVideo(null)}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  header: ViewStyle;
  headerLeft: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  listContent: ViewStyle;
  cardContainer: ViewStyle;
  videoCard: ViewStyle;
  thumbnailContainer: ViewStyle;
  thumbnail: ViewStyle;
  autoplayOverlay: ViewStyle;
  autoplayIndicator: ViewStyle;
  autoplayText: TextStyle;
  autoplayWebView: ViewStyle;
  trendingBadge: ViewStyle;
  trendingBadgeText: TextStyle;
  socialProof: ViewStyle;
  watchingNow: ViewStyle;
  watchingNowText: TextStyle;
  growthBadge: ViewStyle;
  growthText: TextStyle;
  playOverlay: ViewStyle;
  playButton: ViewStyle;
  videoInfo: ViewStyle;
  videoTitle: TextStyle;
  videoMeta: ViewStyle;
  category: TextStyle;
  metricsRow: ViewStyle;
  trendingScore: TextStyle;
}>({
  container: {
    marginTop: 24,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 10,
    color: COLORS.white60,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  cardContainer: {
    marginRight: 12,
  },
  videoCard: {
    width: 280,
    backgroundColor: COLORS.darkLight,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff08',
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  autoplayOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  autoplayIndicator: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.neonRed,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
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
  autoplayText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  autoplayWebView: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  trendingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.dark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.neonRed,
  },
  trendingBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.neonRed,
    letterSpacing: 0.5,
  },
  socialProof: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    gap: 6,
  },
  watchingNow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  watchingNowText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
  growthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  growthText: {
    fontSize: 9,
    fontWeight: '700',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.neonRed,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.9,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.neonRed,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  videoInfo: {
    padding: 12,
    gap: 6,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 18,
  },
  videoMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    fontSize: 11,
    color: COLORS.neonTeal,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendingScore: {
    fontSize: 10,
    color: COLORS.white60,
    fontWeight: '600',
  },
});
