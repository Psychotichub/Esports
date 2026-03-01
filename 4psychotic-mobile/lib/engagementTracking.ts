import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserBehavior {
  videoId: string;
  category: string;
  watchTime: number; // in seconds
  completionRate: number; // 0-100
  timestamp: number;
  skipped: boolean;
  rewatched: boolean;
}

export interface EngagementStats {
  totalWatchTime: number; // in seconds
  videosWatched: number;
  favoriteCategory: string;
  mostActiveDay: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  totalSessions: number;
}

const BEHAVIOR_KEY = '@user_behavior';
const ENGAGEMENT_KEY = '@engagement_stats';
const STREAK_KEY = '@streak_data';

// Track user behavior
export async function trackVideoWatch(
  videoId: string,
  category: string,
  watchTime: number,
  completionRate: number,
  skipped: boolean = false,
  rewatched: boolean = false
): Promise<void> {
  try {
    const behaviors = await getUserBehaviors();
    const behavior: UserBehavior = {
      videoId,
      category,
      watchTime,
      completionRate,
      timestamp: Date.now(),
      skipped,
      rewatched,
    };
    behaviors.push(behavior);
    
    // Keep only last 1000 behaviors
    if (behaviors.length > 1000) {
      behaviors.splice(0, behaviors.length - 1000);
    }
    
    await AsyncStorage.setItem(BEHAVIOR_KEY, JSON.stringify(behaviors));
    await updateEngagementStats(behavior);
  } catch (error) {
    console.error('Error tracking video watch:', error);
  }
}

// Get user behaviors
export async function getUserBehaviors(): Promise<UserBehavior[]> {
  try {
    const data = await AsyncStorage.getItem(BEHAVIOR_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting user behaviors:', error);
    return [];
  }
}

// Get behaviors by category
export async function getBehaviorsByCategory(category: string): Promise<UserBehavior[]> {
  const behaviors = await getUserBehaviors();
  return behaviors.filter(b => b.category.toLowerCase().includes(category.toLowerCase()));
}

// Get top categories by watch time
export async function getTopCategories(limit: number = 5): Promise<Array<{ category: string; watchTime: number; count: number }>> {
  const behaviors = await getUserBehaviors();
  const categoryMap = new Map<string, { watchTime: number; count: number }>();
  
  behaviors.forEach(behavior => {
    const existing = categoryMap.get(behavior.category) || { watchTime: 0, count: 0 };
    categoryMap.set(behavior.category, {
      watchTime: existing.watchTime + behavior.watchTime,
      count: existing.count + 1,
    });
  });
  
  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.watchTime - a.watchTime)
    .slice(0, limit);
}

// Update engagement stats
async function updateEngagementStats(behavior: UserBehavior): Promise<void> {
  try {
    const stats = await getEngagementStats();
    
    stats.totalWatchTime += behavior.watchTime;
    stats.videosWatched += 1;
    stats.totalSessions += 1;
    
    // Update favorite category
    const topCategories = await getTopCategories(1);
    if (topCategories.length > 0) {
      stats.favoriteCategory = topCategories[0].category;
    }
    
    // Update most active day
    const date = new Date();
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    stats.mostActiveDay = dayName;
    
    await AsyncStorage.setItem(ENGAGEMENT_KEY, JSON.stringify(stats));
    await updateStreak();
  } catch (error) {
    console.error('Error updating engagement stats:', error);
  }
}

// Get engagement stats
export async function getEngagementStats(): Promise<EngagementStats> {
  try {
    const data = await AsyncStorage.getItem(ENGAGEMENT_KEY);
    if (data) {
      return JSON.parse(data);
    }
    
    // Return default stats
    return {
      totalWatchTime: 0,
      videosWatched: 0,
      favoriteCategory: '',
      mostActiveDay: '',
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: '',
      totalSessions: 0,
    };
  } catch (error) {
    console.error('Error getting engagement stats:', error);
    return {
      totalWatchTime: 0,
      videosWatched: 0,
      favoriteCategory: '',
      mostActiveDay: '',
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: '',
      totalSessions: 0,
    };
  }
}

