import React, { useState, useRef, useLayoutEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Play, X, Eye } from 'lucide-react-native';

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

export default function VideosScreen() {
  const [selectedVideo, setSelectedVideo] = useState<typeof VIDEOS[0] | null>(null);
  const [webViewError, setWebViewError] = useState(false);

  const VideoCard = ({ video }: { video: typeof VIDEOS[0] }) => {
    const thumbnailUrl = getYouTubeThumbnail(video.url) || '';
    
    return (
      <TouchableOpacity
        style={[styles.videoCard, { borderColor: `${video.color}40` }]}
        onPress={() => setSelectedVideo(video)}
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
          
          {/* Play button overlay */}
          <View
            style={[
              styles.playButton,
              { backgroundColor: video.color, shadowColor: video.color },
            ]}
          >
            <Play size={24} color={COLORS.white} fill={COLORS.white} />
          </View>

          {/* View count badge */}
          <View style={styles.viewBadge}>
            <Eye size={12} color={COLORS.white60} />
            <Text style={styles.viewCount}>{video.views}</Text>
          </View>
        </View>

      {/* Card content */}
      <View style={styles.cardContent}>
        <Text style={[styles.category, { color: video.color }]}>
          {video.category}
        </Text>
        <Text style={styles.videoTitle}>{video.title}</Text>
        <Text style={styles.videoDate}>{video.date}</Text>
      </View>

        {/* Top accent line */}
        <View
          style={[
            styles.accentLine,
            { backgroundColor: video.color },
          ]}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Best Moments</Text>
        <Text style={styles.headerSubtitle}>
          Curated highlights from tournaments and streams
        </Text>
      </View>

      <FlatList
        data={VIDEOS}
        renderItem={({ item }) => <VideoCard video={item} />}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Video Modal */}
      <Modal
        visible={selectedVideo !== null}
        animationType="fade"
        transparent
        onRequestClose={() => {
          setSelectedVideo(null);
          setWebViewError(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setSelectedVideo(null);
                setWebViewError(false);
              }}
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
  playButton: ViewStyle;
  viewBadge: ViewStyle;
  viewCount: TextStyle;
  cardContent: ViewStyle;
  category: TextStyle;
  videoTitle: TextStyle;
  videoDate: TextStyle;
  accentLine: ViewStyle;
  modalOverlay: ViewStyle;
  modalContent: ViewStyle;
  closeButton: ViewStyle;
  playerContainer: ViewStyle;
  webview: ViewStyle;
  webPlayerContainer: ViewStyle;
  videoInfo: ViewStyle;
  videoInfoTitle: TextStyle;
  videoInfoCategory: TextStyle;
  fallbackContainer: ViewStyle;
  fallbackText: TextStyle;
  openButton: ViewStyle;
  openButtonText: TextStyle;
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
  listContent: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  columnWrapper: {
    width: '100%',
    gap: 12,
    paddingHorizontal: 8,
    marginBottom: 4,
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
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  viewBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: `${COLORS.dark}e6`,
    borderWidth: 1,
    borderColor: '#ffffff40',
    borderRadius: 4,
  },
  viewCount: {
    fontSize: 10,
    color: COLORS.white60,
    fontWeight: '600',
  },
  cardContent: {
    padding: 12,
    gap: 4,
  },
  category: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  videoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 16,
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
  modalContent: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? ('90vw' as any) : '100%',
    maxHeight: Platform.OS === 'web' ? ('90vh' as any) : '100%',
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
