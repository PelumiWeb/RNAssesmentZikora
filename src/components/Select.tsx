import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, type } from '../theme/tokens';

export type SelectOption = { value: string; label: string; sublabel?: string };

type Props = {
  label: string;
  placeholder: string;
  options: readonly SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  optionalHint?: boolean;
  error?: string;
  testID?: string;
};

export const Select = ({
  label,
  placeholder,
  options,
  value,
  onChange,
  optionalHint = false,
  error,
  testID,
}: Props) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {optionalHint && <Text style={styles.optional}>Optional</Text>}
      </View>

      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected?.label ?? placeholder }}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={[styles.field, !!error && styles.fieldError]}
      >
        <Text style={selected ? styles.value : styles.placeholder} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.text} />
      </Pressable>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{label}</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: item.value === value }}
                style={styles.option}
                onPress={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
              >
                <View style={styles.optionBody}>
                  <Text style={styles.optionLabel}>{item.label}</Text>
                  {!!item.sublabel && <Text style={styles.optionSub}>{item.sublabel}</Text>}
                </View>
                {item.value === value && (
                  <Ionicons name="checkmark" size={20} color={colors.headingGreen} />
                )}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.lg },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: { ...type.label, color: colors.text },
  optional: { ...type.caption, color: colors.headingGreen },
  field: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.lg,
  },
  fieldError: { borderColor: colors.debitRed },
  value: { ...type.body, color: colors.text, flex: 1 },
  placeholder: { ...type.body, color: colors.placeholder, flex: 1 },
  error: { ...type.caption, color: colors.debitRed, marginTop: spacing.xs },
  backdrop: { flex: 1, backgroundColor: '#00000055' },
  sheet: {
    maxHeight: '60%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
  },
  sheetTitle: { ...type.h3, color: colors.text, marginBottom: spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionBody: { flex: 1 },
  optionLabel: { ...type.body, color: colors.text },
  optionSub: { ...type.caption, color: colors.textMuted },
});
