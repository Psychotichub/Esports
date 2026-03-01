import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle, TextStyle } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';

const COLORS = {
  neonRed: '#ff1744',
  neonTeal: '#00e5ff',
  white: '#ffffff',
  white60: '#ffffff99',
  white40: '#ffffff66',
  green: '#4caf50',
};

interface AnimatedStatProps {
  value: string;
  label: string;
  growth?: number; // Percentage growth (e.g., 12 for 12%)
  isLoading?: boolean;
  color?: string;
}

export default function AnimatedStat({
  value,
  label,
  growth,
  isLoading = false,
  color = COLORS.neonRed,
}: AnimatedStatProps) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const previousValue = useRef(value);

  useEffect(() => {
    // Animate when value changes
    if (previousValue.current !== value && !isLoading) {
      // Fade out
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0.5,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.95,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        // Fade in with new value
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
      
      previousValue.current = value;
    }
  }, [value, isLoading, fadeAnim, scaleAnim]);

  // Format growth indicator
  const renderGrowthIndicator = () => {
    if (growth === undefined || growth === 0) return null;
    
    const isPositive = growth > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const growthColor = isPositive ? COLORS.green : COLORS.neonRed;
    
    return (
      <View style={styles.growthContainer}>
        <Icon size={10} color={growthColor} />
        <Text style={[styles.growthText, { color: growthColor }]}>
          {Math.abs(growth)}%
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.valueContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {isLoading ? (
          <View style={[styles.skeleton, { backgroundColor: `${color}30` }]} />
        ) : (
          <>
            <Text style={[styles.value, { color }]}>{value}</Text>
            {renderGrowthIndicator()}
          </>
        )}
      </Animated.View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  valueContainer: ViewStyle;
  value: TextStyle;
  label: TextStyle;
  growthContainer: ViewStyle;
  growthText: TextStyle;
  skeleton: ViewStyle;
}>({
  container: {
    gap: 4,
    alignItems: 'center',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 24,
  },
  value: {
    fontSize: 20,
    fontWeight: '900',
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.5,
    color: COLORS.white40,
  },
  growthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  growthText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  skeleton: {
    width: 50,
    height: 20,
    borderRadius: 4,
  },
});
