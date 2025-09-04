import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useLoading } from '../../contexts/LoadingContext';
import CustomButton from '../../components/CustomButton';
import { colors, typography, spacing, borderRadius, componentStyles } from '../../utils/theme';
import { formatPhoneNumber } from '../../utils/helpers';
import apiService from '../../services/apiService';

export default function PhoneVerificationScreen({ route, navigation }) {
  const { isDriver = false } = route.params || {};
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  
  const inputRefs = useRef([]);
  const { user, refreshUser } = useAuth();
  const { setLoading: setGlobalLoading } = useLoading();

  useEffect(() => {
    // Pre-fill phone number if user has one
    if (user?.phoneNumber) {
      setPhoneNumber(user.phoneNumber);
    }
  }, [user]);

  useEffect(() => {
    let interval;
    if (resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCountdown]);

  const validatePhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return (cleaned.length === 10) || (cleaned.length === 11 && cleaned.startsWith('1'));
  };

  const formatPhoneInput = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const handlePhoneChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      setPhoneNumber(cleaned);
    }
  };

  const sendVerificationCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Phone Number Required', 'Please enter your phone number.');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert(
        'Invalid Phone Number', 
        'Please enter a valid Canadian phone number (10 digits or 11 digits starting with 1).'
      );
      return;
    }

    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    const formattedPhone = cleanedPhone.length === 11 ? `+${cleanedPhone}` : `+1${cleanedPhone}`;

    setIsResending(true);
    setGlobalLoading(true);

    try {
      const response = await apiService.post('/auth/send-verification', {
        phoneNumber: formattedPhone
      });

      if (response.success) {
        setCodeSent(true);
        setResendCountdown(60); // 60 second cooldown
        Alert.alert(
          'Verification Code Sent',
          `A verification code has been sent to ${formatPhoneNumber(formattedPhone)}`
        );
      }
    } catch (error) {
      console.error('Send verification error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to send verification code. Please try again.'
      );
    } finally {
      setIsResending(false);
      setGlobalLoading(false);
    }
  };

  const handleCodeChange = (text, index) => {
    // Only allow digits
    const digit = text.replace(/[^0-9]/g, '');
    
    if (digit.length > 1) return; // Prevent multiple digits

    const newCode = [...verificationCode];
    newCode[index] = digit;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are entered
    if (digit && index === 5 && newCode.every(d => d)) {
      handleVerifyCode(newCode.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace to go to previous input
    if (e.nativeEvent.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (code = verificationCode.join('')) => {
    if (code.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the complete 6-digit verification code.');
      return;
    }

    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    const formattedPhone = cleanedPhone.length === 11 ? `+${cleanedPhone}` : `+1${cleanedPhone}`;

    setLoading(true);
    setGlobalLoading(true);

    try {
      const response = await apiService.post('/auth/verify-phone', {
        phoneNumber: formattedPhone,
        code: code
      });

      if (response.success) {
        await refreshUser(); // Update user data
        
        if (isDriver) {
          Alert.alert(
            'Phone Verified! 🎉',
            'Your phone number has been verified successfully. Now let\'s create your first ride to get started as a driver.',
            [{ text: 'Create First Ride', onPress: () => navigation.navigate('CreateRide', { isFirstRide: true }) }]
          );
        } else {
          Alert.alert(
            'Phone Verified! 🎉',
            'Your phone number has been verified successfully. You can now use all features of Ride Club.',
            [{ text: 'Get Started', onPress: () => navigation.goBack() }]
          );
        }
      }
    } catch (error) {
      console.error('Verify phone error:', error);
      Alert.alert(
        'Verification Failed',
        error.response?.data?.message || 'Invalid verification code. Please try again.'
      );
      
      // Clear the code on error
      setVerificationCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  const handleResendCode = () => {
    if (resendCountdown > 0) return;
    
    Alert.alert(
      'Resend Code',
      'Are you sure you want to resend the verification code?',
      [
        { text: 'Cancel' },
        { text: 'Resend', onPress: sendVerificationCode }
      ]
    );
  };

  const handleSkipVerification = () => {
    Alert.alert(
      'Skip Verification',
      'You can skip phone verification for now, but some features will be limited until you verify your phone number. You can verify later from your profile.',
      [
        { text: 'Verify Now' },
        { 
          text: 'Skip', 
          style: 'destructive', 
          onPress: () => navigation.goBack() 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.icon}>📱</Text>
            <Text style={styles.title}>Verify Your Phone</Text>
            <Text style={styles.subtitle}>
              Enter your phone number to receive a verification code
            </Text>
          </View>

          {/* Phone Number Input */}
          <View style={styles.phoneContainer}>
            <Text style={styles.phoneLabel}>Phone Number</Text>
            <TextInput
              style={styles.phoneInput}
              value={formatPhoneInput(phoneNumber)}
              onChangeText={handlePhoneChange}
              placeholder="(555) 123-4567"
              placeholderTextColor={colors.textLight}
              keyboardType="phone-pad"
              maxLength={17}
              editable={!codeSent}
            />
            <Text style={styles.phoneHint}>
              Enter a Canadian phone number (10 or 11 digits)
            </Text>

            {!codeSent ? (
              <CustomButton
                title="Send Verification Code"
                onPress={sendVerificationCode}
                loading={isResending}
                disabled={!phoneNumber.trim() || !validatePhoneNumber(phoneNumber)}
                fullWidth
                gradient
                style={styles.sendButton}
              />
            ) : (
              <View style={styles.sentIndicator}>
                <Text style={styles.sentText}>
                  ✅ Code sent to {formatPhoneNumber(phoneNumber.replace(/\D/g, '').length === 11 ? `+${phoneNumber.replace(/\D/g, '')}` : `+1${phoneNumber.replace(/\D/g, '')}`)}
                </Text>
              </View>
            )}
          </View>

          {/* Verification Code Input - Only show after code is sent */}
          {codeSent && (
            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>Enter verification code</Text>
              
              <View style={styles.codeInputsContainer}>
                {verificationCode.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={ref => inputRefs.current[index] = ref}
                    style={[
                      styles.codeInput,
                      digit && styles.codeInputFilled
                    ]}
                    value={digit}
                    onChangeText={(text) => handleCodeChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    selectTextOnFocus
                  />
                ))}
              </View>

              <CustomButton
                title="Verify Phone Number"
                onPress={() => handleVerifyCode()}
                loading={loading}
                disabled={verificationCode.join('').length !== 6}
                fullWidth
                gradient
                style={styles.verifyButton}
              />

              {/* Resend Code */}
              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Didn't receive the code?</Text>
                
                <TouchableOpacity
                  style={[
                    styles.resendButton,
                    resendCountdown > 0 && styles.resendButtonDisabled
                  ]}
                  onPress={handleResendCode}
                  disabled={resendCountdown > 0}
                >
                  <Text style={[
                    styles.resendButtonText,
                    resendCountdown > 0 && styles.resendButtonTextDisabled
                  ]}>
                    {resendCountdown > 0 
                      ? `Resend in ${resendCountdown}s`
                      : 'Resend Code'
                    }
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <View style={styles.helpItem}>
              <Text style={styles.helpIcon}>💡</Text>
              <Text style={styles.helpText}>
                The verification code may take a few minutes to arrive
              </Text>
            </View>
            
            <View style={styles.helpItem}>
              <Text style={styles.helpIcon}>📞</Text>
              <Text style={styles.helpText}>
                Make sure your phone has signal and can receive SMS messages
              </Text>
            </View>
            
            <View style={styles.helpItem}>
              <Text style={styles.helpIcon}>🔢</Text>
              <Text style={styles.helpText}>
                Enter the 6-digit code exactly as received
              </Text>
            </View>
          </View>

          {/* Skip Option */}
          <View style={styles.skipContainer}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkipVerification}
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.xl,
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  phoneContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  phoneLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  phoneInput: {
    ...componentStyles.input.default,
    fontSize: typography.fontSize.lg,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  phoneHint: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  sendButton: {
    height: 55,
  },
  sentIndicator: {
    backgroundColor: colors.success + '10',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  sentText: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
  },
  codeContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  codeLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  codeInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  codeInput: {
    flex: 1,
    height: 56,
    borderWidth: 2,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  codeInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  verifyButton: {
    marginBottom: spacing.md,
    height: 55,
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  resendButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  resendButtonTextDisabled: {
    color: colors.textSecondary,
  },
  helpContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 1,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  helpIcon: {
    fontSize: 20,
    marginRight: spacing.md,
    marginTop: 2,
  },
  helpText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    flex: 1,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  skipContainer: {
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  skipButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});