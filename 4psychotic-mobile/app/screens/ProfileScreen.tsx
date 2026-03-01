import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Facebook, Instagram, Youtube, Twitter, ExternalLink, Bell, BellOff, UserPlus, Check, LogOut, Clock, Heart, ListMusic, TrendingUp, Sparkles, Trophy } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import TopNavBar from '../../components/TopNavBar';
import ConnectedAccounts from '../../components/ConnectedAccounts';
import { getFollowStatus, toggleFollow, updateNotificationPreference, FollowStatus } from '../../lib/followSystem';
import { trackFollow } from '../../lib/analytics';
import { useAuth } from '../../lib/authContext';
import { getUserBehaviors, getEngagementStats } from '../../lib/engagementTracking';
import { getPlaylists } from '../../lib/playlists';
import { getWatchHistory } from '../../lib/watchHistory';
import { computeAchievements, countUnlocked, getHighestTier, TIER_COLORS, TIER_LABELS, Achievement } from '../../lib/achievements';
import { getActivityFeed, LiveStreamActivity, PLATFORM_COLORS, PLATFORM_LABELS, formatRelativeTime } from '../../lib/liveStreamActivity';
import { getFollowingUsers, getFollowers, formatCount } from '../../lib/userFollowSystem';

const COLORS = {
  dark: '#0a0e1a',
  darkLight: '#0f1420',
  neonRed: '#ff1744',
  neonTeal: '#00e5ff',
  white: '#ffffff',
  white60: '#ffffff99',
  white40: '#ffffff66',
};

