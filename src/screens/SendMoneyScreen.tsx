import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Banner } from '../components/Banner';
import { Button } from '../components/Button';
import { Select } from '../components/Select';
import { TextField } from '../components/TextField';
import { DevOfflineToggle } from '../components/DevOfflineToggle';
import { RootStackParamList } from '../navigation/types';
import { feeForAmount } from '../domain/fees';
import {
  TransferFormInput,
  createTransferIntent,
  validateTransferForm,
} from '../domain/transferIntent';
import { useTransfer } from '../hooks/useTransfer';
import { useTransferStore } from '../state/transferStore';
import { useAccount } from '../hooks/useTransactions';
import { Kobo, formatNaira, kobo, parseAmountToKobo } from '../lib/money';
import { ACCOUNT, BANKS, BENEFICIARIES, SOURCE_ACCOUNTS } from '../services/mock/fixtures';
import { colors, radii, spacing, type } from '../theme/tokens';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'SendMoney'>;

const QUICK_AMOUNTS = ['50', '100', '500', '1000'];

const CATEGORIES = [
  { value: 'food', label: 'Food' },
  { value: 'transport', label: 'Transport' },
  { value: 'bills', label: 'Bills' },
  { value: 'family', label: 'Family' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'other', label: 'Other' },
];

export const SendMoneyScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const account = useAccount();
  const { state, start, retry, reset } = useTransfer();

  const prefill = useMemo(
    () => BENEFICIARIES.find((b) => b.id === route.params?.beneficiaryId) ?? null,
    [route.params?.beneficiaryId],
  );

  const [bankCode, setBankCode] = useState<string | null>(prefill?.bankCode ?? null);
  const [sourceAccountId, setSourceAccountId] = useState<string | null>(
    SOURCE_ACCOUNTS[0].id,
  );
  const [accountNumber, setAccountNumber] = useState(prefill?.accountNumber ?? '');
  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [remark, setRemark] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  const balance = (account.data?.balance ?? ACCOUNT.balance) as Kobo;

  const form: TransferFormInput = useMemo(
    () => ({
      bankCode: bankCode ?? '',
      bankName: BANKS.find((b) => b.code === bankCode)?.name ?? '',
      sourceAccountId: sourceAccountId ?? '',
      accountNumber,
      accountName: prefill?.name ?? 'Zikora Beneficiary',
      amountText,
      category: category ?? undefined,
      remark: remark || undefined,
    }),
    [bankCode, sourceAccountId, accountNumber, amountText, category, remark, prefill],
  );

  const validation = useMemo(
    () => validateTransferForm(form, balance),
    [form, balance],
  );

  const parsedAmount = parseAmountToKobo(amountText);
  const fee = feeForAmount(parsedAmount.ok ? parsedAmount.value : kobo(0));
  const totalDebit = parsedAmount.ok ? kobo(parsedAmount.value + fee) : null;

  /** A different form is a different intent, and therefore a different key. */
  const fingerprint = `${bankCode}|${sourceAccountId}|${accountNumber}|${amountText}`;
  // State rather than a ref: it decides whether the button reads Continue or Try again.
  const [intentFingerprint, setIntentFingerprint] = useState<string | null>(null);

  const submitting = state.status === 'submitting';
  const terminal =
    state.status === 'rejected' ||
    state.status === 'failed' ||
    state.status === 'pending_unknown';
  const canRetrySameIntent = terminal && intentFingerprint === fingerprint;

  const onContinue = useCallback(() => {
    setShowErrors(true);
    if (!validation.ok || submitting) return;

    if (canRetrySameIntent) {
      retry();
      return;
    }

    const intent = createTransferIntent(form, validation.value);
    setIntentFingerprint(fingerprint);
    start(intent);
  }, [validation, submitting, canRetrySameIntent, retry, form, fingerprint, start]);

  const handledStatus = useRef<string | null>(null);
  useEffect(() => {
    if (state.status === 'success' && handledStatus.current !== 'success') {
      handledStatus.current = 'success';
      navigation.navigate('Receipt');
      return;
    }
    if (state.status !== 'success') handledStatus.current = state.status;
  }, [state.status, navigation]);

  // Returning here after a completed transfer starts a fresh intent rather than
  // resurrecting the settled one.
  useEffect(
    () =>
      navigation.addListener('focus', () => {
        if (useTransferStore.getState().state.status === 'success') {
          reset();
          setIntentFingerprint(null);
          handledStatus.current = null;
        }
      }),
    [navigation, reset],
  );

  const errors = !validation.ok && showErrors ? validation.errors : {};

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Send Money</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {terminal && state.message && (
            <Banner
              tone={state.status === 'pending_unknown' ? 'warning' : 'error'}
              message={state.message}
            />
          )}

          <Select
            testID="select-bank"
            label="Choose Bank"
            placeholder="Select the bank"
            options={BANKS.map((b) => ({ value: b.code, label: b.name }))}
            value={bankCode}
            onChange={setBankCode}
            error={errors.bankCode}
          />

          <Select
            label="Your Account"
            placeholder="Select account"
            options={SOURCE_ACCOUNTS.map((a) => ({
              value: a.id,
              label: a.label,
              sublabel: `${a.accountNumber} · ${formatNaira(a.balance)}`,
            }))}
            value={sourceAccountId}
            onChange={setSourceAccountId}
          />

          <TextField
            testID="account-number"
            label="Account Number"
            variant="underline"
            value={accountNumber}
            onChangeText={(next) => setAccountNumber(next.replace(/\D/g, ''))}
            placeholder="Enter Account Number"
            keyboardType="number-pad"
            maxLength={10}
            error={errors.accountNumber}
          />

          <TextField
            testID="amount"
            label="Amount"
            variant="underline"
            value={amountText}
            onChangeText={setAmountText}
            placeholder="Enter Amount to be sent"
            keyboardType="decimal-pad"
            error={errors.amount}
          />

          <Text style={styles.feeNotice}>
            This transfer will attract a charge of {formatNaira(fee)}
          </Text>
          {totalDebit && (
            <Text style={styles.totalNotice}>
              Total debited from your account: {formatNaira(totalDebit)}
            </Text>
          )}

          <View style={styles.chips}>
            {QUICK_AMOUNTS.map((value) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityLabel={`Set amount to ${value} naira`}
                style={styles.chip}
                onPress={() => setAmountText(value)}
              >
                <Text style={styles.chipText}>{value}</Text>
              </Pressable>
            ))}
          </View>

          <Select
            label="Category"
            placeholder="What is this for?"
            options={CATEGORIES}
            value={category}
            onChange={setCategory}
            optionalHint
          />

          <TextField
            label="Remark"
            variant="underline"
            value={remark}
            onChangeText={setRemark}
            placeholder="Remarks (e.g Shopping)"
            autoCapitalize="sentences"
          />

          <Button
            label={canRetrySameIntent ? 'Try again' : 'Continue'}
            onPress={onContinue}
            disabled={!validation.ok}
            loading={submitting}
            accessibilityHint={
              canRetrySameIntent
                ? 'Retries the same transfer using its original reference'
                : undefined
            }
          />

          <DevOfflineToggle />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  headerTitle: { ...type.h3, color: colors.text, flex: 1, textAlign: 'center' },
  headerSpacer: { width: 24 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  feeNotice: { ...type.caption, color: colors.debitRed, marginTop: -spacing.sm },
  totalNotice: { ...type.caption, color: colors.textMuted, marginTop: spacing.xs },
  chips: { flexDirection: 'row', gap: spacing.md, marginVertical: spacing.lg },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  chipText: { ...type.label, color: colors.text },
});
