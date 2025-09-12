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
  Platform,
} from 'react-native';
import { colors, typography, spacing, borderRadius, componentStyles } from '../utils/theme';
import CustomButton from '../components/CustomButton';
import { useAuth } from '../contexts/AuthContext';
import { useLoading } from '../contexts/LoadingContext';
import apiService from '../services/apiService';

export default function BugReportScreen({ navigation }) {
  const [issueType, setIssueType] = useState('');
  const [priority, setPriority] = useState('medium');
  const [affectedFeature, setAffectedFeature] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [loading, setLoading] = useState(false);
  const [showIssueTypeDropdown, setShowIssueTypeDropdown] = useState(false);
  const [showFeatureDropdown, setShowFeatureDropdown] = useState(false);

  const { user } = useAuth();
  const { setLoading: setGlobalLoading } = useLoading();

  const priorityLevels = [
    {
      id: 'low',
      label: 'Low',
      description: 'Minor issue, low impact on functionality',
      color: colors.success,
      icon: '🟢'
    },
    {
      id: 'medium',
      label: 'Medium',
      description: 'Moderate issue, affects some functionality',
      color: colors.warning,
      icon: '🟡'
    },
    {
      id: 'high',
      label: 'High',
      description: 'Major issue, significantly impacts usage',
      color: '#FF6B35',
      icon: '🔴'
    },
    {
      id: 'critical',
      label: 'Critical',
      description: 'App crash or complete feature failure',
      color: '#DC143C',
      icon: '🚨'
    }
  ];

  const issueTypes = [
    'App Crash',
    'Feature Not Working',
    'Performance Issue',
    'Login/Authentication Problem',
    'Payment Issue',
    'Search/Filter Problem',
    'Notification Issue',
    'Map/Location Problem',
    'UI/Display Issue',
    'Data Not Loading',
    'Sync Issue',
    'Other Technical Issue'
  ];

  const affectedFeatures = [
    'Login/Registration',
    'Profile Management',
    'Create Ride',
    'Find Rides',
    'Book Ride',
    'My Rides',
    'Ride Requests',
    'Messages/Chat',
    'Credit Management',
    'Payments/Stripe',
    'Vehicle Management',
    'Notifications',
    'Settings',
    'Phone Verification',
    'Search/Filters',
    'Maps/Directions',
    'Rating/Reviews',
    'Help/Support',
    'General App Navigation',
    'Other Feature'
  ];

  const handleSubmitReport = async () => {
    // Validation
    if (!issueType) {
      Alert.alert('Issue Type Required', 'Please select the type of technical issue.');
      return;
    }

    if (!affectedFeature) {
      Alert.alert('Affected Feature Required', 'Please select which feature is affected.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Title Required', 'Please provide a title for this bug report.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Description Required', 'Please provide a detailed description of the issue.');
      return;
    }

    if (!actualBehavior.trim()) {
      Alert.alert('Actual Behavior Required', 'Please describe what actually happened.');
      return;
    }

    submitToAdmin();
  };

  const submitToAdmin = async () => {
    setLoading(true);
    setGlobalLoading(true);

    try {
      const reportData = {
        issueType,
        priority,
        affectedFeature,
        title: title.trim(),
        description: description.trim(),
        stepsToReproduce: stepsToReproduce.trim(),
        expectedBehavior: expectedBehavior.trim(),
        actualBehavior: actualBehavior.trim(),
        reproducible: stepsToReproduce.trim().length > 0,
        reporterInfo: {
          userId: user?.id,
          name: `${user?.firstName} ${user?.lastName}`,
          email: user?.email,
          phone: user?.phoneNumber
        },
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version,
          appVersion: '1.0.0',
          timestamp: new Date().toISOString()
        }
      };

      // In production, this would submit to API
      // const response = await apiService.post('/bugs/report', reportData);

      // Simulate API call
      setTimeout(() => {
        Alert.alert(
          '🐛 Bug Report Submitted',
          priority === 'critical' || priority === 'high'
            ? 'Your bug report has been submitted with high priority. Our development team will investigate immediately and provide updates within 24 hours.'
            : 'Your bug report has been submitted successfully. Our development team will investigate and provide updates within 2-3 business days.',
          [
            { 
              text: 'OK', 
              onPress: () => {
                // Clear form and go back
                setIssueType('');
                setPriority('medium');
                setAffectedFeature('');
                setTitle('');
                setDescription('');
                setStepsToReproduce('');
                setExpectedBehavior('');
                setActualBehavior('');
                navigation.goBack();
              }
            }
          ]
        );
        setLoading(false);
        setGlobalLoading(false);
      }, 1500);

    } catch (error) {
      setLoading(false);
      setGlobalLoading(false);
      console.error('Failed to submit bug report:', error);
      Alert.alert(
        'Submission Failed',
        'We couldn\'t submit your bug report right now. Please try again later or contact support directly.'
      );
    }
  };

  const getPriorityStyle = (level) => {
    const priority = priorityLevels.find(p => p.id === level);
    return priority ? { borderColor: priority.color, backgroundColor: priority.color + '10' } : {};
  };

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
          <Text style={styles.headerTitle}>Report Issue</Text>
        </View>

        {/* Info Notice */}
        <View style={styles.infoNotice}>
          <Text style={styles.infoIcon}>🐛</Text>
          <Text style={styles.infoTitle}>Help Us Fix It</Text>
          <Text style={styles.infoText}>
            The more details you provide, the faster we can identify and fix the issue.
          </Text>
        </View>

        {/* Issue Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Issue Type *</Text>
          <Text style={styles.sectionDescription}>
            What type of technical issue are you experiencing?
          </Text>
          
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowIssueTypeDropdown(!showIssueTypeDropdown)}
          >
            <Text style={[styles.dropdownText, !issueType && styles.placeholderText]}>
              {issueType || 'Select issue type'}
            </Text>
            <Text style={[styles.dropdownArrow, showIssueTypeDropdown && styles.dropdownArrowUp]}>
              ▼
            </Text>
          </TouchableOpacity>

          {showIssueTypeDropdown && (
            <View style={styles.dropdownList}>
              {issueTypes.map((type, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dropdownItem,
                    issueType === type && styles.dropdownItemSelected
                  ]}
                  onPress={() => {
                    setIssueType(type);
                    setShowIssueTypeDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    issueType === type && styles.dropdownItemTextSelected
                  ]}>
                    {type}
                  </Text>
                  {issueType === type && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Affected Feature Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Affected Feature *</Text>
          <Text style={styles.sectionDescription}>
            Which part of the app is having the issue?
          </Text>
          
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowFeatureDropdown(!showFeatureDropdown)}
          >
            <Text style={[styles.dropdownText, !affectedFeature && styles.placeholderText]}>
              {affectedFeature || 'Select affected feature'}
            </Text>
            <Text style={[styles.dropdownArrow, showFeatureDropdown && styles.dropdownArrowUp]}>
              ▼
            </Text>
          </TouchableOpacity>

          {showFeatureDropdown && (
            <View style={styles.dropdownList}>
              {affectedFeatures.map((feature, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dropdownItem,
                    affectedFeature === feature && styles.dropdownItemSelected
                  ]}
                  onPress={() => {
                    setAffectedFeature(feature);
                    setShowFeatureDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    affectedFeature === feature && styles.dropdownItemTextSelected
                  ]}>
                    {feature}
                  </Text>
                  {affectedFeature === feature && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Priority Level Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority Level</Text>
          <Text style={styles.sectionDescription}>
            How severely does this issue affect your use of the app?
          </Text>
          
          {priorityLevels.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.priorityOption,
                priority === level.id && styles.priorityOptionSelected,
                priority === level.id && getPriorityStyle(level.id)
              ]}
              onPress={() => setPriority(level.id)}
            >
              <Text style={styles.priorityIcon}>{level.icon}</Text>
              <View style={styles.priorityContent}>
                <Text style={[
                  styles.priorityLabel,
                  priority === level.id && styles.priorityLabelSelected
                ]}>
                  {level.label}
                </Text>
                <Text style={styles.priorityDescription}>
                  {level.description}
                </Text>
              </View>
              <View style={[
                styles.radioButton,
                priority === level.id && styles.radioButtonSelected,
                priority === level.id && { borderColor: level.color }
              ]}>
                {priority === level.id && (
                  <View style={[styles.radioButtonInner, { backgroundColor: level.color }]} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Issue Title *</Text>
          <Text style={styles.sectionDescription}>
            Provide a brief, clear title describing the issue
          </Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., App crashes when creating a new ride"
            placeholderTextColor={colors.textLight}
            maxLength={100}
          />
          <Text style={styles.characterCount}>
            {title.length}/100 characters
          </Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detailed Description *</Text>
          <Text style={styles.sectionDescription}>
            Describe the issue in detail - what were you trying to do when it happened?
          </Text>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Please provide a detailed description of the issue including:&#10;• What you were trying to do&#10;• When the issue occurs&#10;• How often it happens&#10;• Any error messages you see"
            placeholderTextColor={colors.textLight}
            multiline
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={styles.characterCount}>
            {description.length}/1000 characters
          </Text>
        </View>

        {/* Steps to Reproduce */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Steps to Reproduce (Optional)</Text>
          <Text style={styles.sectionDescription}>
            Help us reproduce the issue by providing step-by-step instructions
          </Text>
          <TextInput
            style={styles.descriptionInput}
            value={stepsToReproduce}
            onChangeText={setStepsToReproduce}
            placeholder="Please provide step-by-step instructions:&#10;1. Go to...&#10;2. Tap on...&#10;3. Enter...&#10;4. The issue occurs when..."
            placeholderTextColor={colors.textLight}
            multiline
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.characterCount}>
            {stepsToReproduce.length}/500 characters
          </Text>
        </View>

        {/* Expected vs Actual Behavior */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expected Behavior (Optional)</Text>
          <Text style={styles.sectionDescription}>
            What did you expect to happen?
          </Text>
          <TextInput
            style={styles.textInput}
            value={expectedBehavior}
            onChangeText={setExpectedBehavior}
            placeholder="e.g., The ride should be created and I should see the ride details"
            placeholderTextColor={colors.textLight}
            maxLength={300}
          />
          <Text style={styles.characterCount}>
            {expectedBehavior.length}/300 characters
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actual Behavior *</Text>
          <Text style={styles.sectionDescription}>
            What actually happened instead?
          </Text>
          <TextInput
            style={styles.textInput}
            value={actualBehavior}
            onChangeText={setActualBehavior}
            placeholder="e.g., The app crashed and returned to the home screen"
            placeholderTextColor={colors.textLight}
            maxLength={300}
          />
          <Text style={styles.characterCount}>
            {actualBehavior.length}/300 characters
          </Text>
        </View>

        {/* Device Information */}
        <View style={styles.deviceSection}>
          <Text style={styles.deviceTitle}>📱 Device Information</Text>
          <Text style={styles.deviceInfo}>Platform: {Platform.OS === 'ios' ? 'iOS' : 'Android'}</Text>
          <Text style={styles.deviceInfo}>Version: {Platform.Version}</Text>
          <Text style={styles.deviceInfo}>App Version: 1.0.0</Text>
          <Text style={styles.deviceNote}>
            This information helps our developers identify device-specific issues
          </Text>
        </View>

        {/* Submit Button */}
        <CustomButton
          title="Submit Bug Report"
          onPress={handleSubmitReport}
          loading={loading}
          disabled={loading || !issueType || !affectedFeature || !title.trim() || !description.trim() || !actualBehavior.trim()}
          fullWidth
          gradient
          style={styles.submitButton}
        />

        {/* Support Contact */}
        <View style={styles.supportSection}>
          <Text style={styles.supportTitle}>Need immediate help?</Text>
          <Text style={styles.supportText}>
            For urgent issues: support@rideclub.ca
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
  infoNotice: {
    backgroundColor: colors.primary + '10',
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  infoIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  infoTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * 1.4,
  },
  section: {
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
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  dropdown: {
    ...componentStyles.input.default,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: spacing.md,
  },
  dropdownText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    flex: 1,
  },
  placeholderText: {
    color: colors.textLight,
  },
  dropdownArrow: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    transform: [{ rotate: '0deg' }],
  },
  dropdownArrowUp: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownList: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray300,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  dropdownItemSelected: {
    backgroundColor: colors.primary + '10',
  },
  dropdownItemText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  checkmark: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.gray200,
    marginBottom: spacing.md,
  },
  priorityOptionSelected: {
    borderWidth: 2,
  },
  priorityIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  priorityContent: {
    flex: 1,
  },
  priorityLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  priorityLabelSelected: {
    color: colors.primary,
  },
  priorityDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderWidth: 2,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  titleInput: {
    ...componentStyles.input.default,
    fontSize: typography.fontSize.base,
  },
  textInput: {
    ...componentStyles.input.default,
    fontSize: typography.fontSize.base,
  },
  descriptionInput: {
    ...componentStyles.input.default,
    height: 120,
    textAlignVertical: 'top',
    fontSize: typography.fontSize.base,
  },
  characterCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  deviceSection: {
    backgroundColor: colors.gray50,
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  deviceTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  deviceInfo: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  deviceNote: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  submitButton: {
    margin: spacing.md,
    marginTop: 0,
    height: 55,
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
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  supportText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    textAlign: 'center',
  },
});