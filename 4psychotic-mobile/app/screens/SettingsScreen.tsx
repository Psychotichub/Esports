import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import TopNavBar from '../../components/TopNavBar';
import {
  getUserPreferences,
  saveUserPreferences,
  toggleInterest,
  ALL_CATEGORIES,
  INTENSITY_OPTIONS,
  PUSH_TIMING_OPTIONS,
  UserPreferences,
  ContentIntensity,
  PushTiming,
} from '../../lib/userPreferences';
import { getEngagementStats, EngagementStats } from '../../lib/engagementTracking';
import { getDailyGoal, getSessionStats } from '../../lib/sessionTracking';
import { useAuth } from '../../lib/authContext';

const COLORS = {
  dark: '#0a0e1a',
  darkLight: '#0f1420',
  card: '#12182b',
  neonRed: '#ff1744',
  neonTeal: '#00e5ff',
  neonGold: '#ffd600',
  neonGreen: '#76ff03',
  white: '#ffffff',
  white80: '#ffffffcc',
  white60: '#ffffff99',
  white40: '#ffffff66',
  white10: '#ffffff1a',
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatWatchTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── Streak fire animation ──────────────────────────────────────────────────

function StreakBadge({ streak }: { streak: number }) {
  const scale = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (streak > 0) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.2, duration: 250, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,   duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [streak]);

  const color = streak >= 30 ? COLORS.neonGold
              : streak >= 7  ? COLORS.neonRed
              : streak >= 3  ? '#ff9100'
              : COLORS.white60;

  return (
    <Animated.View style={[styles.streakBadge, { transform: [{ scale }], borderColor: color }]}>
      <Text style={[styles.streakNumber, { color }]}>{streak}</Text>
      <Text style={styles.streakLabel}>day streak</Text>
      {streak >= 3 && <Text style={styles.streakFire}>🔥</Text>}
    </Animated.View>
  );
}

