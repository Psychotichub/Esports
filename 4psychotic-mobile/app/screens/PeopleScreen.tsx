/**
 * PeopleScreen.tsx
 * Discover, follow, and manage connections with other users.
 * Tabs: Discover | Following | Followers
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Animated,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  X,
  Users,
  UserCheck,
  Wifi,
  Radio,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import TopNavBar from '../../components/TopNavBar';
import FollowButton from '../../components/FollowButton';
import {
  AppUser,
  getSuggestedUsers,
  getFollowingUsers,
  getFollowers,
  formatCount,
  MOCK_USERS,
} from '../../lib/userFollowSystem';
import { PLATFORM_COLORS, PLATFORM_LABELS } from '../../lib/liveStreamActivity';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = {
  dark:      '#0a0e1a',
  darkLight: '#0f1420',
  card:      '#131929',
  neonRed:   '#ff1744',
  neonTeal:  '#00e5ff',
  white:     '#ffffff',
  white80:   '#ffffffcc',
  white60:   '#ffffff99',
  white40:   '#ffffff66',
  white10:   '#ffffff1a',
};

const TABS = ['Discover', 'Following', 'Followers'] as const;
type Tab = typeof TABS[number];

// ─── Avatar component ─────────────────────────────────────────────────────────

function UserAvatar({ user, size = 48 }: { user: AppUser; size?: number }) {
  return (
    <View
      style={[
        avatarStyles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: `${user.avatarColor}30`, borderColor: user.isLive ? user.avatarColor : '#ffffff15' },
      ]}
    >
      <Text style={[avatarStyles.initial, { fontSize: size * 0.38, color: user.avatarColor }]}>
        {user.name.charAt(0).toUpperCase()}
      </Text>
      {/* Live dot */}
      {user.isLive && (
        <View style={[avatarStyles.liveDot, { backgroundColor: '#ff1744', borderWidth: 1.5, borderColor: COLORS.dark }]} />
      )}
    </View>
  );
}
const avatarStyles = StyleSheet.create({
  circle:   { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, position: 'relative' },
  initial:  { fontWeight: '900' },
  liveDot:  { width: 10, height: 10, borderRadius: 5, position: 'absolute', bottom: 1, right: 1 },
});

// ─── UserRow card ─────────────────────────────────────────────────────────────

function UserRow({
  user,
  onFollowChange,
}: {
  user: AppUser;
  onFollowChange?: () => void;
}) {
  const platformColor = PLATFORM_COLORS[user.platform];

  return (
    <View style={rowStyles.row}>
      <UserAvatar user={user} size={50} />

      <View style={rowStyles.info}>
        <View style={rowStyles.nameRow}>
          <Text style={rowStyles.name}>{user.name}</Text>
          {user.isLive && (
            <View style={rowStyles.liveBadge}>
              <Radio size={8} color="#ffffff" />
              <Text style={rowStyles.liveBadgeText}>LIVE</Text>
            </View>
          )}
        </View>
        <Text style={rowStyles.username}>{user.username}</Text>
        <Text style={rowStyles.bio} numberOfLines={1}>{user.bio}</Text>

        <View style={rowStyles.metaRow}>
          {/* Platform badge */}
          <View style={[rowStyles.platformBadge, { backgroundColor: `${platformColor}20`, borderColor: `${platformColor}40` }]}>
            <Text style={[rowStyles.platformText, { color: platformColor }]}>
              {PLATFORM_LABELS[user.platform]}
            </Text>
          </View>
          <Text style={rowStyles.stats}>
            {formatCount(user.followerCount)} followers · {user.streamCount} streams
          </Text>
        </View>
      </View>

      <FollowButton
        userId={user.id}
        size="sm"
        showNotificationToggle
        onFollowChange={onFollowChange}
      />
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff08',
  },
  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#ff174490', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4,
  },
  liveBadgeText: { fontSize: 8, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  username: { fontSize: 11, color: COLORS.white60 },
  bio:      { fontSize: 11, color: COLORS.white40, marginTop: 1 },
  metaRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  platformBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  platformText:  { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  stats: { fontSize: 10, color: COLORS.white40 },
});

// ─── Live-now banner ──────────────────────────────────────────────────────────

