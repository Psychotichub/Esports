import { ENV } from '../_core/env';

export interface YouTubeOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Get YouTube OAuth authorization URL
 */
export function getYouTubeAuthUrl(state: string): string {
  const clientId = process.env.YOUTUBE_OAUTH_CLIENT_ID || ENV.youtubeApiKey;
  const redirectUri = process.env.YOUTUBE_OAUTH_REDIRECT_URI || `${ENV.oAuthServerUrl}/api/oauth/youtube/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeYouTubeCode(
  code: string,
  redirectUri: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}> {
  const clientId = process.env.YOUTUBE_OAUTH_CLIENT_ID || ENV.youtubeApiKey;
  const clientSecret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET || '';

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`YouTube OAuth token exchange failed: ${error}`);
  }

  return await response.json();
}

/**
 * Refresh YouTube access token
 */
export async function refreshYouTubeToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
  token_type: string;
}> {
  const clientId = process.env.YOUTUBE_OAUTH_CLIENT_ID || ENV.youtubeApiKey;
  const clientSecret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET || '';

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`YouTube token refresh failed: ${error}`);
  }

  return await response.json();
}

/**
 * Get YouTube channel information
 */
export async function getYouTubeChannelInfo(accessToken: string): Promise<{
  id: string;
  title: string;
  description?: string;
  customUrl?: string;
}> {
  const response = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get YouTube channel info: ${error}`);
  }

  const data = await response.json();
  if (!data.items || data.items.length === 0) {
    throw new Error('No YouTube channel found');
  }

  const channel = data.items[0];
  return {
    id: channel.id,
    title: channel.snippet.title,
    description: channel.snippet.description,
    customUrl: channel.snippet.customUrl,
  };
}
