import React, { useState } from 'react';
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
import { isValidEmail, isValidPhoneNumber, formatPhoneNumber } from '../../utils/helpers';

export default function RegisterScreen({ route, navigation }) {
  const { role = 'PASSENGER' } = route.params || {};
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: role,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { setLoading: setGlobalLoading } = useLoading();

  const validateForm = () => {
    // Name validation
    if (!formData.firstName.trim()) {
      Alert.alert('Validation Error', 'Please enter your first name');
      return false;
    }

    if (!formData.lastName.trim()) {
      Alert.alert('Validation Error', 'Please enter your last name');
      return false;
    }

    if (formData.firstName.trim().length < 2) {
      Alert.alert('Validation Error', 'First name must be at least 2 characters long');
      return false;
    }

    if (formData.lastName.trim().length < 2) {
      Alert.alert('Validation Error', 'Last name must be at least 2 characters long');
      return false;
    }

    // Email validation
    if (!formData.email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email address');
      return false;
    }

    if (!isValidEmail(formData.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }

    // Phone validation
    if (!formData.phoneNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter your phone number');
      return false;
    }

    if (!isValidPhoneNumber(formData.phoneNumber)) {
      Alert.alert('Validation Error', 'Please enter a valid Canadian phone number');
      return false;
    }

    // Password validation
    if (!formData.password) {
      Alert.alert('Validation Error', 'Please enter a password');
      return false;
    }

    if (formData.password.length < 8) {
      Alert.alert('Validation Error', 'Password must be at least 8 characters long');
      return false;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      Alert.alert(
        'Validation Error',
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      );
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return false;
    }

    // Terms acceptance
    if (!acceptedTerms) {
      Alert.alert('Terms Required', 'Please accept the Terms of Service and Privacy Policy to continue');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setGlobalLoading(true);

    try {
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase().trim(),
        phoneNumber: formatPhoneNumber(formData.phoneNumber),
        password: formData.password,
        role: formData.role,
      };

      await register(userData);
      
      if (formData.role === 'DRIVER') {
        Alert.alert(
          'Driver Account Created! 🎉',
          'Your account has been created successfully. Please verify your phone number and complete your driver profile.',
          [{ text: 'Continue', onPress: () => navigation.navigate('PhoneVerification', { isDriver: true }) }]
        );
      } else {
        Alert.alert(
          'Account Created! 🎉',
          'Your account has been created successfully. Please verify your phone number to get started.',
          [{ text: 'Continue', onPress: () => navigation.navigate('PhoneVerification', { isDriver: false }) }]
        );
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(
        'Registration Failed',
        error.message || 'Failed to create account. Please try again.'
      );
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  const handlePhoneNumberChange = (text) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // Format as user types
    let formatted = cleaned;
    if (cleaned.length >= 6) {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    } else if (cleaned.length >= 3) {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    }
    
    setFormData({ ...formData, phoneNumber: formatted });
  };

  const handleTermsPress = () => {
    Alert.alert(
      'Terms of Service',
      'The full Terms of Service and Privacy Policy are available on our website. By creating an account, you agree to our terms and privacy practices.',
      [{ text: 'OK' }]
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
            <Text style={styles.logo}>{role === 'DRIVER' ? '🚗' : '🎒'}</Text>
            <Text style={styles.title}>
              {role === 'DRIVER' ? 'Join as Driver' : 'Join as Passenger'}
            </Text>
            <Text style={styles.subtitle}>
              {role === 'DRIVER' 
                ? 'Create your driver account and start earning by sharing rides across Canada'
                : 'Create your account and start booking rides across Canada'
              }
            </Text>
          </View>

          {/* Registration Form */}
          <View style={styles.formContainer}>
            {/* Name Fields */}
            <View style={styles.nameContainer}>
              <View style={styles.nameField}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.firstName}
                  onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                  placeholder="John"
                  placeholderTextColor={colors.textLight}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.nameField}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.lastName}
                  onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                  placeholder="Doe"
                  placeholderTextColor={colors.textLight}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.textInput}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="john.doe@example.com"
                placeholderTextColor={colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
            </View>

            {/* Phone Number */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                value={formData.phoneNumber}
                onChangeText={handlePhoneNumberChange}
                placeholder="123-456-7890"
                placeholderTextColor={colors.textLight}
                keyboardType="phone-pad"
                maxLength={12}
              />
              <Text style={styles.helpText}>
                Canadian phone number required for verification
              </Text>
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  placeholder="Enter a strong password"
                  placeholderTextColor={colors.textLight}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.passwordToggleText}>
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.helpText}>
                At least 8 characters with uppercase, lowercase, and numbers
              </Text>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.textLight}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Text style={styles.passwordToggleText}>
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setAcceptedTerms(!acceptedTerms)}
              >
                <View style={[
                  styles.checkboxBox,
                  acceptedTerms && styles.checkboxBoxChecked
                ]}>
                  {acceptedTerms && (
                    <Text style={styles.checkboxText}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
              
              <View style={styles.termsTextContainer}>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={styles.termsLink} onPress={handleTermsPress}>
                    Terms of Service
                  </Text>
                  {' '}and{' '}
                  <Text style={styles.termsLink} onPress={handleTermsPress}>
                    Privacy Policy
                  </Text>
                </Text>
              </View>
            </View>

            <CustomButton
              title="Create Account"
              variant="primary"
              onPress={handleRegister}
              fullWidth
              style={styles.registerButton}
            />
          </View>

          {/* Sign In */}
          <View style={styles.signinContainer}>
            <Text style={styles.signinText}>Already have an account?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={styles.signinButton}
            >
              <Text style={styles.signinButtonText}>Sign In</Text>
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
    paddingVertical: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  logo: {
    fontSize: 48,
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
    lineHeight: typography.fontSize.base * 1.4,
  },
  formContainer: {
    marginBottom: spacing.lg,
  },
  nameContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  nameField: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  textInput: {
    ...componentStyles.input.default,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    ...componentStyles.input.default,
    paddingHorizontal: 0,
  },
  passwordInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  passwordToggle: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  passwordToggleText: {
    fontSize: 20,
  },
  helpText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  checkbox: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.gray400,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkboxBoxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
    textDecorationLine: 'underline',
  },
  registerButton: {
    marginTop: spacing.sm,
    height: 55,
  },
  signinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  signinText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  signinButton: {
    marginLeft: spacing.sm,
  },
  signinButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
});