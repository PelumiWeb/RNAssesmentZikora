import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radii, spacing, type } from '../theme/tokens';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'solid' | 'outline';
  style?: ViewStyle;
  accessibilityHint?: string;
};

export const Button = ({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'solid',
  style,
  accessibilityHint,
}: Props) => {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'solid' ? styles.solid : styles.outline,
        pressed && !inactive && variant === 'solid' && { backgroundColor: colors.primaryPressed },
        inactive && variant === 'solid' && { backgroundColor: colors.primaryDisabled },
        inactive && variant === 'outline' && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'solid' ? colors.surface : colors.primary} />
      ) : (
        <Text style={[styles.label, variant === 'outline' && { color: colors.headingGreen }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 54,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  solid: { backgroundColor: colors.primary },
  outline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary },
  label: { ...type.bodyStrong, color: colors.surface },
});
