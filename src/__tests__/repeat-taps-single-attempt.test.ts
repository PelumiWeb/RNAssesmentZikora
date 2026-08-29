import { canSubmit, initialTransferState, transferReducer } from '../domain/transfer';
import { createTransferIntent, validateTransferForm } from '../domain/transferIntent';
import { kobo } from '../lib/money';
import {
  __resetTransferStore,
  __transferCount,
  __transferRequestCount,
  submitTransfer,
} from '../services/mock/transferApi';

const buildIntent = (amountText: string) => {
  const form = {
    bankCode: '058',
    bankName: 'GTBank',
    sourceAccountId: 'acc_main',
    accountNumber: '2011223344',
    accountName: 'Chidi Umeh',
    amountText,
  };
  const validated = validateTransferForm(form, kobo(500_000_00));
  if (!validated.ok) throw new Error('fixture should validate');
  return createTransferIntent(form, validated.value);
};

beforeEach(() => __resetTransferStore());

describe('repeat taps create exactly one transfer attempt', () => {
  it('refuses a second submit while one is in flight', () => {
    const intent = buildIntent('1000');
    const withIntent = transferReducer(initialTransferState, {
      type: 'INTENT_CREATED',
      intent,
    });

    const first = transferReducer(withIntent, { type: 'SUBMIT' });
    const second = transferReducer(first, { type: 'SUBMIT' });

    expect(first.attempts).toBe(1);
    expect(second.attempts).toBe(1);
    expect(canSubmit(first)).toBe(false);
  });

  it('never re-submits from a success state', () => {
    const intent = buildIntent('1000');
    const settled = transferReducer(
      transferReducer(
        transferReducer(initialTransferState, { type: 'INTENT_CREATED', intent }),
        { type: 'SUBMIT' },
      ),
      {
        type: 'SETTLED',
        outcome: 'success',
        receipt: { reference: 'ZKR1', completedAt: 0 },
      },
    );

    expect(canSubmit(settled)).toBe(false);
    expect(transferReducer(settled, { type: 'SUBMIT' })).toBe(settled);
  });

  it('replays one idempotency key into one transfer, byte-identical', async () => {
    const intent = buildIntent('1000');
    const request = {
      idempotencyKey: intent.idempotencyKey,
      amount: intent.amount,
      fee: intent.fee,
      totalDebit: intent.totalDebit,
      bankCode: intent.bankCode,
      accountNumber: intent.accountNumber,
    };

    const [a, b, c] = await Promise.all([
      submitTransfer(request),
      submitTransfer(request),
      submitTransfer(request),
    ]);

    expect(__transferCount()).toBe(1);
    expect(__transferRequestCount(intent.idempotencyKey)).toBeGreaterThanOrEqual(1);
    expect(b).toEqual(a);
    expect(c).toEqual(a);
  });

  it('retrying a pending_unknown intent reuses the original key', () => {
    const intent = buildIntent('1033');
    const pending = transferReducer(
      transferReducer(
        transferReducer(initialTransferState, { type: 'INTENT_CREATED', intent }),
        { type: 'SUBMIT' },
      ),
      { type: 'SETTLED', outcome: 'pending_unknown' },
    );

    const retried = transferReducer(pending, { type: 'SUBMIT' });

    expect(retried.status).toBe('submitting');
    expect(retried.attempts).toBe(2);
    expect(retried.intent?.idempotencyKey).toBe(intent.idempotencyKey);
  });
});
