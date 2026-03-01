import express from 'express';
import { getYouTubeAuthUrl, exchangeYouTubeCode, getYouTubeChannelInfo } from './youtube';
import { getFacebookAuthUrl, exchangeFacebookCode, getLongLivedToken, getFacebookPages } from './facebook';
import { getTikTokAuthUrl, exchangeTikTokCode, getTikTokUserInfo } from './tiktok';
import { upsertSocialConnection, getSocialConnection } from '../socialConnections';
import { getUserByOpenId } from '../db';
import crypto from 'crypto';

const router = express.Router();

// Store OAuth states temporarily (in production, use Redis)
const oauthStates = new Map<string, { userId: number; platform: string; timestamp: number }>();

// Clean up old states every 10 minutes
setInterval(() => {
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  for (const [state, data] of oauthStates.entries()) {
    if (data.timestamp < tenMinutesAgo) {
      oauthStates.delete(state);
    }
  }
}, 10 * 60 * 1000);

/**
 * Generate OAuth state token
 */
function generateState(userId: number, platform: string): string {
  const state = crypto.randomBytes(32).toString('hex');
  oauthStates.set(state, {
    userId,
    platform,
    timestamp: Date.now(),
  });
  return state;
}

/**
 * Verify and consume OAuth state
 */
function verifyState(state: string): { userId: number; platform: string } | null {
  const data = oauthStates.get(state);
  if (!data) {
    return null;
  }

  // Check if state is expired (10 minutes)
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  if (data.timestamp < tenMinutesAgo) {
    oauthStates.delete(state);
    return null;
  }

  oauthStates.delete(state);
  return data;
}

/**
 * YouTube OAuth Routes
 */
router.get('/youtube/authorize', async (req, res) => {
  try {
    const userId = parseInt(req.query.userId as string);
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    const state = generateState(userId, 'youtube');
    const authUrl = getYouTubeAuthUrl(state);

    res.json({ authUrl, state });
  } catch (error) {
    console.error('[OAuth] YouTube authorize error:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

router.get('/youtube/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`/?oauth_error=${encodeURIComponent(error as string)}`);
    }

    if (!code || !state) {
      return res.redirect('/?oauth_error=missing_parameters');
    }

    const stateData = verifyState(state as string);
    if (!stateData) {
      return res.redirect('/?oauth_error=invalid_state');
    }

    const redirectUri = `${req.protocol}://${req.get('host')}/api/oauth/youtube/callback`;
    const tokenData = await exchangeYouTubeCode(code as string, redirectUri);

    // Get channel info
    const channelInfo = await getYouTubeChannelInfo(tokenData.access_token);

    // Calculate expiration
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;

    // Save connection
    await upsertSocialConnection({
      appUserId: stateData.userId,
      platform: 'youtube',
      platformUserId: channelInfo.id,
      channelOrPageId: channelInfo.id,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt,
    });

    res.redirect('/?oauth_success=youtube');
  } catch (error) {
    console.error('[OAuth] YouTube callback error:', error);
    res.redirect(`/?oauth_error=${encodeURIComponent((error as Error).message)}`);
  }
});

/**
 * Facebook OAuth Routes
 */
router.get('/facebook/authorize', async (req, res) => {
  try {
    const userId = parseInt(req.query.userId as string);
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    const state = generateState(userId, 'facebook');
    const authUrl = getFacebookAuthUrl(state);

    res.json({ authUrl, state });
  } catch (error) {
    console.error('[OAuth] Facebook authorize error:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

router.get('/facebook/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`/?oauth_error=${encodeURIComponent(error as string)}`);
    }

    if (!code || !state) {
      return res.redirect('/?oauth_error=missing_parameters');
    }

    const stateData = verifyState(state as string);
    if (!stateData) {
      return res.redirect('/?oauth_error=invalid_state');
    }

    const redirectUri = `${req.protocol}://${req.get('host')}/api/oauth/facebook/callback`;
    const tokenData = await exchangeFacebookCode(code as string, redirectUri);

    // Exchange for long-lived token
    const longLivedToken = await getLongLivedToken(tokenData.access_token);

    // Get user's pages
    const pages = await getFacebookPages(longLivedToken.access_token);
    if (pages.length === 0) {
      return res.redirect('/?oauth_error=no_pages_found');
    }

    // Use first page (in production, let user select)
    const page = pages[0];

    // Calculate expiration
    const expiresAt = longLivedToken.expires_in
      ? new Date(Date.now() + longLivedToken.expires_in * 1000)
      : null;

    // Save connection
    await upsertSocialConnection({
      appUserId: stateData.userId,
      platform: 'facebook',
      platformUserId: page.id,
      channelOrPageId: page.id,
      accessToken: page.access_token, // Use page access token
      expiresAt,
    });

    res.redirect('/?oauth_success=facebook');
  } catch (error) {
    console.error('[OAuth] Facebook callback error:', error);
    res.redirect(`/?oauth_error=${encodeURIComponent((error as Error).message)}`);
  }
});

/**
 * TikTok OAuth Routes
 */
router.get('/tiktok/authorize', async (req, res) => {
  try {
    const userId = parseInt(req.query.userId as string);
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    const state = generateState(userId, 'tiktok');
    const authUrl = getTikTokAuthUrl(state);

    res.json({ authUrl, state });
  } catch (error) {
    console.error('[OAuth] TikTok authorize error:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

router.get('/tiktok/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`/?oauth_error=${encodeURIComponent(error as string)}`);
    }

    if (!code || !state) {
      return res.redirect('/?oauth_error=missing_parameters');
    }

    const stateData = verifyState(state as string);
    if (!stateData) {
      return res.redirect('/?oauth_error=invalid_state');
    }

    const redirectUri = `${req.protocol}://${req.get('host')}/api/oauth/tiktok/callback`;
    const tokenData = await exchangeTikTokCode(code as string, redirectUri);

    // Get user info
    const userInfo = await getTikTokUserInfo(tokenData.access_token);

    // Calculate expiration
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;

    // Save connection
    await upsertSocialConnection({
      appUserId: stateData.userId,
      platform: 'tiktok',
      platformUserId: userInfo.open_id,
      channelOrPageId: userInfo.open_id,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt,
    });

    res.redirect('/?oauth_success=tiktok');
  } catch (error) {
    console.error('[OAuth] TikTok callback error:', error);
    res.redirect(`/?oauth_error=${encodeURIComponent((error as Error).message)}`);
  }
});

export function registerOAuthRoutes(app: express.Application): void {
  app.use('/api/oauth', router);
}
