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
} from 'react-native';
import { colors, typography, spacing, borderRadius, componentStyles } from '../utils/theme';
import CustomButton from '../components/CustomButton';
import { useAuth } from '../contexts/AuthContext';
import { useLoading } from '../contexts/LoadingContext';
import apiService from '../services/apiService';

export default function SafetyReportScreen({ navigation }) {
  const [urgencyLevel, setUrgencyLevel] = useState('');
  const [safetyType, setSafetyType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const { user } = useAuth();
  const { setLoading: setGlobalLoading } = useLoading();

  const urgencyLevels = [
    {
      id: 'low',
      label: 'Low',
      description: 'Minor concern, no immediate danger',
      color: colors.success,
      icon: '🟢'
    },
    {
      id: 'medium',
      label: 'Medium',
      description: 'Concerning behavior, needs attention',
      color: colors.warning,
      icon: '🟡'
    },
    {
      id: 'high',
      label: 'High',
      description: 'Unsafe situation, requires immediate action',
      color: '#FF6B35',
      icon: '🔴'
    },
    {
      id: 'critical',
      label: 'Critical',
      description: 'Immediate danger, emergency response needed',
      color: '#DC143C',
      icon: '🚨'
    }
  ];

  const safetyTypes = [
    'Inappropriate Behavior',
    'Harassment',
    'Reckless Driving',
    'Vehicle Safety Issues',
    'Threatening Behavior',
    'Fraud/Scam',
    'Substance Use',
    'Route Deviation',
    'Privacy Violation',
    'Other Safety Concern'
  ];

  const handleSubmitReport = async () => {
    // Validation
    if (!urgencyLevel) {
      Alert.alert('Urgency Level Required', 'Please select an urgency level for this safety report.');
      return;
    }

    if (!safetyType) {
      Alert.alert('Safety Type Required', 'Please select the type of safety issue.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Title Required', 'Please provide a title for this safety report.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Description Required', 'Please provide a detailed description of the safety issue.');
      return;
    }

    // Show emergency notice for critical reports
    if (urgencyLevel === 'critical') {
      Alert.alert(
        '🚨 Critical Safety Issue',
        'For immediate emergencies, please contact 911 first, then submit this report.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'I Understand, Continue', onPress: submitToAdmin }
        ]
      );
      return;
    }

    submitToAdmin();
  };

  const submitToAdmin = async () => {
    setLoading(true);
    setGlobalLoading(true);

    try {
      const reportData = {
        urgencyLevel,
        safetyType,
        title: title.trim(),
        description: description.trim(),
        reporterInfo: {
          userId: user?.id,
          name: `${user?.firstName} ${user?.lastName}`,
          email: user?.email,
          phone: user?.phoneNumber
        },
        deviceInfo: {
          platform: 'mobile',
          timestamp: new Date().toISOString()
        }
      };

      // In production, this would submit to API
      // const response = await apiService.post('/safety/report', reportData);

      // Simulate API call
      setTimeout(() => {
        Alert.alert(
          '🛡️ Safety Report Submitted',
          urgencyLevel === 'high' || urgencyLevel === 'critical' 
            ? 'Your safety report has been submitted with high priority. Our safety team will investigate immediately and contact you within 1 hour.'
            : 'Your safety report has been submitted successfully. Our safety team will review it and contact you within 24 hours if additional information is needed.',
          [
            { 
              text: 'OK', 
              onPress: () => {
                // Clear form and go back
                setUrgencyLevel('');
                setSafetyType('');
                setTitle('');
                setDescription('');
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
      console.error('Failed to submit safety report:', error);
      Alert.alert(
        'Submission Failed',
        'We couldn\'t submit your safety report right now. For urgent safety concerns, please contact emergency services. You can also try again later or contact support directly.'
      );
    }
  };

  const getUrgencyStyle = (level) => {
    const urgency = urgencyLevels.find(u => u.id === level);
    return urgency ? { borderColor: urgency.color, backgroundColor: urgency.color + '10' } : {};
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
          <Text style={styles.headerTitle}>Report Safety Issue</Text>
        </View>

        {/* Emergency Notice */}
        <View style={styles.emergencyNotice}>
          <Text style={styles.emergencyIcon}>🚨</Text>
          <Text style={styles.emergencyTitle}>Emergency Notice</Text>
          <Text style={styles.emergencyText}>
            For immediate emergencies or if you feel unsafe, contact 911 first, then submit this report.
          </Text>
        </View>

        {/* Urgency Level Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Urgency Level *</Text>
          <Text style={styles.sectionDescription}>
            How urgent is this safety concern?
          </Text>
          
          {urgencyLevels.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.urgencyOption,
                urgencyLevel === level.id && styles.urgencyOptionSelected,
                urgencyLevel === level.id && getUrgencyStyle(level.id)
              ]}
              onPress={() => setUrgencyLevel(level.id)}
            >
              <Text style={styles.urgencyIcon}>{level.icon}</Text>
              <View style={styles.urgencyContent}>
                <Text style={[
                  styles.urgencyLabel,
                  urgencyLevel === level.id && styles.urgencyLabelSelected
                ]}>
                  {level.label}
                </Text>
                <Text style={styles.urgencyDescription}>
                  {level.description}
                </Text>
              </View>
              <View style={[
                styles.radioButton,
                urgencyLevel === level.id && styles.radioButtonSelected,
                urgencyLevel === level.id && { borderColor: level.color }
              ]}>
                {urgencyLevel === level.id && (
                  <View style={[styles.radioButtonInner, { backgroundColor: level.color }]} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Safety Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type of Safety Issue *</Text>
          <Text style={styles.sectionDescription}>
            What type of safety concern are you reporting?
          </Text>
          
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowTypeDropdown(!showTypeDropdown)}
          >
            <Text style={[styles.dropdownText, !safetyType && styles.placeholderText]}>
              {safetyType || 'Select safety issue type'}
            </Text>
            <Text style={[styles.dropdownArrow, showTypeDropdown && styles.dropdownArrowUp]}>
              ▼
            </Text>
          </TouchableOpacity>

          {showTypeDropdown && (
            <View style={styles.dropdownList}>
              {safetyTypes.map((type, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dropdownItem,
                    safetyType === type && styles.dropdownItemSelected
                  ]}
                  onPress={() => {
                    setSafetyType(type);
                    setShowTypeDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    safetyType === type && styles.dropdownItemTextSelected
                  ]}>
                    {type}
                  </Text>
                  {safetyType === type && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Title *</Text>
          <Text style={styles.sectionDescription}>
            Provide a brief, clear title for this safety issue
          </Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Driver was speeding and driving recklessly"
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
            Provide as much detail as possible about what happened, when, and where
          </Text>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Please describe the safety issue in detail. Include:&#10;• What happened exactly?&#10;• When did it occur?&#10;• Where did it happen?&#10;• Were there any witnesses?&#10;• Any other relevant information"
            placeholderTextColor={colors.textLight}
            multiline
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={styles.characterCount}>
            {description.length}/1000 characters
          </Text>
        </View>

        {/* Information Notice */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>📋 What happens next?</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>1.</Text>
            <Text style={styles.infoText}>
              Your report is submitted to our safety team immediately
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>2.</Text>
            <Text style={styles.infoText}>
              We investigate the report and may contact you for additional information
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>3.</Text>
            <Text style={styles.infoText}>
              Appropriate action is taken to ensure safety of all users
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>4.</Text>
            <Text style={styles.infoText}>
              You receive an update on the resolution when investigation is complete
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <CustomButton
          title="Submit Safety Report"
          onPress={handleSubmitReport}
          loading={loading}
          disabled={loading || !urgencyLevel || !safetyType || !title.trim() || !description.trim()}
          fullWidth
          variant="danger"
          style={styles.submitButton}
        />

        {/* Support Contact */}
        <View style={styles.supportSection}>
          <Text style={styles.supportTitle}>Need immediate help?</Text>
          <Text style={styles.supportText}>
            Emergency: Call 911
          </Text>
          <Text style={styles.supportText}>
            Safety concerns: safety@rideclub.ca
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
    backgroundColor: colors.danger,
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
  emergencyNotice: {
    backgroundColor: colors.danger + '15',
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger + '30',
  },
  emergencyIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  emergencyTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  emergencyText: {
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
  urgencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.gray200,
    marginBottom: spacing.md,
  },
  urgencyOptionSelected: {
    borderWidth: 2,
  },
  urgencyIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  urgencyContent: {
    flex: 1,
  },
  urgencyLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  urgencyLabelSelected: {
    color: colors.danger,
  },
  urgencyDescription: {
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
  titleInput: {
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
  infoSection: {
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
  infoTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  infoNumber: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginRight: spacing.sm,
    width: 20,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    flex: 1,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  submitButton: {
    margin: spacing.md,
    marginTop: 0,
    height: 55,
  },
  supportSection: {
    backgroundColor: colors.warning + '10',
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
    marginBottom: spacing.xs,
  },
});