function LiveNowBanner({ liveUsers }: { liveUsers: AppUser[] }) {
  if (liveUsers.length === 0) return null;
  return (
    <View style={bannerStyles.container}>
      <View style={bannerStyles.titleRow}>
        <Wifi size={13} color={COLORS.neonRed} />
        <Text style={bannerStyles.title}>LIVE NOW</Text>
        <Text style={bannerStyles.count}>{liveUsers.length} streaming</Text>
      </View>
      <View style={bannerStyles.avatarRow}>
        {liveUsers.slice(0, 6).map((u, i) => (
          <View key={u.id} style={[bannerStyles.avatarWrap, { marginLeft: i > 0 ? -8 : 0 }]}>
            <UserAvatar user={u} size={36} />
          </View>
        ))}
        {liveUsers.length > 6 && (
          <View style={[bannerStyles.moreCircle, { marginLeft: -8 }]}>
            <Text style={bannerStyles.moreText}>+{liveUsers.length - 6}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const bannerStyles = StyleSheet.create({
  container: {
    marginHorizontal: 16, marginVertical: 8,
    backgroundColor: `${COLORS.neonRed}10`,
    borderWidth: 1, borderColor: `${COLORS.neonRed}30`,
    borderRadius: 12, padding: 12, gap: 8,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title:    { fontSize: 10, fontWeight: '800', color: COLORS.neonRed, letterSpacing: 1.5, flex: 1 },
  count:    { fontSize: 10, color: COLORS.white60 },
  avatarRow:{ flexDirection: 'row', alignItems: 'center' },
  avatarWrap: {},
  moreCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.darkLight,
    borderWidth: 1.5, borderColor: '#ffffff20',
    alignItems: 'center', justifyContent: 'center',
  },
  moreText: { fontSize: 10, color: COLORS.white60, fontWeight: '700' },
});

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: Tab }) {
  const config = {
    Discover: { emoji: '🔍', title: 'Nobody left to discover!', sub: 'You\'re following everyone — nice.' },
    Following: { emoji: '👥', title: 'Not following anyone yet', sub: 'Go to Discover and follow streamers you like.' },
    Followers: { emoji: '🌟', title: 'No followers yet', sub: 'Share your profile and get more people following you.' },
  }[tab];
  return (
    <View style={emptyStyles.wrap}>
      <Text style={emptyStyles.emoji}>{config.emoji}</Text>
      <Text style={emptyStyles.title}>{config.title}</Text>
      <Text style={emptyStyles.sub}>{config.sub}</Text>
    </View>
  );
}
const emptyStyles = StyleSheet.create({
  wrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emoji: { fontSize: 48 },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.white, textAlign: 'center' },
  sub:   { fontSize: 13, color: COLORS.white60, textAlign: 'center', paddingHorizontal: 40, lineHeight: 18 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function PeopleScreen() {
  const [activeTab, setActiveTab]       = useState<Tab>('Discover');
  const [search, setSearch]             = useState('');
  const [refreshing, setRefreshing]     = useState(false);
  const [loading, setLoading]           = useState(true);

  const [suggested,  setSuggested]  = useState<AppUser[]>([]);
  const [following,  setFollowing]  = useState<AppUser[]>([]);
  const [followers,  setFollowers]  = useState<AppUser[]>([]);

  const tabAnim = useRef(new Animated.Value(0)).current;

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [s, f, fl] = await Promise.all([
      getSuggestedUsers(),
      getFollowingUsers(),
      getFollowers(),
    ]);
    setSuggested(s);
    setFollowing(f);
    setFollowers(fl);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadAll();
    setRefreshing(false);
  };

  const switchTab = (tab: Tab) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
    setSearch('');
    const idx = TABS.indexOf(tab);
    Animated.spring(tabAnim, {
      toValue: idx,
      useNativeDriver: false,
      speed: 20,
    }).start();
  };

  // Computed data for active tab
  const rawData: AppUser[] =
    activeTab === 'Discover'  ? suggested :
    activeTab === 'Following' ? following  : followers;

  const filteredData = search.trim()
    ? rawData.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.channelName.toLowerCase().includes(search.toLowerCase())
      )
    : rawData;

  const liveFollowing = following.filter(u => u.isLive);

  // Tab indicator width calculation
  const TAB_WIDTH_PCT = `${100 / TABS.length}%` as any;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TopNavBar title="Community" />

      {/* ── Tab bar ── */}
      <View style={styles.tabBar}>
        {TABS.map(tab => {
          const active = activeTab === tab;
          const count =
            tab === 'Discover'  ? suggested.length :
            tab === 'Following' ? following.length  : followers.length;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, active && styles.tabItemActive]}
              onPress={() => switchTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab}</Text>
              {count > 0 && (
                <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Live now banner (Following tab) ── */}
      {activeTab === 'Following' && <LiveNowBanner liveUsers={liveFollowing} />}

      {/* ── Stats bar (Discover tab) ── */}
      {activeTab === 'Discover' && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Users size={14} color={COLORS.neonTeal} />
            <Text style={styles.statText}>{formatCount(MOCK_USERS.length)} streamers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <UserCheck size={14} color={COLORS.neonRed} />
            <Text style={styles.statText}>{following.length} following</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Wifi size={14} color={COLORS.neonRed} />
            <Text style={styles.statText}>
              {MOCK_USERS.filter(u => u.isLive).length} live now
            </Text>
          </View>
        </View>
      )}

      {/* ── Search bar ── */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={14} color={COLORS.white60} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            placeholderTextColor={COLORS.white40}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={14} color={COLORS.white60} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── List ── */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.neonRed} />
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={u => u.id}
          renderItem={({ item }) => (
            <UserRow user={item} onFollowChange={loadAll} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.neonRed}
              colors={[COLORS.neonRed]}
            />
          }
          ListEmptyComponent={
            search.trim()
              ? (
                <View style={emptyStyles.wrap}>
                  <Text style={emptyStyles.emoji}>🔍</Text>
                  <Text style={emptyStyles.title}>No results for "{search}"</Text>
                </View>
              )
              : <EmptyState tab={activeTab} />
          }
          ListFooterComponent={
            filteredData.length > 0 ? (
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  {filteredData.length} {activeTab === 'Discover' ? 'suggestions' : activeTab === 'Following' ? 'following' : 'followers'}
                </Text>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff10',
    backgroundColor: COLORS.darkLight,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: COLORS.neonRed,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white60,
  },
  tabLabelActive: {
    color: COLORS.white,
    fontWeight: '800',
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ffffff15',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeActive: {
    backgroundColor: `${COLORS.neonRed}25`,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white60,
  },
  tabBadgeTextActive: {
    color: COLORS.neonRed,
  },

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff08',
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { fontSize: 12, color: COLORS.white60 },
  statDivider: { width: 1, height: 12, backgroundColor: '#ffffff15' },

  // Search
  searchRow: { paddingHorizontal: 16, paddingVertical: 8 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.darkLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ffffff10',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.white,
    padding: 0,
  },

  // Loading / footer
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingVertical: 20, alignItems: 'center' },
  footerText: { fontSize: 12, color: COLORS.white40 },
});
