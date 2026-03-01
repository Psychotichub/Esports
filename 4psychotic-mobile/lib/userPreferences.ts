import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFS_KEY = '@4psychotic:userPreferences';

export type ContentIntensity = 'casual' | 'regular' | 'hardcore';
export type PushTiming = 'always' | 'morning' | 'evening' | 'never';
export type DataUsage = 'wifi_only' | 'low' | 'high';

export interface UserPreferences {
  // Category interests (multi-select)
  interests: string[];

  // Autoplay next video
  autoplayEnabled: boolean;

  // Preferred push notification window
  pushTiming: PushTiming;

  // Content intensity level
  contentIntensity: ContentIntensity;

  // Data usage preference
  dataUsage: DataUsage;

  // Daily watch goal (minutes)
  dailyGoalMinutes: number;
}

const DEFAULTS: UserPreferences = {
  interests: ['gaming', 'highlights'],
  autoplayEnabled: true,
  pushTiming: 'always',
  contentIntensity: 'regular',
  dataUsage: 'high',
  dailyGoalMinutes: 30,
};

export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveUserPreferences(prefs: Partial<UserPreferences>): Promise<void> {
  try {
    const current = await getUserPreferences();
    const updated = { ...current, ...prefs };
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
}

export async function toggleInterest(interest: string): Promise<string[]> {
  const prefs = await getUserPreferences();
  const idx = prefs.interests.indexOf(interest);
  if (idx > -1) {
    prefs.interests.splice(idx, 1);
  } else {
    prefs.interests.push(interest);
  }
  await saveUserPreferences({ interests: prefs.interests });
  return prefs.interests;
}

export const ALL_CATEGORIES = [
  { id: 'gaming',       label: '🎮 Gaming',       color: '#ff1744' },
  { id: 'highlights',   label: '⚡ Highlights',    color: '#ff9100' },
  { id: 'tournaments',  label: '🏆 Tournaments',   color: '#ffd600' },
  { id: 'tutorials',    label: '📚 Tutorials',     color: '#00e5ff' },
  { id: 'compilations', label: '🎬 Compilations',  color: '#d500f9' },
  { id: 'live',         label: '🔴 Live Streams',  color: '#76ff03' },
  { id: 'esports',      label: '🕹️ Esports',       color: '#ff4081' },
  { id: 'fps',          label: '🎯 FPS',            color: '#00b0ff' },
];

export const INTENSITY_OPTIONS: { id: ContentIntensity; label: string; desc: string }[] = [
  { id: 'casual',   label: '😴 Casual',   desc: 'Light content, shorter sessions' },
  { id: 'regular',  label: '😎 Regular',  desc: 'Balanced mix, 30–60 min sessions' },
  { id: 'hardcore', label: '🔥 Hardcore', desc: 'Deep dives, tournaments, long sessions' },
];

export const PUSH_TIMING_OPTIONS: { id: PushTiming; label: string; desc: string }[] = [
  { id: 'always',  label: '🔔 Always',  desc: 'Notify me any time' },
  { id: 'morning', label: '🌅 Morning', desc: '8 AM – 12 PM only' },
  { id: 'evening', label: '🌆 Evening', desc: '6 PM – 11 PM only' },
  { id: 'never',   label: '🔕 Never',   desc: 'No push notifications' },
];
