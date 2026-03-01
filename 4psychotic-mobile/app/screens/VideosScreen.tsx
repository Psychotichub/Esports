import React, { useState, useRef, useLayoutEffect, useEffect, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Play, X, Eye, Search, Filter, ChevronDown, Clock, TrendingUp, Heart, ListPlus, ListMusic } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import TopNavBar from '../../components/TopNavBar';
import VideoPreview from '../../components/VideoPreview';
import { saveWatchHistory, getWatchHistory, WatchHistoryItem, updateWatchProgress } from '../../lib/watchHistory';
import { saveSearchHistory, getSearchHistory, clearSearchHistory } from '../../lib/searchHistory';
import {
  getPlaylists,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  getAllPlaylistedVideoIds,
  Playlist,
} from '../../lib/playlists';
import {
  getPlaylists,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  getPlaylistCountForVideo,
  getAllPlaylistedVideoIds,
  Playlist,
} from '../../lib/playlists';

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

const VIDEOS = [
  {
    id: 1,
    title: 'HIGH_LOW #ULTIMATEROYALE',
    category: 'PUBG Mobile Esports',
    views: '4',
    url: 'https://www.youtube.com/embed/0bZsBWRRS1Y',
    date: '2 weeks ago',
    color: COLORS.neonRed,
  },
  {
    id: 2,
    title: 'Ultimate_Highlight',
    category: 'Gaming Highlights',
    views: '8',
    url: 'https://www.youtube.com/embed/RdLG6az6u0Q',
    date: '2 weeks ago',
    color: COLORS.neonTeal,
  },
  {
    id: 3,
    title: '#highlight Ultimate',
    category: 'Streaming',
    views: '47',
    url: 'https://www.youtube.com/embed/rsxGDqVgXe0',
    date: '3 weeks ago',
    color: '#ff6b35',
  },
  {
    id: 4,
    title: 'Ultimate Royale Highlight',
    category: 'Esports',
    views: '48',
    url: 'https://www.youtube.com/embed/ZcIRHSLHlak',
    date: '3 weeks ago',
    color: COLORS.neonTeal,
  },
  {
    id: 5,
    title: 'Psychedelic Gaming Vibes',
    category: 'Creative',
    views: '2.9K',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    date: 'Jan 19, 2025',
    color: COLORS.neonRed,
  },
  {
    id: 6,
    title: 'Best Moments Compilation',
    category: 'Compilation',
    views: '4.2K',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    date: 'Jan 15, 2025',
    color: COLORS.neonTeal,
  },
];

