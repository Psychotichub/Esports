import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentSession, getSessionStats } from './sessionTracking';
import { getEngagementStats } from './engagementTracking';
import { getWatchHistory } from './watchHistory';
import { getPlaylists } from './playlists';
import { getFollowStatus } from './followSystem';

const ANALYTICS_KEY = '@analytics_data';
const RETENTION_KEY = '@retention_data';
const INTERACTIONS_KEY = '@user_interactions';

export interface AnalyticsData {
  // Primary Metrics
  totalSessions: number;
  totalSessionDuration: number; // in seconds
  totalVideosWatched: number;
  totalWatchTime: number; // in seconds
  totalCompletions: number; // videos watched to 95%+
  totalUsers: number;
  
  // Supporting Metrics
  recommendedVideoClicks: number;
  recommendedVideoImpressions: number;
  totalScrollDepth: number; // total scroll distance
  totalScrollSessions: number;
  searchQueries: number;
  searchSessions: number;
  playlistCreations: number;
  playlistAdditions: number;
  totalFollows: number;
  totalShares: number;
  
  // Timestamps
  firstSessionDate: number;
  lastSessionDate: number;
  lastUpdated: number;
}

export interface UserInteraction {
  timestamp: number;
  type: 'recommendation_click' | 'recommendation_impression' | 'scroll' | 'search' | 'playlist_create' | 'playlist_add' | 'follow' | 'share' | 'video_watch' | 'video_complete';
  data?: any;
}

export interface RetentionData {
  userId: string;
  firstSessionDate: number;
  sessions: Array<{
    date: string; // YYYY-MM-DD
    sessionId: string;
    duration: number;
    videosWatched: number;
  }>;
}

// Initialize analytics
export async function initializeAnalytics(): Promise<AnalyticsData> {
  const existing = await getAnalytics();
  if (existing) return existing;
  
  const newData: AnalyticsData = {
    totalSessions: 0,
    totalSessionDuration: 0,
    totalVideosWatched: 0,
    totalWatchTime: 0,
    totalCompletions: 0,
    totalUsers: 1,
    recommendedVideoClicks: 0,
    recommendedVideoImpressions: 0,
    totalScrollDepth: 0,
    totalScrollSessions: 0,
    searchQueries: 0,
    searchSessions: 0,
    playlistCreations: 0,
    playlistAdditions: 0,
    totalFollows: 0,
    totalShares: 0,
    firstSessionDate: Date.now(),
    lastSessionDate: Date.now(),
    lastUpdated: Date.now(),
  };
  
  await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(newData));
  return newData;
}

// Get analytics data
export async function getAnalytics(): Promise<AnalyticsData | null> {
  try {
    const data = await AsyncStorage.getItem(ANALYTICS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting analytics:', error);
    return null;
  }
}

// Update analytics
async function updateAnalytics(updates: Partial<AnalyticsData>): Promise<void> {
  const current = await getAnalytics() || await initializeAnalytics();
  const updated = {
    ...current,
    ...updates,
    lastUpdated: Date.now(),
  };
  await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(updated));
}

// Track user interaction
export async function trackInteraction(interaction: UserInteraction): Promise<void> {
  try {
    const interactions = await getUserInteractions();
    interactions.push(interaction);
    // Keep only last 1000 interactions
    if (interactions.length > 1000) {
      interactions.splice(0, interactions.length - 1000);
    }
    await AsyncStorage.setItem(INTERACTIONS_KEY, JSON.stringify(interactions));
  } catch (error) {
    console.error('Error tracking interaction:', error);
  }
}

