import { getWatchHistory } from './watchHistory';
import { getUserInteractions } from './analytics';

export interface TrendingVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  category: string;
  url: string;
  views: number;
  date: string;
  trendingScore: number;
  watchingNow?: number;
  growthToday?: number; // percentage
  completionRate?: number;
  shares?: number;
  likes?: number;
}

export interface TrendingMetrics {
  watchingNow: number;
  growthToday: number; // percentage
  completionRate: number;
  shares: number;
  likes: number;
}

// Calculate trending score for a video
export async function calculateTrendingScore(
  video: {
    videoId: string;
    title: string;
    views: string | number;
    date: string;
  },
  metrics?: TrendingMetrics
): Promise<number> {
  // Parse views
  const views = typeof video.views === 'string' 
    ? parseViews(video.views)
    : video.views;
  
  // Get views in last 24h (simplified: assume recent videos have more views)
  const videoDate = new Date(video.date);
  const hoursSinceUpload = (Date.now() - videoDate.getTime()) / (1000 * 60 * 60);
  const viewsLast24h = hoursSinceUpload < 24 
    ? views * (1 - hoursSinceUpload / 24) // Decay based on age
    : views * 0.1; // Older videos get 10% of views
  
  // Get metrics (or use defaults)
  const watchingNow = metrics?.watchingNow || Math.floor(Math.random() * 500) + 50;
  const likes = metrics?.likes || Math.floor(views * 0.05); // 5% like rate
  const completionRate = metrics?.completionRate || 65; // 65% average
  const shares = metrics?.shares || Math.floor(views * 0.02); // 2% share rate
  
  // Calculate trending score
  const score = 
    (viewsLast24h * 0.4) +
    (likes * 0.3) +
    (completionRate * 0.2) +
    (shares * 0.1);
  
  return score;
}

// Parse view count string (e.g., "1.2K", "5.3M")
function parseViews(views: string): number {
  const cleaned = views.replace(/[^\d.KM]/g, '');
  if (cleaned.includes('M')) {
    return parseFloat(cleaned.replace('M', '')) * 1000000;
  } else if (cleaned.includes('K')) {
    return parseFloat(cleaned.replace('K', '')) * 1000;
  }
  return parseFloat(cleaned) || 0;
}

// Get trending videos with scores
export async function getTrendingVideos(
  videos: Array<{
    videoId: string;
    title: string;
    thumbnail: string;
    category: string;
    url: string;
    views: string;
    date: string;
  }>,
  limit: number = 10
): Promise<TrendingVideo[]> {
  const trending: Array<{ video: typeof videos[0]; score: number; metrics: TrendingMetrics }> = [];
  
  for (const video of videos) {
    // Calculate metrics
    const watchingNow = Math.floor(Math.random() * 500) + 50;
    const growthToday = Math.floor(Math.random() * 50) + 5; // 5-55% growth
    const completionRate = Math.floor(Math.random() * 30) + 50; // 50-80%
    const shares = Math.floor(parseViews(video.views) * 0.02);
    const likes = Math.floor(parseViews(video.views) * 0.05);
    
    const metrics: TrendingMetrics = {
      watchingNow,
      growthToday,
      completionRate,
      shares,
      likes,
    };
    
    const score = await calculateTrendingScore(video, metrics);
    
    trending.push({ video, score, metrics });
  }
  
  // Sort by score and return top videos
  return trending
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ video, score, metrics }) => ({
      ...video,
      trendingScore: score,
      watchingNow: metrics.watchingNow,
      growthToday: metrics.growthToday,
      completionRate: metrics.completionRate,
      shares: metrics.shares,
      likes: metrics.likes,
    }));
}

// Get growth indicator for a video
export function getGrowthIndicator(growth: number): {
  icon: '↑' | '↓' | '→';
  color: string;
  text: string;
} {
  if (growth > 20) {
    return { icon: '↑', color: '#00ff88', text: `↑ ${growth}% today` };
  } else if (growth > 0) {
    return { icon: '↑', color: '#00ffd1', text: `↑ ${growth}% today` };
  } else if (growth < 0) {
    return { icon: '↓', color: '#ff006e', text: `↓ ${Math.abs(growth)}% today` };
  }
  return { icon: '→', color: '#ffffff99', text: 'No change' };
}
