import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, type } from '../theme/tokens';

export type BannerTone = 'error' | 'warning';

const TONES: Record<BannerTone, { bg: string; fg: string; icon: keyof typeof Ionicons.glyphMap }> =
  {
    error: { bg: '#FDECEC', fg: colors.debitRed, icon: 'alert-circle-outline' },
    warning: { bg: '#FFF6E6', fg: '#B26B00', icon: 'help-circle-outline' },
  };

/**
 * Failure and uncertainty are shown here and never dressed as success -- an uncertain
 * outcome gets the warning tone and its own wording, not the error copy.
 */
export const Banner = ({ tone, message }: { tone: BannerTone; message: string }) => {
  const t = TONES[tone];
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.wrap, { backgroundColor: t.bg }]}
    >
      <Ionicons name={t.icon} size={20} color={t.fg} />
      <Text style={[styles.text, { color: t.fg }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.sm,
    marginBottom: spacing.lg,
  },
  text: { ...type.label, flex: 1 },
});
