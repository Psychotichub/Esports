/**
 * liveStreamActivity.ts
 * Tracks which live streams a user watched, when, and for how long.
 * Used by the Profile Activity Feed and personalized sorting.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVITY_KEY = '@4psychotic:liveStreamActivity';
const MAX_ENTRIES   = 100;

export type Platform = 'youtube' | 'facebook' | 'tiktok';

export interface LiveStreamActivity {
  streamId: string;          // video / stream ID
  title: string;
  platform: Platform;
  channelName: string;
  thumbnail: string;
  url: string;
  viewerCount: number;
  watchedAt: number;         // unix ms
  watchDuration: number;     // seconds actually watched
  isFinished: boolean;       // did user watch until stream ended / closed?
}

// ── write ──────────────────────────────────────────────────────────────────

export async function recordStreamWatch(entry: Omit<LiveStreamActivity, 'watchedAt'>): Promise<void> {
  try {
    const list = await getActivityFeed();
    // Remove previous entry for same stream so newest is first
    const filtered = list.filter(e => e.streamId !== entry.streamId);
    const updated: LiveStreamActivity[] = [
      { ...entry, watchedAt: Date.now() },
      ...filtered,
    ].slice(0, MAX_ENTRIES);
    await AsyncStorage.setItem(ACTIVITY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('[liveStreamActivity] write error', e);
  }
}

// ── read ───────────────────────────────────────────────────────────────────

export async function getActivityFeed(limit = 50): Promise<LiveStreamActivity[]> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVITY_KEY);
    if (!raw) return [];
    const list: LiveStreamActivity[] = JSON.parse(raw);
    return list.slice(0, limit);
  } catch {
    return [];
  }
}

export async function getRecentActivity(limit = 5): Promise<LiveStreamActivity[]> {
  return getActivityFeed(limit);
}

/** IDs of streams the user has already watched — used to rank familiar creators higher */
export async function getWatchedStreamIds(): Promise<Set<string>> {
  const list = await getActivityFeed();
  return new Set(list.map(e => e.streamId));
}

/** Platforms watched most, sorted by watch count */
export async function getPreferredPlatforms(): Promise<{ platform: Platform; count: number }[]> {
  const list = await getActivityFeed();
  const counts = new Map<Platform, number>();
  list.forEach(e => counts.set(e.platform, (counts.get(e.platform) ?? 0) + 1));
  return Array.from(counts.entries())
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count);
}

/** Channels watched most, sorted by watch count */
export async function getPreferredChannels(): Promise<{ channelName: string; platform: Platform; count: number }[]> {
  const list = await getActivityFeed();
  const map = new Map<string, { channelName: string; platform: Platform; count: number }>();
  list.forEach(e => {
    const key = `${e.platform}:${e.channelName}`;
    const prev = map.get(key) ?? { channelName: e.channelName, platform: e.platform, count: 0 };
    map.set(key, { ...prev, count: prev.count + 1 });
  });
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

// ── helpers ────────────────────────────────────────────────────────────────

export function formatRelativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const secs = Math.floor(diff / 1000);
  if (secs < 60)   return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60)   return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24)  return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7)    return `${days}d ago`;
  return new Date(ms).toLocaleDateString();
}

export const PLATFORM_COLORS: Record<Platform, string> = {
  youtube:  '#ff0000',
  facebook: '#1877f2',
  tiktok:   '#ff0050',
};

export const PLATFORM_ICONS: Record<Platform, string> = {
  youtube:  '▶',
  facebook: 'f',
  tiktok:   '♪',
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  youtube:  'YouTube',
  facebook: 'Facebook',
  tiktok:   'TikTok',
};

export async function clearActivityFeed(): Promise<void> {
  await AsyncStorage.removeItem(ACTIVITY_KEY);
}
