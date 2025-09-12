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
import { isValidEmail, formatPhoneNumber } from '../../utils/helpers';

export default function LoginScreen({ navigation }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const { login } = useAuth();
  const { setLoading: setGlobalLoading } = useLoading();

  const validateForm = () => {
    if (!formData.email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email address');
      return false;
    }

    if (!isValidEmail(formData.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }

    if (!formData.password) {
      Alert.alert('Validation Error', 'Please enter your password');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters long');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setGlobalLoading(true);

    try {
      await login(formData.email.toLowerCase().trim(), formData.password);
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Failed',
        error.message || 'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
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
            <Text style={styles.logo}>🚗</Text>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>
              Sign in to continue
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.textInput}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Enter your email"
                placeholderTextColor={colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textLight}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
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
            </View>

            {/* Terms and Privacy Checkbox */}
            <View style={styles.termsContainer}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setAcceptedTerms(!acceptedTerms)}
              >
                <View style={[styles.checkbox, acceptedTerms && styles.checkboxActive]}>
                  {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.termsText}>
                  By signing in, I agree to the{' '}
                  <Text 
                    style={styles.termsLink}
                    onPress={() => Alert.alert('Terms of Service', 'Terms of Service will be available soon.')}
                  >
                    Terms of Service
                  </Text>
                  {' '}and{' '}
                  <Text 
                    style={styles.termsLink}
                    onPress={() => Alert.alert('Privacy Policy', 'Privacy Policy will be available soon.')}
                  >
                    Privacy Policy
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <CustomButton
              title="Sign In"
              variant="primary"
              onPress={handleLogin}
              fullWidth
              style={styles.loginButton}
            />
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign Up */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              style={styles.signupButton}
            >
              <Text style={styles.signupButtonText}>Sign Up</Text>
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
    paddingVertical: spacing.sm,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingTop: spacing.xs,
  },
  logo: {
    fontSize: 64,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * 1.4,
  },
  formContainer: {
    marginBottom: spacing.xs,
  },
  inputContainer: {
    marginBottom: spacing.xs,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
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
  termsContainer: {
    marginVertical: spacing.sm,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.gray400,
    borderRadius: 3,
    marginRight: spacing.sm,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
  },
  termsText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
    textDecorationLine: 'underline',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xs,
    minHeight: 30,
  },
  forgotPasswordText: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  loginButton: {
    marginTop: 0,
    height: 55,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray300,
  },
  dividerText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  signupText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  signupButton: {
    marginLeft: spacing.sm,
  },
  signupButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  featuresContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featuresTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: spacing.md,
    width: 32,
    textAlign: 'center',
  },
  featureText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    flex: 1,
    lineHeight: typography.fontSize.base * 1.4,
  },
});