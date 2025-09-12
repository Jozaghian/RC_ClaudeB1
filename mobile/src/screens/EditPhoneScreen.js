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
import { useAuth } from '../contexts/AuthContext';
import { useLoading } from '../contexts/LoadingContext';
import CustomButton from '../components/CustomButton';
import { colors, typography, spacing, borderRadius, componentStyles } from '../utils/theme';

export default function EditPhoneScreen({ navigation }) {
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const { setLoading: setGlobalLoading } = useLoading();

  const formatPhoneNumber = (phone) => {
    // Basic Canadian phone number formatting
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const validatePhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    // Canadian phone numbers: 10 digits or 11 digits starting with 1
    return (cleaned.length === 10) || (cleaned.length === 11 && cleaned.startsWith('1'));
  };

  const handleContinue = () => {
    if (!newPhoneNumber.trim()) {
      Alert.alert('Phone Number Required', 'Please enter your new phone number.');
      return;
    }

    if (!validatePhoneNumber(newPhoneNumber)) {
      Alert.alert(
        'Invalid Phone Number', 
        'Please enter a valid Canadian phone number (10 digits or 11 digits starting with 1).'
      );
      return;
    }

    const cleanedPhone = newPhoneNumber.replace(/\D/g, '');
    const formattedPhone = cleanedPhone.length === 11 ? `+${cleanedPhone}` : `+1${cleanedPhone}`;

    // Navigate to phone verification with the new phone number
    navigation.navigate('PhoneVerification', { 
      newPhoneNumber: formattedPhone,
      isEditing: true 
    });
  };

  const handlePhoneChange = (text) => {
    // Remove all non-digits first
    const cleaned = text.replace(/\D/g, '');
    
    // Limit to 11 digits max
    if (cleaned.length <= 11) {
      setNewPhoneNumber(cleaned);
    }
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
          <Text style={styles.headerTitle}>Edit Phone Number</Text>
        </View>

        {/* Current Phone Info */}
        <View style={styles.currentPhoneSection}>
          <Text style={styles.sectionIcon}>📱</Text>
          <Text style={styles.sectionTitle}>Current Phone Number</Text>
          <Text style={styles.currentPhone}>
            {user?.phoneNumber || 'No phone number set'}
          </Text>
          <View style={styles.verificationStatus}>
            <Text style={[
              styles.statusText,
              { color: user?.phoneVerified ? colors.success : colors.warning }
            ]}>
              {user?.phoneVerified ? '✅ Verified' : '⚠️ Not Verified'}
            </Text>
          </View>
        </View>

        {/* New Phone Form */}
        <View style={styles.formSection}>
          <Text style={styles.formTitle}>Enter New Phone Number</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>New Phone Number</Text>
            <TextInput
              style={styles.textInput}
              value={formatPhoneNumber(newPhoneNumber)}
              onChangeText={handlePhoneChange}
              placeholder="(555) 123-4567"
              placeholderTextColor={colors.textLight}
              keyboardType="phone-pad"
              maxLength={17} // For formatted display
            />
            <Text style={styles.inputHint}>
              Enter a Canadian phone number (10 or 11 digits)
            </Text>
          </View>

          <CustomButton
            title="Continue to Verification"
            onPress={handleContinue}
            disabled={!newPhoneNumber.trim() || !validatePhoneNumber(newPhoneNumber)}
            fullWidth
            gradient
            style={styles.continueButton}
          />
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>📋 What happens next?</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>1.</Text>
            <Text style={styles.infoText}>
              We'll send a 6-digit verification code to your new phone number
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>2.</Text>
            <Text style={styles.infoText}>
              Enter the code to verify your new phone number
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>3.</Text>
            <Text style={styles.infoText}>
              Your phone number will be updated and verified
            </Text>
          </View>
        </View>

        {/* Security Notice */}
        <View style={styles.securitySection}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityTitle}>Security Notice</Text>
          <Text style={styles.securityText}>
            Your phone number is used for account security and ride notifications. 
            Make sure you have access to the new number before changing it.
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
  currentPhoneSection: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  currentPhone: {
    fontSize: typography.fontSize.lg,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.sm,
  },
  verificationStatus: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray100,
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
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
  formTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  textInput: {
    ...componentStyles.input.default,
    fontSize: typography.fontSize.lg,
    textAlign: 'center',
  },
  inputHint: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  continueButton: {
    height: 55,
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
  securitySection: {
    backgroundColor: colors.warning + '10',
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  securityIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  securityTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.warning,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  securityText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * 1.4,
  },
});