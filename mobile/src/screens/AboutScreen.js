import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../utils/theme';
import apiService from '../services/apiService';

export default function AboutScreen({ navigation }) {
  const [content, setContent] = useState({
    title: 'About Ride Club',
    description: ''
  });
  const [loading, setLoading] = useState(true);

  // Default content (fallback if API fails)
  const defaultContent = `Ride Club is a community-based ridesharing platform that connects drivers and passengers across Canada.
Our mission is to make travel more affordable, social, and eco-friendly by helping people share rides safely and conveniently.

With Ride Club, you can:

Find a Ride: Search and join trips offered by trusted drivers.

Offer a Ride: Post your own trip, set your conditions, and share travel costs.

Request a Ride: Create a custom request if no existing ride fits your schedule.

Stay Connected: Chat securely within the app, receive real-time notifications, and manage your bookings with ease.

Ride Club values trust, safety, and transparency. Drivers can verify their identity, passengers can view driver ratings, and both sides can choose the conditions that work best for them.`;

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      // In production, this would fetch from API
      // const response = await apiService.get('/app/about-content');
      
      // For now, use default content
      setContent({
        title: 'About Ride Club',
        description: defaultContent
      });
    } catch (error) {
      console.error('Failed to load about content:', error);
      // Use default content as fallback
      setContent({
        title: 'About Ride Club',
        description: defaultContent
      });
    } finally {
      setLoading(false);
    }
  };

  const formatContent = (text) => {
    return text.split('\n').map((line, index) => {
      if (!line.trim()) {
        return <View key={index} style={styles.spacer} />;
      }
      
      // Check if line is a feature item (starts with a feature name followed by colon)
      if (line.includes(':') && !line.startsWith('Our mission')) {
        const [feature, description] = line.split(':');
        return (
          <View key={index} style={styles.featureItem}>
            <Text style={styles.featureTitle}>{feature.trim()}:</Text>
            <Text style={styles.featureDescription}>{description.trim()}</Text>
          </View>
        );
      }
      
      // Regular paragraph
      return (
        <Text key={index} style={styles.paragraph}>
          {line.trim()}
        </Text>
      );
    });
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'How would you like to contact our support team?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Email Support', 
          onPress: () => {
            // In production, this would open email client
            Alert.alert('Email Support', 'Please email us at support@rideclub.ca');
          }
        },
        { 
          text: 'In-App Help', 
          onPress: () => {
            // Navigate to help section
            navigation.navigate('Help');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{content.title}</Text>
        </View>

        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>🚗</Text>
          </View>
          <Text style={styles.logoText}>Ride Club</Text>
          <Text style={styles.tagline}>Canadian Ridesharing Community</Text>
        </View>

        {/* Content */}
        <View style={styles.contentSection}>
          {loading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : (
            formatContent(content.description)
          )}
        </View>

        {/* Features Highlight */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>🌟 Why Choose Ride Club?</Text>
          
          <View style={styles.highlightItem}>
            <Text style={styles.highlightIcon}>🛡️</Text>
            <View style={styles.highlightContent}>
              <Text style={styles.highlightTitle}>Safe & Secure</Text>
              <Text style={styles.highlightDescription}>
                Identity verification, driver ratings, and secure in-app messaging
              </Text>
            </View>
          </View>

          <View style={styles.highlightItem}>
            <Text style={styles.highlightIcon}>🇨🇦</Text>
            <View style={styles.highlightContent}>
              <Text style={styles.highlightTitle}>Made for Canada</Text>
              <Text style={styles.highlightDescription}>
                Designed specifically for Canadian cities and travel patterns
              </Text>
            </View>
          </View>

          <View style={styles.highlightItem}>
            <Text style={styles.highlightIcon}>💚</Text>
            <View style={styles.highlightContent}>
              <Text style={styles.highlightTitle}>Eco-Friendly</Text>
              <Text style={styles.highlightDescription}>
                Reduce carbon footprint by sharing rides and splitting costs
              </Text>
            </View>
          </View>

          <View style={styles.highlightItem}>
            <Text style={styles.highlightIcon}>🤝</Text>
            <View style={styles.highlightContent}>
              <Text style={styles.highlightTitle}>Community-Driven</Text>
              <Text style={styles.highlightDescription}>
                Built by Canadians, for Canadians. Join our growing community
              </Text>
            </View>
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>📞 Need Help?</Text>
          <Text style={styles.contactDescription}>
            Our support team is here to help you with any questions or concerns.
          </Text>
          
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={handleContactSupport}
          >
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>Ride Club v1.0.0</Text>
          <Text style={styles.versionSubtext}>Made with ❤️ in Canada</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: spacing.md,
    padding: spacing.sm,
  },
  backButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textAlign: 'center',
    marginRight: spacing.xl,
  },
  logoSection: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.white,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoIcon: {
    fontSize: 40,
  },
  logoText: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  contentSection: {
    backgroundColor: colors.white,
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
  },
  paragraph: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: typography.fontSize.base * 1.5,
    marginBottom: spacing.md,
  },
  spacer: {
    height: spacing.md,
  },
  featureItem: {
    marginBottom: spacing.md,
  },
  featureTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  featureDescription: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: typography.fontSize.base * 1.4,
  },
  featuresSection: {
    backgroundColor: colors.white,
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  highlightIcon: {
    fontSize: 24,
    marginRight: spacing.md,
    marginTop: 2,
  },
  highlightContent: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  highlightDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  contactSection: {
    backgroundColor: colors.primary + '10',
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  contactDescription: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: typography.fontSize.base * 1.4,
  },
  contactButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  contactButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  versionSection: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  versionText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  versionSubtext: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});