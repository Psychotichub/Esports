import { ENV } from '../_core/env';

/**
 * Get Facebook OAuth authorization URL
 */
export function getFacebookAuthUrl(state: string): string {
  const appId = process.env.FACEBOOK_APP_ID || '';
  const redirectUri = process.env.FACEBOOK_OAUTH_REDIRECT_URI || `${ENV.oAuthServerUrl}/api/oauth/facebook/callback`;

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'pages_read_engagement,pages_show_list,pages_read_user_content',
    state,
  });

  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeFacebookCode(
  code: string,
  redirectUri: string
): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
}> {
  const appId = process.env.FACEBOOK_APP_ID || '';
  const appSecret = process.env.FACEBOOK_APP_SECRET || '';

  const response = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    // Facebook uses GET with query params
  });

  const url = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
  url.searchParams.set('client_id', appId);
  url.searchParams.set('client_secret', appSecret);
  url.searchParams.set('code', code);
  url.searchParams.set('redirect_uri', redirectUri);

  const tokenResponse = await fetch(url.toString());

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Facebook OAuth token exchange failed: ${error}`);
  }

  return await tokenResponse.json();
}

/**
 * Get long-lived access token (Facebook tokens expire, need to exchange for long-lived)
 */
export async function getLongLivedToken(shortLivedToken: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
}> {
  const appId = process.env.FACEBOOK_APP_ID || '';
  const appSecret = process.env.FACEBOOK_APP_SECRET || '';

  const url = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
  url.searchParams.set('grant_type', 'fb_exchange_token');
  url.searchParams.set('client_id', appId);
  url.searchParams.set('client_secret', appSecret);
  url.searchParams.set('fb_exchange_token', shortLivedToken);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Facebook long-lived token exchange failed: ${error}`);
  }

  return await response.json();
}

/**
 * Get Facebook pages for the user
 */
export async function getFacebookPages(accessToken: string): Promise<Array<{
  id: string;
  name: string;
  access_token: string;
}>> {
  const response = await fetch(
    'https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Facebook pages: ${error}`);
  }

  const data = await response.json();
  return data.data || [];
}
