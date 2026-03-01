/**
 * Live Stream Aggregator
 *
 * All live-status detection is OAuth-driven:
 *  • Background poller (liveStatusPolling.ts) uses each user's stored
 *    OAuth access token to check whether their channel is live and writes
 *    the result back to `socialConnections.isLive / lastLiveVideoId`.
 *  • This file reads those pre-computed flags and then uses the same
 *    OAuth tokens to fetch fresh stream metadata (title, viewer count,
 *    thumbnail) in a single batch request per platform.
 *
 * No YOUTUBE_API_KEY or YOUTUBE_CHANNEL_ID environment variables are
 * needed.  The only credentials required are those obtained through the
 * OAuth consent flow and stored in the `socialConnections` table.
 */

export interface LiveStream {
  platform: 'youtube' | 'facebook' | 'tiktok';
  streamId: string;
  title: string;
  viewerCount: number;
  thumbnail: string;
  /** Public watch / stream URL */
  url: string;
  /** Channel / page / creator name on the platform */
  channelName: string;
  isLive: boolean;
  startedAt?: string;
}

// ─────────────────────────────────────────────────────────────
// PUBLIC ENTRY POINT
// ─────────────────────────────────────────────────────────────

export async function getAllLiveStreams(): Promise<LiveStream[]> {
  return getRegisteredUsersLiveStreams();
}

// ─────────────────────────────────────────────────────────────
// REGISTERED USERS — reads the DB, uses their OAuth tokens
// ─────────────────────────────────────────────────────────────

