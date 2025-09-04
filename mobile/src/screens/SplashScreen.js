import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography } from '../utils/theme';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.1)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;
  
  // Pulse animation for the background
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const startAnimation = () => {
      // Start background pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnimation, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnimation, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Epic logo entrance animation
      setTimeout(() => {
        Animated.parallel([
          // Fade in
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.exp),
            useNativeDriver: true,
          }),
          // Zoom and bounce effect
          Animated.spring(logoScale, {
            toValue: 2, // Double the size!
            tension: 20,
            friction: 7,
            useNativeDriver: true,
          }),
          // Subtle rotation for dynamic effect
          Animated.timing(logoRotation, {
            toValue: 1,
            duration: 1200,
            easing: Easing.out(Easing.back(1.7)),
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Finish after 1 second of showing the logo
          setTimeout(() => {
            onFinish();
          }, 1000);
        });
      }, 500);
    };

    startAnimation();
  }, []);

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: pulseAnimation }] }]}>
      <LinearGradient
        colors={['#0f0f23', '#1a1a3a', '#2d1b69', '#4e2a84']}
        style={styles.gradient}
      >
        {/* Animated background circles for depth */}
        <Animated.View 
          style={[
            styles.backgroundCircle, 
            styles.circle1,
            { 
              opacity: glowAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.1, 0.3]
              })
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.backgroundCircle, 
            styles.circle2,
            { 
              opacity: glowAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.2, 0.4]
              })
            }
          ]} 
        />

        {/* Main Logo with epic effects */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                { 
                  rotate: logoRotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  })
                }
              ],
            },
          ]}
        >
          {/* Glow effect behind logo */}
          <Animated.View 
            style={[
              styles.logoGlow,
              {
                opacity: glowAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.8]
                })
              }
            ]}
          />
          
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Enhanced floating particles */}
        <View style={styles.particles}>
          {[...Array(30)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.particle,
                {
                  left: Math.random() * width,
                  top: Math.random() * height,
                  backgroundColor: i % 3 === 0 ? '#00ff88' : i % 3 === 1 ? '#ff6b6b' : '#ffffff',
                  opacity: 0.7,
                },
              ]}
            />
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundCircle: {
    position: 'absolute',
    borderRadius: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle1: {
    width: 300,
    height: 300,
    top: height * 0.2,
    left: -100,
  },
  circle2: {
    width: 400,
    height: 400,
    bottom: height * 0.1,
    right: -150,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    zIndex: 2,
  },
  logoGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#00ff88',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 50,
    elevation: 10,
    zIndex: 1,
  },
  particles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5,
  },
});

export default SplashScreen;