// Get user interactions
export async function getUserInteractions(): Promise<UserInteraction[]> {
  try {
    const data = await AsyncStorage.getItem(INTERACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Track session end
export async function trackSessionEnd(duration: number, videosWatched: number): Promise<void> {
  const analytics = await getAnalytics() || await initializeAnalytics();
  await updateAnalytics({
    totalSessions: analytics.totalSessions + 1,
    totalSessionDuration: analytics.totalSessionDuration + duration,
    totalVideosWatched: analytics.totalVideosWatched + videosWatched,
    lastSessionDate: Date.now(),
  });
  
  await trackInteraction({
    timestamp: Date.now(),
    type: 'video_watch',
    data: { videosWatched, duration },
  });
  
  // Update retention
  await updateRetention(duration, videosWatched);
}

// Track video completion
export async function trackVideoCompletion(): Promise<void> {
  const analytics = await getAnalytics() || await initializeAnalytics();
  await updateAnalytics({
    totalCompletions: analytics.totalCompletions + 1,
  });
  
  await trackInteraction({
    timestamp: Date.now(),
    type: 'video_complete',
  });
}

// Track recommendation click
export async function trackRecommendationClick(videoId: string): Promise<void> {
  const analytics = await getAnalytics() || await initializeAnalytics();
  await updateAnalytics({
    recommendedVideoClicks: analytics.recommendedVideoClicks + 1,
  });
  
  await trackInteraction({
    timestamp: Date.now(),
    type: 'recommendation_click',
    data: { videoId },
  });
}

// Track recommendation impression
export async function trackRecommendationImpression(videoId: string): Promise<void> {
  const analytics = await getAnalytics() || await initializeAnalytics();
  await updateAnalytics({
    recommendedVideoImpressions: analytics.recommendedVideoImpressions + 1,
  });
  
  await trackInteraction({
    timestamp: Date.now(),
    type: 'recommendation_impression',
    data: { videoId },
  });
}

// Track scroll depth
export async function trackScrollDepth(depth: number): Promise<void> {
  const analytics = await getAnalytics() || await initializeAnalytics();
  await updateAnalytics({
    totalScrollDepth: analytics.totalScrollDepth + depth,
    totalScrollSessions: analytics.totalScrollSessions + 1,
  });
  
  await trackInteraction({
    timestamp: Date.now(),
    type: 'scroll',
    data: { depth },
  });
}

// Track search
export async function trackSearch(query: string): Promise<void> {
  const analytics = await getAnalytics() || await initializeAnalytics();
  await updateAnalytics({
    searchQueries: analytics.searchQueries + 1,
    searchSessions: analytics.searchSessions + 1,
  });
  
  await trackInteraction({
    timestamp: Date.now(),
    type: 'search',
    data: { query },
  });
}

// Track playlist creation
export async function trackPlaylistCreation(): Promise<void> {
  const analytics = await getAnalytics() || await initializeAnalytics();
  await updateAnalytics({
    playlistCreations: analytics.playlistCreations + 1,
  });
  
  await trackInteraction({
    timestamp: Date.now(),
    type: 'playlist_create',
  });
}

// Track playlist addition
export async function trackPlaylistAddition(): Promise<void> {
  const analytics = await getAnalytics() || await initializeAnalytics();
  await updateAnalytics({
    playlistAdditions: analytics.playlistAdditions + 1,
  });
  
  await trackInteraction({
    timestamp: Date.now(),
    type: 'playlist_add',
  });
}

// Track follow
export async function trackFollow(): Promise<void> {
  const analytics = await getAnalytics() || await initializeAnalytics();
  await updateAnalytics({
    totalFollows: analytics.totalFollows + 1,
  });
  
  await trackInteraction({
    timestamp: Date.now(),
    type: 'follow',
  });
}

// Track share
export async function trackShare(platform?: string): Promise<void> {
  const analytics = await getAnalytics() || await initializeAnalytics();
  await updateAnalytics({
    totalShares: analytics.totalShares + 1,
  });
  
  await trackInteraction({
    timestamp: Date.now(),
    type: 'share',
    data: { platform },
  });
}

// Update retention data
async function updateRetention(duration: number, videosWatched: number): Promise<void> {
  try {
    const userId = 'default_user'; // In production, use actual user ID
    const today = new Date().toISOString().split('T')[0];
    
    let retention: RetentionData | null = null;
    try {
      const data = await AsyncStorage.getItem(`${RETENTION_KEY}_${userId}`);
      retention = data ? JSON.parse(data) : null;
    } catch {
      // First session
    }
    
    if (!retention) {
      retention = {
        userId,
        firstSessionDate: Date.now(),
        sessions: [],
      };
    }
    
    // Check if session for today already exists
    const existingSession = retention.sessions.find(s => s.date === today);
    if (existingSession) {
      existingSession.duration += duration;
      existingSession.videosWatched += videosWatched;
    } else {
      retention.sessions.push({
        date: today,
        sessionId: `session_${Date.now()}`,
        duration,
        videosWatched,
      });
    }
    
    await AsyncStorage.setItem(`${RETENTION_KEY}_${userId}`, JSON.stringify(retention));
  } catch (error) {
    console.error('Error updating retention:', error);
  }
}

// Get retention rate
export async function getRetentionRate(days: 7 | 30): Promise<number> {
  try {
    const userId = 'default_user';
    const data = await AsyncStorage.getItem(`${RETENTION_KEY}_${userId}`);
    if (!data) return 0;
    
    const retention: RetentionData = JSON.parse(data);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const firstSessionDate = new Date(retention.firstSessionDate);
    if (firstSessionDate > cutoffDate) {
      // User is new, can't calculate retention yet
      return 0;
    }
    
    // Check if user had a session in the last N days
    const recentSessions = retention.sessions.filter(s => {
      const sessionDate = new Date(s.date);
      return sessionDate >= cutoffDate;
    });
    
    return recentSessions.length > 0 ? 1 : 0; // 1 = retained, 0 = not retained
  } catch (error) {
    console.error('Error calculating retention:', error);
    return 0;
  }
}

// Get all North Star Metrics
export async function getNorthStarMetrics(): Promise<{
  // Primary Metrics
  averageSessionDuration: number; // in minutes
  videosWatchedPerSession: number;
  retention7Day: number; // percentage
  retention30Day: number; // percentage
  returnVisitFrequency: number; // sessions per week
  watchCompletionRate: number; // percentage
  
  // Supporting Metrics
  recommendationCTR: number; // percentage
  averageScrollDepth: number; // percentage
  searchUsageRate: number; // percentage
  playlistUsageRate: number; // percentage
  followsPer100Users: number;
  shareRate: number; // percentage
}> {
  const analytics = await getAnalytics() || await initializeAnalytics();
  const sessionStats = await getSessionStats();
  const retention7Day = await getRetentionRate(7);
  const retention30Day = await getRetentionRate(30);
  
  // Calculate primary metrics
  const averageSessionDuration = analytics.totalSessions > 0
    ? (analytics.totalSessionDuration / analytics.totalSessions) / 60 // convert to minutes
    : 0;
  
  const videosWatchedPerSession = analytics.totalSessions > 0
    ? analytics.totalVideosWatched / analytics.totalSessions
    : 0;
  
  const watchCompletionRate = analytics.totalVideosWatched > 0
    ? (analytics.totalCompletions / analytics.totalVideosWatched) * 100
    : 0;
  
  // Calculate return visit frequency (sessions in last 7 days)
  const interactions = await getUserInteractions();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentSessions = interactions.filter(i => 
    i.type === 'video_watch' && i.timestamp >= sevenDaysAgo
  );
  const returnVisitFrequency = recentSessions.length / 7; // sessions per day, convert to per week
  
  // Calculate supporting metrics
  const recommendationCTR = analytics.recommendedVideoImpressions > 0
    ? (analytics.recommendedVideoClicks / analytics.recommendedVideoImpressions) * 100
    : 0;
  
  const averageScrollDepth = analytics.totalScrollSessions > 0
    ? analytics.totalScrollDepth / analytics.totalScrollSessions
    : 0;
  
  const searchUsageRate = analytics.totalSessions > 0
    ? (analytics.searchSessions / analytics.totalSessions) * 100
    : 0;
  
  // Check playlist usage
  const playlists = await getPlaylists();
  const playlistUsageRate = analytics.totalSessions > 0
    ? (playlists.length > 0 ? 1 : 0) * 100 // simplified: has playlists = 100%
    : 0;
  
  const followsPer100Users = analytics.totalUsers > 0
    ? (analytics.totalFollows / analytics.totalUsers) * 100
    : 0;
  
  const shareRate = analytics.totalVideosWatched > 0
    ? (analytics.totalShares / analytics.totalVideosWatched) * 100
    : 0;
  
  return {
    averageSessionDuration,
    videosWatchedPerSession,
    retention7Day: retention7Day * 100,
    retention30Day: retention30Day * 100,
    returnVisitFrequency: returnVisitFrequency * 7, // sessions per week
    watchCompletionRate,
    recommendationCTR,
    averageScrollDepth,
    searchUsageRate,
    playlistUsageRate,
    followsPer100Users,
    shareRate,
  };
}
