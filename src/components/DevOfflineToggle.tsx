import { StyleSheet, Switch, Text, View } from 'react-native';
import { useDevFlags } from '../services/mock/devFlags';
import { colors, radii, spacing, type } from '../theme/tokens';

/** Dev-only affordance so an evaluator can reproduce the offline branch on demand. */
export const DevOfflineToggle = () => {
  const forceOffline = useDevFlags((s) => s.forceOffline);
  const setForceOffline = useDevFlags((s) => s.setForceOffline);

  if (!__DEV__) return null;

  return (
    <View style={styles.row}>
      <Text style={styles.label}>Force offline (dev)</Text>
      <Switch
        accessibilityLabel="Force offline mode"
        value={forceOffline}
        onValueChange={setForceOffline}
        trackColor={{ true: colors.primary, false: colors.trackInactive }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.sm,
    marginTop: spacing.md,
  },
  label: { ...type.caption, color: colors.textMuted },
});
