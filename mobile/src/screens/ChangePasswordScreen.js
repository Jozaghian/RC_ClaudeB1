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
import apiService from '../services/apiService';

export default function ChangePasswordScreen({ navigation }) {
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  const { user } = useAuth();
  const { setLoading: setGlobalLoading } = useLoading();

  const passwordRequirements = [
    { id: 'length', text: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
    { id: 'uppercase', text: 'One uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
    { id: 'lowercase', text: 'One lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
    { id: 'number', text: 'One number', test: (pwd) => /\d/.test(pwd) },
    { id: 'special', text: 'One special character', test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
  ];

  const validatePassword = (password) => {
    const errors = {};
    
    passwordRequirements.forEach(req => {
      if (!req.test(password)) {
        errors[req.id] = req.text;
      }
    });
    
    return errors;
  };

  const validatePasswords = () => {
    const errors = {};
    
    if (!passwords.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwords.newPassword) {
      errors.newPassword = 'New password is required';
    } else {
      const passwordErrors = validatePassword(passwords.newPassword);
      if (Object.keys(passwordErrors).length > 0) {
        errors.newPassword = 'Password does not meet requirements';
      }
    }
    
    if (!passwords.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwords.newPassword !== passwords.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (passwords.currentPassword === passwords.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = (field, value) => {
    setPasswords(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation errors when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleChangePassword = async () => {
    if (!validatePasswords()) {
      return;
    }
    
    setLoading(true);
    setGlobalLoading(true);
    
    try {
      const response = await apiService.post('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      
      if (response.success) {
        Alert.alert(
          'Password Changed Successfully! 🎉',
          'Your password has been updated. For security reasons, you will be logged out and need to sign in again with your new password.',
          [
            {
              text: 'OK',
              onPress: () => {
                // In production, logout user and navigate to login
                navigation.navigate('Login');
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Change password error:', error);
      
      if (error.response?.status === 401) {
        Alert.alert(
          'Invalid Current Password',
          'The current password you entered is incorrect. Please try again.'
        );
      } else {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Failed to change password. Please try again.'
        );
      }
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    const passed = passwordRequirements.filter(req => req.test(password)).length;
    if (passed < 2) return { level: 'weak', color: colors.danger, text: 'Weak' };
    if (passed < 4) return { level: 'medium', color: colors.warning, text: 'Medium' };
    if (passed === 5) return { level: 'strong', color: colors.success, text: 'Strong' };
    return { level: 'none', color: colors.gray400, text: '' };
  };

  const passwordStrength = getPasswordStrength(passwords.newPassword);

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
          <Text style={styles.headerTitle}>Change Password</Text>
        </View>

        {/* Security Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoIcon}>🔐</Text>
          <Text style={styles.infoTitle}>Security Notice</Text>
          <Text style={styles.infoText}>
            After changing your password, you will be logged out for security reasons and need to sign in again with your new password.
          </Text>
        </View>

        {/* Password Form */}
        <View style={styles.formSection}>
          {/* Current Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Current Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[
                  styles.textInput,
                  styles.passwordInput,
                  validationErrors.currentPassword && styles.inputError
                ]}
                value={passwords.currentPassword}
                onChangeText={(text) => handlePasswordChange('currentPassword', text)}
                placeholder="Enter your current password"
                placeholderTextColor={colors.textLight}
                secureTextEntry={!showPasswords.current}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => togglePasswordVisibility('current')}
              >
                <Text style={styles.eyeIcon}>
                  {showPasswords.current ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            </View>
            {validationErrors.currentPassword && (
              <Text style={styles.errorText}>{validationErrors.currentPassword}</Text>
            )}
          </View>

          {/* New Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[
                  styles.textInput,
                  styles.passwordInput,
                  validationErrors.newPassword && styles.inputError
                ]}
                value={passwords.newPassword}
                onChangeText={(text) => handlePasswordChange('newPassword', text)}
                placeholder="Enter your new password"
                placeholderTextColor={colors.textLight}
                secureTextEntry={!showPasswords.new}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => togglePasswordVisibility('new')}
              >
                <Text style={styles.eyeIcon}>
                  {showPasswords.new ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Password Strength Indicator */}
            {passwords.newPassword.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBar}>
                  <View 
                    style={[
                      styles.strengthFill,
                      { 
                        width: `${(passwordRequirements.filter(req => req.test(passwords.newPassword)).length / passwordRequirements.length) * 100}%`,
                        backgroundColor: passwordStrength.color
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                  {passwordStrength.text}
                </Text>
              </View>
            )}
            
            {validationErrors.newPassword && (
              <Text style={styles.errorText}>{validationErrors.newPassword}</Text>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[
                  styles.textInput,
                  styles.passwordInput,
                  validationErrors.confirmPassword && styles.inputError
                ]}
                value={passwords.confirmPassword}
                onChangeText={(text) => handlePasswordChange('confirmPassword', text)}
                placeholder="Confirm your new password"
                placeholderTextColor={colors.textLight}
                secureTextEntry={!showPasswords.confirm}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => togglePasswordVisibility('confirm')}
              >
                <Text style={styles.eyeIcon}>
                  {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            </View>
            {validationErrors.confirmPassword && (
              <Text style={styles.errorText}>{validationErrors.confirmPassword}</Text>
            )}
          </View>
        </View>

        {/* Password Requirements */}
        <View style={styles.requirementsSection}>
          <Text style={styles.requirementsTitle}>Password Requirements</Text>
          {passwordRequirements.map(req => {
            const isValid = req.test(passwords.newPassword);
            return (
              <View key={req.id} style={styles.requirementItem}>
                <Text style={[
                  styles.requirementIcon,
                  { color: isValid ? colors.success : colors.textSecondary }
                ]}>
                  {isValid ? '✅' : '⭕'}
                </Text>
                <Text style={[
                  styles.requirementText,
                  { color: isValid ? colors.success : colors.textSecondary }
                ]}>
                  {req.text}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Submit Button */}
        <View style={styles.buttonSection}>
          <CustomButton
            title="Change Password"
            onPress={handleChangePassword}
            loading={loading}
            disabled={Object.keys(validationErrors).length > 0 || !passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword}
            fullWidth
            gradient
            style={styles.submitButton}
          />
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>💡 Security Tips</Text>
          <Text style={styles.helpText}>
            • Use a unique password that you don't use elsewhere{'\n'}
            • Consider using a password manager{'\n'}
            • Don't share your password with anyone{'\n'}
            • Change your password if you suspect it's compromised
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
  infoSection: {
    backgroundColor: colors.primary + '10',
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  infoTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * 1.4,
  },
  formSection: {
    backgroundColor: colors.white,
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  textInput: {
    ...componentStyles.input.default,
    marginBottom: 0,
  },
  passwordInput: {
    flex: 1,
    paddingRight: spacing.xl * 2,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.md,
    padding: spacing.sm,
  },
  eyeIcon: {
    fontSize: 18,
  },
  inputError: {
    borderColor: colors.danger,
    borderWidth: 2,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  requirementsSection: {
    backgroundColor: colors.white,
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  requirementsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  requirementIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
    width: 20,
  },
  requirementText: {
    fontSize: typography.fontSize.sm,
    flex: 1,
  },
  buttonSection: {
    padding: spacing.md,
  },
  submitButton: {
    height: 55,
  },
  helpSection: {
    backgroundColor: colors.gray100,
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.md,
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
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * 1.4,
  },
});