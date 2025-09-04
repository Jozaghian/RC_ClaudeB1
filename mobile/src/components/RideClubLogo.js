import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../utils/theme';

const RideClubLogo = ({ size = 'medium', variant = 'full' }) => {
  const sizeStyles = {
    small: {
      container: { width: 60, height: 60 },
      textSize: 18,
      logoTextSize: 24,
      spacing: spacing.xs,
    },
    medium: {
      container: { width: 80, height: 80 },
      textSize: 22,
      logoTextSize: 32,
      spacing: spacing.sm,
    },
    large: {
      container: { width: 120, height: 120 },
      textSize: 28,
      logoTextSize: 48,
      spacing: spacing.md,
    },
  };

  const currentSize = sizeStyles[size];

  if (variant === 'icon') {
    return (
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={[styles.iconContainer, currentSize.container]}
      >
        <Text style={[styles.iconEmoji, { fontSize: currentSize.logoTextSize }]}>
          🚗
        </Text>
      </LinearGradient>
    );
  }

  if (variant === 'text') {
    return (
      <View style={[styles.textContainer, { marginVertical: currentSize.spacing }]}>
        <Text style={[styles.brandText, { fontSize: currentSize.textSize }]}>
          <Text style={styles.brandRide}>Ride</Text>
          <Text style={styles.brandClub}>Club</Text>
        </Text>
        <Text style={[styles.tagline, { fontSize: currentSize.textSize * 0.4 }]}>
          Canadian Ride Sharing
        </Text>
      </View>
    );
  }

  // Full logo (default)
  return (
    <View style={[styles.fullContainer, { marginVertical: currentSize.spacing }]}>
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={[styles.iconContainer, currentSize.container]}
      >
        <Text style={[styles.iconEmoji, { fontSize: currentSize.logoTextSize }]}>
          🚗
        </Text>
      </LinearGradient>
      
      <View style={[styles.textContainer, { marginTop: currentSize.spacing }]}>
        <Text style={[styles.brandText, { fontSize: currentSize.textSize }]}>
          <Text style={styles.brandRide}>Ride</Text>
          <Text style={styles.brandClub}>Club</Text>
        </Text>
        <Text style={[styles.tagline, { fontSize: currentSize.textSize * 0.4 }]}>
          Canadian Ride Sharing
        </Text>
      </View>
    </View>
  );
};

// Animated logo for splash screens
export const AnimatedRideClubLogo = ({ size = 'large' }) => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(pulse);
    };
    pulse();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <RideClubLogo size={size} variant="full" />
    </Animated.View>
  );
};

// Logo with Canadian flag accent
export const CanadianRideClubLogo = ({ size = 'medium' }) => {
  return (
    <View style={styles.canadianContainer}>
      <RideClubLogo size={size} variant="full" />
      <View style={styles.flagAccent}>
        <Text style={styles.flagEmoji}>🇨🇦</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    elevation: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  iconEmoji: {
    color: colors.white,
  },
  textContainer: {
    alignItems: 'center',
  },
  brandText: {
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  brandRide: {
    color: colors.primary,
  },
  brandClub: {
    color: colors.secondary,
  },
  tagline: {
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.light,
    textAlign: 'center',
    marginTop: 2,
  },
  canadianContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  flagAccent: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    padding: 2,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  flagEmoji: {
    fontSize: 16,
  },
});

export default RideClubLogo;