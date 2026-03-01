import { useQuery } from '@tanstack/react-query';
import { trpc } from '../trpc';

export interface LiveStatus {
  platform: 'youtube' | 'facebook' | 'tiktok';
  isLive: boolean;
  lastLiveVideoId?: string | null;
  lastCheckedAt?: Date | null;
}

/**
 * Hook to get live status for a specific user
 */
export function useLiveStatus(userId: number) {
  return trpc.social.getLiveStatus.useQuery(
    { userId },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      enabled: !!userId,
    }
  );
}

/**
 * Hook to get current user's social connections
 */
export function useSocialConnections() {
  return trpc.social.getConnections.useQuery(undefined, {
    refetchInterval: 60000, // Refetch every minute
  });
}
