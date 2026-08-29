import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Transaction,
  accessibleAmountLabel,
  signedAmountLabel,
  transactionTitle,
} from '../domain/transactions';
import { formatTransactionDate } from '../lib/time';
import { colors, radii, spacing, type } from '../theme/tokens';

export const ROW_HEIGHT = 72;

/** memo + a fixed height keep the 3,000-row list cheap to recycle. */
export const TransactionRow = memo(({ tx }: { tx: Transaction }) => {
  const credit = tx.direction === 'credit';
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${accessibleAmountLabel(tx)}, ${formatTransactionDate(tx.timestamp)}`}
    >
      <View style={[styles.icon, { backgroundColor: credit ? '#E4F1E7' : '#FDE7E7' }]}>
        <Ionicons
          name={credit ? 'arrow-down-outline' : 'arrow-up-outline'}
          size={18}
          color={credit ? colors.creditGreen : colors.debitRed}
        />
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {transactionTitle(tx)}
        </Text>
        <Text style={styles.date} numberOfLines={1}>
          {formatTransactionDate(tx.timestamp)}
        </Text>
      </View>

      <Text
        style={[styles.amount, { color: credit ? colors.creditGreen : colors.debitRed }]}
        numberOfLines={1}
      >
        {signedAmountLabel(tx)}
      </Text>
    </View>
  );
});

TransactionRow.displayName = 'TransactionRow';

const styles = StyleSheet.create({
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { ...type.bodyStrong, color: colors.text },
  date: { ...type.caption, color: colors.textMuted, marginTop: 2 },
  amount: { ...type.bodyStrong },
});
