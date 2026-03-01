import { eq, and } from 'drizzle-orm';
import { getDb } from './db';
import { socialConnections, InsertSocialConnection, SocialConnection } from '../drizzle/schema';
import { encrypt, decrypt } from './_core/crypto';

/**
 * Create or update a social connection
 */
export async function upsertSocialConnection(
  connection: Omit<InsertSocialConnection, 'accessTokenEncrypted' | 'refreshTokenEncrypted'> & {
    accessToken: string;
    refreshToken?: string;
  }
): Promise<SocialConnection> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const accessTokenEncrypted = encrypt(connection.accessToken);
  const refreshTokenEncrypted = connection.refreshToken ? encrypt(connection.refreshToken) : null;

  const values: InsertSocialConnection = {
    appUserId: connection.appUserId,
    platform: connection.platform,
    platformUserId: connection.platformUserId,
    channelOrPageId: connection.channelOrPageId,
    accessTokenEncrypted,
    refreshTokenEncrypted,
    expiresAt: connection.expiresAt,
    isLive: connection.isLive || 'false',
    lastLiveVideoId: connection.lastLiveVideoId,
    lastCheckedAt: connection.lastCheckedAt,
  };

  const existing = await db
    .select()
    .from(socialConnections)
    .where(
      and(
        eq(socialConnections.appUserId, connection.appUserId),
        eq(socialConnections.platform, connection.platform)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    await db
      .update(socialConnections)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(eq(socialConnections.id, existing[0].id));

    return {
      ...existing[0],
      ...values,
    } as SocialConnection;
  } else {
    // Insert new
    const [result] = await db.insert(socialConnections).values(values);
    const [newConnection] = await db
      .select()
      .from(socialConnections)
      .where(eq(socialConnections.id, result.insertId))
      .limit(1);

    return newConnection;
  }
}

/**
 * Get social connection by user ID and platform
 */
export async function getSocialConnection(
  appUserId: number,
  platform: 'youtube' | 'facebook' | 'tiktok'
): Promise<SocialConnection | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const [result] = await db
    .select()
    .from(socialConnections)
    .where(and(eq(socialConnections.appUserId, appUserId), eq(socialConnections.platform, platform)))
    .limit(1);

  return result || null;
}

/**
 * Get all social connections for a user
 */
export async function getUserSocialConnections(appUserId: number): Promise<SocialConnection[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(socialConnections)
    .where(eq(socialConnections.appUserId, appUserId));
}

/**
 * Get decrypted access token
 */
export async function getDecryptedAccessToken(
  appUserId: number,
  platform: 'youtube' | 'facebook' | 'tiktok'
): Promise<string | null> {
  const connection = await getSocialConnection(appUserId, platform);
  if (!connection) {
    return null;
  }

  try {
    return decrypt(connection.accessTokenEncrypted);
  } catch (error) {
    console.error(`[SocialConnections] Failed to decrypt token for ${platform}:`, error);
    return null;
  }
}

/**
 * Get decrypted refresh token
 */
export async function getDecryptedRefreshToken(
  appUserId: number,
  platform: 'youtube' | 'facebook' | 'tiktok'
): Promise<string | null> {
  const connection = await getSocialConnection(appUserId, platform);
  if (!connection || !connection.refreshTokenEncrypted) {
    return null;
  }

  try {
    return decrypt(connection.refreshTokenEncrypted);
  } catch (error) {
    console.error(`[SocialConnections] Failed to decrypt refresh token for ${platform}:`, error);
    return null;
  }
}

/**
 * Update live status
 */
export async function updateLiveStatus(
  appUserId: number,
  platform: 'youtube' | 'facebook' | 'tiktok',
  isLive: boolean,
  lastLiveVideoId?: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    return;
  }

  await db
    .update(socialConnections)
    .set({
      isLive: isLive ? 'true' : 'false',
      lastLiveVideoId: lastLiveVideoId || null,
      lastCheckedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(eq(socialConnections.appUserId, appUserId), eq(socialConnections.platform, platform))
    );
}

/**
 * Delete social connection
 */
export async function deleteSocialConnection(
  appUserId: number,
  platform: 'youtube' | 'facebook' | 'tiktok'
): Promise<void> {
  const db = await getDb();
  if (!db) {
    return;
  }

  await db
    .delete(socialConnections)
    .where(
      and(eq(socialConnections.appUserId, appUserId), eq(socialConnections.platform, platform))
    );
}

/**
 * Get all active connections that need live status checking
 */
export async function getActiveConnectionsForPolling(): Promise<SocialConnection[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  // Get connections that haven't been checked in the last 2 minutes
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

  return await db
    .select()
    .from(socialConnections)
    .where(
      // Only check connections that have valid tokens (not expired or expiring soon)
      // This is a simplified check - in production, you'd want more sophisticated logic
    );
}
