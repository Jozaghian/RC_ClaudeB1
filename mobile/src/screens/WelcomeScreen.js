import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Image,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CustomButton, { DriverButton, PassengerButton } from '../components/CustomButton';
import { colors, typography, spacing, borderRadius } from '../utils/theme';

const { height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryLight]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Features Section */}
          <View style={styles.featuresSection}>
            <FeatureItem 
              icon="🚗" 
              title="Browse & Book"
              description="Find rides posted by drivers"
              onPress={() => {
                console.log('Browse rides pressed');
                // Navigate directly to browse rides page (no login required)
                navigation.navigate('BrowseRides');
              }}
            />
            <FeatureItem 
              icon="🎯" 
              title="Request & Bid"
              description="Request custom rides, get competitive bids"
              onPress={() => {
                console.log('Request ride pressed');
                // Navigate directly to request ride page (no login required)  
                navigation.navigate('RequestRide');
              }}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonSection}>
            <DriverButton
              title="Join as Driver"
              onPress={() => {
                console.log('Driver button pressed');
                navigation.navigate('Register', { role: 'DRIVER' });
              }}
              fullWidth
              style={styles.roleButton}
            />
            
            <PassengerButton
              title="Join as Passenger"
              onPress={() => {
                console.log('Passenger button pressed');
                navigation.navigate('Register', { role: 'PASSENGER' });
              }}
              fullWidth
              style={styles.roleButton}
            />
            
            <CustomButton
              title="Already have an account? Sign In"
              variant="ghost"
              onPress={() => {
                console.log('Login button pressed');
                navigation.navigate('Login');
              }}
              textStyle={styles.signInText}
              style={styles.signInButton}
              fullWidth
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>🇨🇦 Coast to Coast</Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const FeatureItem = ({ icon, title, description, onPress }) => (
  <TouchableOpacity style={styles.featureItem} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <Text style={styles.featureTitle}>{title}</Text>
    <Text style={styles.featureDescription}>{description}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'flex-start',
    paddingTop: spacing.xl,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  logo: {
    width: 160,
    height: 160,
  },
  featuresSection: {
    marginBottom: spacing.lg,
  },
  featureItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  featureTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  featureDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * 1.3,
  },
  buttonSection: {
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
    marginTop: 'auto',
  },
  roleButton: {
    marginBottom: spacing.md,
    height: 55,
  },
  signInButton: {
    marginTop: spacing.sm,
    height: 55,
  },
  signInText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    textDecorationLine: 'underline',
    fontWeight: typography.fontWeight.medium,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  footerText: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
    opacity: 0.8,
    textAlign: 'center',
  },
});

