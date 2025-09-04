import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLoading } from '../contexts/LoadingContext';
import CustomButton from '../components/CustomButton';
import RideClubLogo from '../components/RideClubLogo';
import { colors, typography, spacing, borderRadius, componentStyles } from '../utils/theme';
import { formatPhoneNumber, isValidEmail } from '../utils/helpers';

export default function LoginScreen({ navigation }) {
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const { setLoading } = useLoading();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.emailOrPhone.trim()) {
      newErrors.emailOrPhone = 'Email or phone number is required';
    } else {
      const input = formData.emailOrPhone.trim();
      // Check if it's a phone number (contains only digits, spaces, dashes, parentheses, +)
      const phoneRegex = /^[\+]?[1]?[-.\s]?[\(]?[0-9]{3}[\)]?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;
      const isPhone = phoneRegex.test(input.replace(/\s/g, ''));
      
      if (!isPhone && !isValidEmail(input)) {
        newErrors.emailOrPhone = 'Please enter a valid email or phone number';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      const input = formData.emailOrPhone.trim();
      const phoneRegex = /^[\+]?[1]?[-.\s]?[\(]?[0-9]{3}[\)]?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;
      const isPhone = phoneRegex.test(input.replace(/\s/g, ''));

      const loginData = {
        password: formData.password,
      };

      if (isPhone) {
        loginData.phoneNumber = formatPhoneNumber(input);
      } else {
        loginData.email = input;
      }

      const response = await login(loginData);

      if (!response.success) {
        Alert.alert('Login Failed', response.message);
      }
      // Success is handled by the AuthContext

    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Error',
        error.message || 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <RideClubLogo size="medium" />
          </View>

          {/* Welcome Text */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome Back!</Text>
            <Text style={styles.welcomeSubtitle}>
              Sign in to continue your ride sharing journey
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.formSection}>
            {/* Email or Phone Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email or Phone Number</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.emailOrPhone && styles.inputError
                ]}
                value={formData.emailOrPhone}
                onChangeText={(value) => handleInputChange('emailOrPhone', value)}
                placeholder="Enter your email or phone number"
                placeholderTextColor={colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
              />
              {errors.emailOrPhone && (
                <Text style={styles.errorText}>{errors.emailOrPhone}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.password && styles.inputError
                ]}
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                placeholder="Enter your password"
                placeholderTextColor={colors.textLight}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Login Button */}
            <CustomButton
              title="Sign In"
              onPress={handleLogin}
              loading={isSubmitting}
              disabled={isSubmitting}
              fullWidth
              gradient
              style={styles.loginButton}
            />

            {/* Forgot Password Link */}
            <CustomButton
              title="Forgot Password?"
              variant="ghost"
              onPress={() => {
                Alert.alert(
                  'Reset Password',
                  'Password reset functionality will be available soon. Please contact support if you need assistance.',
                  [{ text: 'OK' }]
                );
              }}
              textStyle={styles.forgotPasswordText}
              style={styles.forgotPasswordButton}
            />
          </View>

          {/* Sign Up Link */}
          <View style={styles.signUpSection}>
            <Text style={styles.signUpPrompt}>Don't have an account?</Text>
            <CustomButton
              title="Join Ride Club"
              variant="secondary"
              onPress={() => navigation.navigate('Register')}
              disabled={isSubmitting}
              style={styles.signUpButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By signing in, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  welcomeTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * 1.4,
  },
  formSection: {
    marginBottom: spacing.xl,
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
  input: {
    ...componentStyles.input.default,
    fontSize: typography.fontSize.base,
  },
  inputError: {
    ...componentStyles.input.error,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
  loginButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    minHeight: 58,
  },
  forgotPasswordButton: {
    alignSelf: 'center',
    minHeight: 58,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  signUpSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  signUpPrompt: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  signUpButton: {
    minWidth: 200,
    minHeight: 58,
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  footerText: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: typography.fontSize.xs * 1.4,
  },
});

