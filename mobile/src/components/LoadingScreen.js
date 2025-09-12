import React from 'react';
import { View, StyleSheet, Text, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '../utils/theme';

const LoadingScreen = ({ message = 'Loading Ride Club...' }) => {
  const spinValue = new Animated.Value(0);

  React.useEffect(() => {
    const spin = () => {
      spinValue.setValue(0);
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(spin);
    };
    spin();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryLight]}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Ride Club Logo Animation */}
        <View style={styles.logoContainer}>
          <Animated.View
            style={[
              styles.outerRing,
              { transform: [{ rotate: spin }] }
            ]}
          >
            <View style={styles.innerRing}>
              <Text style={styles.logoText}>🚗</Text>
            </View>
          </Animated.View>
        </View>

        {/* Loading text */}
        <Text style={styles.loadingText}>{message}</Text>
        
        {/* Loading dots animation */}
        <View style={styles.dotsContainer}>
          <LoadingDot delay={0} />
          <LoadingDot delay={200} />
          <LoadingDot delay={400} />
        </View>

        {/* Tagline */}
        <Text style={styles.tagline}>Your Canadian Ride Sharing Platform</Text>
      </View>
    </LinearGradient>
  );
};

const LoadingDot = ({ delay }) => {
  const scaleValue = new Animated.Value(0.5);

  React.useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 0.5,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(animate);
    };
    
    const timer = setTimeout(animate, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Animated.View
      style={[
        styles.dot,
        { transform: [{ scale: scaleValue }] }
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: spacing.xl,
  },
  outerRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.white,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  logoText: {
    fontSize: 32,
  },
  loadingText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
    marginHorizontal: 4,
  },
  tagline: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.light,
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default LoadingScreen;