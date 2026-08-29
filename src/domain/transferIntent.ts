import { Kobo, ParseFailure, parseAmountToKobo } from '../lib/money';
import { newIdempotencyKey, newId } from '../lib/ids';
import { feeForAmount, totalDebitFor } from './fees';
import { TransferIntent } from './transfer';

export type TransferFormInput = {
  bankCode: string;
  bankName: string;
  sourceAccountId: string;
  accountNumber: string;
  accountName: string;
  amountText: string;
  category?: string;
  remark?: string;
};

export type TransferFieldError = 'bankCode' | 'accountNumber' | 'amount';
export type TransferFormErrors = Partial<Record<TransferFieldError, string>>;

export type ValidatedTransfer = {
  amount: Kobo;
  fee: Kobo;
  totalDebit: Kobo;
};

const AMOUNT_MESSAGES: Record<ParseFailure, string> = {
  empty: 'Enter an amount',
  invalid: 'Enter a valid amount',
  too_many_decimals: 'Amount can have at most 2 decimal places',
  not_positive: 'Amount must be greater than zero',
  too_large: 'Amount is too large',
};

/** Category and Remark are optional by design and never block Continue. */
export const validateTransferForm = (
  input: TransferFormInput,
  balance: Kobo,
): { ok: true; value: ValidatedTransfer } | { ok: false; errors: TransferFormErrors } => {
  const errors: TransferFormErrors = {};

  if (!input.bankCode) errors.bankCode = 'Choose a bank';
  if (!/^\d{10}$/.test(input.accountNumber.trim())) {
    errors.accountNumber = 'Account number must be 10 digits';
  }

  const parsed = parseAmountToKobo(input.amountText);
  if (!parsed.ok) {
    errors.amount = AMOUNT_MESSAGES[parsed.reason];
    return { ok: false, errors };
  }

  const fee = feeForAmount(parsed.value);
  const totalDebit = totalDebitFor(parsed.value);
  if (totalDebit > balance) {
    errors.amount = 'Insufficient balance for this amount plus fee';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { amount: parsed.value, fee, totalDebit } };
};

/**
 * The idempotency key is minted here -- at intent creation, when the user commits --
 * and then lives on the intent. Every retry replays it; nothing downstream may mint one.
 */
export const createTransferIntent = (
  input: TransferFormInput,
  validated: ValidatedTransfer,
): TransferIntent => ({
  id: newId('intent'),
  idempotencyKey: newIdempotencyKey(),
  createdAt: Date.now(),
  bankCode: input.bankCode,
  bankName: input.bankName,
  accountNumber: input.accountNumber.trim(),
  accountName: input.accountName,
  sourceAccountId: input.sourceAccountId,
  amount: validated.amount,
  fee: validated.fee,
  totalDebit: validated.totalDebit,
  category: input.category,
  remark: input.remark,
});