// Update streak
export async function updateStreak(): Promise<{ currentStreak: number; longestStreak: number }> {
  try {
    const today = new Date().toDateString();
    const streakData = await getStreakData();
    
    // Check if already updated today
    if (streakData.lastActiveDate === today) {
      return {
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
      };
    }
    
    // Check if consecutive day
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    if (streakData.lastActiveDate === yesterdayStr) {
      // Continue streak
      streakData.currentStreak += 1;
    } else if (streakData.lastActiveDate !== today) {
      // Reset streak if not consecutive
      streakData.currentStreak = 1;
    }
    
    // Update longest streak
    if (streakData.currentStreak > streakData.longestStreak) {
      streakData.longestStreak = streakData.currentStreak;
    }
    
    streakData.lastActiveDate = today;
    
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(streakData));
    
    // Update engagement stats
    const stats = await getEngagementStats();
    stats.currentStreak = streakData.currentStreak;
    stats.longestStreak = streakData.longestStreak;
    stats.lastActiveDate = today;
    await AsyncStorage.setItem(ENGAGEMENT_KEY, JSON.stringify(stats));
    
    return {
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
    };
  } catch (error) {
    console.error('Error updating streak:', error);
    return { currentStreak: 0, longestStreak: 0 };
  }
}

// Get streak data
async function getStreakData(): Promise<{
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
}> {
  try {
    const data = await AsyncStorage.getItem(STREAK_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: '',
    };
  } catch (error) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: '',
    };
  }
}

// Get recommendation score for a video
export async function getRecommendationScore(
  videoId: string,
  category: string,
  videoTitle: string
): Promise<number> {
  const behaviors = await getUserBehaviors();
  let score = 0;
  
  // Category preference (40% weight)
  const categoryBehaviors = behaviors.filter(b => 
    b.category.toLowerCase().includes(category.toLowerCase()) ||
    category.toLowerCase().includes(b.category.toLowerCase())
  );
  if (categoryBehaviors.length > 0) {
    const avgWatchTime = categoryBehaviors.reduce((sum, b) => sum + b.watchTime, 0) / categoryBehaviors.length;
    const avgCompletion = categoryBehaviors.reduce((sum, b) => sum + b.completionRate, 0) / categoryBehaviors.length;
    score += (avgWatchTime / 60) * 0.2; // Normalize to minutes
    score += (avgCompletion / 100) * 0.2;
  }
  
  // Similar videos (30% weight)
  const similarBehaviors = behaviors.filter(b => {
    const titleWords = videoTitle.toLowerCase().split(/\s+/);
    const behaviorTitle = b.videoId; // We'd need to store titles for better matching
    return titleWords.some(word => word.length > 3);
  });
  if (similarBehaviors.length > 0) {
    score += 0.3;
  }
  
  // Recency (20% weight)
  const recentBehaviors = behaviors.filter(b => 
    Date.now() - b.timestamp < 7 * 24 * 60 * 60 * 1000 // Last 7 days
  );
  if (recentBehaviors.length > 0) {
    score += 0.2;
  }
  
  // Completion rate preference (10% weight)
  const highCompletionBehaviors = behaviors.filter(b => b.completionRate > 80);
  if (highCompletionBehaviors.length > 0) {
    score += 0.1;
  }
  
  return Math.min(score, 1.0); // Normalize to 0-1
}

// Clear all tracking data (for testing/reset)
export async function clearTrackingData(): Promise<void> {
  await AsyncStorage.removeItem(BEHAVIOR_KEY);
  await AsyncStorage.removeItem(ENGAGEMENT_KEY);
  await AsyncStorage.removeItem(STREAK_KEY);
}