export default function VideosScreen({ route }: { route?: any }) {
  const [selectedVideo, setSelectedVideo] = useState<typeof VIDEOS[0] | null>(null);
  const [webViewError, setWebViewError] = useState(false);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>(route?.params?.filter || 'all');
  const [sortBy, setSortBy] = useState<'newest' | 'views' | 'liked'>('newest');
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [autoPlayNext, setAutoPlayNext] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [allVideos, setAllVideos] = useState<typeof VIDEOS>(VIDEOS);
  const flatListRef = useRef<FlatList>(null);
  
  // Video preview state
  const [previewVideo, setPreviewVideo] = useState<typeof VIDEOS[0] | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cardLayoutRef = useRef<{ [key: number]: { x: number; y: number; width: number; height: number } }>({});
  
  // Playlist state
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistVideoIds, setPlaylistVideoIds] = useState<Set<string>>(new Set());
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedVideoForPlaylist, setSelectedVideoForPlaylist] = useState<typeof VIDEOS[0] | null>(null);
  
  // Get initial filter from navigation params
  const initialFilter = route?.params?.filter || 'all';

  // Load watch history and search history on mount
  React.useEffect(() => {
    loadWatchHistory();
    loadSearchHistory();
    loadPlaylists();
    if (initialFilter !== 'all') {
      setActiveFilter(initialFilter);
    }
  }, [initialFilter]);

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
    const videoId = getVideoId(video.url);
    if (videoId) {
      const existingHistory = watchHistory.find(h => h.videoId === videoId);
      await saveWatchHistory({
        videoId,
        videoUrl: video.url,
        title: video.title,
        thumbnail: getYouTubeThumbnail(video.url) || '',
        category: video.category,
        progress: existingHistory?.progress || 0,
      });
      // Reload history
      await loadWatchHistory();
    }
    setSelectedVideo(video);
  };

  // Generate more videos for pagination (simulating API call)
  const generateMoreVideos = (page: number, baseVideos: typeof VIDEOS): typeof VIDEOS => {
    const videosPerPage = 6;
    const newVideos: typeof VIDEOS = [];
    
    // Generate videos by duplicating and modifying base videos
    for (let i = 0; i < videosPerPage; i++) {
      const baseVideo = baseVideos[i % baseVideos.length];
      const newId = baseVideos.length * (page - 1) + i + 1;
      
      newVideos.push({
        ...baseVideo,
        id: newId,
        title: `${baseVideo.title} ${page > 1 ? `(Part ${page})` : ''}`,
        views: String(Math.floor(Math.random() * 100) + 1) + (Math.random() > 0.7 ? 'K' : ''),
        date: page === 1 ? baseVideo.date : `${page} weeks ago`,
      });
    }
    
    return newVideos;
  };

  // Load more videos (simulating API call)
  const loadMoreVideos = async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const nextPage = currentPage + 1;
    const newVideos = generateMoreVideos(nextPage, VIDEOS);
    
    // Limit to 5 pages for demo (30 videos total)
    if (nextPage <= 5) {
      setAllVideos(prev => [...prev, ...newVideos]);
      setCurrentPage(nextPage);
    } else {
      setHasMore(false);
    }
    
    setIsLoadingMore(false);
  };

  // Reset pagination when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
    setAllVideos(VIDEOS);
    setHasMore(true);
    // Scroll to top when filter changes
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
  
  // Filter and sort videos
  const getFilteredAndSortedVideos = () => {
    let result = [...allVideos];
    
    // Apply category filter
    if (activeFilter !== 'all') {
      switch (activeFilter) {
        case 'highlights':
          result = result.filter(v => 
            v.category.toLowerCase().includes('highlight') || 
            v.category.toLowerCase().includes('esports')
          );
          break;
        case 'tournaments':
          result = result.filter(v => 
            v.category.toLowerCase().includes('esports') ||
            v.category.toLowerCase().includes('tournament') ||
            v.title.toLowerCase().includes('tournament')
          );
          break;
        case 'tutorials':
          result = result.filter(v => 
            v.category.toLowerCase().includes('tutorial') ||
            v.title.toLowerCase().includes('tutorial') ||
            v.title.toLowerCase().includes('guide')
          );
          break;
        case 'compilations':
          result = result.filter(v => 
            v.category.toLowerCase().includes('compilation') ||
            v.title.toLowerCase().includes('compilation') ||
            v.title.toLowerCase().includes('best moments') ||
            v.title.toLowerCase().includes('highlights')
          );
          break;
        default:
          break;
      }
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
  
  // Check if we have more videos to load (only when no filters/search)
  const canLoadMore = hasMore && !isLoadingMore && activeFilter === 'all' && !searchQuery.trim();
  
  // Get related videos for the currently selected video
  const getRelatedVideos = (currentVideo: typeof VIDEOS[0]): typeof VIDEOS => {
    if (!currentVideo) return [];
    
    const related: Array<{ video: typeof VIDEOS[0]; score: number }> = [];
    
    VIDEOS.forEach((video) => {
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
  
  const relatedVideos = selectedVideo ? getRelatedVideos(selectedVideo) : [];

  const VideoCard = ({ video }: { video: typeof VIDEOS[0] }) => {
    const thumbnailUrl = getYouTubeThumbnail(video.url) || '';
    const videoId = getVideoId(video.url);
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
        }, 2000); // Show preview after 2 seconds hover
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

          {/* View count badge */}
          <View style={styles.viewBadge}>
            <Eye size={12} color={COLORS.white60} />
            <Text style={styles.viewCount}>{video.views}</Text>
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
  }, [activeFilter]);

  const sortOptions = [
    { id: 'newest', label: 'Newest', icon: Clock },
    { id: 'views', label: 'Most Viewed', icon: TrendingUp },
    { id: 'liked', label: 'Most Liked', icon: Heart },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TopNavBar title="Best Moments" />
      
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
                  setShowSortMenu(false);
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
          {searchQuery ? `Search results for "${searchQuery}"` : 'Curated highlights from tournaments and streams'}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={filteredVideos}
        renderItem={({ item }) => <VideoCard video={item} />}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (canLoadMore) {
            loadMoreVideos();
          }
        }}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={6}
        windowSize={10}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.neonTeal} />
              <Text style={styles.loadingText}>Loading more videos...</Text>
            </View>
          ) : !hasMore && filteredVideos.length > 6 ? (
            <View style={styles.endContainer}>
              <Text style={styles.endText}>You've reached the end</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery
                ? `No videos found for "${searchQuery}"`
                : activeFilter !== 'all'
                ? `No videos found for ${categories.find(f => f.id === activeFilter)?.label || activeFilter}`
                : 'No videos found'}
            </Text>
            {(searchQuery || activeFilter !== 'all') && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={styles.clearFiltersText}>Clear Filters</Text>
              </TouchableOpacity>
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
              </View>
            )}

            {/* Up Next - Related Videos */}
            {selectedVideo && relatedVideos.length > 0 && (
              <View style={styles.upNextContainer}>
                <View style={styles.upNextHeader}>
                  <Text style={styles.upNextTitle}>Up Next</Text>
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
  addToPlaylistButton: ViewStyle;
  videoDate: TextStyle;
  accentLine: ViewStyle;
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
  emptyText: {
    fontSize: 14,
    color: COLORS.white60,
    textAlign: 'center',
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
});
