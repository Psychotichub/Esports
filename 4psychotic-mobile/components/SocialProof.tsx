import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { Users, Flame, Heart, MessageCircle, Star } from 'lucide-react-native';

const COLORS = {
  dark: '#0a0e1a',
  darkLight: '#0f1420',
  neonRed: '#ff1744',
  neonTeal: '#00e5ff',
  white: '#ffffff',
  white60: '#ffffff99',
  white40: '#ffffff66',
};

interface SocialProofProps {
  subscriberCount?: number;
  isLive?: boolean;
  viewerCount?: number;
}

interface ActivityItem {
  id: string;
  type: 'like' | 'comment' | 'watch';
  user: string;
  action: string;
  time: string;
  icon: typeof Heart;
}

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  rating: number;
}

// Mock activity feed data
const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'like',
    user: 'Alex',
    action: 'liked a video',
    time: '2m ago',
    icon: Heart,
  },
  {
    id: '2',
    type: 'watch',
    user: 'Sarah',
    action: 'started watching',
    time: '5m ago',
    icon: Users,
  },
  {
    id: '3',
    type: 'comment',
    user: 'Mike',
    action: 'commented on',
    time: '8m ago',
    icon: MessageCircle,
  },
  {
    id: '4',
    type: 'like',
    user: 'Emma',
    action: 'liked a video',
    time: '12m ago',
    icon: Heart,
  },
];

// Mock testimonials
const mockTestimonials: Testimonial[] = [
  {
    id: '1',
    quote: 'Best PUBG Mobile content creator! The highlights are insane 🔥',
    author: 'GamingFan23',
    rating: 5,
  },
  {
    id: '2',
    quote: 'Love the psychedelic gaming vibes. Keep it up!',
    author: 'ArtGamer',
    rating: 5,
  },
  {
    id: '3',
    quote: 'The tournament coverage is top-notch. Highly recommend!',
    author: 'EsportsLover',
    rating: 5,
  },
];

export default function SocialProof({
  subscriberCount,
  isLive = false,
  viewerCount = 0,
}: SocialProofProps) {
  const [activityCount, setActivityCount] = useState(0);
  
  useEffect(() => {
    // Simulate real-time activity updates
    const interval = setInterval(() => {
      setActivityCount(prev => prev + Math.floor(Math.random() * 3));
    }, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, []);
  const [animatedCount, setAnimatedCount] = useState(0);
  const [activities] = useState<ActivityItem[]>(mockActivities);
  const [testimonials] = useState<Testimonial[]>(mockTestimonials);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animate subscriber count
  useEffect(() => {
    if (!subscriberCount) return;

    const target = subscriberCount;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    const stepDuration = duration / steps;

    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setAnimatedCount(target);
        clearInterval(timer);
      } else {
        setAnimatedCount(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [subscriberCount]);

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Join Followers */}
      {subscriberCount && (
        <View style={styles.followersCard}>
          <Users size={18} color={COLORS.neonTeal} />
          <View style={styles.followersContent}>
            <Text style={styles.followersLabel}>Join</Text>
            <Text style={styles.followersCount}>
              {formatNumber(animatedCount || subscriberCount)}+ followers
            </Text>
          </View>
        </View>
      )}

      {/* Live Viewers */}
      {isLive && viewerCount > 0 && (
        <View style={styles.viewersCard}>
          <Flame size={18} color={COLORS.neonRed} />
          <Text style={styles.viewersText}>
            {viewerCount} people watching now
          </Text>
        </View>
      )}

      {/* Recent Activity Feed */}
      <View style={styles.activitySection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {activityCount > 0 && (
            <View style={styles.activityBadge}>
              <Text style={styles.activityBadgeText}>+{activityCount} new</Text>
            </View>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activityList}
        >
          {activities.map((activity) => {
            const IconComponent = activity.icon;
            return (
              <View key={activity.id} style={styles.activityItem}>
                <IconComponent size={14} color={COLORS.neonTeal} />
                <Text style={styles.activityText}>
                  <Text style={styles.activityUser}>{activity.user}</Text>{' '}
                  {activity.action} {activity.time}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Testimonials */}
      <View style={styles.testimonialsSection}>
        <Text style={styles.sectionTitle}>What Fans Say</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.testimonialsList}
        >
          {testimonials.map((testimonial) => (
            <View key={testimonial.id} style={styles.testimonialCard}>
              <View style={styles.testimonialRating}>
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    color={COLORS.neonTeal}
                    fill={COLORS.neonTeal}
                  />
                ))}
              </View>
              <Text style={styles.testimonialQuote}>"{testimonial.quote}"</Text>
              <Text style={styles.testimonialAuthor}>— {testimonial.author}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginTop: 16,
  },
  followersCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: COLORS.darkLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${COLORS.neonTeal}30`,
  },
  followersContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  followersLabel: {
    fontSize: 13,
    color: COLORS.white60,
    fontWeight: '500',
  },
  followersCount: {
    fontSize: 15,
    color: COLORS.neonTeal,
    fontWeight: '700',
  },
  viewersCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: `${COLORS.neonRed}15`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${COLORS.neonRed}40`,
  },
  viewersText: {
    fontSize: 13,
    color: COLORS.white,
    fontWeight: '600',
  },
  activitySection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white60,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  activityList: {
    gap: 8,
    paddingRight: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.darkLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ffffff08',
  },
  activityText: {
    fontSize: 11,
    color: COLORS.white60,
  },
  activityUser: {
    fontWeight: '600',
    color: COLORS.neonTeal,
  },
  testimonialsSection: {
    gap: 8,
  },
  testimonialsList: {
    gap: 12,
    paddingRight: 16,
  },
  testimonialCard: {
    width: 200,
    padding: 12,
    backgroundColor: COLORS.darkLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${COLORS.neonTeal}20`,
    gap: 6,
  },
  testimonialRating: {
    flexDirection: 'row',
    gap: 2,
  },
  testimonialQuote: {
    fontSize: 12,
    color: COLORS.white,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  testimonialAuthor: {
    fontSize: 10,
    color: COLORS.neonTeal,
    fontWeight: '600',
    marginTop: 4,
  },
});
