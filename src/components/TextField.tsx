import { useState } from 'react';
import {
  KeyboardTypeOptions,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, type } from '../theme/tokens';

type Props = {
  label: string;
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  variant?: 'pill' | 'underline';
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  error?: string;
  autoCapitalize?: 'none' | 'sentences';
  testID?: string;
};

export const TextField = ({
  label,
  value,
  onChangeText,
  placeholder,
  variant = 'pill',
  secure = false,
  keyboardType,
  maxLength,
  error,
  autoCapitalize = 'none',
  testID,
}: Props) => {
  const [hidden, setHidden] = useState(secure);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.field,
          variant === 'pill' ? styles.pill : styles.underline,
          !!error && styles.fieldError,
        ]}
      >
        <TextInput
          testID={testID}
          accessibilityLabel={label}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
        />
        {secure && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            hitSlop={12}
            onPress={() => setHidden((h) => !h)}
          >
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={22}
              color={colors.text}
            />
          </Pressable>
        )}
      </View>
      {!!error && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.lg },
  label: { ...type.label, color: colors.text, marginBottom: spacing.sm },
  field: { flexDirection: 'row', alignItems: 'center' },
  pill: {
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
  },
  underline: {
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
  },
  fieldError: { borderColor: colors.debitRed, borderBottomColor: colors.debitRed },
  input: { flex: 1, ...type.body, color: colors.text, paddingVertical: 0 },
  error: { ...type.caption, color: colors.debitRed, marginTop: spacing.xs },
});
