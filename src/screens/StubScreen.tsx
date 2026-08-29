import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, type } from '../theme/tokens';

/** Budget / Cards / Account are explicitly out of scope; they exist so the tab bar matches. */
export const StubScreen = ({ title }: { title: string }) => (
  <SafeAreaView style={styles.safe} edges={['top']}>
    <View style={styles.body}>
      <Text style={type.h2}>{title}</Text>
      <Text style={styles.note}>Not part of the assessed flow.</Text>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  note: { ...type.body, color: colors.textMuted },
});
