import { ENV } from "./_core/env";

export interface YouTubeLiveStatus {
  isLive: boolean;
  title: string;
  viewerCount: number;
  videoId: string;
  channelTitle: string;
  thumbnail: string;
  url: string;
}

/**
 * Fetch live streaming status from YouTube channel
 * Returns information about active live streams
 */
export async function getYouTubeLiveStatus(): Promise<YouTubeLiveStatus | null> {
  if (!ENV.youtubeApiKey || !ENV.youtubeChannelId) {
    console.warn("YouTube API credentials not configured");
    return null;
  }

  try {
    // Search for active live streams from the channel
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&` +
      `channelId=${ENV.youtubeChannelId}&` +
      `type=video&` +
      `eventType=live&` +
      `maxResults=1&` +
      `key=${ENV.youtubeApiKey}`
    );

    if (!searchResponse.ok) {
      console.error("YouTube API search failed:", searchResponse.statusText);
      return null;
    }

    const searchData = await searchResponse.json();

    // If no live streams found, return null
    if (!searchData.items || searchData.items.length === 0) {
      return null;
    }

    const liveStream = searchData.items[0];
    const videoId = liveStream.id.videoId;

    // Fetch detailed statistics for the live stream
    const statsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?` +
      `part=snippet,statistics,liveStreamingDetails&` +
      `id=${videoId}&` +
      `key=${ENV.youtubeApiKey}`
    );

    if (!statsResponse.ok) {
      console.error("YouTube API stats failed:", statsResponse.statusText);
      return null;
    }

    const statsData = await statsResponse.json();

    if (!statsData.items || statsData.items.length === 0) {
      return null;
    }

    const video = statsData.items[0];
    const snippet = video.snippet;
    const statistics = video.statistics;
    const liveDetails = video.liveStreamingDetails;

    // Extract viewer count (concurrentViewers is only available for active streams)
    const viewerCount = liveDetails?.concurrentViewers
      ? parseInt(liveDetails.concurrentViewers, 10)
      : 0;

    return {
      isLive: true,
      title: snippet.title,
      viewerCount,
      videoId,
      channelTitle: snippet.channelTitle,
      thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || "",
      url: `https://www.youtube.com/watch?v=${videoId}`,
    };
  } catch (error) {
    console.error("Error fetching YouTube live status:", error);
    return null;
  }
}

/**
 * Fetch channel statistics
 */
export async function getYouTubeChannelStats() {
  if (!ENV.youtubeApiKey || !ENV.youtubeChannelId) {
    console.warn("YouTube API credentials not configured");
    return null;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?` +
      `part=snippet,statistics&` +
      `id=${ENV.youtubeChannelId}&` +
      `key=${ENV.youtubeApiKey}`
    );

    if (!response.ok) {
      console.error("YouTube API channel stats failed:", response.statusText);
      return null;
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }

    const channel = data.items[0];

    return {
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnail: channel.snippet.thumbnails?.high?.url,
      subscriberCount: channel.statistics.subscriberCount,
      viewCount: channel.statistics.viewCount,
      videoCount: channel.statistics.videoCount,
    };
  } catch (error) {
    console.error("Error fetching YouTube channel stats:", error);
    return null;
  }
}

/**
 * Fetch recent videos from the channel
 */
export async function getYouTubeRecentVideos(maxResults: number = 6) {
  if (!ENV.youtubeApiKey || !ENV.youtubeChannelId) {
    console.warn("YouTube API credentials not configured");
    return [];
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&` +
      `channelId=${ENV.youtubeChannelId}&` +
      `type=video&` +
      `order=date&` +
      `maxResults=${maxResults}&` +
      `key=${ENV.youtubeApiKey}`
    );

    if (!response.ok) {
      console.error("YouTube API recent videos failed:", response.statusText);
      return [];
    }

    const data = await response.json();

    if (!data.items) {
      return [];
    }

    return data.items.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      publishedAt: item.snippet.publishedAt,
      channelTitle: item.snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));
  } catch (error) {
    console.error("Error fetching YouTube recent videos:", error);
    return [];
  }
}
