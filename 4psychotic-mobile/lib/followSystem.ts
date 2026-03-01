import AsyncStorage from '@react-native-async-storage/async-storage';

const FOLLOW_KEY = '@follow_status';

export interface FollowStatus {
  isFollowing: boolean;
  followedAt?: number;
  notificationEnabled: boolean;
}

// Get follow status
export async function getFollowStatus(): Promise<FollowStatus> {
  try {
    const data = await AsyncStorage.getItem(FOLLOW_KEY);
    return data ? JSON.parse(data) : { isFollowing: false, notificationEnabled: true };
  } catch (error) {
    console.error('Error getting follow status:', error);
    return { isFollowing: false, notificationEnabled: true };
  }
}

// Toggle follow status
export async function toggleFollow(): Promise<FollowStatus> {
  try {
    const current = await getFollowStatus();
    const newStatus: FollowStatus = {
      isFollowing: !current.isFollowing,
      followedAt: !current.isFollowing ? Date.now() : current.followedAt,
      notificationEnabled: current.notificationEnabled,
    };
    await AsyncStorage.setItem(FOLLOW_KEY, JSON.stringify(newStatus));
    return newStatus;
  } catch (error) {
    console.error('Error toggling follow:', error);
    return { isFollowing: false, notificationEnabled: true };
  }
}

// Update notification preference
export async function updateNotificationPreference(enabled: boolean): Promise<void> {
  try {
    const current = await getFollowStatus();
    const newStatus: FollowStatus = {
      ...current,
      notificationEnabled: enabled,
    };
    await AsyncStorage.setItem(FOLLOW_KEY, JSON.stringify(newStatus));
  } catch (error) {
    console.error('Error updating notification preference:', error);
  }
}
