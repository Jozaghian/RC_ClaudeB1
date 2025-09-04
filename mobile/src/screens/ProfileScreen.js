import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { useLoading } from '../contexts/LoadingContext';
import CustomButton from '../components/CustomButton';
import { colors, typography, spacing, borderRadius, componentStyles } from '../utils/theme';
import { formatCurrency, getInitials } from '../utils/helpers';
import apiService from '../services/apiService';

const LANGUAGE_OPTIONS = [
  'English', 
  'French', 
  'Spanish', 
  'Mandarin', 
  'Arabic', 
  'Hindi', 
  'Urdu',
  'Farsi (Persian)', 
  'Farsi (Dari)', 
  'Filipino (Tagalog)',
  'Italian', 
  'Ukrainian', 
  'Korean', 
  'Russian', 
  'Japanese', 
  'German',
  'Portuguese',
  'Polish',
  'Punjabi',
  'Tamil',
  'Vietnamese',
  'Cantonese',
  'Greek',
  'Dutch',
  'Romanian',
  'Serbian',
  'Croatian',
  'Bengali',
  'Gujarati',
  'Turkish'
].sort();

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    preferredName: '',
    email: '',
    phoneNumber: '',
    bio: '',
    languages: [],
    profilePicture: null,
    driverVerified: false,
    phoneVerified: false,
    emailVerified: false,
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [stats, setStats] = useState({
    totalTripsAsDriver: 0,
    totalTripsAsPassenger: 0,
    driverRating: 0,
    passengerRating: 0,
    creditsBalance: 0,
    totalEarned: 0,
  });
  const [loading, setLoading] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const { user, logout } = useAuth();
  const { setLoading: setGlobalLoading } = useLoading();

  useEffect(() => {
    loadProfile();
    loadStats();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/auth/profile');
      if (response.success) {
        setProfile(response.data.user);
        setEditedProfile(response.data.user);
      }
    } catch (error) {
      console.error('Load profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [driverStatsRes, passengerStatsRes, creditsRes] = await Promise.all([
        apiService.get('/auth/driver-stats').catch(() => ({ success: false })),
        apiService.get('/auth/passenger-stats').catch(() => ({ success: false })),
        apiService.get('/credits/balance').catch(() => ({ success: false }))
      ]);

      const newStats = { ...stats };
      
      if (driverStatsRes.success) {
        newStats.totalTripsAsDriver = driverStatsRes.data.totalTrips || 0;
        newStats.driverRating = driverStatsRes.data.averageRating || 0;
        newStats.totalEarned = driverStatsRes.data.totalEarned || 0;
      }
      
      if (passengerStatsRes.success) {
        newStats.totalTripsAsPassenger = passengerStatsRes.data.totalTrips || 0;
        newStats.passengerRating = passengerStatsRes.data.averageRating || 0;
      }
      
      if (creditsRes.success) {
        newStats.creditsBalance = creditsRes.data.balance || 0;
      }

      setStats(newStats);
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const handleSaveProfile = async () => {
    setGlobalLoading(true);

    try {
      const response = await apiService.put('/auth/profile', editedProfile);
      
      if (response.success) {
        setProfile(response.data.user);
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      
      const moderationError = apiService.handleModerationError(error);
      if (moderationError.isModerationError) {
        Alert.alert(
          'Content Not Allowed',
          moderationError.message,
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert('Error', moderationError.message || 'Failed to update profile.');
      }
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile(profile);
    setIsEditing(false);
    setShowLanguageSelector(false);
  };

  const toggleLanguage = (language) => {
    const currentLanguages = editedProfile.languages || [];
    const isSelected = currentLanguages.includes(language);
    
    if (isSelected) {
      setEditedProfile({
        ...editedProfile,
        languages: currentLanguages.filter(lang => lang !== language)
      });
    } else {
      setEditedProfile({
        ...editedProfile,
        languages: [...currentLanguages, language]
      });
    }
  };


  const handleVerifyPhone = () => {
    navigation.navigate('PhoneVerification');
  };

  const requestPermissions = async () => {
    const { status: cameraRollStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (cameraRollStatus !== 'granted' || cameraStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'We need camera and photo library permissions to update your profile picture.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const showImagePickerOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library', 'Remove Photo'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: profile.profilePicture ? 3 : undefined,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            pickImageFromCamera();
          } else if (buttonIndex === 2) {
            pickImageFromLibrary();
          } else if (buttonIndex === 3 && profile.profilePicture) {
            removeProfilePicture();
          }
        }
      );
    } else {
      // Android - show custom alert
      const options = ['Take Photo', 'Choose from Library'];
      if (profile.profilePicture) {
        options.push('Remove Photo');
      }
      options.push('Cancel');

      Alert.alert(
        'Update Profile Picture',
        'Choose an option',
        [
          { text: 'Take Photo', onPress: pickImageFromCamera },
          { text: 'Choose from Library', onPress: pickImageFromLibrary },
          ...(profile.profilePicture ? [{ text: 'Remove Photo', onPress: removeProfilePicture, style: 'destructive' }] : []),
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const pickImageFromCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await uploadProfilePicture(result.assets[0]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickImageFromLibrary = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await uploadProfilePicture(result.assets[0]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const uploadProfilePicture = async (imageAsset) => {
    setGlobalLoading(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('profilePicture', {
        uri: imageAsset.uri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      });

      // For now, we'll simulate upload and use local URI
      // In production, this would upload to your server
      console.log('Uploading image:', imageAsset.uri);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update local state with new image
      setProfile(prev => ({ 
        ...prev, 
        profilePicture: imageAsset.uri 
      }));
      
      setEditedProfile(prev => ({ 
        ...prev, 
        profilePicture: imageAsset.uri 
      }));

      Alert.alert('Success', 'Profile picture updated successfully!');
      
      // TODO: In production, call actual API:
      // const response = await apiService.uploadFile('/auth/profile/picture', formData);
      
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
    } finally {
      setGlobalLoading(false);
    }
  };

  const removeProfilePicture = async () => {
    Alert.alert(
      'Remove Profile Picture',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setGlobalLoading(true);
            
            try {
              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              setProfile(prev => ({ ...prev, profilePicture: null }));
              setEditedProfile(prev => ({ ...prev, profilePicture: null }));
              
              Alert.alert('Success', 'Profile picture removed successfully!');
              
              // TODO: In production, call actual API:
              // await apiService.delete('/auth/profile/picture');
              
            } catch (error) {
              console.error('Remove picture error:', error);
              Alert.alert('Error', 'Failed to remove profile picture. Please try again.');
            } finally {
              setGlobalLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  const renderVerificationBadge = (isVerified, label) => (
    <View style={[
      styles.verificationBadge,
      { backgroundColor: isVerified ? colors.success + '20' : colors.warning + '20' }
    ]}>
      <Text style={[
        styles.verificationText,
        { color: isVerified ? colors.success : colors.warning }
      ]}>
        {isVerified ? '✓' : '!'} {label}
      </Text>
    </View>
  );

  const renderStatCard = (title, value, subtitle, icon, onPress = null) => (
    <TouchableOpacity 
      style={[styles.statCard, onPress && styles.clickableStatCard]} 
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            <TouchableOpacity 
              style={styles.profileImageTouchable}
              onPress={showImagePickerOptions}
              activeOpacity={0.8}
            >
              {profile.profilePicture ? (
                <Image source={{ uri: profile.profilePicture }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Text style={styles.profileInitials}>
                    {getInitials(profile.firstName, profile.lastName)}
                  </Text>
                </View>
              )}
              
              {/* Camera Icon Overlay */}
              <View style={styles.cameraIconContainer}>
                <Text style={styles.cameraIcon}>📷</Text>
              </View>
            </TouchableOpacity>
            
            {/* Helpful text */}
            <Text style={styles.profileImageHint}>
              Tap to change photo
            </Text>
          </View>
          
          <Text style={styles.profileName}>
            {profile.firstName} {profile.lastName}
          </Text>
          
          <View style={styles.verificationContainer}>
            {renderVerificationBadge(profile.phoneVerified, 'Phone')}
            {renderVerificationBadge(profile.emailVerified, 'Email')}
            {renderVerificationBadge(profile.driverVerified, 'Driver')}
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Text style={styles.editButtonText}>
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>📊 Your Stats</Text>
          
          <View style={styles.statsGrid}>
            {renderStatCard(
              'Driver Rating',
              stats.driverRating > 0 ? `⭐ ${stats.driverRating.toFixed(1)}` : 'No rating',
              `${stats.totalTripsAsDriver} trips`,
              '🚗'
            )}
            
            {renderStatCard(
              'Passenger Rating',
              stats.passengerRating > 0 ? `⭐ ${stats.passengerRating.toFixed(1)}` : 'No rating',
              `${stats.totalTripsAsPassenger} trips`,
              '🎒'
            )}
            
            {renderStatCard(
              'Credits',
              stats.creditsBalance,
              'Available',
              '💳',
              () => navigation.navigate('CreditManagement')
            )}
            
            {renderStatCard(
              'Total Earned',
              formatCurrency(stats.totalEarned),
              'All time',
              '💰'
            )}
          </View>
        </View>

        {/* Profile Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Profile Information</Text>
          
          {isEditing ? (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedProfile.firstName}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, firstName: text })}
                  placeholder="Enter first name"
                  placeholderTextColor={colors.textLight}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Preferred Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedProfile.preferredName}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, preferredName: text })}
                  placeholder="What would you like to be called? (optional)"
                  placeholderTextColor={colors.textLight}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedProfile.lastName}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, lastName: text })}
                  placeholder="Enter last name"
                  placeholderTextColor={colors.textLight}
                />
              </View>


              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Bio</Text>
                <TextInput
                  style={[styles.textInput, styles.bioInput]}
                  value={editedProfile.bio}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, bio: text })}
                  placeholder="Tell other users about yourself..."
                  placeholderTextColor={colors.textLight}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Languages</Text>
                <TouchableOpacity
                  style={styles.languageSelector}
                  onPress={() => setShowLanguageSelector(!showLanguageSelector)}
                >
                  <Text style={styles.languageSelectorText}>
                    {editedProfile.languages?.length > 0 
                      ? editedProfile.languages.join(', ')
                      : 'Select languages you speak'
                    }
                  </Text>
                  <Text style={styles.languageSelectorArrow}>
                    {showLanguageSelector ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>

                {showLanguageSelector && (
                  <ScrollView style={styles.languageOptions} nestedScrollEnabled={true}>
                    {LANGUAGE_OPTIONS.map((language) => (
                      <TouchableOpacity
                        key={language}
                        style={styles.languageOption}
                        onPress={() => toggleLanguage(language)}
                      >
                        <Text style={styles.languageOptionText}>{language}</Text>
                        <View style={[
                          styles.languageCheckbox,
                          editedProfile.languages?.includes(language) && styles.languageCheckboxSelected
                        ]}>
                          {editedProfile.languages?.includes(language) && (
                            <Text style={styles.languageCheckboxText}>✓</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              <View style={styles.editActions}>
                <CustomButton
                  title="Cancel"
                  variant="outline"
                  onPress={handleCancelEdit}
                  style={styles.editActionButton}
                />
                <CustomButton
                  title="Save"
                  onPress={handleSaveProfile}
                  style={styles.editActionButton}
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profile.email}</Text>
              </View>


              {profile.preferredName && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Preferred Name</Text>
                  <Text style={styles.infoValue}>{profile.preferredName}</Text>
                </View>
              )}

              {profile.bio && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Bio</Text>
                  <Text style={styles.infoValue}>{profile.bio}</Text>
                </View>
              )}

              {profile.languages && profile.languages.length > 0 && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Languages</Text>
                  <Text style={styles.infoValue}>{profile.languages.join(', ')}</Text>
                </View>
              )}
            </>
          )}
        </View>


        {/* Quick Actions */}
        <View style={styles.section}>
          
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('CreditManagement')}
          >
            <Text style={styles.actionIcon}>💳</Text>
            <Text style={styles.actionText}>Manage Credits</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('VehicleManagement')}
          >
            <Text style={styles.actionIcon}>🚙</Text>
            <Text style={styles.actionText}>My Vehicles</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          {!profile.phoneVerified && (
            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleVerifyPhone}
            >
              <Text style={styles.actionIcon}>📱</Text>
              <Text style={styles.actionText}>Verify Phone Number</Text>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('About')}
          >
            <Text style={styles.actionIcon}>ℹ️</Text>
            <Text style={styles.actionText}>About Ride Club</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionText}>Settings</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

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


        {/* Logout */}
        <View style={styles.logoutSection}>
          <CustomButton
            title="Logout"
            variant="outline"
            onPress={handleLogout}
            fullWidth
            style={styles.logoutButton}
          />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  profileImageContainer: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  profileImageTouchable: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: colors.white,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.white,
  },
  profileInitials: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  profileName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.md,
  },
  verificationContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  verificationBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  verificationText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  editButton: {
    backgroundColor: colors.white + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.white + '40',
  },
  editButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  statsSection: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: '48%',
    marginBottom: spacing.md,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
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
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  languageSelector: {
    ...componentStyles.input.default,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageSelectorText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  languageSelectorArrow: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  languageOptions: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    maxHeight: 300,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  languageOptionText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  languageCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.gray400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageCheckboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  languageCheckboxText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  editActionButton: {
    flex: 1,
    height: 55,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  infoLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
    flex: 2,
    textAlign: 'right',
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
  logoutSection: {
    padding: spacing.md,
  },
  logoutButton: {
    borderColor: colors.danger,
    minHeight: 58,
  },
  clickableStatCard: {
    borderWidth: 2,
    borderColor: colors.primary + '20',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  cameraIcon: {
    fontSize: 16,
  },
  profileImageHint: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
    opacity: 0.8,
    textAlign: 'center',
    fontWeight: typography.fontWeight.medium,
  },
});