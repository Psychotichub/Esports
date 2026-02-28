import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Facebook, Instagram, Youtube, Twitter, ExternalLink } from 'lucide-react-native';

const { width } = Dimensions.get('window');

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
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.neonRed} />
          </View>
        ) : (
          <>
            {/* Channel Info */}
            <View style={styles.channelInfo}>
              {/* Avatar placeholder */}
              <View style={[styles.avatar, { backgroundColor: COLORS.neonRed }]}>
                <Text style={styles.avatarText}>∞</Text>
              </View>

              <Text style={styles.channelName}>{stats?.title}</Text>
              <Text style={styles.channelDescription}>{stats?.description}</Text>

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
    marginBottom: 20,
    letterSpacing: 0.5,
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
});
