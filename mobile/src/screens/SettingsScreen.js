import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { colors, typography, spacing, borderRadius } from '../utils/theme';
import apiService from '../services/apiService';

export default function SettingsScreen({ navigation }) {
  const [settings, setSettings] = useState({
    notifications: {
      enabled: true,
      bookings: true,
      messages: true,
      rideReminders: true,
      promotions: false,
    },
    privacy: {
      showPhoneNumber: true,
      messageSettings: 'confirmed', // 'confirmed' or 'all'
    },
    theme: 'device', // 'light', 'dark', 'device'
  });

  // Dropdown states
  const [expandedSections, setExpandedSections] = useState({
    notifications: false,
    privacy: false,
    theme: false,
    account: false,
  });
  
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/auth/profile');
      if (response.success && response.data.user) {
        const userProfile = response.data.user;
        setSettings({
          notifications: userProfile.notifications || settings.notifications,
          privacy: userProfile.privacy || settings.privacy,
          theme: userProfile.theme || settings.theme,
        });
      }
    } catch (error) {
      console.error('Load settings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [setting]: value
      }
    }));
    
    // In production, this would sync with API
    console.log('Notification setting changed:', setting, value);
  };

  const handleMasterNotificationToggle = (enabled) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        enabled,
        // If disabling all notifications, turn off individual ones too
        ...(enabled ? {} : {
          bookings: false,
          messages: false,
          rideReminders: false,
          promotions: false,
        })
      }
    }));
  };

  const handlePrivacyToggle = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [setting]: value
      }
    }));
    
    // In production, this would sync with API
    console.log('Privacy setting changed:', setting, value);
  };

  const handleThemeChange = (theme) => {
    setSettings(prev => ({
      ...prev,
      theme: theme
    }));
    
    // In production, this would sync with API and apply theme
    console.log('Theme changed to:', theme);
  };

  const handleEditEmail = () => {
    Alert.alert(
      'Edit Email Address',
      'You will be redirected to update your email address. A verification email will be sent to your new address.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => {
            // In production, navigate to email edit screen
            console.log('Navigate to edit email screen');
            // navigation.navigate('EditEmail');
          }
        }
      ]
    );
  };


  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleDeleteAccount = () => {
    navigation.navigate('DeleteAccount');
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('notifications')}
          >
            <Text style={styles.sectionTitle}>🔔 Notifications</Text>
            <Text style={styles.dropdownArrow}>
              {expandedSections.notifications ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
          
          {expandedSections.notifications && (
            <View style={styles.sectionContent}>
              {/* Master notification toggle */}
              <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Enable Notifications</Text>
              <Text style={styles.settingDescription}>
                Turn on/off all notifications
              </Text>
            </View>
            <Switch
              value={settings.notifications.enabled}
              onValueChange={handleMasterNotificationToggle}
              trackColor={{ false: colors.gray300, true: colors.primary + '40' }}
              thumbColor={settings.notifications.enabled ? colors.primary : colors.gray400}
            />
          </View>

          {/* Individual notification settings - only show if notifications are enabled */}
          {settings.notifications.enabled && (
            <>
              {/* Bookings */}
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Bookings</Text>
                  <Text style={styles.settingDescription}>
                    Get notified about ride bookings and updates
                  </Text>
                </View>
                <Switch
                  value={settings.notifications.bookings}
                  onValueChange={(value) => handleNotificationToggle('bookings', value)}
                  trackColor={{ false: colors.gray300, true: colors.primary + '40' }}
                  thumbColor={settings.notifications.bookings ? colors.primary : colors.gray400}
                />
              </View>

              {/* Messages */}
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Messages</Text>
                  <Text style={styles.settingDescription}>
                    Get notified about new messages from other users
                  </Text>
                </View>
                <Switch
                  value={settings.notifications.messages}
                  onValueChange={(value) => handleNotificationToggle('messages', value)}
                  trackColor={{ false: colors.gray300, true: colors.primary + '40' }}
                  thumbColor={settings.notifications.messages ? colors.primary : colors.gray400}
                />
              </View>

              {/* Ride Reminders */}
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Ride Reminders</Text>
                  <Text style={styles.settingDescription}>
                    Get reminders about upcoming rides
                  </Text>
                </View>
                <Switch
                  value={settings.notifications.rideReminders}
                  onValueChange={(value) => handleNotificationToggle('rideReminders', value)}
                  trackColor={{ false: colors.gray300, true: colors.primary + '40' }}
                  thumbColor={settings.notifications.rideReminders ? colors.primary : colors.gray400}
                />
              </View>

              {/* Promotions */}
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Promotions</Text>
                  <Text style={styles.settingDescription}>
                    Get notified about special offers and promotions
                  </Text>
                </View>
                <Switch
                  value={settings.notifications.promotions}
                  onValueChange={(value) => handleNotificationToggle('promotions', value)}
                  trackColor={{ false: colors.gray300, true: colors.primary + '40' }}
                  thumbColor={settings.notifications.promotions ? colors.primary : colors.gray400}
                />
              </View>
            </>
          )}

              {/* Disabled state message */}
              {!settings.notifications.enabled && (
                <View style={styles.disabledContainer}>
                  <Text style={styles.disabledText}>
                    All notifications are currently disabled. Enable notifications above to customize individual settings.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('privacy')}
          >
            <Text style={styles.sectionTitle}>🔒 Privacy</Text>
            <Text style={styles.dropdownArrow}>
              {expandedSections.privacy ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
          
          {expandedSections.privacy && (
            <View style={styles.sectionContent}>
              {/* Phone Number Visibility - Only show for drivers */}
              {user?.driverVerified && (
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Show Phone Number</Text>
                <Text style={styles.settingDescription}>
                  Allow passengers to see your phone number when they book your rides
                </Text>
              </View>
              <Switch
                value={settings.privacy.showPhoneNumber}
                onValueChange={(value) => handlePrivacyToggle('showPhoneNumber', value)}
                trackColor={{ false: colors.gray300, true: colors.primary + '40' }}
                thumbColor={settings.privacy.showPhoneNumber ? colors.primary : colors.gray400}
              />
            </View>
          )}

          {/* Messaging Preferences */}
          <View style={styles.privacyItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Who can message me</Text>
              <Text style={styles.settingDescription}>
                Control who can send you messages on the platform
              </Text>
            </View>
          </View>

          {/* Message Setting Options */}
          <View style={styles.privacyOptionsContainer}>
            <TouchableOpacity
              style={[
                styles.privacyOption,
                settings.privacy.messageSettings === 'confirmed' && styles.privacyOptionSelected
              ]}
              onPress={() => handlePrivacyToggle('messageSettings', 'confirmed')}
            >
              <View style={styles.privacyOptionContent}>
                <View style={[
                  styles.radioButton,
                  settings.privacy.messageSettings === 'confirmed' && styles.radioButtonSelected
                ]}>
                  {settings.privacy.messageSettings === 'confirmed' && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <View style={styles.privacyOptionText}>
                  <Text style={[
                    styles.privacyOptionTitle,
                    settings.privacy.messageSettings === 'confirmed' && styles.privacyOptionTitleSelected
                  ]}>
                    Only confirmed bookings
                  </Text>
                  <Text style={styles.privacyOptionDescription}>
                    Only users who have booked your rides can message you
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.privacyOption,
                settings.privacy.messageSettings === 'all' && styles.privacyOptionSelected
              ]}
              onPress={() => handlePrivacyToggle('messageSettings', 'all')}
            >
              <View style={styles.privacyOptionContent}>
                <View style={[
                  styles.radioButton,
                  settings.privacy.messageSettings === 'all' && styles.radioButtonSelected
                ]}>
                  {settings.privacy.messageSettings === 'all' && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <View style={styles.privacyOptionText}>
                  <Text style={[
                    styles.privacyOptionTitle,
                    settings.privacy.messageSettings === 'all' && styles.privacyOptionTitleSelected
                  ]}>
                    Anyone
                  </Text>
                  <Text style={styles.privacyOptionDescription}>
                    Any user on the platform can send you messages
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

              {/* Privacy Note */}
              <View style={styles.privacyNoteContainer}>
                <Text style={styles.privacyNoteText}>
                  💡 Your personal information is always protected. These settings only control visibility within the Ride Club platform.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Theme Settings */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('theme')}
          >
            <Text style={styles.sectionTitle}>🎨 Theme</Text>
            <Text style={styles.dropdownArrow}>
              {expandedSections.theme ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
          
          {expandedSections.theme && (
            <View style={styles.sectionContent}>
              {/* Theme Selection */}
              <View style={styles.privacyItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>App Theme</Text>
              <Text style={styles.settingDescription}>
                Choose how the app looks
              </Text>
            </View>
          </View>

          {/* Theme Options */}
          <View style={styles.privacyOptionsContainer}>
            <TouchableOpacity
              style={[
                styles.privacyOption,
                settings.theme === 'light' && styles.privacyOptionSelected
              ]}
              onPress={() => handleThemeChange('light')}
            >
              <View style={styles.privacyOptionContent}>
                <View style={[
                  styles.radioButton,
                  settings.theme === 'light' && styles.radioButtonSelected
                ]}>
                  {settings.theme === 'light' && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <View style={styles.privacyOptionText}>
                  <Text style={[
                    styles.privacyOptionTitle,
                    settings.theme === 'light' && styles.privacyOptionTitleSelected
                  ]}>
                    ☀️ Light Mode
                  </Text>
                  <Text style={styles.privacyOptionDescription}>
                    Use light theme with bright backgrounds
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.privacyOption,
                settings.theme === 'dark' && styles.privacyOptionSelected
              ]}
              onPress={() => handleThemeChange('dark')}
            >
              <View style={styles.privacyOptionContent}>
                <View style={[
                  styles.radioButton,
                  settings.theme === 'dark' && styles.radioButtonSelected
                ]}>
                  {settings.theme === 'dark' && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <View style={styles.privacyOptionText}>
                  <Text style={[
                    styles.privacyOptionTitle,
                    settings.theme === 'dark' && styles.privacyOptionTitleSelected
                  ]}>
                    🌙 Dark Mode
                  </Text>
                  <Text style={styles.privacyOptionDescription}>
                    Use dark theme with dark backgrounds
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.privacyOption,
                settings.theme === 'device' && styles.privacyOptionSelected
              ]}
              onPress={() => handleThemeChange('device')}
            >
              <View style={styles.privacyOptionContent}>
                <View style={[
                  styles.radioButton,
                  settings.theme === 'device' && styles.radioButtonSelected
                ]}>
                  {settings.theme === 'device' && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <View style={styles.privacyOptionText}>
                  <Text style={[
                    styles.privacyOptionTitle,
                    settings.theme === 'device' && styles.privacyOptionTitleSelected
                  ]}>
                    📱 Device Mode
                  </Text>
                  <Text style={styles.privacyOptionDescription}>
                    Automatically match your device's theme setting
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

              {/* Theme Note */}
              <View style={styles.privacyNoteContainer}>
                <Text style={styles.privacyNoteText}>
                  💡 Theme changes will be applied immediately. Device mode will follow your system's light/dark mode setting.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Account Management */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('account')}
          >
            <Text style={styles.sectionTitle}>👤 Account Management</Text>
            <Text style={styles.dropdownArrow}>
              {expandedSections.account ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
          
          {expandedSections.account && (
            <View style={styles.sectionContent}>
              <TouchableOpacity
            style={styles.actionItem}
            onPress={handleEditEmail}
          >
            <Text style={styles.actionIcon}>📧</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionText}>Edit Email</Text>
              <Text style={styles.actionSubtext}>
                {user?.email || 'No email set'}
              </Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>


          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleChangePassword}
          >
            <Text style={styles.actionIcon}>🔒</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionText}>Change Password</Text>
              <Text style={styles.actionSubtext}>
                Update your login password
              </Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionItem, styles.dangerActionItem]}
            onPress={handleDeleteAccount}
          >
            <Text style={styles.actionIcon}>🗑️</Text>
            <View style={styles.actionContent}>
              <Text style={[styles.actionText, styles.dangerActionText]}>Delete Account</Text>
              <Text style={styles.actionSubtext}>
                Permanently remove your account and all data
              </Text>
            </View>
            <Text style={[styles.actionArrow, styles.dangerActionText]}>→</Text>
          </TouchableOpacity>

              {/* GDPR/PIPEDA Compliance Note */}
              <View style={styles.privacyNoteContainer}>
                <Text style={styles.privacyNoteText}>
                  🛡️ Account deletion is provided to comply with PIPEDA (Canada) and GDPR (EU) data protection regulations. All personal data will be permanently removed from our systems.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Additional Settings Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Other Settings</Text>
          
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('Help')}
          >
            <Text style={styles.actionIcon}>❓</Text>
            <Text style={styles.actionText}>Help & FAQ</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('Support')}
          >
            <Text style={styles.actionIcon}>📞</Text>
            <Text style={styles.actionText}>Contact Support</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

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
    marginRight: spacing.xl, // To center the title accounting for back button
  },
  section: {
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
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray300,
    marginBottom: spacing.md,
  },
  dropdownArrow: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.bold,
  },
  sectionContent: {
    // Content container for collapsible sections
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  disabledContainer: {
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  disabledText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  privacyItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  privacyOptionsContainer: {
    marginTop: spacing.sm,
  },
  privacyOption: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  privacyOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  privacyOptionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray400,
    marginRight: spacing.md,
    marginTop: 2,
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
  privacyOptionText: {
    flex: 1,
  },
  privacyOptionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  privacyOptionTitleSelected: {
    color: colors.primary,
  },
  privacyOptionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  privacyNoteContainer: {
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  privacyNoteText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: spacing.md,
    width: 30,
  },
  actionText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  actionArrow: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  actionContent: {
    flex: 1,
  },
  actionSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  dangerActionItem: {
    borderTopWidth: 1,
    borderTopColor: colors.danger + '20',
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },
  dangerActionText: {
    color: colors.danger,
  },
});