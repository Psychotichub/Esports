import { ENV } from '../_core/env';

/**
 * Get TikTok OAuth authorization URL
 * Note: TikTok OAuth requires TikTok for Developers account
 */
export function getTikTokAuthUrl(state: string): string {
  const clientKey = process.env.TIKTOK_CLIENT_KEY || '';
  const redirectUri = process.env.TIKTOK_OAUTH_REDIRECT_URI || `${ENV.oAuthServerUrl}/api/oauth/tiktok/callback`;

  const params = new URLSearchParams({
    client_key: clientKey,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'user.info.basic,video.list',
    state,
  });

  return `https://www.tiktok.com/v2/auth/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeTikTokCode(
  code: string,
  redirectUri: string
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY || '';
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET || '';

  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TikTok OAuth token exchange failed: ${error}`);
  }

  return await response.json();
}

/**
 * Refresh TikTok access token
 */
export async function refreshTikTokToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY || '';
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET || '';

  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TikTok token refresh failed: ${error}`);
  }

  return await response.json();
}

/**
 * Get TikTok user information
 */
export async function getTikTokUserInfo(accessToken: string): Promise<{
  open_id: string;
  union_id: string;
  avatar_url: string;
  display_name: string;
}> {
  const response = await fetch('https://open.tiktokapis.com/v2/user/info/', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get TikTok user info: ${error}`);
  }

  const data = await response.json();
  return data.data?.user || {};
}
