import { getWatchHistory } from './watchHistory';
import { getEngagementStats } from './engagementTracking';

export interface ContentChain {
  videos: Array<{
    id: number;
    title: string;
    category: string;
    url: string;
    views: string;
    date: string;
    color: string;
  }>;
  theme: string;
  score: number;
}

// Build content chain based on current video
export async function buildContentChain(
  currentVideo: {
    id: number;
    title: string;
    category: string;
    url: string;
    views: string;
    date: string;
    color: string;
  },
  allVideos: typeof currentVideo[],
  maxLength: number = 5
): Promise<ContentChain> {
  const chain: ContentChain = {
    videos: [currentVideo],
    theme: currentVideo.category,
    score: 0,
  };
  
  // Get user's watch history and preferences
  const watchHistory = await getWatchHistory();
  const topCategories = await getTopCategories(3);
  const behaviors = await getUserBehaviors();
  
  // Extract keywords from current video
  const keywords = extractKeywords(currentVideo.title);
  const category = currentVideo.category;
  
  // Find related videos
  const related: Array<{ video: typeof currentVideo; score: number; reason: string }> = [];
  
  for (const video of allVideos) {
    if (video.id === currentVideo.id) continue;
    
    let score = 0;
    let reason = '';
    
    // Same category (highest priority)
    if (video.category === category) {
      score += 40;
      reason = 'Same category';
    }
    
    // Similar keywords
    const videoKeywords = extractKeywords(video.title);
    const commonKeywords = keywords.filter(k => videoKeywords.includes(k));
    score += commonKeywords.length * 10;
    if (commonKeywords.length > 0) {
      reason = `Similar: ${commonKeywords[0]}`;
    }
    
    // User's favorite category
    const isFavoriteCategory = topCategories.some(c => 
      c.category.toLowerCase().includes(video.category.toLowerCase())
    );
    if (isFavoriteCategory) {
      score += 20;
      if (!reason) reason = 'Your favorite category';
    }
    
    // Recently watched similar
    const recentSimilar = behaviors.filter(b => 
      b.category === video.category &&
      Date.now() - b.timestamp < 7 * 24 * 60 * 60 * 1000
    );
    if (recentSimilar.length > 0) {
      score += 15;
      if (!reason) reason = 'Similar to recent watches';
    }
    
    // Tournament/series continuation
    if (isTournamentSeries(currentVideo.title, video.title)) {
      score += 30;
      reason = 'Tournament series';
    }
    
    if (score > 0) {
      related.push({ video, score, reason });
    }
  }
  
  // Sort by score and add to chain
  related
    .sort((a, b) => b.score - a.score)
    .slice(0, maxLength - 1)
    .forEach(item => {
      chain.videos.push(item.video);
      chain.score += item.score;
    });
  
  return chain;
}

// Extract keywords from title
function extractKeywords(title: string): string[] {
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from'];
  return title
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word))
    .slice(0, 5);
}

// Check if videos are part of a tournament series
function isTournamentSeries(title1: string, title2: string): boolean {
  const tournamentKeywords = ['tournament', 'championship', 'cup', 'league', 'series', 'round', 'match'];
  const title1Lower = title1.toLowerCase();
  const title2Lower = title2.toLowerCase();
  
  return tournamentKeywords.some(keyword => 
    title1Lower.includes(keyword) && title2Lower.includes(keyword)
  );
}

// Get chain continuation suggestion
export async function getChainContinuation(
  lastVideoId: string,
  allVideos: Array<{
    id: number;
    title: string;
    category: string;
    url: string;
    views: string;
    date: string;
    color: string;
  }>
): Promise<{
  video: typeof allVideos[0];
  message: string;
} | null> {
  const lastVideo = allVideos.find(v => v.id.toString() === lastVideoId);
  if (!lastVideo) return null;
  
  const chain = await buildContentChain(lastVideo, allVideos, 2);
  if (chain.videos.length < 2) return null;
  
  const nextVideo = chain.videos[1];
  return {
    video: nextVideo,
    message: `Continue watching ${chain.theme} content`,
  };
}
