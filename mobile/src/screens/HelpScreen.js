import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../utils/theme';
import apiService from '../services/apiService';

export default function HelpScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredFaqs, setFilteredFaqs] = useState([]);

  // Default FAQ content based on app features
  const defaultFaqs = [
    {
      id: 1,
      category: 'Getting Started',
      question: 'How do I create my first ride as a driver?',
      answer: 'After verifying your phone number, go to "My Rides" and tap "Create Ride". Fill in your departure and destination cities, date, time, available seats, and price per seat. You can also set preferences like no smoking or pets allowed.',
      priority: 1,
      tags: ['create ride', 'driver', 'first ride', 'getting started']
    },
    {
      id: 2,
      category: 'Booking Rides',
      question: 'How do I book a ride as a passenger?',
      answer: 'Search for rides on the "Find Rides" tab by entering your departure and destination cities and travel date. Browse available rides, check driver ratings, and tap "Book Ride" on the ride that fits your needs.',
      priority: 1,
      tags: ['book ride', 'passenger', 'find rides', 'search']
    },
    {
      id: 3,
      category: 'Payments & Credits',
      question: 'How does the credit system work?',
      answer: 'Ride Club uses a credit-based payment system. Purchase credit packages through the app, then use credits to book rides. Drivers receive credits when passengers book their rides. You can view your credit balance in your profile.',
      priority: 1,
      tags: ['credits', 'payment', 'money', 'balance']
    },
    {
      id: 4,
      category: 'Safety & Verification',
      question: 'How do I verify my phone number?',
      answer: 'Go to your Profile, tap "Verify Phone Number", enter your Canadian phone number, and we\'ll send you a 6-digit verification code via SMS. Enter the code to complete verification.',
      priority: 2,
      tags: ['phone verification', 'verify', 'safety', 'sms']
    },
    {
      id: 5,
      category: 'Ride Requests',
      question: 'What is a ride request and how does it work?',
      answer: 'If no existing rides match your schedule, create a ride request with your travel details. Drivers can see your request and offer to drive you. You\'ll get notifications when drivers make offers, and you can choose the best one.',
      priority: 2,
      tags: ['ride request', 'custom ride', 'driver offers']
    },
    {
      id: 6,
      category: 'Messaging & Communication',
      question: 'How do I contact my driver or passenger?',
      answer: 'Use the secure in-app messaging system. After booking a ride, you can message each other through the ride details page. This keeps your personal contact information private while allowing necessary communication.',
      priority: 2,
      tags: ['messaging', 'contact', 'communication', 'chat']
    },
    {
      id: 7,
      category: 'Vehicle Management',
      question: 'How do I add or update my vehicle information?',
      answer: 'Go to Profile > Vehicle Management to add your vehicle details including make, model, year, color, and license plate. This information helps passengers identify your car and builds trust.',
      priority: 2,
      tags: ['vehicle', 'car', 'driver', 'license plate']
    },
    {
      id: 8,
      category: 'Ratings & Reviews',
      question: 'How do ratings work in Ride Club?',
      answer: 'After each completed ride, both drivers and passengers can rate each other from 1-5 stars and leave optional comments. These ratings help build trust in the community and help others make informed decisions.',
      priority: 2,
      tags: ['ratings', 'reviews', 'feedback', 'stars']
    },
    {
      id: 9,
      category: 'Cancellations & Changes',
      question: 'Can I cancel or modify my ride booking?',
      answer: 'Yes, you can cancel bookings through the ride details page. Cancellation policies may vary by timing - early cancellations typically have no penalty, while last-minute cancellations may affect your credits or rating.',
      priority: 3,
      tags: ['cancel', 'modify', 'change', 'booking']
    },
    {
      id: 10,
      category: 'Account Settings',
      question: 'How do I change my password or email address?',
      answer: 'Go to Profile > Settings > Account Management. You can change your password using the "Change Password" option, or update your email through "Edit Email". Email changes require verification.',
      priority: 3,
      tags: ['password', 'email', 'account', 'settings']
    },
    {
      id: 11,
      category: 'Geographic Coverage',
      question: 'Which Canadian cities does Ride Club serve?',
      answer: 'Ride Club serves all major Canadian cities and towns. You can search for rides between any Canadian locations. Our city autocomplete helps you find the exact pickup and drop-off points.',
      priority: 3,
      tags: ['cities', 'canada', 'coverage', 'locations']
    },
    {
      id: 12,
      category: 'Troubleshooting',
      question: 'I\'m not receiving SMS verification codes. What should I do?',
      answer: 'Check that your phone has signal and can receive SMS messages. Make sure you entered the correct phone number. SMS codes may take a few minutes to arrive. If you still don\'t receive it, try the "Resend Code" option after the countdown expires.',
      priority: 3,
      tags: ['sms', 'verification', 'not receiving', 'troubleshooting']
    }
  ];

  useEffect(() => {
    loadFaqs();
  }, []);

  useEffect(() => {
    filterFaqs();
  }, [searchQuery, faqs]);

  const loadFaqs = async () => {
    try {
      // In production, this would fetch from API
      // const response = await apiService.get('/app/faqs');
      
      // For now, use default FAQs
      setFaqs(defaultFaqs);
    } catch (error) {
      console.error('Failed to load FAQs:', error);
      setFaqs(defaultFaqs);
    } finally {
      setLoading(false);
    }
  };

  const filterFaqs = () => {
    if (!searchQuery.trim()) {
      // Show all FAQs sorted by priority and category
      const sorted = [...faqs].sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.category.localeCompare(b.category);
      });
      setFilteredFaqs(sorted);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = faqs.filter(faq => {
      return (
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.category.toLowerCase().includes(query) ||
        faq.tags.some(tag => tag.toLowerCase().includes(query))
      );
    });

    // Sort search results by relevance
    const sortedFiltered = filtered.sort((a, b) => {
      const aQuestion = a.question.toLowerCase().includes(query);
      const bQuestion = b.question.toLowerCase().includes(query);
      
      if (aQuestion && !bQuestion) return -1;
      if (!aQuestion && bQuestion) return 1;
      
      return a.priority - b.priority;
    });

    setFilteredFaqs(sortedFiltered);
  };

  const toggleFaq = (faqId) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  const groupFaqsByCategory = (faqList) => {
    if (searchQuery.trim()) {
      return { 'Search Results': faqList };
    }

    return faqList.reduce((groups, faq) => {
      const category = faq.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(faq);
      return groups;
    }, {});
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Need more help? Our support team is ready to assist you.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Email Support', 
          onPress: () => {
            Alert.alert('Email Support', 'Please email us at support@rideclub.ca\n\nInclude details about your issue for faster assistance.');
          }
        }
      ]
    );
  };

  const categoryOrder = ['Getting Started', 'Booking Rides', 'Payments & Credits', 'Safety & Verification', 'Ride Requests', 'Messaging & Communication', 'Vehicle Management', 'Ratings & Reviews', 'Cancellations & Changes', 'Account Settings', 'Geographic Coverage', 'Troubleshooting'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & FAQ</Text>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search FAQ (e.g., 'how to book', 'credits', 'verify phone')"
            placeholderTextColor={colors.textLight}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Stats */}
        {searchQuery.trim() && (
          <View style={styles.searchStats}>
            <Text style={styles.searchStatsText}>
              {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''} for "{searchQuery}"
            </Text>
          </View>
        )}

        {/* FAQ Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading FAQ...</Text>
          </View>
        ) : (
          Object.entries(groupFaqsByCategory(filteredFaqs))
            .sort(([a], [b]) => {
              if (searchQuery.trim()) return 0;
              return categoryOrder.indexOf(a) - categoryOrder.indexOf(b);
            })
            .map(([category, categoryFaqs]) => (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{category}</Text>
                
                {categoryFaqs.map((faq) => (
                  <View key={faq.id} style={styles.faqItem}>
                    <TouchableOpacity
                      style={styles.faqQuestion}
                      onPress={() => toggleFaq(faq.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.faqQuestionText}>{faq.question}</Text>
                      <Text style={[
                        styles.faqArrow,
                        expandedFaq === faq.id && styles.faqArrowExpanded
                      ]}>
                        ▼
                      </Text>
                    </TouchableOpacity>
                    
                    {expandedFaq === faq.id && (
                      <View style={styles.faqAnswer}>
                        <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ))
        )}

        {/* No Results */}
        {!loading && filteredFaqs.length === 0 && searchQuery.trim() && (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsIcon}>🤔</Text>
            <Text style={styles.noResultsTitle}>No FAQ found</Text>
            <Text style={styles.noResultsText}>
              Try searching with different keywords or contact our support team for assistance.
            </Text>
            <TouchableOpacity 
              style={styles.contactSupportButton}
              onPress={handleContactSupport}
            >
              <Text style={styles.contactSupportButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Contact Support Section */}
        <View style={styles.supportSection}>
          <Text style={styles.supportTitle}>Still need help?</Text>
          <Text style={styles.supportDescription}>
            Can't find what you're looking for? Our support team is here to help with any questions or issues.
          </Text>
          
          <TouchableOpacity 
            style={styles.supportButton}
            onPress={handleContactSupport}
          >
            <Text style={styles.supportButtonText}>📧 Contact Support</Text>
          </TouchableOpacity>
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
  searchSection: {
    backgroundColor: colors.white,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
    color: colors.textSecondary,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  clearButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  clearButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  searchStats: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  searchStatsText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  categorySection: {
    backgroundColor: colors.white,
    margin: spacing.md,
    marginTop: 0,
    borderRadius: borderRadius.lg,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    padding: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingVertical: spacing.md,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginRight: spacing.md,
    lineHeight: typography.fontSize.base * 1.4,
  },
  faqArrow: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    transform: [{ rotate: '0deg' }],
  },
  faqArrowExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  faqAnswer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.gray50,
  },
  faqAnswerText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: typography.fontSize.base * 1.5,
  },
  noResultsContainer: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  noResultsIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  noResultsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  noResultsText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: typography.fontSize.base * 1.4,
  },
  contactSupportButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  contactSupportButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  supportSection: {
    backgroundColor: colors.primary + '10',
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  supportTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  supportDescription: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: typography.fontSize.base * 1.4,
  },
  supportButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  supportButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});