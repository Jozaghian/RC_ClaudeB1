import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Button,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  useMediaQuery,
  Snackbar,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
  AccountCircle as AccountIcon,
  Settings as SettingsIcon,
  Lock as LockIcon,
  Delete as DeleteIcon,
  Help as HelpIcon,
  Support as SupportIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useLoading } from '../../contexts/LoadingContext';
import { useNavigate } from 'react-router-dom';
import { useThemeContext } from '../../contexts/ThemeContext';

interface NotificationSettings {
  enabled: boolean;
  bookings: boolean;
  messages: boolean;
  rideReminders: boolean;
  promotions: boolean;
}

interface PrivacySettings {
  showPhoneNumber: boolean;
  messageSettings: 'confirmed' | 'all';
}

interface UserSettings {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  theme: 'light' | 'dark' | 'device';
}

const SettingsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { setLoading } = useLoading();
  const navigate = useNavigate();
  const { mode, setMode, actualMode } = useThemeContext();

  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      enabled: true,
      bookings: true,
      messages: true,
      rideReminders: true,
      promotions: false,
    },
    privacy: {
      showPhoneNumber: true,
      messageSettings: 'confirmed',
    },
    theme: mode,
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteConfirmError, setDeleteConfirmError] = useState('');
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Mock user data
  const user = {
    email: 'user@example.com',
    driverVerified: true,
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true, 'Loading settings...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Settings would be loaded from API here
    } catch (error) {
      console.error('Load settings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: UserSettings) => {
    try {
      setLoading(true, 'Saving settings...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSettings(newSettings);
      setSnackbarMessage('Settings saved successfully!');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Save settings error:', error);
      setSnackbarMessage('Failed to save settings. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = (setting: keyof NotificationSettings, value: boolean) => {
    const newSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [setting]: value,
      },
    };

    // If disabling master notifications, turn off all sub-notifications
    if (setting === 'enabled' && !value) {
      newSettings.notifications = {
        enabled: false,
        bookings: false,
        messages: false,
        rideReminders: false,
        promotions: false,
      };
    }

    saveSettings(newSettings);
  };

  const handlePrivacyToggle = (setting: keyof PrivacySettings, value: any) => {
    const newSettings = {
      ...settings,
      privacy: {
        ...settings.privacy,
        [setting]: value,
      },
    };
    saveSettings(newSettings);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'device') => {
    setMode(newTheme);
    const newSettings = {
      ...settings,
      theme: newTheme,
    };
    setSettings(newSettings);
    setSnackbarMessage(`Theme changed to ${newTheme === 'device' ? 'device mode' : newTheme + ' mode'}!`);
    setSnackbarOpen(true);
  };

  const handleChangePassword = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordErrors({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordDialogOpen(true);
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (passwordErrors[field as keyof typeof passwordErrors]) {
      setPasswordErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validatePassword = (password: string): string => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return '';
  };

  const handlePasswordSubmit = async () => {
    // Reset errors
    const errors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };

    // Validate current password
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    // Validate new password
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else {
      const passwordError = validatePassword(passwordData.newPassword);
      if (passwordError) {
        errors.newPassword = passwordError;
      }
    }

    // Validate confirm password
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Check if new password is same as current
    if (passwordData.currentPassword && passwordData.newPassword && 
        passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }

    // If there are errors, show them
    if (Object.values(errors).some(error => error !== '')) {
      setPasswordErrors(errors);
      return;
    }

    try {
      setLoading(true, 'Changing password...');
      
      // Simulate API call to change password
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate API response - in real app, this would verify current password
      // For demo, we'll assume it succeeds if current password is not empty
      
      setPasswordDialogOpen(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setSnackbarMessage('Password changed successfully! Please log in again with your new password.');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Change password error:', error);
      setPasswordErrors({ 
        currentPassword: 'Invalid current password', 
        newPassword: '', 
        confirmPassword: '' 
      });
      setSnackbarMessage('Failed to change password. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    setDeletePassword('');
    setDeletePasswordError('');
    setDeleteConfirmText('');
    setDeleteConfirmError('');
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAccount = async () => {
    // Reset errors
    setDeletePasswordError('');
    setDeleteConfirmError('');

    // Validate password
    if (!deletePassword) {
      setDeletePasswordError('Password is required');
      return;
    }

    // Validate confirmation text
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      setDeleteConfirmError('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }

    try {
      setLoading(true, 'Deleting account...');
      
      // Make API call to delete account
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Assume token is stored
        },
        body: JSON.stringify({
          password: deletePassword,
          confirmDeletion: 'DELETE MY ACCOUNT'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setDeleteDialogOpen(false);
        setSnackbarMessage('Account and all data permanently deleted. You will be logged out.');
        setSnackbarOpen(true);
        
        // Clear local storage and redirect to login after a delay
        setTimeout(() => {
          localStorage.clear();
          window.location.href = '/login';
        }, 3000);
      } else {
        if (data.message.includes('active bookings or rides')) {
          setSnackbarMessage(`${data.message} Active bookings: ${data.details?.activeBookings || 0}, Active rides: ${data.details?.activeRides || 0}`);
        } else if (data.message.includes('Invalid password')) {
          setDeletePasswordError('Incorrect password');
        } else {
          setSnackbarMessage(data.message || 'Failed to delete account. Please try again.');
        }
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Delete account error:', error);
      setSnackbarMessage('Network error. Please check your connection and try again.');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToHelp = () => {
    navigate('/help');
  };

  const handleNavigateToSupport = () => {
    navigate('/support');
  };

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, md: 3 } }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 'bold', 
            mb: 4,
            fontSize: { xs: '1.5rem', md: '2rem' }
          }}
        >
          ⚙️ Settings
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Notification Settings */}
          <Card elevation={2}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <NotificationsIcon color="primary" />
                  <Typography variant="h6">Notifications</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {/* Master notification toggle */}
                  <ListItem>
                    <ListItemIcon>
                      <NotificationsIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Enable Notifications"
                      secondary="Turn on/off all notifications"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings.notifications.enabled}
                        onChange={(e) => handleNotificationToggle('enabled', e.target.checked)}
                        color="primary"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>

                  <Divider />

                  {/* Individual notification settings */}
                  {settings.notifications.enabled ? (
                    <>
                      <ListItem>
                        <ListItemText
                          primary="Bookings"
                          secondary="Get notified about ride bookings and updates"
                          sx={{ ml: 4 }}
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.notifications.bookings}
                            onChange={(e) => handleNotificationToggle('bookings', e.target.checked)}
                            color="primary"
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemText
                          primary="Messages"
                          secondary="Get notified about new messages from other users"
                          sx={{ ml: 4 }}
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.notifications.messages}
                            onChange={(e) => handleNotificationToggle('messages', e.target.checked)}
                            color="primary"
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemText
                          primary="Ride Reminders"
                          secondary="Get reminders about upcoming rides"
                          sx={{ ml: 4 }}
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.notifications.rideReminders}
                            onChange={(e) => handleNotificationToggle('rideReminders', e.target.checked)}
                            color="primary"
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemText
                          primary="Promotions"
                          secondary="Get notified about special offers and promotions"
                          sx={{ ml: 4 }}
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.notifications.promotions}
                            onChange={(e) => handleNotificationToggle('promotions', e.target.checked)}
                            color="primary"
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    </>
                  ) : (
                    <ListItem>
                      <Alert severity="info" sx={{ width: '100%' }}>
                        All notifications are currently disabled. Enable notifications above to customize individual settings.
                      </Alert>
                    </ListItem>
                  )}
                </List>
              </AccordionDetails>
            </Accordion>
          </Card>

          {/* Privacy Settings */}
          <Card elevation={2}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <SecurityIcon color="primary" />
                  <Typography variant="h6">Privacy</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {/* Phone number visibility - only for drivers */}
                  {user.driverVerified && (
                    <ListItem>
                      <ListItemIcon>
                        <SecurityIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Show Phone Number"
                        secondary="Allow passengers to see your phone number when they book your rides"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.privacy.showPhoneNumber}
                          onChange={(e) => handlePrivacyToggle('showPhoneNumber', e.target.checked)}
                          color="primary"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  )}

                  <Divider />

                  {/* Message settings */}
                  <ListItem>
                    <ListItemText
                      primary="Who can message me"
                      secondary="Control who can send you messages on the platform"
                    />
                  </ListItem>

                  <Box sx={{ ml: 2, mr: 2 }}>
                    <FormControl component="fieldset">
                      <RadioGroup
                        value={settings.privacy.messageSettings}
                        onChange={(e) => handlePrivacyToggle('messageSettings', e.target.value)}
                      >
                        <FormControlLabel
                          value="confirmed"
                          control={<Radio />}
                          label={
                            <Box>
                              <Typography variant="body1">Only confirmed bookings</Typography>
                              <Typography variant="body2" color="text.secondary">
                                Only users who have booked your rides can message you
                              </Typography>
                            </Box>
                          }
                        />
                        <FormControlLabel
                          value="all"
                          control={<Radio />}
                          label={
                            <Box>
                              <Typography variant="body1">Anyone</Typography>
                              <Typography variant="body2" color="text.secondary">
                                Any user on the platform can send you messages
                              </Typography>
                            </Box>
                          }
                        />
                      </RadioGroup>
                    </FormControl>
                  </Box>

                  <Alert severity="info" sx={{ mt: 2 }}>
                    💡 Your personal information is always protected. These settings only control visibility within the Ride Club platform.
                  </Alert>
                </List>
              </AccordionDetails>
            </Accordion>
          </Card>

          {/* Theme Settings */}
          <Card elevation={2}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <PaletteIcon color="primary" />
                  <Typography variant="h6">Theme</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="App Theme"
                      secondary="Choose how the app looks"
                    />
                  </ListItem>

                  <Box sx={{ ml: 2, mr: 2 }}>
                    <FormControl component="fieldset">
                      <RadioGroup
                        value={settings.theme}
                        onChange={(e) => handleThemeChange(e.target.value as 'light' | 'dark' | 'device')}
                      >
                        <FormControlLabel
                          value="light"
                          control={<Radio />}
                          label={
                            <Box>
                              <Typography variant="body1">☀️ Light Mode</Typography>
                              <Typography variant="body2" color="text.secondary">
                                Use light theme with bright backgrounds
                              </Typography>
                            </Box>
                          }
                        />
                        <FormControlLabel
                          value="dark"
                          control={<Radio />}
                          label={
                            <Box>
                              <Typography variant="body1">🌙 Dark Mode</Typography>
                              <Typography variant="body2" color="text.secondary">
                                Use dark theme with dark backgrounds
                              </Typography>
                            </Box>
                          }
                        />
                        <FormControlLabel
                          value="device"
                          control={<Radio />}
                          label={
                            <Box>
                              <Typography variant="body1">📱 Device Mode</Typography>
                              <Typography variant="body2" color="text.secondary">
                                Automatically match your device's theme setting
                              </Typography>
                            </Box>
                          }
                        />
                      </RadioGroup>
                    </FormControl>
                  </Box>

                  <Alert severity="info" sx={{ mt: 2 }}>
                    💡 Theme changes will be applied immediately. Device mode will follow your system's light/dark mode setting.
                    {mode === 'device' && (
                      <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium' }}>
                        Currently using: {actualMode === 'dark' ? '🌙 Dark' : '☀️ Light'} (from device settings)
                      </Typography>
                    )}
                  </Alert>
                </List>
              </AccordionDetails>
            </Accordion>
          </Card>

          {/* Account Management */}
          <Card elevation={2}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AccountIcon color="primary" />
                  <Typography variant="h6">Account Management</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  <ListItem button onClick={handleChangePassword}>
                    <ListItemIcon>
                      <LockIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Change Password"
                      secondary="Update your login password"
                    />
                  </ListItem>

                  <Divider />

                  <ListItem button onClick={handleDeleteAccount}>
                    <ListItemIcon>
                      <DeleteIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography color="error">Delete Account</Typography>}
                      secondary="Permanently remove your account and all data"
                    />
                  </ListItem>

                  <Alert severity="warning" sx={{ mt: 2 }}>
                    🛡️ Account deletion is provided to comply with PIPEDA (Canada) and GDPR (EU) data protection regulations. All personal data will be permanently removed from our systems.
                  </Alert>
                </List>
              </AccordionDetails>
            </Accordion>
          </Card>

          {/* Other Settings */}
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <SettingsIcon color="primary" />
                Other Settings
              </Typography>
              
              <List>
                <ListItem button onClick={handleNavigateToHelp}>
                  <ListItemIcon>
                    <HelpIcon />
                  </ListItemIcon>
                  <ListItemText primary="Help & FAQ" />
                </ListItem>

                <ListItem button onClick={handleNavigateToSupport}>
                  <ListItemIcon>
                    <SupportIcon />
                  </ListItemIcon>
                  <ListItemText primary="Contact Support" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* Change Password Dialog */}
        <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Change Password</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter your current password and choose a new secure password.
            </Typography>
            
            <TextField
              fullWidth
              label="Current Password"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
              error={!!passwordErrors.currentPassword}
              helperText={passwordErrors.currentPassword}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
              error={!!passwordErrors.newPassword}
              helperText={passwordErrors.newPassword || 'Must be at least 8 characters with uppercase, lowercase, and number'}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
              error={!!passwordErrors.confirmPassword}
              helperText={passwordErrors.confirmPassword}
            />
            
            <Alert severity="info" sx={{ mt: 2 }}>
              🔒 For your security, you will be logged out after changing your password and will need to log in again.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handlePasswordSubmit} 
              variant="contained"
              disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            >
              Change Password
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Account Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogContent>
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                ⚠️ This action cannot be undone!
              </Typography>
              <Typography variant="body2">
                Deleting your account will permanently remove:
              </Typography>
              <ul>
                <li>All your personal information</li>
                <li>Ride history and bookings</li>
                <li>Messages and reviews</li>
                <li>Vehicle information</li>
                <li>Credit balance and transaction history</li>
              </ul>
            </Alert>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              To confirm account deletion, please enter your password and type the confirmation text below.
            </Typography>

            <TextField
              fullWidth
              label="Enter your password"
              type="password"
              value={deletePassword}
              onChange={(e) => {
                setDeletePassword(e.target.value);
                if (deletePasswordError) setDeletePasswordError('');
              }}
              error={!!deletePasswordError}
              helperText={deletePasswordError}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Type DELETE MY ACCOUNT to confirm"
              value={deleteConfirmText}
              onChange={(e) => {
                setDeleteConfirmText(e.target.value);
                if (deleteConfirmError) setDeleteConfirmError('');
              }}
              error={!!deleteConfirmError}
              helperText={deleteConfirmError || 'Type exactly: DELETE MY ACCOUNT'}
              placeholder="DELETE MY ACCOUNT"
              sx={{ mb: 2 }}
            />

            <Alert severity="warning" sx={{ mt: 2 }}>
              🛡️ This complies with PIPEDA (Canada) and GDPR (EU) data protection regulations. 
              All personal data will be permanently removed from our systems.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={confirmDeleteAccount} 
              color="error" 
              variant="contained"
              disabled={!deletePassword || deleteConfirmText !== 'DELETE MY ACCOUNT'}
            >
              Delete My Account
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success/Error Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
        />
      </Container>
    </Box>
  );
};

export default SettingsPage;