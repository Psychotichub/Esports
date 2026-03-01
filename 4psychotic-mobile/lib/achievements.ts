import { EngagementStats } from './engagementTracking';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'legendary';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: AchievementTier;
  unlocked: boolean;
  progress: number;   // 0–100
  progressLabel: string;
}

export const TIER_COLORS: Record<AchievementTier, string> = {
  bronze:    '#cd7f32',
  silver:    '#c0c0c0',
  gold:      '#ffd600',
  legendary: '#d500f9',
};

export const TIER_LABELS: Record<AchievementTier, string> = {
  bronze:    '🥉 Bronze',
  silver:    '🥈 Silver',
  gold:      '🥇 Gold',
  legendary: '💎 Legendary',
};

type StatsInput = {
  videosWatched: number;
  watchTimeSeconds: number;  // raw seconds from engagementTracking
  currentStreak: number;
  longestStreak: number;
  playlistsCreated: number;
  likesGiven: number;
};

export function computeAchievements(s: StatsInput): Achievement[] {
  const watchMins = s.watchTimeSeconds / 60;

  return [
    // ── FIRST WATCH ───────────────────────────────────────
    {
      id: 'first_watch',
      title: 'First Blood',
      description: 'Watch your very first video',
      icon: '▶️',
      tier: 'bronze',
      unlocked: s.videosWatched >= 1,
      progress: Math.min(100, s.videosWatched * 100),
      progressLabel: `${s.videosWatched}/1 videos`,
    },

    // ── BINGE WATCHER ─────────────────────────────────────
    {
      id: 'binge_10',
      title: 'Binge Mode',
      description: 'Watch 10 videos',
      icon: '📺',
      tier: 'bronze',
      unlocked: s.videosWatched >= 10,
      progress: Math.min(100, (s.videosWatched / 10) * 100),
      progressLabel: `${s.videosWatched}/10 videos`,
    },
    {
      id: 'binge_50',
      title: 'Content Addict',
      description: 'Watch 50 videos',
      icon: '🎬',
      tier: 'silver',
      unlocked: s.videosWatched >= 50,
      progress: Math.min(100, (s.videosWatched / 50) * 100),
      progressLabel: `${s.videosWatched}/50 videos`,
    },
    {
      id: 'binge_200',
      title: 'Video Veteran',
      description: 'Watch 200 videos',
      icon: '🏅',
      tier: 'gold',
      unlocked: s.videosWatched >= 200,
      progress: Math.min(100, (s.videosWatched / 200) * 100),
      progressLabel: `${s.videosWatched}/200 videos`,
    },
    {
      id: 'binge_1000',
      title: 'Legendary Watcher',
      description: 'Watch 1,000 videos',
      icon: '🦾',
      tier: 'legendary',
      unlocked: s.videosWatched >= 1000,
      progress: Math.min(100, (s.videosWatched / 1000) * 100),
      progressLabel: `${s.videosWatched}/1,000 videos`,
    },

    // ── WATCH TIME ─────────────────────────────────────────
    {
      id: 'watch_30m',
      title: 'Getting Warmed Up',
      description: 'Watch 30 minutes total',
      icon: '⏱️',
      tier: 'bronze',
      unlocked: watchMins >= 30,
      progress: Math.min(100, (watchMins / 30) * 100),
      progressLabel: `${Math.round(watchMins)}/30 min`,
    },
    {
      id: 'watch_5h',
      title: 'Dedicated Fan',
      description: 'Watch 5 hours of content',
      icon: '🎯',
      tier: 'silver',
      unlocked: watchMins >= 300,
      progress: Math.min(100, (watchMins / 300) * 100),
      progressLabel: `${Math.round(watchMins / 60)}h/5h`,
    },
    {
      id: 'watch_24h',
      title: 'Full Day Grind',
      description: 'Watch 24 hours of content',
      icon: '⚡',
      tier: 'gold',
      unlocked: watchMins >= 1440,
      progress: Math.min(100, (watchMins / 1440) * 100),
      progressLabel: `${Math.round(watchMins / 60)}h/24h`,
    },
    {
      id: 'watch_100h',
      title: 'Time Lord',
      description: 'Watch 100 hours of content',
      icon: '👑',
      tier: 'legendary',
      unlocked: watchMins >= 6000,
      progress: Math.min(100, (watchMins / 6000) * 100),
      progressLabel: `${Math.round(watchMins / 60)}h/100h`,
    },

    // ── STREAK ────────────────────────────────────────────
    {
      id: 'streak_3',
      title: 'On Fire',
      description: 'Maintain a 3-day streak',
      icon: '🔥',
      tier: 'bronze',
      unlocked: s.longestStreak >= 3,
      progress: Math.min(100, (s.longestStreak / 3) * 100),
      progressLabel: `${s.longestStreak}/3 days`,
    },
    {
      id: 'streak_7',
      title: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: '🗡️',
      tier: 'silver',
      unlocked: s.longestStreak >= 7,
      progress: Math.min(100, (s.longestStreak / 7) * 100),
      progressLabel: `${s.longestStreak}/7 days`,
    },
    {
      id: 'streak_30',
      title: 'Monthly Legend',
      description: 'Maintain a 30-day streak',
      icon: '🏆',
      tier: 'gold',
      unlocked: s.longestStreak >= 30,
      progress: Math.min(100, (s.longestStreak / 30) * 100),
      progressLabel: `${s.longestStreak}/30 days`,
    },
    {
      id: 'streak_100',
      title: 'Unstoppable',
      description: 'Maintain a 100-day streak',
      icon: '💎',
      tier: 'legendary',
      unlocked: s.longestStreak >= 100,
      progress: Math.min(100, (s.longestStreak / 100) * 100),
      progressLabel: `${s.longestStreak}/100 days`,
    },

    // ── PLAYLISTS ─────────────────────────────────────────
    {
      id: 'playlist_1',
      title: 'Curator',
      description: 'Create your first playlist',
      icon: '🎵',
      tier: 'bronze',
      unlocked: s.playlistsCreated >= 1,
      progress: Math.min(100, s.playlistsCreated * 100),
      progressLabel: `${s.playlistsCreated}/1 playlists`,
    },
    {
      id: 'playlist_5',
      title: 'DJ Mode',
      description: 'Create 5 playlists',
      icon: '🎧',
      tier: 'silver',
      unlocked: s.playlistsCreated >= 5,
      progress: Math.min(100, (s.playlistsCreated / 5) * 100),
      progressLabel: `${s.playlistsCreated}/5 playlists`,
    },

    // ── ENGAGEMENT ────────────────────────────────────────
    {
      id: 'engage_10',
      title: 'Active Member',
      description: 'Engage with 10 videos (like, comment, share)',
      icon: '❤️',
      tier: 'bronze',
      unlocked: s.likesGiven >= 10,
      progress: Math.min(100, (s.likesGiven / 10) * 100),
      progressLabel: `${s.likesGiven}/10 engagements`,
    },
    {
      id: 'engage_100',
      title: 'Community Pillar',
      description: 'Engage with 100 videos',
      icon: '🌟',
      tier: 'gold',
      unlocked: s.likesGiven >= 100,
      progress: Math.min(100, (s.likesGiven / 100) * 100),
      progressLabel: `${s.likesGiven}/100 engagements`,
    },
  ];
}

export function countUnlocked(achievements: Achievement[]): number {
  return achievements.filter(a => a.unlocked).length;
}

export function getHighestTier(achievements: Achievement[]): AchievementTier | null {
  const unlocked = achievements.filter(a => a.unlocked);
  if (unlocked.some(a => a.tier === 'legendary')) return 'legendary';
  if (unlocked.some(a => a.tier === 'gold'))      return 'gold';
  if (unlocked.some(a => a.tier === 'silver'))     return 'silver';
  if (unlocked.some(a => a.tier === 'bronze'))     return 'bronze';
  return null;
}