export default function ProfileScreen() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [followStatus, setFollowStatus] = useState<FollowStatus>({ isFollowing: false, notificationEnabled: true });
  const [userStats, setUserStats] = useState({
    videosWatched: 0,
    watchTime: 0,
    playlistsCreated: 0,
    likesGiven: 0,
    currentStreak: 0,
    longestStreak: 0,
    watchTimeSeconds: 0,
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [activityFeed, setActivityFeed] = useState<LiveStreamActivity[]>([]);
  const [followCounts, setFollowCounts] = useState({ following: 0, followers: 0 });
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const loadUserStats = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const watchHistory = await getWatchHistory();
      const playlists = await getPlaylists();
      const behaviors = await getUserBehaviors();
      const engagementStats = await getEngagementStats();
      
      // Calculate watch time (estimate in minutes)
      const totalWatchTime = watchHistory.reduce((acc, item) => {
        // Estimate 2 minutes per video watched
        return acc + (item.progress > 0 ? 2 : 0);
      }, 0);
      
      const rawWatchTimeSeconds = engagementStats.totalWatchTime || 0;

      setUserStats({
        videosWatched: watchHistory.length,
        watchTime: totalWatchTime,
        playlistsCreated: playlists.length,
        likesGiven: behaviors.length,
        currentStreak: engagementStats.currentStreak || 0,
        longestStreak: engagementStats.longestStreak || 0,
        watchTimeSeconds: rawWatchTimeSeconds,
      });

      // Compute achievements from real activity
      const computed = computeAchievements({
        videosWatched: watchHistory.length,
        watchTimeSeconds: rawWatchTimeSeconds,
        currentStreak: engagementStats.currentStreak || 0,
        longestStreak: engagementStats.longestStreak || 0,
        playlistsCreated: playlists.length,
        likesGiven: behaviors.length,
      });
      setAchievements(computed);

      // Load live stream activity feed
      const feed = await getActivityFeed(20);
      setActivityFeed(feed);

      // Load follow counts
      const [fw, fr] = await Promise.all([getFollowingUsers(), getFollowers()]);
      setFollowCounts({ following: fw.length, followers: fr.length });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadFollowStatus();
    // Simulate fetching channel stats
    setTimeout(() => {
      setStats({
        title: '4psychotic',
        subscriberCount: '1,700+',
        viewCount: '50K+',
        videoCount: '120+',
        description: 'Psychedelic Gaming · PUBG Mobile Esports · Live Streaming',
      });
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserStats();
    }
  }, [isAuthenticated, loadUserStats]);

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSignupPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('signup');
  };

  const handleLoginPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('login');
  };

  const loadFollowStatus = async () => {
    const status = await getFollowStatus();
    setFollowStatus(status);
  };

  const handleFollowToggle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    const newStatus = await toggleFollow();
    setFollowStatus(newStatus);
    
    if (newStatus.isFollowing) {
      trackFollow();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleNotificationToggle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newEnabled = !followStatus.notificationEnabled;
    await updateNotificationPreference(newEnabled);
    setFollowStatus({ ...followStatus, notificationEnabled: newEnabled });
  };

  const socialLinks = [
    {
      icon: Facebook,
      label: 'Facebook',
      value: 'facebook.com/psy243',
      href: 'https://www.facebook.com/psy243',
      color: COLORS.neonRed,
    },
    {
      icon: Instagram,
      label: 'Instagram',
      value: '@4psychotic',
      href: 'https://www.instagram.com/4psychotic',
      color: COLORS.neonTeal,
    },
    {
      icon: Youtube,
      label: 'YouTube',
      value: '@sureshpokharel243',
      href: 'https://www.youtube.com/@sureshpokharel243',
      color: COLORS.neonRed,
    },
    {
      icon: Twitter,
      label: 'Twitter/X',
      value: '@4psychotic',
      href: 'https://twitter.com/4psychotic',
      color: COLORS.neonTeal,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TopNavBar title={isAuthenticated ? "My Profile" : "Profile"} />
      <ScrollView showsVerticalScrollIndicator={false}>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.neonRed} />
          </View>
        ) : isAuthenticated ? (
          /* USER PROFILE - Authenticated */
          <>
            {/* User Info */}
            <View style={styles.channelInfo}>
              {/* User Avatar */}
              <View style={[styles.avatar, { backgroundColor: COLORS.neonTeal }]}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>

              <Text style={styles.channelName}>{user?.name || 'User'}</Text>
              <Text style={styles.channelDescription}>{user?.email}</Text>

              {/* Logout Button */}
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <LogOut size={16} color={COLORS.neonRed} />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>

              {/* Social counts — followers / following */}
              <TouchableOpacity
                style={styles.socialCountsRow}
                onPress={() => navigation.navigate('people')}
                activeOpacity={0.8}
              >
                <View style={styles.socialCountItem}>
                  <Text style={styles.socialCountValue}>{formatCount(followCounts.following)}</Text>
                  <Text style={styles.socialCountLabel}>Following</Text>
                </View>
                <View style={styles.socialCountDivider} />
                <View style={styles.socialCountItem}>
                  <Text style={styles.socialCountValue}>{formatCount(followCounts.followers)}</Text>
                  <Text style={styles.socialCountLabel}>Followers</Text>
                </View>
                <View style={styles.socialCountCta}>
                  <Text style={styles.socialCountCtaText}>Community →</Text>
                </View>
              </TouchableOpacity>

              {/* User Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Clock size={20} color={COLORS.neonTeal} />
                  <Text style={[styles.statValue, { color: COLORS.neonTeal }]}>
                    {userStats.videosWatched}
                  </Text>
                  <Text style={styles.statLabel}>Videos Watched</Text>
                </View>
                <View style={styles.statBox}>
                  <TrendingUp size={20} color={COLORS.neonRed} />
                  <Text style={[styles.statValue, { color: COLORS.neonRed }]}>
                    {Math.floor(userStats.watchTime / 60)}h
                  </Text>
                  <Text style={styles.statLabel}>Watch Time</Text>
                </View>
                <View style={styles.statBox}>
                  <ListMusic size={20} color={COLORS.neonTeal} />
                  <Text style={[styles.statValue, { color: COLORS.neonTeal }]}>
                    {userStats.playlistsCreated}
                  </Text>
                  <Text style={styles.statLabel}>Playlists</Text>
                </View>
              </View>

              {/* Streak Info */}
              {userStats.currentStreak > 0 && (
                <View style={styles.streakContainer}>
                  <Sparkles size={20} color={COLORS.neonRed} />
                  <View style={styles.streakInfo}>
                    <Text style={styles.streakText}>
                      🔥 {userStats.currentStreak} day streak
                    </Text>
                    <Text style={styles.streakSubtext}>
                      Best: {userStats.longestStreak} days
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* My Activity Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>My Activity</Text>

              {/* Quick stats row */}
              <View style={styles.activityQuickRow}>
                {[
                  { icon: <Heart size={14} color={COLORS.neonRed} />, label: 'Liked', value: String(userStats.likesGiven) },
                  { icon: <ListMusic size={14} color={COLORS.neonTeal} />, label: 'Playlists', value: String(userStats.playlistsCreated) },
                  { icon: <Clock size={14} color={COLORS.neonTeal} />, label: 'Watched', value: String(userStats.videosWatched) },
                ].map(item => (
                  <View key={item.label} style={styles.activityQuickCard}>
                    {item.icon}
                    <Text style={styles.activityQuickValue}>{item.value}</Text>
                    <Text style={styles.activityQuickLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>

              {/* Live stream activity timeline */}
              {activityFeed.length > 0 ? (
                <>
                  <Text style={styles.activityTimelineTitle}>📡 Recently Watched Live Streams</Text>
                  {activityFeed.slice(0, 8).map((item, idx) => (
                    <View key={`${item.streamId}-${idx}`} style={styles.timelineItem}>
                      {/* Platform dot */}
                      <View style={[styles.timelineDot, { backgroundColor: PLATFORM_COLORS[item.platform] }]} />
                      {/* Vertical line (not for last item) */}
                      {idx < Math.min(activityFeed.length, 8) - 1 && (
                        <View style={styles.timelineLine} />
                      )}
                      <View style={styles.timelineContent}>
                        <View style={styles.timelineRow}>
                          <View style={[styles.timelinePlatformBadge, { backgroundColor: `${PLATFORM_COLORS[item.platform]}22`, borderColor: `${PLATFORM_COLORS[item.platform]}44` }]}>
                            <Text style={[styles.timelinePlatformText, { color: PLATFORM_COLORS[item.platform] }]}>
                              {PLATFORM_LABELS[item.platform]}
                            </Text>
                          </View>
                          <Text style={styles.timelineTime}>{formatRelativeTime(item.watchedAt)}</Text>
                        </View>
                        <Text style={styles.timelineTitle} numberOfLines={1}>{item.title}</Text>
                        {item.channelName ? (
                          <Text style={styles.timelineChannel}>{item.channelName}</Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </>
              ) : (
                <View style={styles.activityEmptyState}>
                  <Text style={styles.activityEmptyIcon}>📡</Text>
                  <Text style={styles.activityEmptyText}>
                    No live streams watched yet.{'\n'}Go to Live tab and join a stream!
                  </Text>
                </View>
              )}
            </View>

            {/* ── Achievements ── */}
            {achievements.length > 0 && (() => {
              const unlockedCount = countUnlocked(achievements);
              const highestTier   = getHighestTier(achievements);
              const displayed     = showAllAchievements
                ? achievements
                : achievements.filter(a => a.unlocked).slice(0, 6);

              return (
                <View style={styles.section}>
                  {/* Header */}
                  <View style={styles.achievementHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Trophy size={18} color={COLORS.neonTeal} />
                      <Text style={styles.sectionTitle}>Achievements</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      <Text style={styles.achievementCount}>
                        {unlockedCount}/{achievements.length} unlocked
                      </Text>
                      {highestTier && (
                        <Text style={[styles.achievementTierBadge, { color: TIER_COLORS[highestTier] }]}>
                          {TIER_LABELS[highestTier]}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Overall progress bar */}
                  <View style={styles.achievementOverallBar}>
                    <View
                      style={[
                        styles.achievementOverallFill,
                        {
                          width: `${(unlockedCount / achievements.length) * 100}%` as any,
                          backgroundColor: highestTier ? TIER_COLORS[highestTier] : COLORS.neonTeal,
                        },
                      ]}
                    />
                  </View>

                  {/* Achievement cards */}
                  <View style={styles.achievementGrid}>
                    {displayed.map(ach => (
                      <View
                        key={ach.id}
                        style={[
                          styles.achievementCard,
                          ach.unlocked && { borderColor: `${TIER_COLORS[ach.tier]}55`, backgroundColor: `${TIER_COLORS[ach.tier]}10` },
                          !ach.unlocked && styles.achievementCardLocked,
                        ]}
                      >
                        {/* Icon + lock overlay */}
                        <View style={styles.achievementIconWrap}>
                          <Text style={[styles.achievementIcon, !ach.unlocked && { opacity: 0.3 }]}>
                            {ach.icon}
                          </Text>
                          {!ach.unlocked && (
                            <Text style={styles.achievementLock}>🔒</Text>
                          )}
                        </View>

                        <Text
                          style={[
                            styles.achievementTitle,
                            ach.unlocked && { color: TIER_COLORS[ach.tier] },
                          ]}
                          numberOfLines={1}
                        >
                          {ach.title}
                        </Text>
                        <Text style={styles.achievementDesc} numberOfLines={2}>
                          {ach.description}
                        </Text>

                        {/* Progress bar */}
                        <View style={styles.achievementBar}>
                          <View
                            style={[
                              styles.achievementBarFill,
                              {
                                width: `${ach.progress}%` as any,
                                backgroundColor: ach.unlocked
                                  ? TIER_COLORS[ach.tier]
                                  : '#ffffff30',
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.achievementProgress}>{ach.progressLabel}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Show all / collapse */}
                  <TouchableOpacity
                    style={styles.achievementToggle}
                    onPress={() => {
                      setShowAllAchievements(p => !p);
                      Haptics.selectionAsync();
                    }}
                  >
                    <Text style={styles.achievementToggleText}>
                      {showAllAchievements
                        ? '▲ Show Less'
                        : `▼ Show All ${achievements.length} Achievements`}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })()}

            {/* ── Connected Social Accounts ── */}
            <ConnectedAccounts />
          </>
        ) : (
          /* CHANNEL PROFILE - Guest User */
          <>
            {/* Sign Up CTA Banner */}
            <View style={styles.signupBanner}>
              <View style={styles.signupBannerContent}>
                <Sparkles size={24} color={COLORS.neonTeal} />
                <View style={styles.signupBannerText}>
                  <Text style={styles.signupBannerTitle}>
                    Create Your Account
                  </Text>
                  <Text style={styles.signupBannerSubtitle}>
                    Unlock personalized features and track your gaming journey
                  </Text>
                </View>
              </View>
              <View style={styles.signupBannerButtons}>
                <TouchableOpacity
                  style={styles.signupBannerButton}
                  onPress={handleSignupPress}
                  activeOpacity={0.8}
                >
                  <Text style={styles.signupBannerButtonText}>Sign Up</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.loginBannerButton}
                  onPress={handleLoginPress}
                  activeOpacity={0.8}
                >
                  <Text style={styles.loginBannerButtonText}>Login</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Benefits Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Why Create an Account?</Text>
              <View style={styles.benefitsList}>
                {[
                  { icon: Heart, text: 'Like and comment on videos', color: COLORS.neonRed },
                  { icon: ListMusic, text: 'Create custom playlists', color: COLORS.neonTeal },
                  { icon: Clock, text: 'Track your watch history', color: COLORS.neonTeal },
                  { icon: TrendingUp, text: 'View your gaming stats', color: COLORS.neonRed },
                  { icon: Sparkles, text: 'Build your engagement streak', color: COLORS.neonTeal },
                ].map((benefit, index) => {
                  const IconComponent = benefit.icon;
                  return (
                    <View key={index} style={styles.benefitItem}>
                      <IconComponent size={18} color={benefit.color} />
                      <Text style={styles.benefitText}>{benefit.text}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Channel Info */}
            <View style={styles.channelInfo}>
              {/* Avatar placeholder */}
              <View style={[styles.avatar, { backgroundColor: COLORS.neonRed }]}>
                <Text style={styles.avatarText}>∞</Text>
              </View>

              <Text style={styles.channelName}>{stats?.title}</Text>
              <Text style={styles.channelDescription}>{stats?.description}</Text>

              {/* Follow Button */}
              <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, styles.followButtonContainer]}>
                <TouchableOpacity
                  style={[
                    styles.followButton,
                    followStatus.isFollowing && styles.followButtonActive,
                  ]}
                  onPress={handleFollowToggle}
                  activeOpacity={0.8}
                >
                  {followStatus.isFollowing ? (
                    <>
                      <Check size={18} color={COLORS.white} />
                      <Text style={styles.followButtonText}>Following</Text>
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} color={COLORS.white} />
                      <Text style={styles.followButtonText}>Follow</Text>
                    </>
                  )}
                </TouchableOpacity>
                
                {/* Notification Toggle (shown when following) */}
                {followStatus.isFollowing && (
                  <TouchableOpacity
                    style={styles.notificationToggle}
                    onPress={handleNotificationToggle}
                    activeOpacity={0.8}
                  >
                    {followStatus.notificationEnabled ? (
                      <>
                        <Bell size={16} color={COLORS.neonTeal} />
                        <Text style={styles.notificationToggleText}>Notifications ON</Text>
                      </>
                    ) : (
                      <>
                        <BellOff size={16} color={COLORS.white60} />
                        <Text style={[styles.notificationToggleText, { color: COLORS.white60 }]}>
                          Notifications OFF
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </Animated.View>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                {[
                  { value: stats?.subscriberCount, label: 'Subscribers' },
                  { value: stats?.viewCount, label: 'Views' },
                  { value: stats?.videoCount, label: 'Videos' },
                ].map((stat, index) => (
                  <View key={index} style={styles.statBox}>
                    <Text style={[styles.statValue, { color: COLORS.neonRed }]}>
                      {stat.value}
                    </Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* About Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.aboutText}>
                4psychotic is a digital creator and live streamer based in Bucharest, Romania — blending
                the raw intensity of competitive gaming with psychedelic visual artistry.
              </Text>
              <Text style={styles.aboutText}>
                Recognised as a top fan by PUBG MOBILE South Asia Esports, bringing tournament-level
                gameplay and community-driven highlights to a growing audience.
              </Text>
            </View>

            {/* Social Links Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Connect</Text>
              <View style={styles.socialLinks}>
                {socialLinks.map((social, index) => {
                  const IconComponent = social.icon;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.socialLink,
                        {
                          borderColor: `${social.color}40`,
                          backgroundColor: `${social.color}08`,
                        },
                      ]}
                      onPress={() => Linking.openURL(social.href)}
                    >
                      <View
                        style={[
                          styles.socialIconContainer,
                          { backgroundColor: `${social.color}20` },
                        ]}
                      >
                        <IconComponent size={20} color={social.color} strokeWidth={2} />
                      </View>

                      <View style={styles.socialInfo}>
                        <Text
                          style={[styles.socialLabel, { color: social.color }]}
                        >
                          {social.label}
                        </Text>
                        <Text style={styles.socialValue}>{social.value}</Text>
                      </View>

                      <ExternalLink
                        size={16}
                        color={social.color}
                        style={{ opacity: 0.6 }}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Featured Post */}
            <View style={styles.section}>
              <View
                style={[
                  styles.featuredPost,
                  {
                    borderColor: `${COLORS.neonTeal}40`,
                    backgroundColor: `${COLORS.neonTeal}08`,
                  },
                ]}
              >
                <View>
                  <Text
                    style={[
                      styles.featuredLabel,
                      { color: COLORS.neonTeal },
                    ]}
                  >
                    Latest Featured Post
                  </Text>
                  <Text style={styles.featuredTitle}>
                    Ultimate Royale Highlights
                  </Text>
                  <Text style={styles.featuredMeta}>
                    With PUBG Mobile Esports Pakistan — Jan 31, 2025
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.watchButton,
                    { backgroundColor: COLORS.neonTeal },
                  ]}
                  onPress={() =>
                    Linking.openURL('https://www.facebook.com/psy243')
                  }
                >
                  <Text style={styles.watchButtonText}>Watch</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.dark,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff08',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  channelInfo: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff08',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.neonRed,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '900',
    color: COLORS.white,
  },
  channelName: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 4,
  },
  channelDescription: {
    fontSize: 12,
    color: COLORS.white60,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  followButtonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: COLORS.neonTeal,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.neonTeal,
    minWidth: 140,
  },
  followButtonActive: {
    backgroundColor: 'transparent',
    borderColor: COLORS.neonTeal,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  notificationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.darkLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${COLORS.neonTeal}40`,
  },
  notificationToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.neonTeal,
  },
  // ── Social counts bar ───────────────────────────────────────────────────
  socialCountsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffffff0d',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 0,
  },
  socialCountItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  socialCountValue: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.white,
  },
  socialCountLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white60,
    letterSpacing: 0.3,
  },
  socialCountDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#ffffff12',
    marginHorizontal: 8,
  },
  socialCountCta: {
    paddingLeft: 8,
    paddingVertical: 4,
    borderLeftWidth: 1,
    borderLeftColor: '#ffffff12',
    marginLeft: 8,
  },
  socialCountCtaText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.neonTeal,
    letterSpacing: 0.3,
  },

  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.darkLight,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ffffff08',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.white40,
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff08',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 13,
    color: COLORS.white60,
    lineHeight: 19,
    marginBottom: 12,
  },
  socialLinks: {
    gap: 12,
  },
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 4,
    borderWidth: 1,
  },
  socialIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialInfo: {
    flex: 1,
  },
  socialLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  socialValue: {
    fontSize: 12,
    color: COLORS.white60,
  },
  featuredPost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 4,
    borderWidth: 1,
  },
  featuredLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  featuredTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 2,
  },
  featuredMeta: {
    fontSize: 11,
    color: COLORS.white60,
  },
  watchButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  watchButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.dark,
    letterSpacing: 0.5,
  },
  signupBanner: {
    margin: 16,
    padding: 20,
    backgroundColor: COLORS.darkLight,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: `${COLORS.neonTeal}40`,
    gap: 16,
  },
  signupBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  signupBannerText: {
    flex: 1,
    gap: 4,
  },
  signupBannerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
  },
  signupBannerSubtitle: {
    fontSize: 13,
    color: COLORS.white60,
    lineHeight: 18,
  },
  signupBannerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  signupBannerButton: {
    flex: 1,
    backgroundColor: COLORS.neonTeal,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupBannerButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
    letterSpacing: 0.5,
  },
  loginBannerButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.neonTeal,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBannerButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.neonTeal,
    letterSpacing: 0.5,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  benefitText: {
    fontSize: 14,
    color: COLORS.white60,
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: COLORS.darkLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${COLORS.neonRed}40`,
    marginTop: 8,
    marginBottom: 20,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.neonRed,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: COLORS.darkLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${COLORS.neonRed}40`,
    marginTop: 12,
    width: '100%',
  },
  streakInfo: {
    flex: 1,
    gap: 4,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  streakSubtext: {
    fontSize: 12,
    color: COLORS.white60,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.darkLight,
    borderRadius: 8,
  },
  activityText: {
    fontSize: 14,
    color: COLORS.white60,
    flex: 1,
  },

  // ── Activity quick stats row ────────────────────────────────────────────
  activityQuickRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  activityQuickCard: {
    flex: 1,
    backgroundColor: COLORS.darkLight,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: '#ffffff08',
  },
  activityQuickValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
  },
  activityQuickLabel: {
    fontSize: 10,
    color: COLORS.white60,
    letterSpacing: 0.3,
  },

  // ── Activity timeline ────────────────────────────────────────────────────
  activityTimelineTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white60,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 14,
    position: 'relative',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    flexShrink: 0,
  },
  timelineLine: {
    position: 'absolute',
    left: 4,
    top: 16,
    bottom: 0,
    width: 2,
    backgroundColor: '#ffffff10',
  },
  timelineContent: {
    flex: 1,
    gap: 3,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelinePlatformBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  timelinePlatformText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timelineTime: {
    fontSize: 10,
    color: COLORS.white40,
  },
  timelineTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  timelineChannel: {
    fontSize: 10,
    color: COLORS.white60,
  },

  // ── Activity empty state ─────────────────────────────────────────────────
  activityEmptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  activityEmptyIcon: {
    fontSize: 32,
  },
  activityEmptyText: {
    fontSize: 12,
    color: COLORS.white60,
    textAlign: 'center',
    lineHeight: 18,
  },

  // ── Achievements ─────────────────────────────────────────────────────────
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  achievementCount: {
    fontSize: 11,
    color: COLORS.white60,
    fontWeight: '600',
  },
  achievementTierBadge: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  achievementOverallBar: {
    height: 4,
    backgroundColor: '#ffffff15',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: -4,
  },
  achievementOverallFill: {
    height: '100%',
    borderRadius: 2,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  achievementCard: {
    width: '47%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffffff10',
    backgroundColor: '#ffffff06',
    padding: 10,
    gap: 4,
  },
  achievementCardLocked: {
    opacity: 0.5,
  },
  achievementIconWrap: {
    position: 'relative',
    width: 32,
    height: 32,
    marginBottom: 4,
  },
  achievementIcon: {
    fontSize: 26,
  },
  achievementLock: {
    fontSize: 12,
    position: 'absolute',
    bottom: -2,
    right: -4,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white60,
  },
  achievementDesc: {
    fontSize: 10,
    color: COLORS.white40,
    lineHeight: 13,
  },
  achievementBar: {
    height: 3,
    backgroundColor: '#ffffff15',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  achievementBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  achievementProgress: {
    fontSize: 9,
    color: COLORS.white40,
    marginTop: 1,
  },
  achievementToggle: {
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ffffff0a',
    marginTop: 4,
  },
  achievementToggleText: {
    fontSize: 11,
    color: COLORS.neonTeal,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
