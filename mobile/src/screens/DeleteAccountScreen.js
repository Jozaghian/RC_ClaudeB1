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
  Switch,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLoading } from '../contexts/LoadingContext';
import CustomButton from '../components/CustomButton';
import { colors, typography, spacing, borderRadius, componentStyles } from '../utils/theme';
import apiService from '../services/apiService';

export default function DeleteAccountScreen({ navigation }) {
  const [confirmationText, setConfirmationText] = useState('');
  const [reasonForDeletion, setReasonForDeletion] = useState('');
  const [dataExportRequested, setDataExportRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Info, 2: Confirmation, 3: Final
  
  const { user, logout } = useAuth();
  const { setLoading: setGlobalLoading } = useLoading();

  const deletionReasons = [
    'No longer need the service',
    'Privacy concerns',
    'Found a better alternative',
    'Too many notifications',
    'Difficult to use',
    'Moving to a different city',
    'Other'
  ];

  const dataCategories = [
    'Profile information (name, email, phone)',
    'Ride history and bookings',
    'Credit balance and transactions',
    'Vehicle information',
    'Messages and communications',
    'Location data',
    'App usage analytics',
    'Photos and documents'
  ];

  const handleDataExport = async () => {
    setGlobalLoading(true);
    
    try {
      const response = await apiService.post('/auth/request-data-export');
      
      if (response.success) {
        Alert.alert(
          'Data Export Requested',
          'Your data export has been requested. You will receive an email with your data within 48 hours as required by GDPR/PIPEDA regulations.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Data export error:', error);
      Alert.alert(
        'Export Failed',
        'Failed to request data export. Please try again or contact support.'
      );
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    setGlobalLoading(true);
    
    try {
      const response = await apiService.delete('/auth/account', {
        data: {
          confirmationText,
          reason: reasonForDeletion,
          dataExportRequested
        }
      });
      
      if (response.success) {
        Alert.alert(
          'Account Deleted Successfully',
          'Your account and all associated data have been permanently deleted from our systems. Thank you for using Ride Club.',
          [
            {
              text: 'OK',
              onPress: () => {
                logout();
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Delete account error:', error);
      Alert.alert(
        'Deletion Failed',
        error.response?.data?.message || 'Failed to delete account. Please try again or contact support.'
      );
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  const renderStepOne = () => (
    <>
      {/* Warning Section */}
      <View style={styles.warningSection}>
        <Text style={styles.warningIcon}>⚠️</Text>
        <Text style={styles.warningTitle}>Account Deletion Warning</Text>
        <Text style={styles.warningText}>
          This action is permanent and cannot be undone. All your data will be permanently deleted from our systems.
        </Text>
      </View>

      {/* What Gets Deleted */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🗑️ What will be deleted:</Text>
        {dataCategories.map((category, index) => (
          <View key={index} style={styles.dataItem}>
            <Text style={styles.dataIcon}>•</Text>
            <Text style={styles.dataText}>{category}</Text>
          </View>
        ))}
      </View>

      {/* Legal Compliance */}
      <View style={styles.complianceSection}>
        <Text style={styles.complianceIcon}>🛡️</Text>
        <Text style={styles.complianceTitle}>GDPR/PIPEDA Compliance</Text>
        <Text style={styles.complianceText}>
          This deletion process complies with the General Data Protection Regulation (GDPR) and Personal Information Protection and Electronic Documents Act (PIPEDA). 
          Your right to erasure ("right to be forgotten") is being honored.
        </Text>
      </View>

      {/* Data Export Option */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📥 Data Export (Optional)</Text>
        <Text style={styles.sectionDescription}>
          Before deleting your account, you can request a copy of all your data. This will be sent to your email within 48 hours.
        </Text>
        
        <View style={styles.exportOption}>
          <View style={styles.exportInfo}>
            <Text style={styles.exportTitle}>Request Data Export</Text>
            <Text style={styles.exportDescription}>
              Get a copy of all your data before deletion
            </Text>
          </View>
          <Switch
            value={dataExportRequested}
            onValueChange={setDataExportRequested}
            trackColor={{ false: colors.gray300, true: colors.primary + '40' }}
            thumbColor={dataExportRequested ? colors.primary : colors.gray400}
          />
        </View>

        {dataExportRequested && (
          <CustomButton
            title="Request Data Export Now"
            onPress={handleDataExport}
            variant="outline"
            style={styles.exportButton}
          />
        )}
      </View>

      <View style={styles.stepButtons}>
        <CustomButton
          title="Cancel"
          onPress={() => navigation.goBack()}
          variant="outline"
          style={styles.stepButton}
        />
        <CustomButton
          title="Continue to Delete Account"
          onPress={() => setStep(2)}
          variant="danger"
          style={styles.stepButton}
        />
      </View>
    </>
  );

  const renderStepTwo = () => (
    <>
      {/* Reason for Deletion */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Help us improve (Optional)</Text>
        <Text style={styles.sectionDescription}>
          Could you tell us why you're deleting your account? This helps us improve our service.
        </Text>
        
        {deletionReasons.map((reason, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.reasonOption,
              reasonForDeletion === reason && styles.reasonOptionSelected
            ]}
            onPress={() => setReasonForDeletion(reason)}
          >
            <View style={[
              styles.radioButton,
              reasonForDeletion === reason && styles.radioButtonSelected
            ]}>
              {reasonForDeletion === reason && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
            <Text style={[
              styles.reasonText,
              reasonForDeletion === reason && styles.reasonTextSelected
            ]}>
              {reason}
            </Text>
          </TouchableOpacity>
        ))}

        {reasonForDeletion === 'Other' && (
          <TextInput
            style={styles.otherReasonInput}
            placeholder="Please specify..."
            placeholderTextColor={colors.textLight}
            multiline
            textAlignVertical="top"
          />
        )}
      </View>

      {/* Account Info */}
      <View style={styles.accountSection}>
        <Text style={styles.accountTitle}>Account to be deleted:</Text>
        <Text style={styles.accountInfo}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.accountInfo}>{user?.email}</Text>
        <Text style={styles.accountInfo}>{user?.phoneNumber}</Text>
      </View>

      <View style={styles.stepButtons}>
        <CustomButton
          title="Back"
          onPress={() => setStep(1)}
          variant="outline"
          style={styles.stepButton}
        />
        <CustomButton
          title="Continue"
          onPress={() => setStep(3)}
          variant="danger"
          style={styles.stepButton}
        />
      </View>
    </>
  );

  const renderStepThree = () => (
    <>
      {/* Final Confirmation */}
      <View style={styles.finalSection}>
        <Text style={styles.finalIcon}>🚨</Text>
        <Text style={styles.finalTitle}>Final Confirmation</Text>
        <Text style={styles.finalText}>
          This is your last chance to cancel. Once you proceed, your account and ALL data will be permanently deleted and cannot be recovered.
        </Text>
      </View>

      {/* Confirmation Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Type "DELETE ACCOUNT" to confirm:</Text>
        <TextInput
          style={styles.confirmationInput}
          value={confirmationText}
          onChangeText={setConfirmationText}
          placeholder="DELETE ACCOUNT"
          placeholderTextColor={colors.textLight}
          autoCapitalize="characters"
        />
        
        {confirmationText === 'DELETE ACCOUNT' && (
          <View style={styles.confirmationValid}>
            <Text style={styles.confirmationValidText}>✅ Confirmation text is correct</Text>
          </View>
        )}
      </View>

      {/* Legal Notice */}
      <View style={styles.legalSection}>
        <Text style={styles.legalTitle}>⚖️ Legal Notice</Text>
        <Text style={styles.legalText}>
          By proceeding, you acknowledge that:
          {'\n'}• All your data will be permanently deleted
          {'\n'}• This action cannot be undone
          {'\n'}• You will lose access to all features and history
          {'\n'}• Any remaining credit balance will be forfeited
          {'\n'}• This complies with GDPR/PIPEDA right to erasure
        </Text>
      </View>

      <View style={styles.stepButtons}>
        <CustomButton
          title="Back"
          onPress={() => setStep(2)}
          variant="outline"
          style={styles.stepButton}
        />
        <CustomButton
          title="DELETE ACCOUNT PERMANENTLY"
          onPress={handleDeleteAccount}
          loading={loading}
          disabled={confirmationText !== 'DELETE ACCOUNT'}
          variant="danger"
          style={styles.stepButton}
        />
      </View>
      
      {/* Cancel Option */}
      <View style={styles.cancelContainer}>
        <CustomButton
          title="Cancel Delete Account"
          onPress={() => navigation.goBack()}
          variant="outline"
          fullWidth
          style={styles.cancelButton}
        />
      </View>
    </>
  );

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
          <Text style={styles.headerTitle}>Delete Account</Text>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${(step / 3) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>Step {step} of 3</Text>
        </View>

        {/* Step Content */}
        {step === 1 && renderStepOne()}
        {step === 2 && renderStepTwo()}
        {step === 3 && renderStepThree()}

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Need Help?</Text>
          <Text style={styles.helpText}>
            If you're having issues with the app, consider contacting our support team first. 
            We might be able to help resolve your concerns without deleting your account.
          </Text>
          <TouchableOpacity style={styles.helpButton}>
            <Text style={styles.helpButtonText}>Contact Support</Text>
          </TouchableOpacity>
          
          <View style={styles.cancelContainer}>
            <CustomButton
              title="Cancel Delete Account"
              onPress={() => navigation.goBack()}
              variant="outline"
              fullWidth
              style={styles.cancelButton}
            />
          </View>
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
  progressContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.danger,
    borderRadius: 2,
  },
  progressText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
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
    marginBottom: spacing.md,
  },
  sectionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  warningSection: {
    backgroundColor: colors.danger + '10',
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger + '30',
  },
  warningIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  warningTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.danger,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  warningText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * 1.4,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  dataIcon: {
    fontSize: typography.fontSize.base,
    color: colors.danger,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  dataText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    flex: 1,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  complianceSection: {
    backgroundColor: colors.primary + '10',
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  complianceIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  complianceTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  complianceText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * 1.4,
  },
  exportOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  exportInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  exportTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  exportDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  exportButton: {
    marginTop: spacing.md,
    height: 55,
  },
  continueButton: {
    margin: spacing.md,
    marginTop: 0,
    height: 55,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  reasonOptionSelected: {
    backgroundColor: colors.primary + '10',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray400,
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  reasonText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    flex: 1,
  },
  reasonTextSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  otherReasonInput: {
    ...componentStyles.input.default,
    height: 80,
    textAlignVertical: 'top',
    marginTop: spacing.md,
  },
  accountSection: {
    backgroundColor: colors.gray100,
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  accountTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  accountInfo: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  stepButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    margin: spacing.md,
    marginTop: 0,
  },
  stepButton: {
    flex: 1,
    height: 55,
  },
  finalSection: {
    backgroundColor: colors.danger + '15',
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.danger + '50',
  },
  finalIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  finalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.danger,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  finalText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * 1.4,
  },
  confirmationInput: {
    ...componentStyles.input.default,
    fontSize: typography.fontSize.lg,
    textAlign: 'center',
    borderColor: colors.danger,
    borderWidth: 2,
  },
  confirmationValid: {
    backgroundColor: colors.success + '10',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  confirmationValidText: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
  },
  legalSection: {
    backgroundColor: colors.warning + '10',
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  legalTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.warning,
    marginBottom: spacing.sm,
  },
  legalText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  helpSection: {
    backgroundColor: colors.white,
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    elevation: 1,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  helpTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  helpText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  helpButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  helpButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
    textDecorationLine: 'underline',
  },
  cancelContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  cancelButton: {
    height: 55,
    borderColor: colors.textSecondary,
  },
});