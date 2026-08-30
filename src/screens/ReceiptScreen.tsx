import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { canViewReceipt } from '../domain/transfer';
import { useTransferStore } from '../state/transferStore';
import { formatNaira } from '../lib/money';
import { formatReceiptDate } from '../lib/time';
import { ACCOUNT } from '../services/mock/fixtures';
import { colors, radii, spacing, type } from '../theme/tokens';

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <View style={styles.rowValue}>{children}</View>
  </View>
);

export const ReceiptScreen = () => {
  const navigation = useNavigation();
  const state = useTransferStore((s) => s.state);

  // The one gate. Anything that is not a confirmed success cannot render a receipt,
  // however the user arrived here.
  if (!canViewReceipt(state) || !state.intent || !state.receipt) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.blocked}>
          <Ionicons name="lock-closed-outline" size={28} color={colors.textMuted} />
          <Text style={styles.blockedText}>
            No confirmed transfer to show a receipt for.
          </Text>
          <Pressable accessibilityRole="button" onPress={() => navigation.goBack()}>
            <Text style={styles.blockedLink}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { intent, receipt } = state;
  const narration = intent.remark ?? intent.category ?? 'Transfer';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoMark}>Z</Text>
          <Text style={styles.logoWord}>ZIKORA</Text>
        </View>
        <Text style={styles.headerTitle}>TRANSACTION RECEIPT</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close receipt"
          hitSlop={12}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.dateBand}>
        <Text style={styles.dateText}>{formatReceiptDate(receipt.completedAt)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Row label="Transaction Amount">
          <Text style={styles.value}>{formatNaira(intent.amount)}</Text>
        </Row>
        <Row label="Transaction Type">
          <Text style={styles.value}>INTER-BANK</Text>
        </Row>
        <Row label="Sender">
          <Text style={styles.value}>{ACCOUNT.name}</Text>
        </Row>
        <Row label="Beneficiary">
          <Text style={styles.value}>{intent.accountName}</Text>
          <Text style={styles.value}>{intent.accountNumber}</Text>
          <Text style={styles.value}>{intent.bankName}</Text>
        </Row>
        <Row label="Narration">
          <Text style={styles.value}>{narration}</Text>
        </Row>
        <Row label="Reference">
          <Text style={styles.value}>{receipt.reference}</Text>
        </Row>
        <Row label="Transaction Status">
          <Text style={styles.value}>Transfer Request Successful</Text>
        </Row>

        <View style={styles.divider} />

        <Text style={styles.disclaimerTitle}>DISCLAIMER</Text>
        <Text style={styles.disclaimer}>
          Please review the details carefully; if discrepancies are noted, contact customer
          support within 24 hours. This receipt does not constitute a contractual
          obligation, and all transactions are subject to bank terms and conditions.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Contact us @zikora&apos;s email and phone number</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  blocked: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  blockedText: { ...type.body, color: colors.textMuted, textAlign: 'center' },
  blockedLink: { ...type.bodyStrong, color: colors.headingGreen },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  logo: { alignItems: 'center' },
  logoMark: { fontSize: 22, fontWeight: '700', color: colors.primary, lineHeight: 24 },
  logoWord: { fontSize: 7, letterSpacing: 2, color: colors.textMuted },
  headerTitle: { ...type.bodyStrong, color: colors.text, flex: 1, textAlign: 'center' },
  dateBand: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  dateText: { ...type.label, color: colors.surface },
  content: { padding: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  rowLabel: { ...type.body, color: colors.textMuted, flexShrink: 0 },
  rowValue: { flex: 1, alignItems: 'flex-end' },
  value: { ...type.bodyStrong, color: colors.text, textAlign: 'right' },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  disclaimerTitle: {
    ...type.bodyStrong,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  disclaimer: { ...type.body, color: colors.textMuted, textAlign: 'center' },
  footer: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderTopLeftRadius: radii.sm,
    borderTopRightRadius: radii.sm,
  },
  footerText: { ...type.label, color: colors.surface },
});
