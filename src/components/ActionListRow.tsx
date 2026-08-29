import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, type } from '../theme/tokens';

type Props = {
  title: string;
  subtitle: string;
  onPress?: () => void;
  /** Rows without a live destination stay visible but announce themselves as disabled. */
  disabled?: boolean;
};

export const ActionListRow = ({ title, subtitle, onPress, disabled = false }: Props) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={title}
    accessibilityHint={disabled ? 'Not available in this build' : subtitle}
    accessibilityState={{ disabled }}
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => [styles.row, pressed && !disabled && styles.pressed]}
  >
    <View style={styles.body}>
      <Text style={[styles.title, disabled && styles.muted]}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
    <Ionicons
      name="chevron-forward"
      size={20}
      color={disabled ? colors.placeholder : colors.text}
    />
  </Pressable>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  pressed: { backgroundColor: colors.trackInactive },
  body: { flex: 1 },
  title: { ...type.bodyStrong, color: colors.text },
  muted: { color: colors.textMuted },
  subtitle: { ...type.caption, color: colors.textMuted, marginTop: 2 },
});
