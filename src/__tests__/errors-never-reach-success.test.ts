import {
  TransferWireResult,
  canViewReceipt,
  classifyOutcome,
  initialTransferState,
  transferReducer,
} from '../domain/transfer';
import { createTransferIntent, validateTransferForm } from '../domain/transferIntent';
import { kobo } from '../lib/money';

const intent = () => {
  const form = {
    bankCode: '058',
    bankName: 'GTBank',
    sourceAccountId: 'acc_main',
    accountNumber: '2011223344',
    accountName: 'Chidi Umeh',
    amountText: '1000',
  };
  const validated = validateTransferForm(form, kobo(500_000_00));
  if (!validated.ok) throw new Error('fixture should validate');
  return createTransferIntent(form, validated.value);
};

const submitted = () =>
  transferReducer(
    transferReducer(initialTransferState, { type: 'INTENT_CREATED', intent: intent() }),
    { type: 'SUBMIT' },
  );

describe('errors can never reach a success path', () => {
  const failures: [string, TransferWireResult][] = [
    ['400 bad request', { kind: 'http_error', status: 400 }],
    ['401 unauthorised', { kind: 'http_error', status: 401 }],
    ['409 conflict', { kind: 'http_error', status: 409 }],
    ['422 unprocessable', { kind: 'http_error', status: 422 }],
    ['500 server error', { kind: 'http_error', status: 500 }],
    ['503 unavailable', { kind: 'http_error', status: 503 }],
    ['offline', { kind: 'network_error' }],
    ['timeout', { kind: 'timeout' }],
    ['2xx with unreadable body', { kind: 'ok', status: 200, body: 'not-json' }],
    ['2xx with unknown status', { kind: 'ok', status: 200, body: { status: 'weird' } }],
    ['2xx success without a reference', { kind: 'ok', status: 200, body: { status: 'success' } }],
  ];

  it.each(failures)('%s never classifies as success', (_label, wire) => {
    expect(classifyOutcome(wire)).not.toBe('success');
  });

  it.each(failures)('%s never unlocks the receipt', (_label, wire) => {
    const settled = transferReducer(submitted(), {
      type: 'SETTLED',
      outcome: classifyOutcome(wire),
    });
    expect(canViewReceipt(settled)).toBe(false);
    expect(settled.receipt).toBeNull();
  });

  it('only a confirmed 2xx with a reference unlocks the receipt', () => {
    const wire: TransferWireResult = {
      kind: 'ok',
      status: 200,
      body: { status: 'success', reference: 'ZKR123' },
    };
    const settled = transferReducer(submitted(), {
      type: 'SETTLED',
      outcome: classifyOutcome(wire),
      receipt: { reference: 'ZKR123', completedAt: Date.now() },
    });
    expect(settled.status).toBe('success');
    expect(canViewReceipt(settled)).toBe(true);
  });
});
