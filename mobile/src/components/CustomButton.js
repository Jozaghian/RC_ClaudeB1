import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/theme';

const CustomButton = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon = null,
  style = {},
  textStyle = {},
  gradient = false,
  fullWidth = false,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary,
          color: colors.white,
        };
      case 'secondary':
        return {
          backgroundColor: colors.white,
          borderColor: colors.primary,
          borderWidth: 1.5,
          color: colors.primary,
        };
      case 'success':
        return {
          backgroundColor: colors.success,
          color: colors.white,
        };
      case 'warning':
        return {
          backgroundColor: colors.warning,
          color: colors.white,
        };
      case 'error':
        return {
          backgroundColor: colors.error,
          color: colors.white,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.gray400,
          borderWidth: 1,
          color: colors.text,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: colors.primary,
        };
      case 'driver':
        return {
          backgroundColor: colors.driver,
          color: colors.white,
        };
      case 'passenger':
        return {
          backgroundColor: colors.passenger,
          color: colors.white,
        };
      default:
        return {
          backgroundColor: colors.primary,
          color: colors.white,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          fontSize: typography.fontSize.sm,
          height: 36,
        };
      case 'medium':
        return {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          fontSize: typography.fontSize.base,
          height: 44,
        };
      case 'large':
        return {
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.lg,
          fontSize: typography.fontSize.lg,
          height: 52,
        };
      default:
        return {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          fontSize: typography.fontSize.base,
          height: 44,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const buttonStyles = [
    styles.button,
    {
      backgroundColor: variantStyles.backgroundColor,
      borderColor: variantStyles.borderColor,
      borderWidth: variantStyles.borderWidth || 0,
      paddingHorizontal: sizeStyles.paddingHorizontal,
      paddingVertical: sizeStyles.paddingVertical,
      height: sizeStyles.height,
      width: fullWidth ? '100%' : 'auto',
    },
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    {
      color: variantStyles.color,
      fontSize: sizeStyles.fontSize,
    },
    disabled && styles.disabledText,
    textStyle,
  ];

  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      onPress();
    }
  };

  const renderContent = () => (
    <>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyles.color}
          style={icon ? { marginRight: spacing.sm } : {}}
        />
      ) : (
        icon && <View style={{ marginRight: spacing.sm }}>{icon}</View>
      )}
      <Text style={textStyles} numberOfLines={1}>
        {title}
      </Text>
    </>
  );

  if (gradient && (variant === 'primary' || variant === 'driver' || variant === 'passenger')) {
    const gradientColors = variant === 'passenger' 
      ? [colors.success, colors.passenger]
      : variant === 'driver'
      ? [colors.primary, colors.primaryLight]
      : [colors.primary, colors.primaryLight];

    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        {...props}
      >
        <LinearGradient
          colors={gradientColors}
          style={[buttonStyles, { backgroundColor: 'transparent' }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.content}>
            {renderContent()}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      <View style={styles.content}>
        {renderContent()}
      </View>
    </TouchableOpacity>
  );
};

// Specialized button components
export const DriverButton = (props) => (
  <CustomButton variant="driver" gradient {...props} />
);

export const PassengerButton = (props) => (
  <CustomButton variant="passenger" gradient {...props} />
);

export const CreditButton = (props) => (
  <CustomButton
    variant="primary"
    gradient
    icon={<Text style={{ color: colors.white, fontSize: 16 }}>💳</Text>}
    {...props}
  />
);

export const EmergencyButton = (props) => (
  <CustomButton
    variant="error"
    icon={<Text style={{ color: colors.white, fontSize: 16 }}>🚨</Text>}
    {...props}
  />
);

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  disabled: {
    backgroundColor: colors.gray300,
    opacity: 0.6,
  },
  disabledText: {
    color: colors.gray500,
  },
});

export default CustomButton;