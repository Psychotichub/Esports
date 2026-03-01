import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { Play, TrendingUp } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75;
const CARD_SPACING = 12;

const COLORS = {
  dark: '#0a0e1a',
  darkLight: '#0f1420',
  neonRed: '#ff1744',
  neonTeal: '#00e5ff',
  white: '#ffffff',
  white60: '#ffffff99',
  white40: '#ffffff66',
};

interface Video {
  videoId: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  url: string;
}

interface TrendingVideosCarouselProps {
  videos: Video[];
  onVideoPress: (video: Video) => void;
}

export default function TrendingVideosCarousel({
  videos,
  onVideoPress,
}: TrendingVideosCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-scroll every 5 seconds
  useEffect(() => {
    if (videos.length <= 1) return;

    const startAutoScroll = () => {
      autoScrollTimer.current = setInterval(() => {
        setCurrentIndex((prev) => {
          const nextIndex = (prev + 1) % videos.length;
          flatListRef.current?.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
          return nextIndex;
        });
      }, 5000);
    };

    startAutoScroll();

    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, [videos.length]);

  // Handle scroll events
  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / (CARD_WIDTH + CARD_SPACING));
        setCurrentIndex(index);
      },
    }
  );

  const renderVideoCard = ({ item, index }: { item: Video; index: number }) => {
    const inputRange = [
      (index - 1) * (CARD_WIDTH + CARD_SPACING),
      index * (CARD_WIDTH + CARD_SPACING),
      (index + 1) * (CARD_WIDTH + CARD_SPACING),
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.7, 1, 0.7],
      extrapolate: 'clamp',
    });

    // Format date
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) return '1 day ago';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return `${Math.floor(diffDays / 30)} months ago`;
    };

    return (
      <Animated.View
        style={[
          styles.cardContainer,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.videoCard}
          onPress={() => onVideoPress(item)}
          activeOpacity={0.9}
        >
          <View style={styles.thumbnailContainer}>
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.thumbnail}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
            <View style={styles.playOverlay}>
              <View style={styles.playButton}>
                <Play size={20} color={COLORS.white} fill={COLORS.white} />
              </View>
            </View>
            <View style={styles.trendingBadge}>
              <TrendingUp size={12} color={COLORS.white} />
              <Text style={styles.trendingText}>TRENDING</Text>
            </View>
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.videoTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.videoDate}>{formatDate(item.publishedAt)}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (!videos || videos.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TrendingUp size={20} color={COLORS.neonRed} />
          <Text style={styles.sectionTitle}>Trending Now</Text>
        </View>
        <View style={styles.pagination}>
          {videos.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderVideoCard}
        keyExtractor={(item) => item.videoId}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        decelerationRate="fast"
        contentContainerStyle={styles.carouselContent}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollToIndexFailed={(info) => {
          // Handle scroll to index failure
          const wait = new Promise((resolve) => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
            });
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  pagination: {
    flexDirection: 'row',
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white40,
  },
  paginationDotActive: {
    backgroundColor: COLORS.neonRed,
    width: 20,
  },
  carouselContent: {
    paddingHorizontal: 16,
    paddingRight: 16,
  },
  cardContainer: {
    width: CARD_WIDTH,
    marginRight: CARD_SPACING,
  },
  videoCard: {
    backgroundColor: COLORS.darkLight,
    borderRadius: 8,
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
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.neonRed,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.neonRed,
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  trendingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${COLORS.neonRed}e6`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.white40,
  },
  trendingText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  cardContent: {
    padding: 12,
    gap: 4,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 18,
  },
  videoDate: {
    fontSize: 11,
    color: COLORS.white60,
  },
});
