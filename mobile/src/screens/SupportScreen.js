import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { colors, typography, spacing, borderRadius, componentStyles } from '../utils/theme';
import CustomButton from '../components/CustomButton';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';

export default function SupportScreen({ navigation }) {
  const [supportForm, setSupportForm] = useState({
    subject: '',
    message: '',
    priority: 'medium',
  });
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();

  const supportOptions = [
    {
      id: 'email',
      title: 'Email Support',
      icon: '📧',
      description: 'Send us an email and we\'ll respond within 24 hours',
      action: () => handleEmailSupport(),
    },
    {
      id: 'faq',
      title: 'Browse FAQ',
      icon: '❓',
      description: 'Find quick answers to common questions',
      action: () => navigation.navigate('Help'),
    },
    {
      id: 'report',
      title: 'Report Issue',
      icon: '🐛',
      description: 'Report a bug or technical problem',
      action: () => handleReportIssue(),
    },
    {
      id: 'safety',
      title: 'Safety Concern',
      icon: '🛡️',
      description: 'Report safety issues or inappropriate behavior',
      action: () => handleSafetyConcern(),
      priority: true,
    },
  ];

  const handleEmailSupport = () => {
    const subject = 'Ride Club Support Request';
    const body = `
Hi Ride Club Support Team,

User Information:
- Name: ${user?.firstName} ${user?.lastName}
- Email: ${user?.email}
- Phone: ${user?.phoneNumber || 'Not provided'}
- User ID: ${user?.id || 'Unknown'}

Issue Description:
[Please describe your issue here]

Device Information:
- Platform: Mobile App
- App Version: 1.0.0

Thank you for your assistance.

Best regards,
${user?.firstName || 'User'}
    `.trim();

    const emailUrl = `mailto:support@rideclub.ca?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.canOpenURL(emailUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(emailUrl);
        } else {
          Alert.alert(
            'Email Not Available',
            'Please send your support request to:\nsupport@rideclub.ca\n\nInclude your user information and a detailed description of your issue.',
            [{ text: 'Copy Email', onPress: () => copyToClipboard('support@rideclub.ca') }]
          );
        }
      })
      .catch(() => {
        Alert.alert(
          'Email Support',
          'support@rideclub.ca\n\nPlease include your user information and a detailed description of your issue.'
        );
      });
  };

  const handleReportIssue = () => {
    navigation.navigate('BugReport');
  };

  const handleSafetyConcern = () => {
    navigation.navigate('SafetyReport');
  };

  const openSupportForm = (category) => {
    setSupportForm(prev => ({
      ...prev,
      subject: category,
      priority: category.includes('Safety') ? 'high' : 'medium'
    }));
    // Scroll to form section or show form
    Alert.alert(
      'Support Form',
      'Please scroll down to fill out the support form, or use the Email Support option for immediate assistance.',
      [{ text: 'OK' }]
    );
  };

  const handleSubmitForm = async () => {
    if (!supportForm.subject.trim() || !supportForm.message.trim()) {
      Alert.alert('Missing Information', 'Please fill in both subject and message fields.');
      return;
    }

    setLoading(true);
    
    try {
      // Send to real API endpoint
      const response = await apiService.createSupportTicket({
        subject: supportForm.subject.trim(),
        message: supportForm.message.trim(),
        priority: supportForm.priority.toUpperCase()
      });
      
      console.log('Support ticket created:', response.data);
      
      // Clear form
      setSupportForm({
        subject: '',
        message: '',
        priority: 'medium'
      });
      
      Alert.alert(
        'Support Request Submitted!',
        'Thank you for contacting us! We\'ve received your support request and will respond within 24 hours.\n\nFor urgent matters, please email us directly at support@rideclub.ca',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Failed to submit support request:', error);
      Alert.alert(
        'Submission Failed',
        error.message || 'We couldn\'t submit your request right now. Please try emailing us directly at support@rideclub.ca'
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    // In production, use Clipboard API
    Alert.alert('Email Copied', `${text} has been copied to your clipboard.`);
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
          <Text style={styles.headerTitle}>Support</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>🚀 How can we help?</Text>
          
          {supportOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.supportOption,
                option.priority && styles.priorityOption
              ]}
              onPress={option.action}
            >
              <Text style={styles.optionIcon}>{option.icon}</Text>
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionTitle,
                  option.priority && styles.priorityTitle
                ]}>
                  {option.title}
                </Text>
                <Text style={styles.optionDescription}>
                  {option.description}
                </Text>
              </View>
              <Text style={styles.optionArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Information */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>📞 Contact Information</Text>
          
          <View style={styles.contactItem}>
            <Text style={styles.contactIcon}>📧</Text>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Email Support</Text>
              <Text style={styles.contactValue}>support@rideclub.ca</Text>
              <Text style={styles.contactDescription}>Response within 24 hours</Text>
            </View>
          </View>

          <View style={styles.contactItem}>
            <Text style={styles.contactIcon}>🛡️</Text>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Safety Concerns</Text>
              <Text style={styles.contactValue}>safety@rideclub.ca</Text>
              <Text style={styles.contactDescription}>Priority response for safety issues</Text>
            </View>
          </View>

          <View style={styles.contactItem}>
            <Text style={styles.contactIcon}>⏰</Text>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Support Hours</Text>
              <Text style={styles.contactValue}>Monday - Friday: 9 AM - 6 PM EST</Text>
              <Text style={styles.contactDescription}>Weekend support for urgent issues</Text>
            </View>
          </View>
        </View>

        {/* Support Form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>✍️ Send us a message</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Subject</Text>
            <TextInput
              style={styles.textInput}
              value={supportForm.subject}
              onChangeText={(text) => setSupportForm(prev => ({ ...prev, subject: text }))}
              placeholder="Brief description of your issue"
              placeholderTextColor={colors.textLight}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Message</Text>
            <TextInput
              style={[styles.textInput, styles.messageInput]}
              value={supportForm.message}
              onChangeText={(text) => setSupportForm(prev => ({ ...prev, message: text }))}
              placeholder="Please provide detailed information about your issue, including any error messages or steps to reproduce the problem."
              placeholderTextColor={colors.textLight}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Priority</Text>
            <View style={styles.priorityContainer}>
              {['low', 'medium', 'high'].map(priority => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityOption,
                    supportForm.priority === priority && styles.priorityOptionSelected
                  ]}
                  onPress={() => setSupportForm(prev => ({ ...prev, priority }))}
                >
                  <Text style={[
                    styles.priorityText,
                    supportForm.priority === priority && styles.priorityTextSelected
                  ]}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <CustomButton
            title="Submit Support Request"
            onPress={handleSubmitForm}
            loading={loading}
            disabled={loading || !supportForm.subject.trim() || !supportForm.message.trim()}
            fullWidth
            gradient
            style={styles.submitButton}
          />
        </View>

        {/* Additional Help */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Need immediate assistance?</Text>
          <Text style={styles.helpText}>
            For urgent safety concerns, contact local emergency services first (911), then report to us.
          </Text>
          <Text style={styles.helpText}>
            For technical issues, try restarting the app or checking our FAQ section first.
          </Text>
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
  quickActionsSection: {
    backgroundColor: colors.white,
    margin: spacing.md,
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
  supportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  priorityOption: {
    borderColor: colors.danger,
    backgroundColor: colors.danger + '05',
  },
  optionIcon: {
    fontSize: 24,
    marginRight: spacing.md,
    width: 32,
    textAlign: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  priorityTitle: {
    color: colors.danger,
  },
  optionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  optionArrow: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  contactSection: {
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
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  contactIcon: {
    fontSize: 20,
    marginRight: spacing.md,
    marginTop: 2,
    width: 24,
    textAlign: 'center',
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  contactValue: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  contactDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  formSection: {
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
  formGroup: {
    marginBottom: spacing.lg,
  },
  formLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  textInput: {
    ...componentStyles.input.default,
  },
  messageInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray300,
    alignItems: 'center',
  },
  priorityOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  priorityText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  priorityTextSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  submitButton: {
    height: 55,
  },
  helpSection: {
    backgroundColor: colors.warning + '10',
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  helpTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  helpText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: typography.fontSize.sm * 1.4,
    marginBottom: spacing.sm,
  },
});