export async function getRegisteredUsersLiveStreams(): Promise<LiveStream[]> {
  try {
    const { getDb } = await import('./db');
    const { socialConnections: scTable } = await import('../drizzle/schema');
    const { decrypt } = await import('./_core/crypto');

    const db = await getDb();
    if (!db) return [];

    // Fetch ALL connections; filter for live ones in memory so we handle
    // both int (0/1) and string ('true'/'false') storage transparently.
    const allConnections = await db.select().from(scTable);

    const liveConnections = allConnections.filter(c => {
      const v = c.isLive as unknown;
      return v === true || v === 1 || v === '1' || v === 'true';
    });

    if (liveConnections.length === 0) return [];

    const streams: LiveStream[] = [];

    // ── YouTube ─────────────────────────────────────────────
    const ytConns = liveConnections.filter(
      c => c.platform === 'youtube' && c.lastLiveVideoId
    );
    if (ytConns.length > 0) {
      // Batch the video IDs; use the first available (non-expired) token.
      // The video.list endpoint accepts any valid OAuth token for public
      // video data — we don't need the specific owner's token here.
      let accessToken: string | null = null;
      for (const conn of ytConns) {
        try {
          accessToken = decrypt(conn.accessTokenEncrypted);
          break;
        } catch {
          // token decrypt failed, try next
        }
      }

      if (accessToken) {
        const videoIds = ytConns.map(c => c.lastLiveVideoId!).join(',');
        const ytStreams = await fetchYouTubeVideoDetails(videoIds, accessToken);

        // If a token was expired (401 back from Google), try to refresh and retry.
        // The polling service handles this properly; here we do a best-effort attempt.
        if (ytStreams.length === 0 && ytConns.length > 0) {
          const refreshed = await tryRefreshAndFetch(ytConns, videoIds);
          streams.push(...refreshed);
        } else {
          streams.push(...ytStreams);
        }
      }
    }

    // ── Facebook ────────────────────────────────────────────
    const fbConns = liveConnections.filter(
      c => c.platform === 'facebook' && c.lastLiveVideoId
    );
    for (const conn of fbConns) {
      let accessToken: string | null = null;
      try {
        accessToken = decrypt(conn.accessTokenEncrypted);
      } catch {
        continue;
      }

      const videoId = conn.lastLiveVideoId!;
      const fbStream = await fetchFacebookVideoDetails(videoId, conn.channelOrPageId, accessToken);
      if (fbStream) streams.push(fbStream);
    }

    // ── TikTok ──────────────────────────────────────────────
    const ttConns = liveConnections.filter(
      c => c.platform === 'tiktok' && c.lastLiveVideoId
    );
    for (const conn of ttConns) {
      // TikTok doesn't provide rich public video metadata via its API yet.
      // We surface a best-effort entry so the card still appears in the feed.
      streams.push({
        platform: 'tiktok',
        streamId: conn.lastLiveVideoId!,
        title: 'TikTok Live',
        viewerCount: 0,
        thumbnail: '',
        url: `https://www.tiktok.com/@${conn.platformUserId}/live`,
        channelName: `@${conn.platformUserId}`,
        isLive: true,
      });
    }

    // Deduplicate by streamId (unlikely but safe)
    const seen = new Set<string>();
    return streams.filter(s => {
      if (seen.has(s.streamId)) return false;
      seen.add(s.streamId);
      return true;
    });
  } catch (error) {
    console.error('[LiveStreams] getRegisteredUsersLiveStreams failed:', error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// YOUTUBE HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Fetch video details from YouTube using an OAuth Bearer token.
 * Returns [] if the token is expired/invalid (caller should retry after refresh).
 */
async function fetchYouTubeVideoDetails(
  videoIds: string,
  accessToken: string
): Promise<LiveStream[]> {
  if (!videoIds || !accessToken) return [];

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?` +
        `part=snippet,statistics,liveStreamingDetails&` +
        `id=${videoIds}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    // 401 = expired / invalid token → return empty so caller can refresh
    if (response.status === 401) {
      console.warn('[LiveStreams] YouTube token expired, needs refresh');
      return [];
    }

    if (!response.ok) {
      console.error('[LiveStreams] YouTube video details failed:', response.statusText);
      return [];
    }

    const data = (await response.json()) as {
      items?: Array<{
        id: string;
        snippet: {
          title: string;
          channelTitle: string;
          thumbnails?: {
            high?: { url: string };
            default?: { url: string };
          };
        };
        liveStreamingDetails?: {
          concurrentViewers?: string;
          actualStartTime?: string;
          actualEndTime?: string;
        };
      }>;
    };

    if (!data.items) return [];

    return data.items
      // Skip streams that have already ended
      .filter(v => !v.liveStreamingDetails?.actualEndTime)
      .map(video => ({
        platform: 'youtube' as const,
        streamId: video.id,
        title: video.snippet.title,
        viewerCount: parseInt(
          video.liveStreamingDetails?.concurrentViewers || '0',
          10
        ),
        thumbnail:
          video.snippet.thumbnails?.high?.url ||
          video.snippet.thumbnails?.default?.url ||
          '',
        url: `https://www.youtube.com/watch?v=${video.id}`,
        channelName: video.snippet.channelTitle,
        isLive: true,
        startedAt: video.liveStreamingDetails?.actualStartTime,
      }));
  } catch (error) {
    console.error('[LiveStreams] fetchYouTubeVideoDetails error:', error);
    return [];
  }
}

/**
 * When the first token attempt returns an empty result (likely expired),
 * try each connection's refresh token to get a new access token,
 * then retry the batch fetch.
 */
async function tryRefreshAndFetch(
  ytConns: Array<{ accessTokenEncrypted: string; refreshTokenEncrypted?: string | null }>,
  videoIds: string
): Promise<LiveStream[]> {
  try {
    const { decrypt, encrypt } = await import('./_core/crypto');
    const { refreshYouTubeToken } = await import('./oauth/youtube');

    for (const conn of ytConns) {
      if (!conn.refreshTokenEncrypted) continue;
      try {
        const refreshToken = decrypt(conn.refreshTokenEncrypted);
        const newTokenData = await refreshYouTubeToken(refreshToken);
        const streams = await fetchYouTubeVideoDetails(videoIds, newTokenData.access_token);
        if (streams.length > 0) return streams;
      } catch {
        // This connection's refresh failed; try the next one
      }
    }
  } catch (error) {
    console.error('[LiveStreams] tryRefreshAndFetch error:', error);
  }
  return [];
}

// ─────────────────────────────────────────────────────────────
// FACEBOOK HELPERS
// ─────────────────────────────────────────────────────────────

async function fetchFacebookVideoDetails(
  videoId: string,
  pageId: string,
  accessToken: string
): Promise<LiveStream | null> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${videoId}?` +
        `fields=title,description,status,viewer_count,embed_html&` +
        `access_token=${accessToken}`
    );

    if (!response.ok) return null;

    const data = (await response.json()) as {
      id?: string;
      title?: string;
      viewer_count?: number;
      status?: string;
    };

    if (data.status !== 'LIVE') return null;

    return {
      platform: 'facebook',
      streamId: videoId,
      title: data.title || 'Facebook Live',
      viewerCount: data.viewer_count || 0,
      thumbnail: `https://graph.facebook.com/${videoId}/picture`,
      url: `https://www.facebook.com/${pageId}/videos/${videoId}`,
      channelName: pageId,
      isLive: true,
    };
  } catch (error) {
    console.error('[LiveStreams] fetchFacebookVideoDetails error:', error);
    return null;
  }
}
