import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Radio, Zap, Gamepad2, Star, Eye } from 'lucide-react-native';
import { trpc } from '../../lib/trpc';

const COLORS = {
  dark: '#0a0e1a',
  darkLight: '#0f1420',
  neonRed: '#ff1744',
  neonTeal: '#00e5ff',
  white: '#ffffff',
  white60: '#ffffff99',
  white40: '#ffffff66',
};

export default function HomeScreen() {
  const { data: liveStatus, isLoading: loading } = trpc.youtube.liveStatus.useQuery(
    undefined,
    {
      refetchInterval: 30000,
    }
  );

  const isLive = liveStatus?.isLive ?? false;
  const liveData = liveStatus?.isLive
    ? {
        title: liveStatus.title || 'PUBG Mobile Esports Live',
        viewerCount: liveStatus.viewerCount || 0,
      }
    : null;

  const services = [
    {
      icon: Radio,
      title: 'Live Streaming',
      subtitle: 'Gaming Live Streaming',
      color: COLORS.neonRed,
    },
    {
      icon: Zap,
      title: 'Esports Highlights',
      subtitle: 'Tournament Coverage',
      color: COLORS.neonTeal,
    },
    {
      icon: Gamepad2,
      title: 'Gaming Content',
      subtitle: 'Digital Creator',
      color: '#ff6b35',
    },
    {
      icon: Star,
      title: 'Community',
      subtitle: 'Esports Community',
      color: COLORS.neonTeal,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroContent}>
            {/* Live Status Badge */}
            {!loading && isLive && liveData && (
              <TouchableOpacity
                style={[styles.liveBadge, { borderColor: COLORS.neonRed }]}
                onPress={() => Linking.openURL('https://www.youtube.com/@sureshpokharel243/live')}
              >
                <View style={styles.livePulse}>
                  <View
                    style={[
                      styles.liveDot,
                      { backgroundColor: COLORS.neonRed },
                    ]}
                  />
                  <Text style={[styles.liveText, { color: COLORS.neonRed }]}>
                    LIVE NOW
                  </Text>
                </View>
                <Text style={styles.liveTitle}>{liveData.title}</Text>
                <View style={styles.viewerBadge}>
                  <Eye size={12} color={COLORS.white60} />
                  <Text style={styles.viewerCount}>
                    {liveData.viewerCount} watching
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Badge */}
            <View style={[styles.badge, { borderColor: COLORS.neonTeal }]}>
              <View style={[styles.badgeDot, { backgroundColor: COLORS.neonTeal }]} />
              <Text style={[styles.badgeText, { color: COLORS.neonTeal }]}>
                Live Streaming · Digital Creator · Bucharest
              </Text>
            </View>

            {/* Main Headline */}
            <Text style={styles.headline}>4PSYCHOTIC</Text>

            {/* Sub-headline */}
            <Text style={[styles.subheadline, { color: COLORS.neonRed }]}>
              PSYCHEDELIC GAMING
            </Text>
            <Text style={[styles.subheadline, { color: COLORS.neonTeal }]}>
              LIVE STREAMING
            </Text>

            {/* Description */}
            <Text style={styles.description}>
              Where psychedelic art meets competitive gaming. Esports highlights, PUBG Mobile tournaments,
              and raw digital creativity — streamed live from Bucharest to the world.
            </Text>

            {/* CTAs */}
            <View style={styles.ctaContainer}>
              <TouchableOpacity
                style={[styles.ctaPrimary, { backgroundColor: COLORS.neonRed }]}
                onPress={() => Linking.openURL('https://www.youtube.com/@sureshpokharel243/live')}
              >
                <Play size={16} color={COLORS.white} fill={COLORS.white} />
                <Text style={styles.ctaText}>Watch Live</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.ctaSecondary, { borderColor: COLORS.neonTeal }]}
              >
                <Text style={[styles.ctaSecondaryText, { color: COLORS.neonTeal }]}>
                  Get In Touch
                </Text>
              </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
              {[
                { value: '1.7K', label: 'Followers' },
                { value: 'PUBG', label: 'Mobile Esports' },
                { value: 'LIVE', label: 'Streaming' },
              ].map((stat) => (
                <View key={stat.label} style={styles.stat}>
                  <Text style={[styles.statValue, { color: COLORS.neonRed }]}>
                    {stat.value}
                  </Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Services Section */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Featured Content</Text>
          <View style={styles.servicesGrid}>
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <View key={index} style={styles.serviceCard}>
                  <View
                    style={[
                      styles.serviceIcon,
                      { borderColor: service.color, backgroundColor: `${service.color}20` },
                    ]}
                  >
                    <IconComponent size={24} color={service.color} strokeWidth={2} />
                  </View>
                  <Text
                    style={[styles.serviceSubtitle, { color: service.color }]}
                  >
                    {service.subtitle}
                  </Text>
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* About Section */}
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>About 4psychotic</Text>
          <Text style={styles.aboutText}>
            4psychotic is a digital creator and live streamer based in Bucharest, Romania — blending
            the raw intensity of competitive gaming with psychedelic visual artistry.
          </Text>
          <Text style={styles.aboutText}>
            Recognised as a top fan by PUBG MOBILE South Asia Esports, 4psychotic brings tournament-level
            gameplay and community-driven highlights to a growing audience.
          </Text>
          <Text style={styles.aboutText}>
            The infinity symbol at the heart of the brand represents the endless loop of gaming, creativity,
            and community — a psychedelic cycle that never stops.
          </Text>
        </View>
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
  hero: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  heroContent: {
    gap: 16,
  },
  liveBadge: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    gap: 8,
  },
  livePulse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  liveTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white60,
  },
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewerCount: {
    fontSize: 11,
    color: COLORS.white60,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headline: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -1,
  },
  subheadline: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 1,
  },
  description: {
    fontSize: 14,
    color: COLORS.white60,
    lineHeight: 20,
  },
  ctaContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 4,
  },
  ctaSecondary: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 4,
    borderWidth: 1,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: COLORS.white,
  },
  ctaSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ffffff08',
  },
  stat: {
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    color: COLORS.white40,
  },
  servicesSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#ffffff08',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  servicesGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceCard: {
    flex: 1,
    minWidth: 0,
    maxWidth: '50%',
    backgroundColor: COLORS.darkLight,
    borderWidth: 1,
    borderColor: '#ffffff10',
    padding: 12,
    borderRadius: 4,
    gap: 8,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  serviceSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.white,
  },
  aboutSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#ffffff08',
  },
  aboutText: {
    fontSize: 14,
    color: COLORS.white60,
    lineHeight: 20,
    marginBottom: 12,
  },
});
