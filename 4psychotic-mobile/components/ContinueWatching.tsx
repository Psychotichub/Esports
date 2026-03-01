import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { Play, X } from 'lucide-react-native';
import { getRecentWatchHistory, WatchHistoryItem, clearVideoHistory } from '../lib/watchHistory';

const COLORS = {
  dark: '#0a0e1a',
  darkLight: '#0f1420',
  neonRed: '#ff1744',
  neonTeal: '#00e5ff',
  white: '#ffffff',
  white60: '#ffffff99',
  white40: '#ffffff66',
};

interface ContinueWatchingProps {
  onVideoPress: (video: WatchHistoryItem) => void;
  maxVideos?: number;
}

export default function ContinueWatching({
  onVideoPress,
  maxVideos = 4,
}: ContinueWatchingProps) {
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWatchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadWatchHistory = async () => {
    try {
      const history = await getRecentWatchHistory(maxVideos);
      // Only show videos with progress > 0 and < 95% (not completed)
      const inProgress = history.filter(
        (item) => item.progress > 0 && item.progress < 95
      );
      setWatchHistory(inProgress);
    } catch (error) {
      console.error('Error loading watch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearVideo = async (videoId: string, event: any) => {
    event.stopPropagation();
    await clearVideoHistory(videoId);
    loadWatchHistory(); // Reload after clearing
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return null;
  }

  if (watchHistory.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Continue Watching</Text>
        <Text style={styles.subtitle}>Pick up where you left off</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {watchHistory.map((item) => (
          <TouchableOpacity
            key={item.videoId}
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
              
              {/* Progress bar overlay */}
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${item.progress}%`, backgroundColor: COLORS.neonRed },
                  ]}
                />
              </View>

              {/* Resume button overlay */}
              <View style={styles.resumeOverlay}>
                <View style={styles.resumeButton}>
                  <Play size={16} color={COLORS.white} fill={COLORS.white} />
                  <Text style={styles.resumeText}>Resume</Text>
                </View>
              </View>

              {/* Clear button */}
              <TouchableOpacity
                style={styles.clearButton}
                onPress={(e) => handleClearVideo(item.videoId, e)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={14} color={COLORS.white} />
              </TouchableOpacity>

              {/* Progress percentage badge */}
              <View style={styles.progressBadge}>
                <Text style={styles.progressText}>{Math.round(item.progress)}%</Text>
              </View>
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.videoTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.videoMeta}>
                {item.category} • {formatTimeAgo(item.lastWatched)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  scrollContent: ViewStyle;
  videoCard: ViewStyle;
  thumbnailContainer: ViewStyle;
  thumbnail: ImageStyle;
  progressBarContainer: ViewStyle;
  progressBar: ViewStyle;
  resumeOverlay: ViewStyle;
  resumeButton: ViewStyle;
  resumeText: TextStyle;
  clearButton: ViewStyle;
  progressBadge: ViewStyle;
  progressText: TextStyle;
  cardContent: ViewStyle;
  videoTitle: TextStyle;
  videoMeta: TextStyle;
}>({
  container: {
    marginTop: 24,
    marginBottom: 8,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.white60,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
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
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressBar: {
    height: '100%',
  },
  resumeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.neonRed,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    shadowColor: COLORS.neonRed,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  resumeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  clearButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.white40,
  },
  progressBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.white40,
  },
  progressText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.neonTeal,
    letterSpacing: 0.5,
  },
  cardContent: {
    padding: 10,
    gap: 4,
  },
  videoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 16,
  },
  videoMeta: {
    fontSize: 10,
    color: COLORS.white60,
  },
});
