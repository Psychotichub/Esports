import AsyncStorage from '@react-native-async-storage/async-storage';

const WATCH_HISTORY_KEY = '@4psychotic:watchHistory';

export interface WatchHistoryItem {
  videoId: string;
  videoUrl: string;
  title: string;
  thumbnail: string;
  category: string;
  progress: number; // 0-100 percentage
  lastWatched: number; // timestamp
  duration?: number; // video duration in seconds (optional)
}

/**
 * Save or update watch history for a video
 */
export async function saveWatchHistory(item: Omit<WatchHistoryItem, 'lastWatched'>): Promise<void> {
  try {
    const history = await getWatchHistory();
    
    // Remove existing entry if present
    const filtered = history.filter(h => h.videoId !== item.videoId);
    
    // Add new entry at the beginning
    const updated: WatchHistoryItem[] = [
      {
        ...item,
        lastWatched: Date.now(),
      },
      ...filtered,
    ];
    
    // Keep only last 50 videos
    const limited = updated.slice(0, 50);
    
    await AsyncStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(limited));
  } catch (error) {
    console.error('Error saving watch history:', error);
  }
}

/**
 * Get all watch history, sorted by most recent
 */
export async function getWatchHistory(): Promise<WatchHistoryItem[]> {
  try {
    const data = await AsyncStorage.getItem(WATCH_HISTORY_KEY);
    if (!data) return [];
    
    const history: WatchHistoryItem[] = JSON.parse(data);
    // Sort by last watched (most recent first)
    return history.sort((a, b) => b.lastWatched - a.lastWatched);
  } catch (error) {
    console.error('Error getting watch history:', error);
    return [];
  }
}

/**
 * Get recent watch history (last N videos)
 */
export async function getRecentWatchHistory(limit: number = 4): Promise<WatchHistoryItem[]> {
  const history = await getWatchHistory();
  return history.slice(0, limit);
}

/**
 * Update progress for a specific video
 */
export async function updateWatchProgress(
  videoId: string,
  progress: number
): Promise<void> {
  try {
    const history = await getWatchHistory();
    const item = history.find(h => h.videoId === videoId);
    
    if (item) {
      item.progress = Math.min(100, Math.max(0, progress));
      item.lastWatched = Date.now();
      await AsyncStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(history));
    }
  } catch (error) {
    console.error('Error updating watch progress:', error);
  }
}

/**
 * Clear watch history for a specific video
 */
export async function clearVideoHistory(videoId: string): Promise<void> {
  try {
    const history = await getWatchHistory();
    const filtered = history.filter(h => h.videoId !== videoId);
    await AsyncStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error clearing video history:', error);
  }
}

/**
 * Clear all watch history
 */
export async function clearAllWatchHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(WATCH_HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing all watch history:', error);
  }
}

/**
 * Extract video ID from YouTube URL
 */
export function getVideoIdFromUrl(url: string): string | null {
  // Handle embed URLs: https://www.youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/\/embed\/([^?]+)/);
  if (embedMatch) return embedMatch[1];
  
  // Handle watch URLs: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return watchMatch[1];
  
  return null;
}