// ─── Progress bar ───────────────────────────────────────────────────────────

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  const width = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: pct,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View style={styles.progressTrack}>
      <Animated.View
        style={[
          styles.progressFill,
          {
            backgroundColor: color,
            width: width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </View>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { isAuthenticated } = useAuth();

  const [stats, setStats]     = useState<EngagementStats | null>(null);
  const [prefs, setPrefs]     = useState<UserPreferences | null>(null);
  const [sessionStats, setSessionStats] = useState({
    averageSessionDuration: 0,
    averageVideosPerSession: 0,
    totalSessions: 0,
  });
  const [dailyGoal, setDailyGoal] = useState({ targetMinutes: 30, currentMinutes: 0, achieved: false });
  const [loading, setLoading]     = useState(true);

  // ── load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [s, p, ss, dg] = await Promise.all([
        getEngagementStats(),
        getUserPreferences(),
        getSessionStats(),
        getDailyGoal(),
      ]);
      setStats(s);
      setPrefs(p);
      setSessionStats(ss);
      setDailyGoal(dg);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── preference helpers ─────────────────────────────────────────────────────
  const updatePref = async (patch: Partial<UserPreferences>) => {
    await saveUserPreferences(patch);
    setPrefs(prev => prev ? { ...prev, ...patch } : null);
    Haptics.selectionAsync();
  };

  const handleToggleInterest = async (id: string) => {
    const updated = await toggleInterest(id);
    setPrefs(prev => prev ? { ...prev, interests: updated } : null);
    Haptics.selectionAsync();
  };

  const handleGoalChange = (delta: number) => {
    if (!prefs) return;
    const next = Math.max(5, Math.min(180, prefs.dailyGoalMinutes + delta));
    updatePref({ dailyGoalMinutes: next });
  };

  const handleResetStats = () => {
    Alert.alert(
      'Reset Activity Data',
      'This will clear all your watch history, streaks, and stats. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const { clearTrackingData } = await import('../../lib/engagementTracking');
            await clearTrackingData();
            await loadData();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  if (loading || !prefs) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <TopNavBar title="Engagement Hub" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your stats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentStreak = stats?.currentStreak ?? 0;
  const longestStreak = stats?.longestStreak ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TopNavBar title="Engagement Hub" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── YOUR GAMING STATS ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ YOUR GAMING STATS</Text>

          {/* Streak highlight */}
          <View style={styles.streakRow}>
            <StreakBadge streak={currentStreak} />
            <View style={styles.streakMeta}>
              {currentStreak >= 3 && (
                <Text style={styles.streakMotivation}>
                  {currentStreak >= 30 ? "🏆 Legendary! Keep going!" :
                   currentStreak >= 7  ? "🔥 You're on fire! Don't break it!" :
                                         "💪 Great start! Keep the streak alive!"}
                </Text>
              )}
              <Text style={styles.streakSubtext}>Best: {longestStreak} days</Text>
              {currentStreak === 0 && (
                <Text style={styles.streakSubtext}>Watch a video today to start your streak!</Text>
              )}
            </View>
          </View>

          {/* Daily goal */}
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalLabel}>🎯 Daily Goal</Text>
              <View style={styles.goalControls}>
                <TouchableOpacity style={styles.goalBtn} onPress={() => handleGoalChange(-5)}>
                  <Text style={styles.goalBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.goalValue}>{prefs.dailyGoalMinutes}m</Text>
                <TouchableOpacity style={styles.goalBtn} onPress={() => handleGoalChange(+5)}>
                  <Text style={styles.goalBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <ProgressBar
              value={dailyGoal.currentMinutes}
              max={prefs.dailyGoalMinutes}
              color={dailyGoal.achieved ? COLORS.neonGreen : COLORS.neonRed}
            />
            <Text style={styles.goalProgress}>
              {dailyGoal.achieved
                ? `✅ Goal achieved! ${Math.round(dailyGoal.currentMinutes)}/${prefs.dailyGoalMinutes} min`
                : `${Math.round(dailyGoal.currentMinutes)}/${prefs.dailyGoalMinutes} min today`}
            </Text>
          </View>

          {/* Stat grid */}
          <View style={styles.statGrid}>
            {[
              { label: 'Total Watch Time',       value: formatWatchTime(stats?.totalWatchTime ?? 0),              icon: '⏱️' },
              { label: 'Videos Watched',          value: String(stats?.videosWatched ?? 0),                        icon: '📺' },
              { label: 'Avg Session',             value: `${Math.round(sessionStats.averageSessionDuration)}m`,    icon: '📊' },
              { label: 'Videos / Session',        value: sessionStats.averageVideosPerSession.toFixed(1),          icon: '🔗' },
              { label: 'Favorite Category',       value: stats?.favoriteCategory || 'None yet',                   icon: '⭐' },
              { label: 'Most Active Day',         value: stats?.mostActiveDay || 'Getting started',               icon: '📅' },
            ].map(item => (
              <View key={item.label} style={styles.statCard}>
                <Text style={styles.statIcon}>{item.icon}</Text>
                <Text style={styles.statValue} numberOfLines={1}>{item.value}</Text>
                <Text style={styles.statLabel} numberOfLines={2}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── CONTENT PREFERENCES ───────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎮 CONTENT PREFERENCES</Text>
          <Text style={styles.sectionSubtitle}>
            Personalize your feed based on what you love
          </Text>

          <Text style={styles.subLabel}>Interests</Text>
          <View style={styles.chipGrid}>
            {ALL_CATEGORIES.map(cat => {
              const active = prefs.interests.includes(cat.id);
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.chip,
                    active && { backgroundColor: `${cat.color}22`, borderColor: cat.color },
                  ]}
                  onPress={() => handleToggleInterest(cat.id)}
                >
                  <Text style={[styles.chipText, active && { color: cat.color }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.subLabel}>Content Intensity</Text>
          {INTENSITY_OPTIONS.map(opt => {
            const active = prefs.contentIntensity === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.radioRow, active && styles.radioRowActive]}
                onPress={() => updatePref({ contentIntensity: opt.id as ContentIntensity })}
              >
                <View style={[styles.radioCircle, active && { borderColor: COLORS.neonRed, backgroundColor: `${COLORS.neonRed}22` }]}>
                  {active && <View style={styles.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.radioLabel, active && { color: COLORS.white }]}>{opt.label}</Text>
                  <Text style={styles.radioDesc}>{opt.desc}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── AUTOPLAY & DATA ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>▶ AUTOPLAY & DATA</Text>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Autoplay Next Video</Text>
              <Text style={styles.toggleDesc}>Automatically play the next recommended video</Text>
            </View>
            <Switch
              value={prefs.autoplayEnabled}
              onValueChange={v => updatePref({ autoplayEnabled: v })}
              trackColor={{ false: COLORS.white10, true: `${COLORS.neonRed}66` }}
              thumbColor={prefs.autoplayEnabled ? COLORS.neonRed : COLORS.white60}
            />
          </View>

          <Text style={styles.subLabel}>Data Usage</Text>
          {[
            { id: 'wifi_only', label: '📶 Wi-Fi Only',    desc: 'Stream only on Wi-Fi' },
            { id: 'low',       label: '🔋 Low Data',      desc: 'Reduce quality on mobile data' },
            { id: 'high',      label: '⚡ High Quality',  desc: 'Full quality always' },
          ].map(opt => {
            const active = prefs.dataUsage === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.radioRow, active && styles.radioRowActive]}
                onPress={() => updatePref({ dataUsage: opt.id as any })}
              >
                <View style={[styles.radioCircle, active && { borderColor: COLORS.neonTeal, backgroundColor: `${COLORS.neonTeal}22` }]}>
                  {active && <View style={[styles.radioDot, { backgroundColor: COLORS.neonTeal }]} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.radioLabel, active && { color: COLORS.white }]}>{opt.label}</Text>
                  <Text style={styles.radioDesc}>{opt.desc}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── PUSH NOTIFICATIONS ───────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 PUSH NOTIFICATIONS</Text>
          <Text style={styles.sectionSubtitle}>
            When should we notify you about live streams and new content?
          </Text>

          {PUSH_TIMING_OPTIONS.map(opt => {
            const active = prefs.pushTiming === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.radioRow, active && styles.radioRowActive]}
                onPress={() => updatePref({ pushTiming: opt.id as PushTiming })}
              >
                <View style={[styles.radioCircle, active && { borderColor: COLORS.neonGold, backgroundColor: `${COLORS.neonGold}22` }]}>
                  {active && <View style={[styles.radioDot, { backgroundColor: COLORS.neonGold }]} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.radioLabel, active && { color: COLORS.white }]}>{opt.label}</Text>
                  <Text style={styles.radioDesc}>{opt.desc}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── DANGER ZONE ───────────────────────────────────────────────── */}
        <View style={[styles.section, { borderColor: '#ff174422' }]}>
          <Text style={[styles.sectionTitle, { color: COLORS.neonRed }]}>⚠️ DATA</Text>

          <TouchableOpacity style={styles.dangerBtn} onPress={handleResetStats}>
            <Text style={styles.dangerBtnText}>Reset Activity Stats</Text>
          </TouchableOpacity>
          <Text style={styles.dangerNote}>
            Clears all watch history, streaks, and engagement data. Cannot be undone.
          </Text>
        </View>

        {/* ── APP INFO ─────────────────────────────────────────────────── */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>4psychotic Mobile v1.0.0</Text>
          <Text style={styles.appCopyright}>© 2025 4psychotic. All rights reserved.</Text>
          <Text style={styles.appTagline}>🕉️ PSYCHEDELIC GAMING</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.white60,
    fontSize: 14,
  },

  // ── Section ─────────────────────────────────────────────────────────────
  section: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffffff0a',
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: COLORS.neonTeal,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.white60,
    marginTop: -8,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: COLORS.white60,
    textTransform: 'uppercase',
    marginTop: 4,
  },

  // ── Streak ──────────────────────────────────────────────────────────────
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  streakBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.dark,
  },
  streakNumber: {
    fontSize: 28,
    fontWeight: '900',
  },
  streakLabel: {
    fontSize: 9,
    color: COLORS.white60,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  streakFire: {
    fontSize: 14,
    position: 'absolute',
    top: -6,
    right: -4,
  },
  streakMeta: {
    flex: 1,
    gap: 4,
  },
  streakMotivation: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 20,
  },
  streakSubtext: {
    fontSize: 12,
    color: COLORS.white60,
  },

  // ── Daily Goal ──────────────────────────────────────────────────────────
  goalCard: {
    backgroundColor: COLORS.dark,
    borderRadius: 8,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#ffffff08',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  goalControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.darkLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffffff15',
  },
  goalBtnText: {
    fontSize: 18,
    color: COLORS.white,
    lineHeight: 20,
  },
  goalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.neonRed,
    minWidth: 40,
    textAlign: 'center',
  },
  goalProgress: {
    fontSize: 11,
    color: COLORS.white60,
  },

  // ── Progress Bar ─────────────────────────────────────────────────────────
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.white10,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // ── Stat Grid ────────────────────────────────────────────────────────────
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    width: '47%',
    backgroundColor: COLORS.dark,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ffffff08',
    gap: 2,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.white60,
    lineHeight: 13,
  },

  // ── Chips ────────────────────────────────────────────────────────────────
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffffff18',
    backgroundColor: 'transparent',
  },
  chipText: {
    fontSize: 12,
    color: COLORS.white60,
    fontWeight: '600',
  },

  // ── Radio Row ────────────────────────────────────────────────────────────
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: COLORS.dark,
  },
  radioRowActive: {
    borderColor: '#ffffff15',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ffffff30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.neonRed,
  },
  radioLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white60,
  },
  radioDesc: {
    fontSize: 11,
    color: COLORS.white40,
    marginTop: 1,
  },

  // ── Toggle Row ───────────────────────────────────────────────────────────
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  toggleDesc: {
    fontSize: 11,
    color: COLORS.white60,
    marginTop: 2,
  },

  // ── Danger ───────────────────────────────────────────────────────────────
  dangerBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${COLORS.neonRed}44`,
    alignItems: 'center',
  },
  dangerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.neonRed,
  },
  dangerNote: {
    fontSize: 11,
    color: COLORS.white40,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: -4,
  },

  // ── App Info ─────────────────────────────────────────────────────────────
  appInfo: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 4,
  },
  appVersion: {
    fontSize: 11,
    color: COLORS.white40,
    fontWeight: '600',
  },
  appCopyright: {
    fontSize: 11,
    color: COLORS.white40,
  },
  appTagline: {
    fontSize: 12,
    color: COLORS.neonRed,
    fontWeight: '700',
    marginTop: 4,
  },
});
