import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Banner } from '../components/Banner';
import { DevOfflineToggle } from '../components/DevOfflineToggle';
import { TransactionRow } from '../components/TransactionRow';
import { RootStackParamList } from '../navigation/types';
import { useAccount, useRecentTransactions } from '../hooks/useTransactions';
import { formatNaira } from '../lib/money';
import { formatRelativeTime, greetingForHour } from '../lib/time';
import { ACCOUNT } from '../services/mock/fixtures';
import { colors, radii, spacing, type } from '../theme/tokens';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ACTIONS = [
  { key: 'transfer', label: 'Transfer', icon: 'swap-horizontal-outline' },
  { key: 'data', label: 'Buy Data', icon: 'phone-portrait-outline' },
  { key: 'help', label: 'Help', icon: 'chatbubble-ellipses-outline' },
  { key: 'savings', label: 'Savings', icon: 'wallet-outline' },
] as const;

const PREVIEW_COUNT = 6;

export const HomeScreen = () => {
  const navigation = useNavigation<Nav>();
  const account = useAccount();
  const recent = useRecentTransactions();

  const [balanceHidden, setBalanceHidden] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }, []);

  const onCopy = async () => {
    await Clipboard.setStringAsync(ACCOUNT.accountNumber);
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1500);
  };

  const balance = account.data?.balance ?? ACCOUNT.balance;
  const rows = recent.transactions.slice(0, PREVIEW_COUNT);

  // dataUpdatedAt only moves on a successful fetch, so a failed refresh leaves this stale.
  const lastUpdated = recent.dataUpdatedAt
    ? formatRelativeTime(recent.dataUpdatedAt)
    : 'never';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={recent.isRefetching}
            onRefresh={() => {
              void recent.refetch();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {ACCOUNT.name.split(' ').map((p) => p[0]).join('')}
            </Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.greeting} numberOfLines={1}>
              {greetingForHour(new Date().getHours())} {ACCOUNT.name.split(' ')[0]}
            </Text>
            <Text style={styles.subGreeting}>Welcome to Zikora</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Add" style={styles.plus}>
            <Ionicons name="add" size={22} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.accountRow}>
          <Text style={styles.accountLabel}>
            Account Number: {ACCOUNT.accountNumber}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Copy account number"
            hitSlop={12}
            onPress={() => void onCopy()}
          >
            <Ionicons name="copy-outline" size={18} color={colors.text} />
          </Pressable>
          {copied && <Text style={styles.copied}>Copied</Text>}
        </View>

        <Text style={styles.balanceLabel}>Your Balance</Text>
        <View style={styles.balanceRow}>
          <Text
            style={styles.balance}
            accessibilityLabel={
              balanceHidden ? 'Balance hidden' : `Balance ${formatNaira(balance)}`
            }
          >
            {balanceHidden ? '₦ ••••••' : formatNaira(balance)}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={balanceHidden ? 'Show balance' : 'Hide balance'}
            accessibilityState={{ checked: !balanceHidden }}
            hitSlop={12}
            onPress={() => setBalanceHidden((h) => !h)}
          >
            <Ionicons
              name={balanceHidden ? 'eye-outline' : 'eye-off-outline'}
              size={22}
              color={colors.text}
            />
          </Pressable>
        </View>
        <Text style={styles.lastUpdated}>Last Updated: {lastUpdated}</Text>

        {recent.isError && (
          <View style={styles.bannerWrap}>
            <Banner
              tone="warning"
              message={
                recent.error instanceof Error
                  ? recent.error.message
                  : "We couldn't refresh right now."
              }
            />
          </View>
        )}

        <View style={styles.actionCard}>
          {ACTIONS.map((action) => (
            <Pressable
              key={action.key}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              style={styles.action}
              onPress={() => {
                if (action.key === 'transfer') navigation.navigate('Tabs', { screen: 'Pay' });
              }}
            >
              <View style={styles.actionIcon}>
                <Ionicons name={action.icon} size={22} color={colors.darkCard} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="See all transactions"
            onPress={() => navigation.navigate('AllTransactions')}
          >
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>

        {rows.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} />
        ))}

        <DevOfflineToggle />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...type.label, color: colors.headingGreen, fontWeight: '700' },
  headerText: { flex: 1 },
  greeting: { ...type.h3, color: colors.text },
  subGreeting: { ...type.body, color: colors.textMuted },
  plus: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
  accountLabel: { ...type.body, color: colors.text },
  copied: { ...type.caption, color: colors.creditGreen },
  balanceLabel: { ...type.body, color: colors.text, marginTop: spacing.md },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  balance: { fontSize: 30, lineHeight: 38, fontWeight: '700', color: colors.text },
  lastUpdated: { ...type.caption, color: colors.textMuted, marginTop: spacing.xs },
  bannerWrap: { marginTop: spacing.md },
  actionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.darkCard,
    borderRadius: radii.md,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  action: { alignItems: 'center', gap: spacing.sm, flex: 1 },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { ...type.caption, color: colors.surface },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
  },
  sectionTitle: { ...type.h3, color: colors.text },
  seeAll: { ...type.label, color: colors.textMuted },
});
