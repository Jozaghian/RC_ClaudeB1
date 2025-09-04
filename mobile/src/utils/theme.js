import { DefaultTheme } from '@react-navigation/native';
import { MD3LightTheme } from 'react-native-paper';

// Color palette for Ride Club
export const colors = {
  // Primary colors (Canadian inspired)
  primary: '#1976D2',      // Bright blue
  primaryDark: '#1565C0',  // Darker blue
  primaryLight: '#42A5F5', // Lighter blue
  
  // Secondary colors
  secondary: '#FF6B35',    // Orange accent
  secondaryDark: '#E55100',
  secondaryLight: '#FF8A65',
  
  // Neutral colors
  background: '#FFFFFF',
  surface: '#F8F9FA',
  surfaceDark: '#E9ECEF',
  
  // Text colors
  text: '#212529',
  textSecondary: '#6C757D',
  textLight: '#ADB5BD',
  
  // Status colors
  success: '#28A745',
  warning: '#FFC107',
  error: '#DC3545',
  info: '#17A2B8',
  
  // Grayscale
  white: '#FFFFFF',
  black: '#000000',
  gray100: '#F8F9FA',
  gray200: '#E9ECEF',
  gray300: '#DEE2E6',
  gray400: '#CED4DA',
  gray500: '#ADB5BD',
  gray600: '#6C757D',
  gray700: '#495057',
  gray800: '#343A40',
  gray900: '#212529',
  
  // Ride Club specific colors
  driver: '#1976D2',       // Blue for drivers
  passenger: '#28A745',    // Green for passengers
  credit: '#FF6B35',       // Orange for credits
  premium: '#6F42C1',      // Purple for premium features
  
  // Canadian theme colors
  maple: '#FF0000',        // Canada red
  winter: '#B3E5FC',       // Winter blue
  forest: '#2E7D32',       // Forest green
  
  // Transparent overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.2)',
};

// Typography
export const typography = {
  // Font families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    light: 'System',
  },
  
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
    display: 36,
  },
  
  // Font weights
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    loose: 1.75,
  },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border radius
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

// Shadows
export const shadows = {
  small: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// React Navigation theme
export const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.white,
    text: colors.text,
    border: colors.gray300,
    notification: colors.error,
  },
};

// React Native Paper theme
export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryLight,
    surface: colors.surface,
    surfaceVariant: colors.gray200,
    background: colors.background,
    error: colors.error,
    errorContainer: '#FFEBEE',
    onPrimary: colors.white,
    onSecondary: colors.white,
    onSurface: colors.text,
    onBackground: colors.text,
    outline: colors.gray400,
  },
};

// Component styles
export const componentStyles = {
  // Button styles
  button: {
    primary: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
      ...shadows.small,
    },
    secondary: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
    },
    text: {
      backgroundColor: 'transparent',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
  },
  
  // Card styles
  card: {
    default: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      ...shadows.medium,
    },
    flat: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.gray200,
    },
  },
  
  // Input styles
  input: {
    default: {
      borderWidth: 1,
      borderColor: colors.gray400,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: typography.fontSize.base,
      backgroundColor: colors.white,
    },
    focused: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    error: {
      borderColor: colors.error,
    },
  },
};

// Layout constants
export const layout = {
  // Screen padding
  screenPadding: spacing.md,
  
  // Header height
  headerHeight: 56,
  
  // Tab bar height
  tabBarHeight: 60,
  
  // Button heights
  buttonHeight: {
    small: 36,
    medium: 44,
    large: 52,
  },
  
  // Icon sizes
  iconSize: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 48,
  },
  
  // Avatar sizes
  avatarSize: {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  },
};

// Animation durations
export const animations = {
  fast: 150,
  normal: 300,
  slow: 500,
};

// Export complete theme object
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  navigation: navigationTheme,
  paper: paperTheme,
  components: componentStyles,
  layout,
  animations,
};

export default theme;