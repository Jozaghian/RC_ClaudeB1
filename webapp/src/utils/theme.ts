import { createTheme } from '@mui/material/styles';

// Modern Color Palette - Fresh and Professional
export const colors = {
  // Primary Brand Colors (Blue-Green Gradient)
  primary: '#2563EB',        // Modern bright blue
  primaryDark: '#1D4ED8',    // Darker blue
  primaryLight: '#3B82F6',   // Lighter blue
  
  // Secondary Colors (Complementary)
  secondary: '#10B981',      // Fresh emerald green
  secondaryDark: '#059669',  // Darker emerald
  secondaryLight: '#34D399', // Lighter emerald
  
  // Accent Colors (Canadian Red)
  accent: '#EF4444',         // Canadian red accent
  accentDark: '#DC2626',     // Darker red
  accentLight: '#F87171',    // Lighter red
  
  // Status Colors
  success: '#10B981',        // Emerald green
  warning: '#F59E0B',        // Amber
  error: '#EF4444',          // Red
  info: '#3B82F6',           // Blue
  
  // Text Colors
  text: '#111827',           // Very dark gray (almost black)
  textSecondary: '#6B7280',  // Medium gray
  textLight: '#9CA3AF',      // Light gray
  textDisabled: '#D1D5DB',   // Very light gray
  
  // Background Colors
  background: '#FFFFFF',     // Pure white
  backgroundSecondary: '#F9FAFB', // Very light gray
  backgroundAccent: '#F3F4F6', // Light gray
  surface: '#FFFFFF',        // White surface
  
  // Border Colors
  border: '#E5E7EB',         // Light gray border
  borderLight: '#F3F4F6',    // Very light border
  borderStrong: '#D1D5DB',   // Stronger border
  
  // Utility Colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  
  // Extended Gray Scale
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Gradient Colors
  gradientStart: '#2563EB',  // Blue
  gradientEnd: '#10B981',    // Emerald
};

// Modern Typography with Google Fonts
export const typography = {
  fontFamily: '"Inter", "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Border radius
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  round: 50,
};

// Shadows
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

// Modern Material-UI theme with enhanced styling
export const muiTheme = createTheme({
  palette: {
    primary: {
      main: colors.primary,
      dark: colors.primaryDark,
      light: colors.primaryLight,
      contrastText: colors.white,
    },
    secondary: {
      main: colors.secondary,
      dark: colors.secondaryDark,
      light: colors.secondaryLight,
      contrastText: colors.white,
    },
    success: {
      main: colors.success,
      contrastText: colors.white,
    },
    warning: {
      main: colors.warning,
      contrastText: colors.white,
    },
    error: {
      main: colors.error,
      contrastText: colors.white,
    },
    info: {
      main: colors.info,
      contrastText: colors.white,
    },
    background: {
      default: colors.background,
      paper: colors.surface,
    },
    text: {
      primary: colors.text,
      secondary: colors.textSecondary,
      disabled: colors.textDisabled,
    },
    divider: colors.border,
  },
  typography: {
    fontFamily: typography.fontFamily,
    h1: {
      fontSize: typography.fontSize['5xl'],
      fontWeight: typography.fontWeight.extrabold,
      lineHeight: typography.lineHeight.tight,
      fontFamily: '"Poppins", sans-serif',
    },
    h2: {
      fontSize: typography.fontSize['4xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.tight,
      fontFamily: '"Poppins", sans-serif',
    },
    h3: {
      fontSize: typography.fontSize['3xl'],
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.tight,
      fontFamily: '"Poppins", sans-serif',
    },
    h4: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.normal,
      fontFamily: '"Poppins", sans-serif',
    },
    h5: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.normal,
      fontFamily: '"Poppins", sans-serif',
    },
    h6: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight.normal,
      fontFamily: '"Poppins", sans-serif',
    },
    body1: {
      fontSize: typography.fontSize.base,
      lineHeight: typography.lineHeight.normal,
      fontFamily: '"Inter", sans-serif',
    },
    body2: {
      fontSize: typography.fontSize.sm,
      lineHeight: typography.lineHeight.normal,
      fontFamily: '"Inter", sans-serif',
    },
    button: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      textTransform: 'none' as const,
      fontFamily: '"Inter", sans-serif',
    },
  },
  shape: {
    borderRadius: borderRadius.lg,
  },
  spacing: spacing.sm,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.lg,
          padding: `${spacing.md}px ${spacing.lg}px`,
          fontWeight: typography.fontWeight.semibold,
          textTransform: 'none',
          fontSize: typography.fontSize.base,
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: shadows.md,
          },
        },
        contained: {
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
          color: colors.white,
          '&:hover': {
            background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.primary} 100%)`,
            transform: 'translateY(-2px)',
            boxShadow: shadows.lg,
          },
        },
        outlined: {
          borderWidth: '2px',
          borderColor: colors.primary,
          color: colors.primary,
          '&:hover': {
            borderWidth: '2px',
            backgroundColor: `${colors.primary}08`,
            transform: 'translateY(-1px)',
          },
        },
        sizeLarge: {
          padding: `${spacing.lg}px ${spacing.xl}px`,
          fontSize: typography.fontSize.lg,
          borderRadius: borderRadius.xl,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.xl,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: `1px solid ${colors.borderLight}`,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: borderRadius.lg,
            fontSize: typography.fontSize.base,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.primary,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.primary,
              borderWidth: '2px',
            },
          },
          '& .MuiInputLabel-root': {
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.medium,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.xl,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
        elevation2: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
        elevation3: {
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.round,
          fontWeight: typography.fontWeight.medium,
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (min-width: 1200px)': {
            maxWidth: '1140px',
          },
        },
      },
    },
  },
});

export default muiTheme;