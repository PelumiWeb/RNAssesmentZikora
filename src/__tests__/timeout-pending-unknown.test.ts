import { classifyOutcome, initialTransferState, transferReducer } from '../domain/transfer';

describe('a timeout is pending_unknown, not success and not failure', () => {
  it('classifies a timeout as pending_unknown', () => {
    expect(classifyOutcome({ kind: 'timeout' })).toBe('pending_unknown');
  });

  it('keeps pending_unknown distinct from failed', () => {
    expect(classifyOutcome({ kind: 'network_error' })).toBe('failed');
    expect(classifyOutcome({ kind: 'timeout' })).not.toBe('failed');
  });

  it('surfaces pending_unknown as its own terminal state', () => {
    const state = transferReducer(
      transferReducer(initialTransferState, {
        type: 'INTENT_CREATED',
        intent: {
          id: 'i1',
          idempotencyKey: 'idem_1',
          createdAt: 0,
          bankCode: '058',
          bankName: 'GTBank',
          accountNumber: '2011223344',
          accountName: 'Chidi Umeh',
          sourceAccountId: 'acc_main',
          amount: 100_000 as never,
          fee: 1_000 as never,
          totalDebit: 101_000 as never,
        },
      }),
      { type: 'SUBMIT' },
    );

    const settled = transferReducer(state, {
      type: 'SETTLED',
      outcome: classifyOutcome({ kind: 'timeout' }),
    });

    expect(settled.status).toBe('pending_unknown');
    expect(settled.receipt).toBeNull();
  });
});
