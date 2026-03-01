/**
 * userFollowSystem.ts
 * User-to-user follow system backed by AsyncStorage.
 * Interfaces are designed to be a drop-in for a real REST/tRPC API later.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ───────────────────────────────────────────────────────────────────

export type Platform = 'youtube' | 'facebook' | 'tiktok';

export interface AppUser {
  id: string;
  name: string;
  username: string;          // @handle
  bio: string;
  avatarColor: string;       // hex — used as background for initial avatar
  platform: Platform;
  channelName: string;       // linked streaming channel
  isLive: boolean;
  followerCount: number;
  followingCount: number;
  streamCount: number;
}

export interface FollowRelation {
  userId: string;            // who is being followed
  followedAt: number;        // unix ms
  notificationsOn: boolean;  // get push when they go live
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const FOLLOWING_KEY   = '@4psychotic:following';    // people I follow
const MY_PROFILE_KEY  = '@4psychotic:myFollowStats';

// ─── Mock user directory ──────────────────────────────────────────────────────
// In production this comes from the backend.
// These simulate other registered users of the app.

export const MOCK_USERS: AppUser[] = [
  {
    id: 'u1',
    name: 'Alex Clutch',
    username: '@alexclutch',
    bio: 'PUBG Mobile pro • Tournament grinder • Top 10 SEA server',
    avatarColor: '#ff1744',
    platform: 'youtube',
    channelName: 'AlexClutch Gaming',
    isLive: true,
    followerCount: 3420,
    followingCount: 128,
    streamCount: 312,
  },
  {
    id: 'u2',
    name: 'NightOwl Gamer',
    username: '@nightowlgg',
    bio: 'Late night streams • FPS & Battle Royale • Chill vibes only',
    avatarColor: '#7c4dff',
    platform: 'facebook',
    channelName: 'NightOwl Gaming',
    isLive: false,
    followerCount: 1870,
    followingCount: 200,
    streamCount: 187,
  },
  {
    id: 'u3',
    name: 'Psych_Reaper',
    username: '@psychreaper',
    bio: 'Esports competitor • Clutch moments every stream',
    avatarColor: '#00e5ff',
    platform: 'youtube',
    channelName: 'PsychReaper',
    isLive: true,
    followerCount: 5100,
    followingCount: 92,
    streamCount: 520,
  },
  {
    id: 'u4',
    name: 'TikTok_FragZ',
    username: '@tiktokfragz',
    bio: 'Short highlight clips • Pro tips • PUBG & COD Mobile',
    avatarColor: '#ff0050',
    platform: 'tiktok',
    channelName: 'FragZ',
    isLive: true,
    followerCount: 12400,
    followingCount: 305,
    streamCount: 890,
  },
  {
    id: 'u5',
    name: 'Sniper Queen',
    username: '@sniperqueen',
    bio: 'Headshot specialist • Training streams every day 8 PM',
    avatarColor: '#ffd600',
    platform: 'youtube',
    channelName: 'SniperQueen',
    isLive: false,
    followerCount: 2900,
    followingCount: 155,
    streamCount: 234,
  },
  {
    id: 'u6',
    name: 'CoachKing',
    username: '@coachking',
    bio: 'Free coaching every Sunday • Diamond rank PUBG',
    avatarColor: '#76ff03',
    platform: 'facebook',
    channelName: 'CoachKing Gaming',
    isLive: false,
    followerCount: 4300,
    followingCount: 410,
    streamCount: 400,
  },
  {
    id: 'u7',
    name: 'GhostByte',
    username: '@ghostbyte',
    bio: 'Stealth plays • Solo squad master • Night raider',
    avatarColor: '#ff9100',
    platform: 'tiktok',
    channelName: 'GhostByte',
    isLive: false,
    followerCount: 730,
    followingCount: 60,
    streamCount: 98,
  },
  {
    id: 'u8',
    name: 'RushMode',
    username: '@rushmode',
    bio: '24/7 grind • No meta, pure aggression • Watch & learn',
    avatarColor: '#e040fb',
    platform: 'youtube',
    channelName: 'RushMode Clips',
    isLive: true,
    followerCount: 8800,
    followingCount: 230,
    streamCount: 670,
  },
];

// ─── Follow helpers ────────────────────────────────────────────────────────────

export async function getFollowing(): Promise<FollowRelation[]> {
  try {
    const raw = await AsyncStorage.getItem(FOLLOWING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function isFollowing(userId: string): Promise<boolean> {
  const list = await getFollowing();
  return list.some(r => r.userId === userId);
}

export async function followUser(userId: string): Promise<void> {
  const list = await getFollowing();
  if (list.some(r => r.userId === userId)) return;
  list.push({ userId, followedAt: Date.now(), notificationsOn: true });
  await AsyncStorage.setItem(FOLLOWING_KEY, JSON.stringify(list));
}

export async function unfollowUser(userId: string): Promise<void> {
  const list = await getFollowing();
  const updated = list.filter(r => r.userId !== userId);
  await AsyncStorage.setItem(FOLLOWING_KEY, JSON.stringify(updated));
}

export async function toggleFollowUser(userId: string): Promise<boolean> {
  if (await isFollowing(userId)) {
    await unfollowUser(userId);
    return false;
  } else {
    await followUser(userId);
    return true;
  }
}

export async function setNotifications(userId: string, on: boolean): Promise<void> {
  const list = await getFollowing();
  const rel = list.find(r => r.userId === userId);
  if (rel) {
    rel.notificationsOn = on;
    await AsyncStorage.setItem(FOLLOWING_KEY, JSON.stringify(list));
  }
}

// ─── Derived lists ─────────────────────────────────────────────────────────────

/** Users the current user follows, enriched with AppUser data */
export async function getFollowingUsers(): Promise<AppUser[]> {
  const list = await getFollowing();
  const ids = new Set(list.map(r => r.userId));
  return MOCK_USERS.filter(u => ids.has(u.id));
}

/** Suggested users = live-first, sorted by follower count, exclude already followed */
export async function getSuggestedUsers(limit = 20): Promise<AppUser[]> {
  const list = await getFollowing();
  const followedIds = new Set(list.map(r => r.userId));
  return MOCK_USERS
    .filter(u => !followedIds.has(u.id))
    .sort((a, b) => {
      // Live users first, then by follower count
      if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
      return b.followerCount - a.followerCount;
    })
    .slice(0, limit);
}

/** Mock followers = random subset of MOCK_USERS who "follow" the current user */
export async function getFollowers(): Promise<AppUser[]> {
  // In production: fetch from backend. Locally we pick a stable mock subset.
  return MOCK_USERS.filter((_, i) => i % 2 === 0);
}

// ─── Format helpers ────────────────────────────────────────────────────────────

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function getUserById(id: string): AppUser | undefined {
  return MOCK_USERS.find(u => u.id === id);
}
