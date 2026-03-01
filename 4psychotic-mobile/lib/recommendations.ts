import { getWatchHistory, WatchHistoryItem } from './watchHistory';

export interface RecommendationReason {
  type: 'category' | 'similar' | 'popular' | 'recent';
  message: string;
}

export interface RecommendedVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  category: string;
  url: string;
  reason: RecommendationReason;
  score: number; // Higher score = better match
}

/**
 * Get user's most watched categories from watch history
 */
function getMostWatchedCategories(history: WatchHistoryItem[], limit: number = 3): string[] {
  const categoryCount: { [key: string]: number } = {};
  
  history.forEach((item) => {
    const category = item.category || 'Gaming';
    const watchWeight = item.progress > 50 ? 2 : 1; // Higher weight for videos watched more
    categoryCount[category] = (categoryCount[category] || 0) + watchWeight;
  });
  
  // Sort by count and return top categories
  return Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([category]) => category);
}

/**
 * Calculate recommendation score for a video
 */
function calculateScore(
  video: { category: string; videoId: string },
  history: WatchHistoryItem[],
  topCategories: string[]
): { score: number; reason: RecommendationReason } {
  let score = 0;
  let reason: RecommendationReason = {
    type: 'popular',
    message: 'Popular in your region',
  };
  
  // Check if video category matches user's top categories
  const categoryMatch = topCategories.findIndex(cat => 
    video.category.toLowerCase().includes(cat.toLowerCase()) ||
    cat.toLowerCase().includes(video.category.toLowerCase())
  );
  
  if (categoryMatch !== -1) {
    score += 30;
    reason = {
      type: 'category',
      message: `You watch a lot of ${topCategories[categoryMatch]} content`,
    };
  }
  
  // Check if user watched similar content recently
  const similarVideos = history.filter(h => 
    h.category === video.category && h.videoId !== video.videoId
  );
  
  if (similarVideos.length > 0) {
    score += 20;
    reason = {
      type: 'similar',
      message: `Similar to videos you've watched`,
    };
  }
  
  // Check if video was watched recently (but not completed)
  const recentWatch = history.find(h => 
    h.videoId === video.videoId && h.progress < 95
  );
  
  if (recentWatch) {
    score += 15;
    reason = {
      type: 'recent',
      message: `You started watching this recently`,
    };
  }
  
  // Base score for all videos (popularity)
  score += 10;
  
  return { score, reason };
}

/**
 * Get personalized recommendations based on watch history
 */
export async function getPersonalizedRecommendations(
  allVideos: {
    videoId: string;
    title: string;
    thumbnail: string;
    category: string;
    url: string;
  }[],
  limit: number = 6
): Promise<RecommendedVideo[]> {
  try {
    const history = await getWatchHistory();
    
    // If no history, return popular videos (no reason needed)
    if (history.length === 0) {
      return allVideos.slice(0, limit).map(video => ({
        ...video,
        reason: {
          type: 'popular',
          message: 'Popular now',
        },
        score: 10,
      }));
    }
    
    // Get user's top categories
    const topCategories = getMostWatchedCategories(history);
    
    // Calculate scores for all videos
    const scoredVideos = allVideos.map(video => {
      const { score, reason } = calculateScore(video, history, topCategories);
      return {
        ...video,
        score,
        reason,
      };
    });
    
    // Sort by score (highest first) and remove already watched videos (unless not completed)
    const watchedVideoIds = new Set(history.filter(h => h.progress >= 95).map(h => h.videoId));
    
    const recommendations = scoredVideos
      .filter(video => {
        // Include if not fully watched, or if it's a high-scoring recommendation
        return !watchedVideoIds.has(video.videoId) || video.score > 30;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    // If we don't have enough recommendations, fill with popular videos
    if (recommendations.length < limit) {
      const remaining = limit - recommendations.length;
      const recommendedIds = new Set(recommendations.map(r => r.videoId));
      const popularVideos = allVideos
        .filter(v => !recommendedIds.has(v.videoId))
        .slice(0, remaining)
        .map(video => ({
          ...video,
          reason: {
            type: 'popular',
            message: 'Popular in your region',
          },
          score: 10,
        }));
      
      recommendations.push(...popularVideos);
    }
    
    return recommendations;
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    // Return popular videos as fallback
    return allVideos.slice(0, limit).map(video => ({
      ...video,
      reason: {
        type: 'popular',
        message: 'Popular now',
      },
      score: 10,
    }));
  }
}
