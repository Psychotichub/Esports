import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Linking,
  Platform,
  ViewStyle,
  TextStyle,
  ImageStyle,
  TextInput,
  ScrollView,
  Animated,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Play, X, Eye, Search, Filter, Clock, TrendingUp, Heart, ListPlus, ListMusic, MessageCircle, Share2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import TopNavBar from '../../components/TopNavBar';
import VideoPreview from '../../components/VideoPreview';
import AuthRequiredModal from '../../components/AuthRequiredModal';
import { useAuth } from '../../lib/authContext';
import { saveWatchHistory, getWatchHistory, WatchHistoryItem, updateWatchProgress } from '../../lib/watchHistory';
import { saveSearchHistory, getSearchHistory, clearSearchHistory } from '../../lib/searchHistory';
import {
  getPlaylists,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  getAllPlaylistedVideoIds,
  Playlist,
} from '../../lib/playlists';
import { trackVideoWatch } from '../../lib/engagementTracking';
import { updateSession } from '../../lib/sessionTracking';
import { buildContentChain } from '../../lib/contentChains';
import { trackSearch, trackScrollDepth, trackPlaylistCreation, trackPlaylistAddition, trackVideoCompletion, trackSessionEnd, getCurrentSession } from '../../lib/analytics';
import { trpc } from '../../lib/trpc';
import { useNavigation } from '@react-navigation/native';
import { recordStreamWatch, getRecentActivity, LiveStreamActivity, PLATFORM_COLORS, PLATFORM_LABELS, formatRelativeTime } from '../../lib/liveStreamActivity';

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

// Web-specific iframe component for embedding YouTube videos
const WebVideoPlayer = ({ url }: { url: string }) => {
  const containerRef = useRef<View>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useLayoutEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Use a more reliable approach with requestAnimationFrame
      const setupIframe = () => {
        if (!containerRef.current) return;
        
        // Access DOM node through React Native Web's internal structure
      const container = containerRef.current as any;
      let domNode: HTMLElement | null = null;
      
        // Try multiple methods to find the DOM node
      if (container._nativeNode) {
        domNode = container._nativeNode;
      } else if (container._internalFiberInstanceHandleDEV?.stateNode) {
        domNode = container._internalFiberInstanceHandleDEV.stateNode;
        } else if (container.__domNode) {
          domNode = container.__domNode;
        } else if (container.nodeType === 1) {
          domNode = container;
      }
      
      if (domNode && domNode instanceof HTMLElement) {
          // Extract video ID and create proper embed URL
          const videoId = getVideoId(url);
          if (!videoId) return;
          
          const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
          
          // Remove existing iframe if any
          if (iframeRef.current && domNode.contains(iframeRef.current)) {
            domNode.removeChild(iframeRef.current);
          }
          
        // Create iframe element
        const iframe = document.createElement('iframe');
          iframe.src = embedUrl;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
          iframe.style.display = 'block';
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.setAttribute('frameborder', '0');
          iframe.setAttribute('title', 'YouTube video player');
          iframe.setAttribute('loading', 'lazy');
        
          // Add iframe to container
        domNode.appendChild(iframe);
          iframeRef.current = iframe;
          
          return true;
        }
        return false;
      };

      // Try immediately
      if (!setupIframe()) {
        // Retry with requestAnimationFrame for better timing
        const rafId = requestAnimationFrame(() => {
          if (!setupIframe()) {
            // Final retry with timeout
            setTimeout(setupIframe, 200);
          }
        });

        return () => {
          cancelAnimationFrame(rafId);
          if (iframeRef.current && iframeRef.current.parentNode) {
            iframeRef.current.parentNode.removeChild(iframeRef.current);
            iframeRef.current = null;
          }
        };
      }

      return () => {
        if (iframeRef.current && iframeRef.current.parentNode) {
          iframeRef.current.parentNode.removeChild(iframeRef.current);
          iframeRef.current = null;
        }
      };
    }
  }, [url]);

  return <View ref={containerRef} style={styles.webPlayerContainer} />;
};

const COLORS = {
  dark: '#0a0e1a',
  darkLight: '#0f1420',
  neonRed: '#ff1744',
  neonTeal: '#00e5ff',
  white: '#ffffff',
  white60: '#ffffff99',
  white40: '#ffffff66',
};

// Helper function to extract video ID from YouTube embed URL
const getVideoId = (url: string): string | null => {
  const match = url.match(/\/embed\/([^?]+)/);
  return match ? match[1] : null;
};

// Helper function to get YouTube thumbnail URL
const getYouTubeThumbnail = (url: string, quality: 'maxresdefault' | 'hqdefault' | 'mqdefault' | 'sddefault' = 'maxresdefault'): string | null => {
  const videoId = getVideoId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};

// Live streams will be fetched from API - no mock data
const VIDEOS: Array<{
  id: number;
  title: string;
  category: string;
  views: string;
  url: string;
  date: string;
  color: string;
  platform?: 'youtube' | 'facebook' | 'tiktok';
  isLive?: boolean;
  thumbnail?: string;
  /** Creator / channel name shown beneath the title */
  channelName?: string;
}> = [];

