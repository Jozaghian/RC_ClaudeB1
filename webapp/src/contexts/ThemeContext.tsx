import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createTheme, Theme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/theme';

type ThemeMode = 'light' | 'dark' | 'device';

interface ThemeContextType {
  mode: ThemeMode;
  actualMode: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Dark mode colors
const darkColors = {
  primary: '#81C784',
  primaryDark: '#4CAF50',
  secondary: '#BB86FC',
  success: '#03DAC6',
  warning: '#FFC107',
  error: '#CF6679',
  info: '#03DAC6',
  
  // Dark text colors
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textLight: '#999999',
  textDisabled: '#666666',
  
  // Dark background colors
  background: '#121212',
  backgroundSecondary: '#1E1E1E',
  surface: '#1E1E1E',
  
  // Dark border colors
  border: '#333333',
  borderLight: '#2A2A2A',
  
  // Utility colors (unchanged)
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  
  // Dark gray scale
  gray50: '#1E1E1E',
  gray100: '#2A2A2A',
  gray200: '#363636',
  gray300: '#424242',
  gray400: '#5A5A5A',
  gray500: '#6E6E6E',
  gray600: '#828282',
  gray700: '#969696',
  gray800: '#AAAAAA',
  gray900: '#BEBEBE',
};

const createAppTheme = (mode: 'light' | 'dark'): Theme => {
  const themeColors = mode === 'dark' ? darkColors : colors;
  
  return createTheme({
    palette: {
      mode,
      primary: {
        main: themeColors.primary,
        dark: themeColors.primaryDark,
        contrastText: mode === 'dark' ? '#000000' : '#FFFFFF',
      },
      secondary: {
        main: themeColors.secondary,
        contrastText: '#FFFFFF',
      },
      success: {
        main: themeColors.success,
      },
      warning: {
        main: themeColors.warning,
      },
      error: {
        main: themeColors.error,
      },
      info: {
        main: themeColors.info,
      },
      background: {
        default: themeColors.background,
        paper: themeColors.surface,
      },
      text: {
        primary: themeColors.text,
        secondary: themeColors.textSecondary,
        disabled: themeColors.textDisabled,
      },
      divider: themeColors.border,
    },
    typography: {
      fontFamily: typography.fontFamily,
      h1: {
        fontSize: typography.fontSize['5xl'],
        fontWeight: typography.fontWeight.bold,
        lineHeight: typography.lineHeight.tight,
      },
      h2: {
        fontSize: typography.fontSize['4xl'],
        fontWeight: typography.fontWeight.bold,
        lineHeight: typography.lineHeight.tight,
      },
      h3: {
        fontSize: typography.fontSize['3xl'],
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.lineHeight.tight,
      },
      h4: {
        fontSize: typography.fontSize['2xl'],
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.lineHeight.normal,
      },
      h5: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.medium,
        lineHeight: typography.lineHeight.normal,
      },
      h6: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.medium,
        lineHeight: typography.lineHeight.normal,
      },
      body1: {
        fontSize: typography.fontSize.base,
        lineHeight: typography.lineHeight.normal,
      },
      body2: {
        fontSize: typography.fontSize.sm,
        lineHeight: typography.lineHeight.normal,
      },
      button: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        textTransform: 'none' as const,
      },
    },
    shape: {
      borderRadius: borderRadius.md,
    },
    spacing: spacing.sm,
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: borderRadius.md,
            padding: `${spacing.sm}px ${spacing.md}px`,
            fontWeight: typography.fontWeight.medium,
            textTransform: 'none',
          },
          contained: {
            backgroundColor: mode === 'dark' ? '#4CAF50' : '#4CAF50',
            boxShadow: shadows.sm,
            '&:hover': {
              backgroundColor: mode === 'dark' ? '#388E3C' : '#388E3C',
              boxShadow: shadows.md,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: borderRadius.lg,
            boxShadow: mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : shadows.sm,
            backgroundColor: themeColors.surface,
            '&:hover': {
              boxShadow: mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.4)' : shadows.md,
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: borderRadius.md,
              backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'transparent',
              '& fieldset': {
                borderColor: mode === 'dark' ? '#333333' : '#E1E8ED',
              },
              '&:hover fieldset': {
                borderColor: mode === 'dark' ? '#555555' : '#CCCCCC',
              },
              '&.Mui-focused fieldset': {
                borderColor: themeColors.primary,
              },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: themeColors.surface,
          },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            backgroundColor: themeColors.surface,
            '&:before': {
              backgroundColor: themeColors.border,
            },
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            },
          },
        },
      },
    },
  });
};

// Helper function to detect system theme preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    // Load theme from localStorage or default to 'device'
    const saved = localStorage.getItem('ride-club-theme');
    return (saved as ThemeMode) || 'device';
  });

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Determine actual theme to use
  const actualMode = mode === 'device' ? systemTheme : mode;

  // Create theme based on actual mode
  const theme = createAppTheme(actualMode);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('ride-club-theme', newMode);
  };

  const contextValue: ThemeContextType = {
    mode,
    actualMode,
    setMode,
    theme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useThemeContext = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};