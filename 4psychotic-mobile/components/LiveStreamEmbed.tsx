import React, { useRef, useLayoutEffect } from 'react';
import { View, StyleSheet, Platform, Linking, TouchableOpacity } from 'react-native';
import { Play } from 'lucide-react-native';
const COLORS = {
  dark: '#0a0e1a',
  neonRed: '#ff1744',
  white: '#ffffff',
};

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

interface LiveStreamEmbedProps {
  platform: 'youtube' | 'facebook' | 'tiktok';
  videoId: string;
  url: string;
  autoplay?: boolean;
  muted?: boolean;
  onError?: (error: Error) => void;
}

export default function LiveStreamEmbed({
  platform,
  videoId,
  url,
  autoplay = false,
  muted = true,
  onError,
}: LiveStreamEmbedProps) {
  const containerRef = useRef<View>(null);

  const getEmbedUrl = (): string => {
    switch (platform) {
      case 'youtube':
        return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&mute=${muted ? 1 : 0}&controls=1&modestbranding=1&playsinline=1&enablejsapi=1`;
      case 'facebook':
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=100%`;
      case 'tiktok':
        // TikTok embed URL format
        return `https://www.tiktok.com/embed/v2/${videoId}`;
      default:
        return url;
    }
  };

  const handleOpenExternal = () => {
    Linking.openURL(url).catch(err => {
      console.error('Failed to open URL:', err);
      onError?.(err);
    });
  };

  useLayoutEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const setupIframe = () => {
        if (!containerRef.current) return;

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
          const embedUrl = getEmbedUrl();

          // Remove existing iframe if any
          domNode.innerHTML = '';

          // Create iframe element
          const iframe = document.createElement('iframe');
          iframe.src = embedUrl;
          iframe.style.width = '100%';
          iframe.style.height = '100%';
          iframe.style.border = 'none';
          iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
          iframe.setAttribute('allowfullscreen', 'true');
          iframe.setAttribute('frameborder', '0');
          iframe.setAttribute('title', `${platform} live stream`);

          iframe.onerror = () => {
            onError?.(new Error(`Failed to load ${platform} embed`));
          };

          domNode.appendChild(iframe);
          return true;
        }
        return false;
      };

      // Try immediately
      if (!setupIframe()) {
        // Retry with requestAnimationFrame
        const rafId = requestAnimationFrame(() => {
          if (!setupIframe()) {
            // Final retry with timeout
            setTimeout(setupIframe, 200);
          }
        });

        return () => {
          cancelAnimationFrame(rafId);
        };
      }

      return () => {
        if (containerRef.current) {
          const container = containerRef.current as any;
          if (container.__domNode) {
            container.__domNode.innerHTML = '';
          }
        }
      };
    }
  }, [platform, videoId, url, autoplay, muted, onError]);

  if (Platform.OS === 'web') {
    return <View ref={containerRef} style={styles.container} />;
  }

  if (WebView) {
    return (
      <View style={styles.container}>
        <WebView
          source={{ uri: getEmbedUrl() }}
          style={styles.webview}
          allowsFullscreenVideo
          allowsInlineMediaPlayback
          javaScriptEnabled
          domStorageEnabled
          mediaPlaybackRequiresUserAction={!autoplay}
          originWhitelist={['*']}
          mixedContentMode="always"
          onError={(syntheticEvent: any) => {
            const { nativeEvent } = syntheticEvent;
            onError?.(new Error(`WebView error: ${nativeEvent.description}`));
          }}
        />
      </View>
    );
  }

  // Fallback: Show play button that opens external
  return (
    <View style={styles.fallbackContainer}>
      <TouchableOpacity style={styles.playButton} onPress={handleOpenExternal}>
        <Play size={48} color={COLORS.white} fill={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.dark,
  },
  webview: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.dark,
  },
  fallbackContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.neonRed,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
