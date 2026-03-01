import React, { useState, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Modal,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Play, Radio, Zap, Gamepad2, Star, X } from 'lucide-react-native';
import { trpc } from '../../lib/trpc';
import TrendingVideosCarousel from '../../components/TrendingVideosCarousel';
import ContinueWatching from '../../components/ContinueWatching';
import AnimatedStat from '../../components/AnimatedStat';
import TopNavBar from '../../components/TopNavBar';
import PersonalizedRecommendations from '../../components/PersonalizedRecommendations';
import EnhancedLiveBadge from '../../components/EnhancedLiveBadge';
import SocialProof from '../../components/SocialProof';
import { WatchHistoryItem, saveWatchHistory, updateWatchProgress, getRecentWatchHistory } from '../../lib/watchHistory';
import { RecommendedVideo } from '../../lib/recommendations';

// Import WebView for video playback
let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    WebView = require('react-native-webview').WebView;
  } catch {
    console.warn('WebView not available');
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
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { data: liveStatus, isLoading: loading } = trpc.youtube.liveStatus.useQuery(
    undefined,
    {
      refetchInterval: 30000,
    }
  );

  const { data: trendingVideos, isLoading: videosLoading } = trpc.youtube.recentVideos.useQuery(
    { maxResults: 6 },
    {
      refetchInterval: 300000, // Refetch every 5 minutes
    }
  );

  const { data: channelStats, isLoading: statsLoading } = trpc.youtube.channelStats.useQuery(
    undefined,
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Store previous stats to calculate growth (using ref to persist across renders)
  const previousStatsRef = useRef<{
    subscriberCount?: number;
    viewCount?: number;
    videoCount?: number;
    timestamp?: number;
  }>({});

  // Calculate growth percentages
  const calculateGrowth = (current: number | undefined, previous: number | undefined): number | undefined => {
    if (!current || !previous || previous === 0) return undefined;
    const growth = ((current - previous) / previous) * 100;
    return Math.round(growth * 10) / 10; // Round to 1 decimal
  };

  // Format numbers
  const formatNumber = (num: number | string | undefined): string => {
    if (!num) return '0';
    if (typeof num === 'string') return num;
    
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Get current stats values
  const currentSubscribers = channelStats?.subscriberCount
    ? parseInt(channelStats.subscriberCount)
    : undefined;
  const currentViews = channelStats?.viewCount
    ? parseInt(channelStats.viewCount)
    : undefined;
  const currentVideos = channelStats?.videoCount
    ? parseInt(channelStats.videoCount)
    : undefined;

  // Update previous stats when new stats arrive (store initial, then update after comparison)
  React.useEffect(() => {
    if (channelStats && (currentSubscribers || currentViews || currentVideos)) {
      const now = Date.now();
      const prev = previousStatsRef.current;
      
      // If no previous stats or it's been more than 25 seconds, update previous stats
      if (!prev.timestamp || (now - (prev.timestamp || 0)) > 25000) {
        previousStatsRef.current = {
          subscriberCount: currentSubscribers,
          viewCount: currentViews,
          videoCount: currentVideos,
          timestamp: now,
        };
      }
    }
  }, [channelStats, currentSubscribers, currentViews, currentVideos]);

  // Calculate growth (compare current with previous)
  const subscriberGrowth = React.useMemo(() => {
    if (!currentSubscribers || !previousStatsRef.current.subscriberCount) return undefined;
    // Only show growth if there's a meaningful difference (avoid showing 0.0%)
    const growth = calculateGrowth(currentSubscribers, previousStatsRef.current.subscriberCount);
    return growth && Math.abs(growth) > 0.1 ? growth : undefined;
  }, [currentSubscribers]);

  // Calculate view growth (currently not displayed but available for future use)
  // const viewGrowth = React.useMemo(() => {
  //   if (!currentViews || !previousStatsRef.current.viewCount) return undefined;
  //   const growth = calculateGrowth(currentViews, previousStatsRef.current.viewCount);
  //   return growth && Math.abs(growth) > 0.1 ? growth : undefined;
  // }, [currentViews]);

  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const cardAnimations = useRef<{ [key: number]: Animated.Value }>({});

  const isLive = liveStatus?.isLive ?? false;
  const liveData = liveStatus?.isLive
    ? {
        title: liveStatus.title || 'PUBG Mobile Esports Live',
        viewerCount: liveStatus.viewerCount || 0,
      }
    : null;

  const handleVideoPress = async (video: any) => {
    // Save to watch history when video is opened
    const videoId = video.videoId;
    if (videoId) {
      const existingHistory = await getRecentWatchHistory(50);
      const historyItem = existingHistory.find(h => h.videoId === videoId);
      
      await saveWatchHistory({
        videoId,
        videoUrl: `https://www.youtube.com/embed/${videoId}`,
        title: video.title,
        thumbnail: video.thumbnail || '',
        category: video.category || 'Gaming',
        progress: historyItem?.progress || 0,
      });
    }

    // Convert to format compatible with video modal
    setSelectedVideo({
      url: `https://www.youtube.com/embed/${video.videoId}`,
      title: video.title,
      videoId: video.videoId,
      thumbnail: video.thumbnail,
      category: video.category || 'Gaming',
    });
  };

  const handleRecommendationPress = async (video: RecommendedVideo) => {
    // Save to watch history when recommended video is opened
    const videoId = video.videoId;
    if (videoId) {
      const existingHistory = await getRecentWatchHistory(50);
      const historyItem = existingHistory.find(h => h.videoId === videoId);
      
      await saveWatchHistory({
        videoId,
        videoUrl: video.url,
        title: video.title,
        thumbnail: video.thumbnail,
        category: video.category,
        progress: historyItem?.progress || 0,
      });
    }

    // Convert to format compatible with video modal
    setSelectedVideo({
      url: video.url,
      title: video.title,
      videoId: video.videoId,
      thumbnail: video.thumbnail,
      category: video.category,
    });
  };

  const handleContinueWatchingPress = async (item: WatchHistoryItem) => {
    // Save that user is continuing to watch
    await saveWatchHistory({
      videoId: item.videoId,
      videoUrl: item.videoUrl,
      title: item.title,
      thumbnail: item.thumbnail,
      category: item.category,
      progress: item.progress, // Keep current progress
    });

    // Open video modal
    setSelectedVideo({
      url: item.videoUrl,
      title: item.title,
      videoId: item.videoId,
      thumbnail: item.thumbnail,
      category: item.category,
      resumeFrom: item.progress, // Pass progress for resume
    });
  };

  const handleVideoModalClose = async () => {
    // When video modal closes, update progress (simulate 25% watched if not already watched)
    if (selectedVideo?.videoId) {
      const existingHistory = await getRecentWatchHistory(50);
      const historyItem = existingHistory.find(h => h.videoId === selectedVideo.videoId);
      
      // If progress is low or doesn't exist, assume user watched some
      const newProgress = historyItem && historyItem.progress > 0 
        ? Math.min(95, historyItem.progress + 25) // Increment by 25%
        : 25; // Start at 25% if new
      
      await updateWatchProgress(selectedVideo.videoId, newProgress);
    }
    setSelectedVideo(null);
  };

  // Web video player component
  const WebVideoPlayer = ({ videoId }: { videoId: string }) => {
    const containerRef = useRef<View>(null);

    useLayoutEffect(() => {
      if (Platform.OS === 'web' && typeof document !== 'undefined' && containerRef.current) {
        const container = containerRef.current as any;
        let domNode: HTMLElement | null = null;

        if (container._nativeNode) {
          domNode = container._nativeNode;
        } else if (container._internalFiberInstanceHandleDEV?.stateNode) {
          domNode = container._internalFiberInstanceHandleDEV.stateNode;
        } else if (container.__domNode) {
          domNode = container.__domNode;
        }

        if (domNode && domNode instanceof HTMLElement) {
          const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
          const iframe = document.createElement('iframe');
          iframe.src = embedUrl;
          iframe.style.width = '100%';
          iframe.style.height = '100%';
          iframe.style.border = 'none';
          iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
          iframe.setAttribute('allowfullscreen', 'true');
          iframe.setAttribute('frameborder', '0');

          domNode.innerHTML = '';
          domNode.appendChild(iframe);

          return () => {
            if (domNode && domNode.contains(iframe)) {
              domNode.removeChild(iframe);
            }
          };
        }
      }
    }, [videoId]);

    return <View ref={containerRef} style={styles.webPlayerContainer} />;
  };

  const services = [
    {
      icon: Radio,
      title: 'Live Streaming',
      subtitle: 'Gaming Live Streaming',
      color: COLORS.neonRed,
      action: 'live',
    },
    {
      icon: Zap,
      title: 'Esports Highlights',
      subtitle: 'Tournament Coverage',
      color: COLORS.neonTeal,
      action: 'highlights',
    },
    {
      icon: Gamepad2,
      title: 'Gaming Content',
      subtitle: 'Digital Creator',
      color: '#ff6b35',
      action: 'gaming',
    },
    {
      icon: Star,
      title: 'Community',
      subtitle: 'Esports Community',
      color: COLORS.neonTeal,
      action: 'community',
    },
  ];

  // Initialize animations for each card
  services.forEach((_, index) => {
    if (!cardAnimations.current[index]) {
      cardAnimations.current[index] = new Animated.Value(1);
    }
  });

  const handleServiceCardPress = (service: typeof services[0], index: number) => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Press animation
    Animated.sequence([
      Animated.timing(cardAnimations.current[index], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(cardAnimations.current[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate based on action
    switch (service.action) {
      case 'live':
        // Open live stream
        if (isLive && liveData) {
          Linking.openURL('https://www.youtube.com/@sureshpokharel243/live');
        } else {
          // Navigate to videos screen with live filter
          navigation.navigate('videos', { filter: 'live' });
        }
        break;
      case 'highlights':
        // Navigate to videos screen filtered by highlights
        navigation.navigate('videos', { filter: 'highlights' });
        break;
      case 'gaming':
        // Navigate to videos screen - show all gaming videos
        navigation.navigate('videos', { filter: 'gaming' });
        break;
      case 'community':
        // For now, navigate to profile (can be changed to community screen later)
        navigation.navigate('profile');
        break;
      default:
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TopNavBar title="4PSYCHOTIC" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroContent}>
            {/* Enhanced Live Badge with Countdown */}
            {!loading && (
              <EnhancedLiveBadge
                isLive={isLive}
                liveData={liveData}
                nextStreamTime={new Date(Date.now() + 2 * 60 * 60 * 1000)} // Default: 2 hours from now
                previousStreamHighlight={
                  trendingVideos && trendingVideos.length > 0
                    ? {
                        title: trendingVideos[0].title || 'Previous Stream',
                        thumbnail: trendingVideos[0].thumbnail || '',
                        url: `https://www.youtube.com/watch?v=${trendingVideos[0].videoId}`,
                      }
                    : null
                }
              />
            )}

            {/* Trending Videos Carousel */}
            {!videosLoading && trendingVideos && trendingVideos.length > 0 && (
              <TrendingVideosCarousel
                videos={trendingVideos}
                onVideoPress={handleVideoPress}
              />
            )}

            {/* Continue Watching Section */}
            <ContinueWatching onVideoPress={handleContinueWatchingPress} />

            {/* Personalized Recommendations */}
            {!videosLoading && trendingVideos && trendingVideos.length > 0 && (
              <PersonalizedRecommendations
                videos={trendingVideos.map((video: any) => ({
                  videoId: video.videoId,
                  title: video.title,
                  thumbnail: video.thumbnail || '',
                  category: video.category || 'Gaming',
                  url: `https://www.youtube.com/embed/${video.videoId}`,
                }))}
                onVideoPress={handleRecommendationPress}
              />
            )}

            {/* Badge */}
            <View style={[styles.badge, { borderColor: COLORS.neonTeal }]}>
              <View style={[styles.badgeDot, { backgroundColor: COLORS.neonTeal }]} />
              <Text style={[styles.badgeText, { color: COLORS.neonTeal }]}>
                Live Streaming · Digital Creator · Bucharest
              </Text>
            </View>

            {/* Main Headline */}
            <Text style={styles.headline}>4PSYCHOTIC</Text>

            {/* Sub-headline */}
            <Text style={[styles.subheadline, { color: COLORS.neonRed }]}>
              PSYCHEDELIC GAMING
            </Text>
            <Text style={[styles.subheadline, { color: COLORS.neonTeal }]}>
              LIVE STREAMING
            </Text>

            {/* Description */}
            <Text style={styles.description}>
              Where psychedelic art meets competitive gaming. Esports highlights, PUBG Mobile tournaments,
              and raw digital creativity — streamed live from Bucharest to the world.
            </Text>

            {/* CTAs */}
            <View style={styles.ctaContainer}>
              <TouchableOpacity
                style={[styles.ctaPrimary, { backgroundColor: COLORS.neonRed }]}
                onPress={() => Linking.openURL('https://www.youtube.com/@sureshpokharel243/live')}
              >
                <Play size={16} color={COLORS.white} fill={COLORS.white} />
                <Text style={styles.ctaText}>Watch Live</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.ctaSecondary, { borderColor: COLORS.neonTeal }]}
              >
                <Text style={[styles.ctaSecondaryText, { color: COLORS.neonTeal }]}>
                  Get In Touch
                </Text>
              </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <AnimatedStat
                value={formatNumber(currentSubscribers)}
                label="Followers"
                growth={subscriberGrowth}
                isLoading={statsLoading}
                color={COLORS.neonRed}
              />
              <AnimatedStat
                value="PUBG"
                label="Mobile Esports"
                isLoading={false}
                color={COLORS.neonRed}
              />
              <AnimatedStat
                value={isLive ? 'LIVE' : 'OFFLINE'}
                label="Streaming"
                isLoading={loading}
                color={isLive ? COLORS.neonRed : COLORS.white40}
              />
            </View>

            {/* Social Proof Elements */}
            <SocialProof
              subscriberCount={currentSubscribers}
              isLive={isLive}
              viewerCount={liveData?.viewerCount || 0}
            />
          </View>
        </View>

        {/* Services Section */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Featured Content</Text>
          <View style={styles.servicesGrid}>
            {services.map((service, index) => {
              const IconComponent = service.icon;
              const scaleAnim = cardAnimations.current[index] || new Animated.Value(1);
              
              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.serviceCardWrapper,
                    {
                      transform: [{ scale: scaleAnim }],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.serviceCard,
                      { borderColor: `${service.color}40` },
                    ]}
                    onPress={() => handleServiceCardPress(service, index)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.serviceIcon,
                        { borderColor: service.color, backgroundColor: `${service.color}20` },
                      ]}
                    >
                      <IconComponent size={24} color={service.color} strokeWidth={2} />
                    </View>
                    <Text
                      style={[styles.serviceSubtitle, { color: service.color }]}
                    >
                      {service.subtitle}
                    </Text>
                    <Text style={styles.serviceTitle}>{service.title}</Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* About Section */}
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>About 4psychotic</Text>
          <Text style={styles.aboutText}>
            4psychotic is a digital creator and live streamer based in Bucharest, Romania — blending
            the raw intensity of competitive gaming with psychedelic visual artistry.
          </Text>
          <Text style={styles.aboutText}>
            Recognised as a top fan by PUBG MOBILE South Asia Esports, 4psychotic brings tournament-level
            gameplay and community-driven highlights to a growing audience.
          </Text>
          <Text style={styles.aboutText}>
            The infinity symbol at the heart of the brand represents the endless loop of gaming, creativity,
            and community — a psychedelic cycle that never stops.
          </Text>
        </View>
      </ScrollView>

      {/* Video Modal */}
      <Modal
        visible={selectedVideo !== null}
        animationType="fade"
        transparent
        onRequestClose={handleVideoModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleVideoModalClose}
            >
              <X size={24} color={COLORS.white} />
            </TouchableOpacity>

            {/* Video player */}
            {selectedVideo && (
              <View style={styles.playerContainer}>
                {Platform.OS === 'web' ? (
                  <WebVideoPlayer videoId={selectedVideo.videoId} />
                ) : WebView ? (
                  <WebView
                    source={{
                      uri: `https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`,
                    }}
                    style={styles.webview}
                    allowsFullscreenVideo
                    allowsInlineMediaPlayback
                    javaScriptEnabled
                    domStorageEnabled
                    mediaPlaybackRequiresUserAction={false}
                    originWhitelist={['*']}
                    mixedContentMode="always"
                  />
                ) : (
                  <View style={styles.fallbackContainer}>
                    <Text style={styles.fallbackText}>
                      Video player not available
                    </Text>
                    <TouchableOpacity
                      style={styles.openButton}
                      onPress={() => {
                        Linking.openURL(
                          `https://www.youtube.com/watch?v=${selectedVideo.videoId}`
                        );
                      }}
                    >
                      <Text style={styles.openButtonText}>Open in Browser</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Video info */}
            {selectedVideo && (
              <View style={styles.videoInfo}>
                <Text style={styles.videoInfoTitle}>{selectedVideo.title}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.dark,
  },
  hero: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  heroContent: {
    gap: 16,
  },
  liveBadge: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    gap: 8,
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headline: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -1,
  },
  subheadline: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 1,
  },
  description: {
    fontSize: 14,
    color: COLORS.white60,
    lineHeight: 20,
  },
  ctaContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 4,
  },
  ctaSecondary: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 4,
    borderWidth: 1,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: COLORS.white,
  },
  ctaSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ffffff08',
  },
  stat: {
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    color: COLORS.white40,
  },
  servicesSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#ffffff08',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  servicesGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceCardWrapper: {
    flex: 1,
    minWidth: 0,
    maxWidth: '50%',
  },
  serviceCard: {
    width: '100%',
    backgroundColor: COLORS.darkLight,
    borderWidth: 1,
    padding: 12,
    borderRadius: 4,
    gap: 8,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  serviceSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.white,
  },
  aboutSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#ffffff08',
  },
  aboutText: {
    fontSize: 14,
    color: COLORS.white60,
    lineHeight: 20,
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    width: '100%',
    backgroundColor: '#00000080',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? ('90vw' as any) : '100%',
    maxHeight: Platform.OS === 'web' ? ('90vh' as any) : '100%',
    backgroundColor: COLORS.darkLight,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff08',
  } as any,
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00000080',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: COLORS.dark,
    minHeight: 300,
  },
  webview: {
    flex: 1,
  },
  webPlayerContainer: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  videoInfo: {
    padding: 16,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#ffffff08',
  },
  videoInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 20,
  },
  fallbackText: {
    fontSize: 14,
    color: COLORS.white60,
    textAlign: 'center',
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.neonRed,
    borderRadius: 4,
  },
  openButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
});
