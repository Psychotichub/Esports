import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEngagementStats } from './engagementTracking';

const SESSION_KEY = '@session_data';
const DAILY_GOAL_KEY = '@daily_watch_goal';

export interface SessionData {
  sessionId: string;
  startTime: number;
  endTime?: number;
  videosWatched: number;
  totalWatchTime: number; // in seconds
  categories: string[];
  lastVideoId?: string;
  depth: number; // How many videos deep in the chain
}

export interface DailyGoal {
  targetMinutes: number;
  currentMinutes: number;
  date: string;
  achieved: boolean;
}

// Start a new session
export async function startSession(): Promise<SessionData> {
  const session: SessionData = {
    sessionId: `session_${Date.now()}`,
    startTime: Date.now(),
    videosWatched: 0,
    totalWatchTime: 0,
    categories: [],
    depth: 0,
  };
  
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

// Update session with video watch
export async function updateSession(videoId: string, watchTime: number, category: string): Promise<SessionData> {
  const session = await getCurrentSession();
  if (!session) {
    return await startSession();
  }
  
  session.videosWatched += 1;
  session.totalWatchTime += watchTime;
  session.lastVideoId = videoId;
  session.depth += 1;
  
  if (!session.categories.includes(category)) {
    session.categories.push(category);
  }
  
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

// Get current session
export async function getCurrentSession(): Promise<SessionData | null> {
  try {
    const data = await AsyncStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
}

// End session
export async function endSession(): Promise<SessionData | null> {
  const session = await getCurrentSession();
  if (!session) return null;
  
  session.endTime = Date.now();
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

// Get session depth (how many videos in current chain)
export async function getSessionDepth(): Promise<number> {
  const session = await getCurrentSession();
  return session?.depth || 0;
}

// Check if user should see "keep watching" prompt
export async function shouldShowKeepWatchingPrompt(): Promise<boolean> {
  const session = await getCurrentSession();
  if (!session) return false;
  
  // Show prompt after 3 videos in a chain
  return session.depth >= 3 && session.depth % 3 === 0;
}

// Get daily watch goal
export async function getDailyGoal(): Promise<DailyGoal> {
  try {
    const today = new Date().toDateString();
    const data = await AsyncStorage.getItem(DAILY_GOAL_KEY);
    const goal: DailyGoal = data ? JSON.parse(data) : null;
    
    if (!goal || goal.date !== today) {
      // Create new daily goal (default: 30 minutes)
      const stats = await getEngagementStats();
      const newGoal: DailyGoal = {
        targetMinutes: 30,
        currentMinutes: 0,
        date: today,
        achieved: false,
      };
      await AsyncStorage.setItem(DAILY_GOAL_KEY, JSON.stringify(newGoal));
      return newGoal;
    }
    
    return goal;
  } catch (error) {
    return {
      targetMinutes: 30,
      currentMinutes: 0,
      date: new Date().toDateString(),
      achieved: false,
    };
  }
}

// Update daily goal progress
export async function updateDailyGoal(watchTimeSeconds: number): Promise<DailyGoal> {
  const goal = await getDailyGoal();
  goal.currentMinutes += watchTimeSeconds / 60;
  goal.achieved = goal.currentMinutes >= goal.targetMinutes;
  
  await AsyncStorage.setItem(DAILY_GOAL_KEY, JSON.stringify(goal));
  return goal;
}

// Get session statistics
export async function getSessionStats(): Promise<{
  averageSessionDuration: number;
  averageVideosPerSession: number;
  longestChain: number;
  totalSessions: number;
}> {
  const stats = await getEngagementStats();
  return {
    averageSessionDuration: stats.totalWatchTime / Math.max(stats.totalSessions, 1) / 60, // in minutes
    averageVideosPerSession: stats.videosWatched / Math.max(stats.totalSessions, 1),
    longestChain: 0, // Can be enhanced with chain tracking
    totalSessions: stats.totalSessions,
  };
}
