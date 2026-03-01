import React, { useState, useEffect, useRef } from 'react';
import { trackRecommendationClick, trackRecommendationImpression } from '../lib/analytics';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Play, Info, X } from 'lucide-react-native';
import { getPersonalizedRecommendations, RecommendedVideo } from '../lib/recommendations';
import * as Haptics from 'expo-haptics';

const COLORS = {
  dark: '#0a0e1a',
  darkLight: '#0f1420',
  neonRed: '#ff1744',
  neonTeal: '#00e5ff',
  white: '#ffffff',
  white60: '#ffffff99',
  white40: '#ffffff66',
};

interface PersonalizedRecommendationsProps {
  videos: {
    videoId: string;
    title: string;
    thumbnail: string;
    category: string;
    url: string;
  }[];
  onVideoPress: (video: RecommendedVideo) => void;
}

export default function PersonalizedRecommendations({
  videos,
  onVideoPress,
}: PersonalizedRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videos]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const recs = await getPersonalizedRecommendations(videos, 6);
      setRecommendations(recs);
      
      // Track impressions for all recommendations
      recs.forEach(rec => {
        trackRecommendationImpression(rec.videoId);
      });
      
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoPress = (video: RecommendedVideo) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackRecommendationClick(video.videoId);
    onVideoPress(video);
  };

  const toggleTooltip = (videoId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTooltipVisible(tooltipVisible === videoId ? null : videoId);
  };

  if (loading || recommendations.length === 0) {
    return null;
  }

  const renderVideoCard = ({ item }: { item: RecommendedVideo }) => {
    const isTooltipVisible = tooltipVisible === item.videoId;
    
    return (
      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.videoCard}
          onPress={() => handleVideoPress(item)}
          activeOpacity={0.8}
        >
          {/* Thumbnail */}
          <View style={styles.thumbnailContainer}>
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.thumbnail}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.playOverlay}>
              <View style={styles.playButton}>
                <Play size={16} color={COLORS.white} fill={COLORS.white} />
              </View>
            </View>
            
            {/* Recommendation Badge */}
            <View style={styles.recommendationBadge}>
              <Text style={styles.recommendationBadgeText}>RECOMMENDED</Text>
            </View>
          </View>

          {/* Video Info */}
          <View style={styles.videoInfo}>
            <Text style={styles.videoTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.videoMeta}>
              <Text style={styles.category}>{item.category}</Text>
              <TouchableOpacity
                style={styles.infoButton}
                onPress={() => toggleTooltip(item.videoId)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Info size={14} color={COLORS.neonTeal} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>

        {/* Tooltip */}
        {isTooltipVisible && (
          <View style={styles.tooltip}>
            <View style={styles.tooltipContent}>
              <Text style={styles.tooltipTitle}>Why this recommendation?</Text>
              <Text style={styles.tooltipText}>{item.reason.message}</Text>
              <TouchableOpacity
                style={styles.tooltipClose}
                onPress={() => setTooltipVisible(null)}
              >
                <X size={14} color={COLORS.white60} />
              </TouchableOpacity>
            </View>
            <View style={styles.tooltipArrow} />
          </View>
        )}
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Recommended for You</Text>
        <Text style={styles.subtitle}>Based on your watching habits</Text>
      </View>

      <FlatList
        data={recommendations}
        renderItem={renderVideoCard}
        keyExtractor={(item) => item.videoId}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 8,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.white60,
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  separator: {
    width: 12,
  },
  cardContainer: {
    position: 'relative',
  },
  videoCard: {
    width: 160,
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
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.neonRed,
    justifyContent: 'center',
    alignItems: 'center',
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
  recommendationBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.neonTeal,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  recommendationBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.dark,
    letterSpacing: 0.5,
  },
  videoInfo: {
    padding: 12,
    gap: 6,
  },
  videoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 16,
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  category: {
    fontSize: 10,
    color: COLORS.neonTeal,
    fontWeight: '600',
    letterSpacing: 0.5,
    flex: 1,
  },
  infoButton: {
    padding: 4,
  },
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    marginBottom: 8,
    zIndex: 1000,
    alignItems: 'center',
  },
  tooltipContent: {
    backgroundColor: COLORS.darkLight,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.neonTeal,
    maxWidth: 200,
    position: 'relative',
  },
  tooltipTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.neonTeal,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  tooltipText: {
    fontSize: 11,
    color: COLORS.white60,
    lineHeight: 14,
  },
  tooltipClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.neonTeal,
    marginTop: -1,
  },
});
