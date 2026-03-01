import { getActiveConnectionsForPolling, updateLiveStatus, getDecryptedAccessToken, getDecryptedRefreshToken } from './socialConnections';
import { refreshYouTubeToken as refreshYouTube } from './oauth/youtube';
import { refreshTikTokToken as refreshTikTok } from './oauth/tiktok';

/**
 * Check if a YouTube channel is currently live
 */
async function checkYouTubeLiveStatus(
  channelId: string,
  accessToken: string
): Promise<{ isLive: boolean; videoId?: string }> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&` +
        `channelId=${channelId}&` +
        `type=video&` +
        `eventType=live&` +
        `maxResults=1`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, need to refresh
        throw new Error('TOKEN_EXPIRED');
      }
      throw new Error(`YouTube API failed: ${response.statusText}`);
    }

    const data = await response.json();
    const isLive = data.items && data.items.length > 0;
    const videoId = isLive ? data.items[0].id.videoId : undefined;

    return { isLive, videoId };
  } catch (error) {
    console.error('[LiveStatusPolling] YouTube check failed:', error);
    throw error;
  }
}

/**
 * Check if a Facebook page is currently live
 */
async function checkFacebookLiveStatus(
  pageId: string,
  accessToken: string
): Promise<{ isLive: boolean; videoId?: string }> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/live_videos?` +
        `fields=id,status&` +
        `status=LIVE&` +
        `limit=1`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('TOKEN_EXPIRED');
      }
      throw new Error(`Facebook API failed: ${response.statusText}`);
    }

    const data = await response.json();
    const isLive = data.data && data.data.length > 0;
    const videoId = isLive ? data.data[0].id : undefined;

    return { isLive, videoId };
  } catch (error) {
    console.error('[LiveStatusPolling] Facebook check failed:', error);
    throw error;
  }
}

/**
 * Check if a TikTok creator is currently live
 * Note: TikTok Live API may have limitations
 */
async function checkTikTokLiveStatus(
  creatorId: string,
  accessToken: string
): Promise<{ isLive: boolean; videoId?: string }> {
  try {
    // TikTok Live API endpoint (may vary based on API version)
    const response = await fetch(
      `https://open.tiktokapis.com/v2/research/live_videos/query/`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: {
            and: [
              {
                operation: 'EQ',
                field_name: 'creator_id',
                field_values: [creatorId],
              },
              {
                operation: 'EQ',
                field_name: 'status',
                field_values: ['LIVE'],
              },
            ],
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('TOKEN_EXPIRED');
      }
      throw new Error(`TikTok API failed: ${response.statusText}`);
    }

    const data = await response.json();
    const isLive = data.data?.videos && data.data.videos.length > 0;
    const videoId = isLive ? data.data.videos[0].video_id : undefined;

    return { isLive, videoId };
  } catch (error) {
    console.error('[LiveStatusPolling] TikTok check failed:', error);
    throw error;
  }
}

/**
 * Poll live status for all active connections
 */
export async function pollLiveStatuses(): Promise<void> {
  try {
    const connections = await getActiveConnectionsForPolling();
    console.log(`[LiveStatusPolling] Checking ${connections.length} connections`);

    for (const connection of connections) {
      try {
        let accessToken = await getDecryptedAccessToken(connection.appUserId, connection.platform);

        if (!accessToken) {
          console.warn(
            `[LiveStatusPolling] No access token for ${connection.platform} (user ${connection.appUserId})`
          );
          continue;
        }

        let liveStatus: { isLive: boolean; videoId?: string };
        let previousIsLive = connection.isLive === 'true';

        try {
          switch (connection.platform) {
            case 'youtube':
              liveStatus = await checkYouTubeLiveStatus(connection.channelOrPageId, accessToken);
              break;
            case 'facebook':
              liveStatus = await checkFacebookLiveStatus(connection.channelOrPageId, accessToken);
              break;
            case 'tiktok':
              liveStatus = await checkTikTokLiveStatus(connection.channelOrPageId, accessToken);
              break;
            default:
              console.warn(`[LiveStatusPolling] Unknown platform: ${connection.platform}`);
              continue;
          }
        } catch (error: any) {
          if (error.message === 'TOKEN_EXPIRED') {
            // Try to refresh token
            const refreshToken = await getDecryptedRefreshToken(
              connection.appUserId,
              connection.platform
            );
            if (refreshToken) {
              try {
                let newTokenData;
                if (connection.platform === 'youtube') {
                  newTokenData = await refreshYouTube(refreshToken);
                } else if (connection.platform === 'tiktok') {
                  newTokenData = await refreshTikTok(refreshToken);
                } else {
                  // Facebook tokens are long-lived, shouldn't need refresh
                  console.warn(`[LiveStatusPolling] Cannot refresh ${connection.platform} token`);
                  continue;
                }

                // Update connection with new token
                // This would require updating the upsert function to handle token refresh
                // For now, log and continue
                console.log(`[LiveStatusPolling] Token refreshed for ${connection.platform}`);
                accessToken = newTokenData.access_token;

                // Retry live status check
                switch (connection.platform) {
                  case 'youtube':
                    liveStatus = await checkYouTubeLiveStatus(
                      connection.channelOrPageId,
                      accessToken
                    );
                    break;
                  case 'tiktok':
                    liveStatus = await checkTikTokLiveStatus(
                      connection.channelOrPageId,
                      accessToken
                    );
                    break;
                }
              } catch (refreshError) {
                console.error(
                  `[LiveStatusPolling] Token refresh failed for ${connection.platform}:`,
                  refreshError
                );
                continue;
              }
            } else {
              console.warn(
                `[LiveStatusPolling] No refresh token for ${connection.platform} (user ${connection.appUserId})`
              );
              continue;
            }
          } else {
            throw error;
          }
        }

        // Update live status
        await updateLiveStatus(
          connection.appUserId,
          connection.platform,
          liveStatus.isLive,
          liveStatus.videoId
        );

        // Detect state transition (offline → live)
        if (!previousIsLive && liveStatus.isLive) {
          console.log(
            `[LiveStatusPolling] 🔴 User ${connection.appUserId} went live on ${connection.platform}!`
          );
          // TODO: Trigger push notification here
          // await triggerLiveNotification(connection.appUserId, connection.platform);
        }
      } catch (error) {
        console.error(
          `[LiveStatusPolling] Error checking ${connection.platform} for user ${connection.appUserId}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error('[LiveStatusPolling] Polling failed:', error);
  }
}

/**
 * Start background polling service
 * Runs every 2-5 minutes
 */
export function startLiveStatusPolling(intervalMinutes: number = 3): NodeJS.Timeout {
  console.log(`[LiveStatusPolling] Starting polling service (every ${intervalMinutes} minutes)`);

  // Run immediately on start
  pollLiveStatuses().catch(console.error);

  // Then run on interval
  return setInterval(() => {
    pollLiveStatuses().catch(console.error);
  }, intervalMinutes * 60 * 1000);
}