export default function VideosScreen({ route }: { route?: any }) {
  const { isAuthenticated, requireAuth } = useAuth();
  const navigation = useNavigation();
  
  // Fetch live streams from all platforms
  const { data: liveStreams, isLoading: streamsLoading, refetch: refetchStreams } = trpc.youtube.liveStreams.useQuery(
    undefined,
    {
      refetchInterval: 30000, // Refetch every 30 seconds to get latest live streams
    }
  );

  const [selectedVideo, setSelectedVideo] = useState<typeof VIDEOS[0] | null>(null);
  const [webViewError, setWebViewError] = useState(false);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState<string>('like');
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [videoLikes, setVideoLikes] = useState<{ [key: string]: number }>({});
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>(route?.params?.filter || 'all');
  const [sortBy, setSortBy] = useState<'newest' | 'views' | 'liked'>('newest');
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [autoPlayNext, setAutoPlayNext] = useState(false);
  
  // Convert live streams to video format
  const [allVideos, setAllVideos] = useState<typeof VIDEOS>([]);
  const flatListRef = useRef<FlatList>(null);
  
  // Pagination state (disabled for live streams — kept for code compatibility)
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore] = useState(false);
  const [hasMore] = useState(false);

  // Pull-to-refresh
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Recently watched live streams (from activity tracking)
  const [recentActivity, setRecentActivity] = useState<LiveStreamActivity[]>([]);
  
  // Video preview state
  const [previewVideo, setPreviewVideo] = useState<typeof VIDEOS[0] | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Playlist state
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistVideoIds, setPlaylistVideoIds] = useState<Set<string>>(new Set());
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedVideoForPlaylist, setSelectedVideoForPlaylist] = useState<typeof VIDEOS[0] | null>(null);
  
  // Get initial filter from navigation params
  const initialFilter = route?.params?.filter || 'all';

  // Convert live streams to video format
  React.useEffect(() => {
    if (liveStreams && liveStreams.length > 0) {
      const convertedVideos = liveStreams.map((stream, index) => {
        // Determine color based on platform
        let color = COLORS.neonRed;
        if (stream.platform === 'facebook') {
          color = '#1877f2'; // Facebook blue
        } else if (stream.platform === 'tiktok') {
          color = '#ff0050'; // TikTok pink/red
        }

        // Format viewer count
        const views = stream.viewerCount >= 1000 
          ? `${(stream.viewerCount / 1000).toFixed(1)}K`
          : stream.viewerCount.toString();

        // Format date (if startedAt available)
        let date = 'Live now';
        if (stream.startedAt) {
          const startTime = new Date(stream.startedAt);
          const now = new Date();
          const diffMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
          if (diffMinutes < 60) {
            date = `${diffMinutes}m ago`;
          } else {
            const diffHours = Math.floor(diffMinutes / 60);
            date = `${diffHours}h ago`;
          }
        }

        return {
          id: index + 1,
          title: stream.title,
          category: stream.platform.charAt(0).toUpperCase() + stream.platform.slice(1) + ' Live',
          views,
          url: stream.url,
          date,
          color,
          platform: stream.platform,
          isLive: stream.isLive,
          thumbnail: stream.thumbnail,
          channelName: stream.channelName,
        };
      });
      setAllVideos(convertedVideos);
    } else {
      setAllVideos([]);
    }
  }, [liveStreams]);

  // Load watch history and search history on mount
  React.useEffect(() => {
    loadWatchHistory();
    loadSearchHistory();
    loadPlaylists();
    loadRecentActivity();
    if (initialFilter !== 'all') {
      setActiveFilter(initialFilter);
    }
  }, [initialFilter]);

  const loadRecentActivity = async () => {
    const activity = await getRecentActivity(6);
    setRecentActivity(activity);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchStreams();
    await loadRecentActivity();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRefreshing(false);
  };

  const loadWatchHistory = async () => {
    const history = await getWatchHistory();
    setWatchHistory(history);
  };

  const loadSearchHistory = async () => {
    const history = await getSearchHistory();
    setSearchHistory(history);
  };

  const loadPlaylists = async () => {
    const data = await getPlaylists();
    setPlaylists(data);
    const videoIds = await getAllPlaylistedVideoIds();
    setPlaylistVideoIds(videoIds);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setShowSearchHistory(text.length === 0 && searchHistory.length > 0);
  };

  const handleSearchSubmit = async () => {
    if (searchQuery.trim()) {
      await saveSearchHistory(searchQuery);
      await loadSearchHistory();
      setShowSearchHistory(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSearchHistorySelect = (query: string) => {
    setSearchQuery(query);
    setShowSearchHistory(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setShowSearchHistory(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleVideoPress = async (video: typeof VIDEOS[0]) => {
    // Save to watch history when video is opened
    const videoId = video.platform === 'youtube' ? (getVideoId(video.url) ?? video.url) : video.url;
    if (videoId) {
      const existingHistory = watchHistory.find(h => h.videoId === videoId);
      await saveWatchHistory({
        videoId,
        videoUrl: video.url,
        title: video.title,
        thumbnail: video.thumbnail ?? getYouTubeThumbnail(video.url) ?? '',
        category: video.category,
        progress: existingHistory?.progress || 0,
      });
      // Reload history
      await loadWatchHistory();

      // Record rich live stream activity
      await recordStreamWatch({
        streamId: videoId,
        title: video.title,
        platform: (video.platform ?? 'youtube') as any,
        channelName: video.channelName ?? '',
        thumbnail: video.thumbnail ?? getYouTubeThumbnail(video.url) ?? '',
        url: video.url,
        viewerCount: parseInt(video.views.replace('K', '000').replace('M', '000000').replace('.', '')) || 0,
        watchDuration: 0,  // updated on close
        isFinished: false,
      });
      await loadRecentActivity();

      // Update session for content chain tracking
      await updateSession(videoId, 0, video.category);
    }
    setSelectedVideo(video);
  };

  // Reset scroll position when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [activeFilter, searchQuery, sortBy]);

  const handleVideoModalClose = async () => {
    // When video modal closes, update progress (simulate 25% watched if not already watched)
    if (selectedVideo) {
      const videoId = getVideoId(selectedVideo.url);
      if (videoId) {
        const existingHistory = watchHistory.find(h => h.videoId === videoId);
        // If progress is low or doesn't exist, assume user watched some
        const newProgress = existingHistory && existingHistory.progress > 0 
          ? Math.min(95, existingHistory.progress + 25) // Increment by 25%
          : 25; // Start at 25% if new
        
        await updateWatchProgress(videoId, newProgress);
        await loadWatchHistory();
        
        // Track engagement behavior
        const oldProgress = existingHistory?.progress || 0;
        const watchTime = Math.max(30, (newProgress - oldProgress) * 2); // Estimate watch time in seconds
        await trackVideoWatch(
          videoId,
          selectedVideo.category,
          watchTime,
          newProgress,
          false, // skipped
          oldProgress > 0 // rewatched
        );
        
        // Track completion if video is 95%+ watched
        if (newProgress >= 95) {
          await trackVideoCompletion();
        }
        
        // Update session for content chain tracking
        await updateSession(videoId, watchTime, selectedVideo.category);
        
        // Track session end when closing video
        const session = await getCurrentSession();
        if (session) {
          const sessionDuration = (Date.now() - session.startTime) / 1000; // in seconds
          await trackSessionEnd(sessionDuration, session.videosWatched);
        }
        
        // Auto-play next video if enabled
        if (autoPlayNext && relatedVideos.length > 0) {
          const nextVideo = relatedVideos[0];
          const nextVideoId = getVideoId(nextVideo.url);
          if (nextVideoId) {
            const nextHistory = watchHistory.find(h => h.videoId === nextVideoId);
            await saveWatchHistory({
              videoId: nextVideoId,
              videoUrl: nextVideo.url,
              title: nextVideo.title,
              thumbnail: getYouTubeThumbnail(nextVideo.url) || '',
              category: nextVideo.category,
              progress: nextHistory?.progress || 0,
            });
            await loadWatchHistory();
            
            // Smooth transition
            setTimeout(() => {
              setSelectedVideo(nextVideo);
              setWebViewError(false);
            }, 300);
            return; // Don't close modal, just switch videos
          }
        }
      }
    }
    setSelectedVideo(null);
    setWebViewError(false);
  };
  
  // Filter and sort videos (only live streams)
  const getFilteredAndSortedVideos = () => {
    // Only show live streams
    let result = allVideos.filter(video => video.isLive !== false);
    
    // Apply platform filter
    if (activeFilter !== 'all') {
      result = result.filter(video => video.platform === activeFilter);
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(v => 
        v.title.toLowerCase().includes(query) ||
        v.category.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'views':
          const aViews = parseFloat(a.views.replace('K', '').replace('M', '')) || 0;
          const bViews = parseFloat(b.views.replace('K', '').replace('M', '')) || 0;
          return bViews - aViews;
        case 'liked':
          // Mock likes based on views (for now)
          const aLikes = parseFloat(a.views.replace('K', '').replace('M', '')) * 0.1 || 0;
          const bLikes = parseFloat(b.views.replace('K', '').replace('M', '')) * 0.1 || 0;
          return bLikes - aLikes;
        case 'newest':
        default:
          // Sort by date (most recent first)
          return b.id - a.id;
      }
    });
    
    return result;
  };
  
  const filteredVideos = getFilteredAndSortedVideos();
  
  // Get related videos for the currently selected video (enhanced with content chains)
  const getRelatedVideos = async (currentVideo: typeof VIDEOS[0]): Promise<typeof VIDEOS> => {
    if (!currentVideo) return [];
    
    // Use content chain builder for better chain continuity
    try {
      const chain = await buildContentChain(currentVideo, allVideos, 5);
      // Return chain videos (excluding current)
      return chain.videos.filter(v => v.id !== currentVideo.id).slice(0, 4);
    } catch (error) {
      console.error('Error building content chain:', error);
      // Fallback to simple algorithm
    }
    
    const related: { video: typeof VIDEOS[0]; score: number }[] = [];
    
    allVideos.forEach((video) => {
      if (video.id === currentVideo.id) return; // Skip current video
      
      let score = 0;
      
      // Same category gets highest priority
      if (video.category === currentVideo.category) {
        score += 30;
      } else if (
        video.category.toLowerCase().includes(currentVideo.category.toLowerCase()) ||
        currentVideo.category.toLowerCase().includes(video.category.toLowerCase())
      ) {
        score += 15;
      }
      
      // Similar title/keywords
      const currentTitleWords = currentVideo.title.toLowerCase().split(/\s+/);
      const videoTitleWords = video.title.toLowerCase().split(/\s+/);
      const commonWords = currentTitleWords.filter(word => 
        word.length > 3 && videoTitleWords.includes(word)
      );
      score += commonWords.length * 5;
      
      // Popular videos (high view count)
      const views = parseFloat(video.views.replace('K', '').replace('M', '')) || 0;
      if (views > 1) {
        score += Math.min(views / 10, 10); // Cap at 10 points
      }
      
      // Recent videos get slight boost
      if (video.date.includes('ago') || new Date(video.date).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000) {
        score += 5;
      }
      
      if (score > 0) {
        related.push({ video, score });
      }
    });
    
    // Sort by score and return top 4
    return related
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(item => item.video);
  };
  
  const [relatedVideos, setRelatedVideos] = useState<typeof VIDEOS>([]);
  
  // Update related videos when selected video changes
  React.useEffect(() => {
    if (selectedVideo) {
      getRelatedVideos(selectedVideo).then(setRelatedVideos);
    } else {
      setRelatedVideos([]);
    }
  }, [selectedVideo]);

  const VideoCard = ({ video }: { video: typeof VIDEOS[0] }) => {
    // Get thumbnail based on platform
    let thumbnailUrl = '';
    if (video.thumbnail) {
      // Use thumbnail from API if available
      thumbnailUrl = video.thumbnail;
    } else if (video.platform === 'youtube') {
      thumbnailUrl = getYouTubeThumbnail(video.url) || '';
    } else {
      // For Facebook/TikTok, use a placeholder or default image
      thumbnailUrl = '';
    }
    
    const videoId = getVideoId(video.url) || video.url.split('/').pop() || '';
    const historyItem = videoId ? watchHistory.find(h => h.videoId === videoId) : null;
    const hasProgress = historyItem && historyItem.progress > 0 && historyItem.progress < 95;
    const isInPlaylist = videoId ? playlistVideoIds.has(videoId) : false;
    const playlistCount = playlists.filter(p => videoId && p.videoIds.includes(videoId)).length;
    const cardRef = useRef<View>(null);
    
    const handleLongPress = () => {
      setIsLongPressing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Get card position
      if (cardRef.current) {
        cardRef.current.measure((x, y, width, height, pageX, pageY) => {
          setPreviewPosition({
            x: pageX + width / 2,
            y: pageY + height / 2,
          });
          setPreviewVideo(video);
        });
      }
    };

    const handlePressOut = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      
      if (isLongPressing) {
        setIsLongPressing(false);
        // Small delay before closing to allow user to see preview
        setTimeout(() => {
          setPreviewVideo(null);
        }, 100);
      }
    };

    const handlePress = () => {
      if (!isLongPressing) {
        handleVideoPress(video);
      } else {
        // If long press was active, open full video
        setPreviewVideo(null);
        setIsLongPressing(false);
        handleVideoPress(video);
      }
    };

    // Web hover handlers
    const handleMouseEnter = () => {
      if (Platform.OS === 'web') {
        longPressTimerRef.current = setTimeout(() => {
          handleLongPress();
        }, 2000) as unknown as NodeJS.Timeout; // Show preview after 2 seconds hover
      }
    };

    const handleMouseLeave = () => {
      if (Platform.OS === 'web' && longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (Platform.OS === 'web' && isLongPressing) {
        setIsLongPressing(false);
        setPreviewVideo(null);
      }
    };
    
    return (
      <View
        ref={cardRef}
      style={[styles.videoCard, { borderColor: `${video.color}40` }]}
        // @ts-ignore - web-only props
        onMouseEnter={handleMouseEnter}
        // @ts-ignore - web-only props
        onMouseLeave={handleMouseLeave}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handlePress}
          onLongPress={handleLongPress}
          onPressOut={handlePressOut}
          delayLongPress={2000}
          style={{ flex: 1 }}
        >
        {/* YouTube thumbnail */}
        <View style={styles.thumbnail}>
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnailImage}
            contentFit="cover"
            transition={200}
            placeholderContentFit="cover"
            cachePolicy="memory-disk"
          />
          
          {/* Progress bar overlay (if video has been watched) */}
          {hasProgress && (
            <View style={styles.progressBarContainer}>
      <View
        style={[
                  styles.progressBarFill,
                  {
                    width: `${historyItem!.progress}%`,
                    backgroundColor: video.color,
                  },
                ]}
              />
            </View>
          )}

          {/* Play button overlay */}
        <View
          style={[
            styles.playButton,
            { backgroundColor: video.color, shadowColor: video.color },
          ]}
        >
            <Play size={20} color={COLORS.white} fill={COLORS.white} />
        </View>

        {/* Live indicator and viewer count badge */}
        <View style={styles.viewBadge}>
          <View style={styles.liveIndicatorDot} />
          <Text style={styles.liveIndicatorText}>LIVE</Text>
        </View>
        <View style={styles.viewerBadge}>
          <Eye size={12} color={COLORS.white60} />
          <Text style={styles.viewCount}>{video.views} watching</Text>
        </View>
        
        {/* Platform badge */}
        <View style={[styles.platformBadge, { backgroundColor: `${video.color}E6` }]}>
          <Text style={styles.platformBadgeText}>
            {video.platform?.toUpperCase() || 'LIVE'}
          </Text>
        </View>

          {/* Progress badge (if video has been watched) */}
          {hasProgress && (
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>
                {Math.round(historyItem!.progress)}%
              </Text>
            </View>
          )}
      </View>

      {/* Card content */}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={[styles.category, { color: video.color }]} numberOfLines={1}>
          {video.category}
        </Text>
          {/* Streamer / channel name */}
          {video.channelName ? (
            <Text style={styles.channelNameText} numberOfLines={1}>
              📺 {video.channelName}
            </Text>
          ) : null}
          <View style={styles.cardMetaRow}>
            <View style={styles.metaItem}>
              <Eye size={10} color={COLORS.white60} />
              <Text style={styles.metaText}>{video.views}</Text>
            </View>
            <Text style={styles.metaSeparator}>•</Text>
            <Text style={styles.metaText}>{video.date}</Text>
            {playlistCount > 0 && (
              <>
                <Text style={styles.metaSeparator}>•</Text>
                <View style={styles.metaItem}>
                  <ListMusic size={10} color={COLORS.neonTeal} />
                  <Text style={[styles.metaText, { color: COLORS.neonTeal }]}>
                    {playlistCount}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
        <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
        <View style={styles.cardActions}>
          {hasProgress && (
            <View style={styles.cardProgressInfo}>
              <Text style={styles.progressText}>
                {Math.round(historyItem!.progress)}% watched
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.addToPlaylistButton}
            onPress={() => {
              setSelectedVideoForPlaylist(video);
              setShowPlaylistModal(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ListPlus size={14} color={isInPlaylist ? COLORS.neonTeal : COLORS.white60} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Top accent line */}
      <View
        style={[
          styles.accentLine,
          { backgroundColor: video.color },
        ]}
      />
    </TouchableOpacity>
      </View>
    );
  };

  const categories = [
    { id: 'all', label: 'All Videos' },
    { id: 'highlights', label: 'Highlights' },
    { id: 'tournaments', label: 'Tournaments' },
    { id: 'tutorials', label: 'Tutorials' },
    { id: 'compilations', label: 'Compilations' },
  ];

  // Tab scroll view ref
  const tabScrollViewRef = useRef<ScrollView>(null);
  
  // Scroll to active tab when filter changes
  useEffect(() => {
    const activeIndex = categories.findIndex(cat => cat.id === activeFilter);
    if (tabScrollViewRef.current && activeIndex >= 0) {
      const tabWidth = 120;
      setTimeout(() => {
        tabScrollViewRef.current?.scrollTo({
          x: Math.max(0, activeIndex * tabWidth - 40),
          animated: true,
        });
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  const sortOptions = [
    { id: 'newest', label: 'Newest', icon: Clock },
    { id: 'views', label: 'Most Viewed', icon: TrendingUp },
    { id: 'liked', label: 'Most Liked', icon: Heart },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TopNavBar title="Live Streams" />
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.neonTeal} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search videos..."
            placeholderTextColor={COLORS.white40}
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearchSubmit}
            onFocus={() => setShowSearchHistory(searchHistory.length > 0 && searchQuery.length === 0)}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              style={styles.clearButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={COLORS.white60} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Search History Dropdown */}
        {showSearchHistory && searchHistory.length > 0 && (
          <View style={styles.searchHistoryContainer}>
            <View style={styles.searchHistoryHeader}>
              <Text style={styles.searchHistoryTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={async () => {
                await clearSearchHistory();
                await loadSearchHistory();
              }}>
                <Text style={styles.clearHistoryText}>Clear</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.searchHistoryList}>
              {searchHistory.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.searchHistoryItem}
                  onPress={() => handleSearchHistorySelect(item)}
                >
                  <Clock size={14} color={COLORS.white60} />
                  <Text style={styles.searchHistoryText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          ref={tabScrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
          style={styles.tabsScrollView}
        >
          {categories.map((category, index) => {
            const isActive = activeFilter === category.id;
            
            return (
              <TouchableOpacity
                key={category.id}
                style={styles.tabButton}
                onPress={() => {
                  setActiveFilter(category.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.8}
              >
                <Animated.View
                  style={[
                    styles.tabContent,
                    {
                      opacity: isActive ? 1 : 0.7,
                      transform: [
                        {
                          scale: isActive ? 1 : 0.95,
                        },
                      ],
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabLabel,
                      isActive && styles.tabLabelActive,
                    ]}
                  >
                    {category.label}
                  </Text>
                </Animated.View>
                {isActive && (
                  <Animated.View
                    style={[
                      styles.tabIndicator,
                      {
                        opacity: 1,
                      },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <View style={styles.sortHeader}>
          <Filter size={16} color={COLORS.white60} />
          <Text style={styles.sortLabel}>Sort by:</Text>
        </View>
        <View style={styles.sortButtons}>
          {sortOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.sortButton,
                  sortBy === option.id && styles.sortButtonActive,
                ]}
                onPress={() => {
                  setSortBy(option.id as typeof sortBy);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <IconComponent
                  size={14}
                  color={sortBy === option.id ? COLORS.neonTeal : COLORS.white60}
                />
                <Text
                  style={[
                    styles.sortButtonText,
                    sortBy === option.id && styles.sortButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>
          {searchQuery ? `Search results for "${searchQuery}"` : 'Live streams from YouTube, Facebook, and TikTok'}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={filteredVideos}
        renderItem={({ item }) => <VideoCard video={item} />}
        keyExtractor={(item) => item.id.toString()}
        onScroll={(event) => {
          const scrollY = event.nativeEvent.contentOffset.y;
          trackScrollDepth(scrollY);
        }}
        scrollEventThrottle={16}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.neonRed}
            colors={[COLORS.neonRed]}
          />
        }
        ListHeaderComponent={
          recentActivity.length > 0 ? (
            <View style={styles.recentSection}>
              <Text style={styles.recentTitle}>🕐 RECENTLY WATCHED</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>
                {recentActivity.map(item => (
                  <TouchableOpacity
                    key={item.streamId}
                    style={styles.recentCard}
                    onPress={() => {
                      // Find the video in allVideos and open it
                      const found = allVideos.find(v =>
                        v.url === item.url ||
                        getVideoId(v.url) === item.streamId ||
                        v.url === item.streamId
                      );
                      if (found) handleVideoPress(found);
                      else Linking.openURL(item.url);
                    }}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: item.thumbnail || `https://img.youtube.com/vi/${item.streamId}/mqdefault.jpg` }}
                      style={styles.recentThumb}
                      contentFit="cover"
                    />
                    {/* Platform badge */}
                    <View style={[styles.recentPlatformBadge, { backgroundColor: PLATFORM_COLORS[item.platform] }]}>
                      <Text style={styles.recentPlatformText}>{PLATFORM_LABELS[item.platform]}</Text>
                    </View>
                    <Text style={styles.recentCardTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.recentCardTime}>{formatRelativeTime(item.watchedAt)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null
        }
        // No pagination for live streams - they're real-time
        onEndReached={undefined}
        onEndReachedThreshold={undefined}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={6}
        windowSize={10}
        ListFooterComponent={
          streamsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.neonTeal} />
              <Text style={styles.loadingText}>Loading live streams...</Text>
            </View>
          ) : filteredVideos.length > 0 ? (
            <View style={styles.endContainer}>
              <Text style={styles.endText}>
                Showing {filteredVideos.length} live stream{filteredVideos.length !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.endSubtext}>Streams update every 30 seconds</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {streamsLoading ? (
              <>
                <ActivityIndicator size="large" color={COLORS.neonTeal} />
                <Text style={styles.emptySubtext}>Checking for live streams…</Text>
              </>
            ) : searchQuery || activeFilter !== 'all' ? (
              /* ── Filtered / search empty ── */
              <>
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? `No live streams found for "${searchQuery}"`
                    : `No ${categories.find(f => f.id === activeFilter)?.label || activeFilter} streams live right now`}
                </Text>
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={styles.clearFiltersText}>Show All Platforms</Text>
                </TouchableOpacity>
              </>
            ) : (
              /* ── No one is live right now ── */
              <>
                <Text style={styles.emptyIcon}>📡</Text>
                <Text style={styles.emptyText}>No one is live right now</Text>
                <Text style={styles.emptySubtext}>
                  Anyone who connects their YouTube, Facebook, or TikTok account will appear here automatically when they go live.
                </Text>

                {/* CTA row */}
                <View style={styles.emptyCtaRow}>
                  <TouchableOpacity
                    style={styles.emptyCtaPrimary}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      refetchStreams();
                    }}
                  >
                    <Text style={styles.emptyCtaPrimaryText}>🔄  Refresh</Text>
                  </TouchableOpacity>

                  {isAuthenticated ? (
                    <TouchableOpacity
                      style={styles.emptyCtaSecondary}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        // Navigate to Profile tab where ConnectedAccounts lives
                        (navigation as any)?.navigate?.('profile');
                      }}
                    >
                      <Text style={styles.emptyCtaSecondaryText}>🔗  Connect Your Account</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.emptyCtaSecondary}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        (navigation as any)?.navigate?.('signup');
                      }}
                    >
                      <Text style={styles.emptyCtaSecondaryText}>✨  Sign Up to Stream</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.emptyHint}>
                  Streams refresh automatically every 30 seconds
                </Text>
              </>
            )}
          </View>
        }
      />

      {/* Video Modal */}
      <Modal
        visible={selectedVideo !== null}
        animationType="fade"
        transparent
        onRequestClose={handleVideoModalClose}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
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
                  // Web: Use custom iframe component
                  <WebVideoPlayer url={selectedVideo.url} />
                ) : WebView && !webViewError ? (
                  // Native (iOS/Android): Use WebView to embed YouTube video
                  (() => {
                    const videoId = getVideoId(selectedVideo.url);
                    const embedUrl = videoId 
                      ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent('https://www.youtube.com')}`
                      : selectedVideo.url;
                    
                    return (
                  <WebView
                        source={{ uri: embedUrl }}
                    style={styles.webview}
                    allowsFullscreenVideo
                        allowsInlineMediaPlayback
                        allowsBackForwardNavigationGestures={false}
                    javaScriptEnabled
                    domStorageEnabled
                    mediaPlaybackRequiresUserAction={false}
                        originWhitelist={['*']}
                        mixedContentMode="always"
                        startInLoadingState
                        scalesPageToFit
                        bounces={false}
                        scrollEnabled={false}
                        onError={(syntheticEvent: any) => {
                          const { nativeEvent } = syntheticEvent;
                          console.warn('WebView error: ', nativeEvent);
                          setWebViewError(true);
                        }}
                        onHttpError={(syntheticEvent: any) => {
                          const { nativeEvent } = syntheticEvent;
                          console.warn('WebView HTTP error: ', nativeEvent);
                          // Only set error for non-200 status codes
                          if (nativeEvent.statusCode >= 400) {
                            setWebViewError(true);
                          }
                        }}
                        onLoadEnd={() => {
                          console.log('Video loaded successfully');
                        }}
                        onShouldStartLoadWithRequest={(request: any) => {
                          // Allow YouTube embed URLs
                          if (request.url.includes('youtube.com/embed/') || request.url.includes('youtube.com/watch')) {
                            return true;
                          }
                          // Block navigation to other URLs
                          return false;
                        }}
                      />
                    );
                  })()
                ) : (
                  <View style={styles.fallbackContainer}>
                    <Text style={styles.fallbackText}>
                      {webViewError 
                        ? 'Unable to play video in app. Please open in YouTube app or browser.'
                        : 'Video player not available'}
                    </Text>
                    <TouchableOpacity
                      style={styles.openButton}
                      onPress={() => {
                        // Convert embed URL to watch URL for opening in browser/YouTube app
                        const videoId = getVideoId(selectedVideo.url);
                        if (videoId) {
                          // Try YouTube app first, fallback to browser
                          const youtubeAppUrl = `vnd.youtube:${videoId}`;
                          const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
                          
                          Linking.canOpenURL(youtubeAppUrl).then((supported) => {
                            if (supported) {
                              Linking.openURL(youtubeAppUrl);
                            } else {
                              Linking.openURL(watchUrl);
                            }
                          }).catch(() => {
                            Linking.openURL(watchUrl);
                          });
                        } else {
                          Linking.openURL(selectedVideo.url);
                        }
                      }}
                    >
                      <Text style={styles.openButtonText}>Open in YouTube</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Video info */}
            {selectedVideo && (
              <View style={styles.videoInfo}>
                <Text style={styles.videoInfoTitle}>{selectedVideo.title}</Text>
                <Text style={styles.videoInfoCategory}>
                  {selectedVideo.category} • {selectedVideo.date}
                </Text>
                
                {/* Action Buttons - Like, Comment, Share */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      if (!isAuthenticated) {
                        setAuthAction('like');
                        setShowAuthModal(true);
                        return;
                      }
                      handleLike(selectedVideo);
                    }}
                    activeOpacity={0.7}
                  >
                    <Heart
                      size={20}
                      color={likedVideos.has(getVideoId(selectedVideo.url) || '') ? COLORS.neonRed : COLORS.white60}
                      fill={likedVideos.has(getVideoId(selectedVideo.url) || '') ? COLORS.neonRed : 'none'}
                    />
                    <Text style={[
                      styles.actionButtonText,
                      likedVideos.has(getVideoId(selectedVideo.url) || '') && styles.actionButtonTextActive
                    ]}>
                      {videoLikes[getVideoId(selectedVideo.url) || ''] || 0}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      if (!isAuthenticated) {
                        setAuthAction('comment');
                        setShowAuthModal(true);
                        return;
                      }
                      // Handle comment - show comment section
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }}
                    activeOpacity={0.7}
                  >
                    <MessageCircle size={20} color={COLORS.white60} />
                    <Text style={styles.actionButtonText}>Comment</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      if (!isAuthenticated) {
                        setAuthAction('share');
                        setShowAuthModal(true);
                        return;
                      }
                      // Handle share
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      const videoId = getVideoId(selectedVideo.url);
                      if (videoId) {
                        Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Share2 size={20} color={COLORS.white60} />
                    <Text style={styles.actionButtonText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Up Next - Related Videos (Content Chain) */}
            {selectedVideo && relatedVideos.length > 0 && (
              <View style={styles.upNextContainer}>
                <View style={styles.upNextHeader}>
                  <View>
                    <Text style={styles.upNextTitle}>Up Next</Text>
                    <Text style={styles.upNextSubtitle}>Continue the chain</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.autoPlayToggle}
                    onPress={() => {
                      setAutoPlayNext(!autoPlayNext);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={styles.autoPlayText}>
                      {autoPlayNext ? '⏸ Auto-play ON' : '▶ Auto-play OFF'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.relatedVideosList}
                >
                  {relatedVideos.map((video) => {
                    const thumbnailUrl = getYouTubeThumbnail(video.url) || '';
                    return (
                      <TouchableOpacity
                        key={video.id}
                        style={styles.relatedVideoCard}
                        onPress={async () => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          
                          // Save current video progress before switching
                          if (selectedVideo) {
                            const currentVideoId = getVideoId(selectedVideo.url);
                            if (currentVideoId) {
                              const existingHistory = watchHistory.find(h => h.videoId === currentVideoId);
                              const newProgress = existingHistory && existingHistory.progress > 0 
                                ? Math.min(95, existingHistory.progress + 25)
                                : 25;
                              await updateWatchProgress(currentVideoId, newProgress);
                            }
                          }
                          
                          // Smooth transition - fade out current, fade in new
                          setSelectedVideo(null);
                          await new Promise(resolve => setTimeout(resolve, 200));
                          
                          // Load new video
                          const videoId = getVideoId(video.url);
                          if (videoId) {
                            const existingHistory = watchHistory.find(h => h.videoId === videoId);
                            await saveWatchHistory({
                              videoId,
                              videoUrl: video.url,
                              title: video.title,
                              thumbnail: thumbnailUrl,
                              category: video.category,
                              progress: existingHistory?.progress || 0,
                            });
                            await loadWatchHistory();
                          }
                          
                          setSelectedVideo(video);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.relatedVideoThumbnail}>
                          <Image
                            source={{ uri: thumbnailUrl }}
                            style={styles.relatedVideoThumbnailImage}
                            contentFit="cover"
                            transition={200}
                          />
                          <View style={styles.relatedVideoPlayOverlay}>
                            <View style={styles.relatedVideoPlayButton}>
                              <Play size={16} color={COLORS.white} fill={COLORS.white} />
                            </View>
                          </View>
                          <View style={styles.relatedVideoCategoryBadge}>
                            <Text style={styles.relatedVideoCategoryText}>
                              {video.category}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.relatedVideoInfo}>
                          <Text style={styles.relatedVideoTitle} numberOfLines={2}>
                            {video.title}
                          </Text>
                          <Text style={styles.relatedVideoMeta}>
                            {video.views} views • {video.date}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Video Preview Overlay */}
      {previewVideo && (
        <VideoPreview
          video={previewVideo}
          visible={!!previewVideo}
          position={previewPosition}
          onClose={() => {
            setPreviewVideo(null);
            setIsLongPressing(false);
          }}
          onOpenFull={() => {
            setPreviewVideo(null);
            setIsLongPressing(false);
            handleVideoPress(previewVideo);
          }}
        />
      )}

      {/* Auth Required Modal */}
      <AuthRequiredModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        action={authAction}
      />

      {/* Add to Playlist Modal */}
      <Modal
        visible={showPlaylistModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowPlaylistModal(false)}
      >
        <View style={styles.playlistModalOverlay}>
          <View style={styles.playlistModalContent}>
            <View style={styles.playlistModalHeader}>
              <Text style={styles.playlistModalTitle}>Add to Playlist</Text>
              <TouchableOpacity
                onPress={() => setShowPlaylistModal(false)}
                style={styles.playlistCloseButton}
              >
                <X size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.playlistModalBody}>
              {selectedVideoForPlaylist && (
                <View style={styles.selectedVideoInfo}>
                  <Text style={styles.selectedVideoTitle} numberOfLines={2}>
                    {selectedVideoForPlaylist.title}
                  </Text>
                  <Text style={styles.selectedVideoCategory}>
                    {selectedVideoForPlaylist.category}
                  </Text>
                </View>
              )}
              
              {playlists.length === 0 ? (
                <View style={styles.noPlaylistsContainer}>
                  <ListMusic size={48} color={COLORS.white40} />
                  <Text style={styles.noPlaylistsText}>No playlists yet</Text>
                  <TouchableOpacity
                    style={styles.createPlaylistButton}
                    onPress={() => {
                      setShowPlaylistModal(false);
                    }}
                  >
                    <Text style={styles.createPlaylistButtonText}>Create Playlist</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                playlists.map((playlist) => {
                  const videoId = selectedVideoForPlaylist ? getVideoId(selectedVideoForPlaylist.url) : null;
                  const isInPlaylist = videoId ? playlist.videoIds.includes(videoId) : false;
                  
                  return (
                    <TouchableOpacity
                      key={playlist.id}
                      style={styles.playlistOption}
                      onPress={async () => {
                        if (!videoId) return;
                        
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        if (isInPlaylist) {
                          await removeVideoFromPlaylist(playlist.id, videoId);
                        } else {
                          await addVideoToPlaylist(playlist.id, videoId);
                        trackPlaylistAddition();
                        }
                        await loadPlaylists();
                      }}
                    >
                      <View style={styles.playlistOptionInfo}>
                        <ListMusic size={20} color={isInPlaylist ? COLORS.neonTeal : COLORS.white60} />
                        <View style={styles.playlistOptionDetails}>
                          <Text style={styles.playlistOptionName}>{playlist.name}</Text>
                          <Text style={styles.playlistOptionMeta}>
                            {playlist.videoIds.length} {playlist.videoIds.length === 1 ? 'video' : 'videos'}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.playlistCheckbox, isInPlaylist && styles.playlistCheckboxActive]}>
                        {isInPlaylist && <View style={styles.playlistCheckmark} />}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  header: ViewStyle;
  headerTitle: TextStyle;
  headerSubtitle: TextStyle;
  listContent: ViewStyle;
  columnWrapper: ViewStyle;
  videoCard: ViewStyle;
  thumbnail: ViewStyle;
  thumbnailImage: ImageStyle;
  progressBarContainer: ViewStyle;
  progressBarFill: ViewStyle;
  progressBadge: ViewStyle;
  progressBadgeText: TextStyle;
  playButton: ViewStyle;
  viewBadge: ViewStyle;
  viewCount: TextStyle;
  cardContent: ViewStyle;
  cardHeader: ViewStyle;
  category: TextStyle;
  cardMetaRow: ViewStyle;
  metaItem: ViewStyle;
  metaText: TextStyle;
  metaSeparator: TextStyle;
  videoTitle: TextStyle;
  cardProgressInfo: ViewStyle;
  progressText: TextStyle;
  cardActions: ViewStyle;
  cardActionButtons: ViewStyle;
  addToPlaylistButton: ViewStyle;
  videoDate: TextStyle;
  accentLine: ViewStyle;
  searchContainer: ViewStyle;
  searchBar: ViewStyle;
  searchIcon: ViewStyle;
  searchInput: TextStyle;
  clearButton: ViewStyle;
  searchHistoryContainer: ViewStyle;
  searchHistoryHeader: ViewStyle;
  searchHistoryTitle: TextStyle;
  clearHistoryText: TextStyle;
  searchHistoryList: ViewStyle;
  searchHistoryItem: ViewStyle;
  searchHistoryText: TextStyle;
  tabsContainer: ViewStyle;
  tabsScrollView: ViewStyle;
  tabsContent: ViewStyle;
  tabButton: ViewStyle;
  tabContent: ViewStyle;
  tabLabel: TextStyle;
  tabLabelActive: TextStyle;
  tabIndicator: ViewStyle;
  sortContainer: ViewStyle;
  sortHeader: ViewStyle;
  sortLabel: TextStyle;
  sortButtons: ViewStyle;
  sortButton: ViewStyle;
  sortButtonActive: ViewStyle;
  sortButtonText: TextStyle;
  sortButtonTextActive: TextStyle;
  emptyContainer: ViewStyle;
  emptyIcon: TextStyle;
  emptyText: TextStyle;
  emptySubtext: TextStyle;
  emptyHint: TextStyle;
  emptyCtaRow: ViewStyle;
  emptyCtaPrimary: ViewStyle;
  emptyCtaPrimaryText: TextStyle;
  emptyCtaSecondary: ViewStyle;
  emptyCtaSecondaryText: TextStyle;
  clearFiltersButton: ViewStyle;
  clearFiltersText: TextStyle;
  channelNameText: TextStyle;
  playlistModalOverlay: ViewStyle;
  playlistModalContent: ViewStyle;
  playlistModalHeader: ViewStyle;
  playlistModalTitle: TextStyle;
  playlistCloseButton: ViewStyle;
  playlistModalBody: ViewStyle;
  selectedVideoInfo: ViewStyle;
  selectedVideoTitle: TextStyle;
  selectedVideoCategory: TextStyle;
  noPlaylistsContainer: ViewStyle;
  noPlaylistsText: TextStyle;
  createPlaylistButton: ViewStyle;
  createPlaylistButtonText: TextStyle;
  playlistOption: ViewStyle;
  playlistOptionInfo: ViewStyle;
  playlistOptionDetails: ViewStyle;
  playlistOptionName: TextStyle;
  playlistOptionMeta: TextStyle;
  playlistCheckbox: ViewStyle;
  playlistCheckboxActive: ViewStyle;
  playlistCheckmark: ViewStyle;
  modalOverlay: ViewStyle;
  modalScrollContent: ViewStyle;
  modalContent: ViewStyle;
  closeButton: ViewStyle;
  playerContainer: ViewStyle;
  webview: ViewStyle;
  webPlayerContainer: ViewStyle;
  videoInfo: ViewStyle;
  videoInfoTitle: TextStyle;
  videoInfoCategory: TextStyle;
  upNextContainer: ViewStyle;
  upNextHeader: ViewStyle;
  upNextTitle: TextStyle;
  autoPlayToggle: ViewStyle;
  autoPlayText: TextStyle;
  relatedVideosList: ViewStyle;
  relatedVideoCard: ViewStyle;
  relatedVideoThumbnail: ViewStyle;
  relatedVideoThumbnailImage: ImageStyle;
  relatedVideoPlayOverlay: ViewStyle;
  relatedVideoPlayButton: ViewStyle;
  relatedVideoCategoryBadge: ViewStyle;
  relatedVideoCategoryText: TextStyle;
  relatedVideoInfo: ViewStyle;
  relatedVideoTitle: TextStyle;
  relatedVideoMeta: TextStyle;
  fallbackContainer: ViewStyle;
  fallbackText: TextStyle;
  openButton: ViewStyle;
  openButtonText: TextStyle;
  loadingContainer: ViewStyle;
  loadingSpinner: ViewStyle;
  spinnerDot: ViewStyle;
  loadingText: TextStyle;
  endContainer: ViewStyle;
  endText: TextStyle;
}>({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.dark,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff08',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.white60,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.dark,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff08',
    position: 'relative',
    zIndex: 100,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${COLORS.neonTeal}30`,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },
  searchHistoryContainer: {
    position: 'absolute',
    top: '100%',
    left: 16,
    right: 16,
    marginTop: 4,
    backgroundColor: COLORS.darkLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${COLORS.neonTeal}30`,
    maxHeight: 200,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  searchHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff08',
  },
  searchHistoryTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white60,
    letterSpacing: 0.5,
  },
  clearHistoryText: {
    fontSize: 11,
    color: COLORS.neonTeal,
    fontWeight: '600',
  },
  searchHistoryList: {
    maxHeight: 150,
  },
  searchHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff08',
  },
  searchHistoryText: {
    fontSize: 13,
    color: COLORS.white,
    flex: 1,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff08',
    backgroundColor: COLORS.dark,
  },
  tabsScrollView: {
    maxHeight: 56,
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 0,
    alignItems: 'center',
  },
  tabButton: {
    position: 'relative',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white60,
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -50,
    height: 3,
    backgroundColor: COLORS.neonTeal,
    borderRadius: 2,
    width: 100,
    shadowColor: COLORS.neonTeal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff08',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.darkLight,
    borderWidth: 1,
    borderColor: '#ffffff08',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: `${COLORS.neonTeal}20`,
    borderColor: COLORS.neonTeal,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white60,
    letterSpacing: 0.5,
  },
  filterButtonTextActive: {
    color: COLORS.neonTeal,
  },
  sortContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff08',
    backgroundColor: COLORS.dark,
  },
  sortHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white60,
    letterSpacing: 0.5,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.darkLight,
    borderWidth: 1,
    borderColor: '#ffffff08',
  },
  sortButtonActive: {
    backgroundColor: `${COLORS.neonTeal}20`,
    borderColor: COLORS.neonTeal,
  },
  sortButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white60,
  },
  sortButtonTextActive: {
    color: COLORS.neonTeal,
  },
  filterBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.darkLight,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff08',
  },
  filterText: {
    fontSize: 12,
    color: COLORS.neonTeal,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyIcon: {
    fontSize: 48,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.white60,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  emptyHint: {
    fontSize: 11,
    color: COLORS.white40,
    textAlign: 'center',
    marginTop: 4,
  },
  emptyCtaRow: {
    flexDirection: 'column',
    gap: 10,
    width: '100%',
    maxWidth: 280,
    marginTop: 4,
  },
  emptyCtaPrimary: {
    backgroundColor: COLORS.neonTeal,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  emptyCtaPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
    letterSpacing: 0.5,
  },
  emptyCtaSecondary: {
    backgroundColor: COLORS.darkLight,
    borderWidth: 1,
    borderColor: `${COLORS.neonTeal}60`,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  emptyCtaSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.neonTeal,
    letterSpacing: 0.5,
  },
  clearFiltersButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.darkLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.neonTeal,
  },
  clearFiltersText: {
    fontSize: 12,
    color: COLORS.neonTeal,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  channelNameText: {
    fontSize: 11,
    color: COLORS.white60,
    marginBottom: 4,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  columnWrapper: {
    width: '100%',
    gap: 8,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  videoCard: {
    flex: 1,
    minWidth: 0,
    maxWidth: '50%',
    backgroundColor: COLORS.darkLight,
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 2,
  },
  progressBarFill: {
    height: '100%',
  },
  progressBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.neonTeal,
    zIndex: 2,
  },
  progressBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.neonTeal,
    letterSpacing: 0.5,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  viewBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: `${COLORS.dark}e8`,
    borderWidth: 1,
    borderColor: '#ffffff30',
    borderRadius: 4,
  },
  viewCount: {
    fontSize: 9,
    color: COLORS.white60,
    fontWeight: '600',
  },
  cardContent: {
    padding: 10,
    gap: 6,
  },
  cardHeader: {
    gap: 4,
  },
  category: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 9,
    color: COLORS.white60,
    fontWeight: '500',
  },
  metaSeparator: {
    fontSize: 9,
    color: COLORS.white40,
  },
  videoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 15,
    marginTop: 2,
  },
  cardProgressInfo: {
    marginTop: 2,
  },
  progressText: {
    fontSize: 9,
    color: COLORS.neonTeal,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  cardActionButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addToPlaylistButton: {
    padding: 4,
  },
  videoDate: {
    fontSize: 10,
    color: COLORS.white40,
  },
  accentLine: {
    height: 2,
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    width: '100%',
    backgroundColor: '#00000080',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? ('90vw' as any) : '100%',
    backgroundColor: COLORS.darkLight,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff08',
  } as ViewStyle,
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
  videoInfoCategory: {
    fontSize: 12,
    color: COLORS.white60,
  },
  upNextContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ffffff08',
    backgroundColor: COLORS.dark,
  },
  upNextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  upNextTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  autoPlayToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.darkLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${COLORS.neonTeal}40`,
  },
  autoPlayText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.neonTeal,
    letterSpacing: 0.5,
  },
  relatedVideosList: {
    gap: 12,
    paddingRight: 16,
  },
  relatedVideoCard: {
    width: 200,
    backgroundColor: COLORS.darkLight,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff08',
  },
  relatedVideoThumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  relatedVideoThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  relatedVideoPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  relatedVideoPlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.neonRed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  relatedVideoCategoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  relatedVideoCategoryText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.neonTeal,
    letterSpacing: 0.5,
  },
  relatedVideoInfo: {
    padding: 12,
    gap: 4,
  },
  relatedVideoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 16,
  },
  relatedVideoMeta: {
    fontSize: 10,
    color: COLORS.white60,
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
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingSpinner: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.neonTeal,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.white60,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  endContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endText: {
    fontSize: 12,
    color: COLORS.white40,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  playlistModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  playlistModalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.darkLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffffff08',
    maxHeight: '80%',
  },
  playlistModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff08',
  },
  playlistModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  playlistCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistModalBody: {
    padding: 20,
  },
  selectedVideoInfo: {
    padding: 12,
    backgroundColor: COLORS.dark,
    borderRadius: 8,
    marginBottom: 16,
    gap: 4,
  },
  selectedVideoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 18,
  },
  selectedVideoCategory: {
    fontSize: 11,
    color: COLORS.white60,
    fontWeight: '600',
  },
  noPlaylistsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  noPlaylistsText: {
    fontSize: 14,
    color: COLORS.white60,
    textAlign: 'center',
  },
  createPlaylistButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.neonTeal,
    borderRadius: 8,
    marginTop: 8,
  },
  createPlaylistButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
  },
  playlistOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.dark,
    borderRadius: 8,
    marginBottom: 8,
  },
  playlistOptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  playlistOptionDetails: {
    flex: 1,
    gap: 2,
  },
  playlistOptionName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  playlistOptionMeta: {
    fontSize: 11,
    color: COLORS.white60,
  },
  playlistCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.white40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistCheckboxActive: {
    borderColor: COLORS.neonTeal,
    backgroundColor: COLORS.neonTeal,
  },
  playlistCheckmark: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.dark,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ffffff08',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.darkLight,
  },
  actionButtonText: {
    fontSize: 14,
    color: COLORS.white60,
    fontWeight: '600',
  },
  actionButtonTextActive: {
    color: COLORS.neonRed,
  },

  // ── Recently Watched Live Streams ─────────────────────────────────────────
  recentSection: {
    paddingTop: 12,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff08',
    marginBottom: 8,
  },
  recentTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: COLORS.neonTeal,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  recentRow: {
    paddingHorizontal: 12,
    gap: 10,
  },
  recentCard: {
    width: 130,
    gap: 4,
  },
  recentThumb: {
    width: 130,
    height: 74,
    borderRadius: 6,
    backgroundColor: COLORS.darkLight,
  },
  recentPlatformBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  recentPlatformText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  recentCardTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
    lineHeight: 14,
    marginTop: 2,
  },
  recentCardTime: {
    fontSize: 10,
    color: COLORS.white40,
  },
});
