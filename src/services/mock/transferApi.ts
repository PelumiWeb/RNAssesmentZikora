import { WireResult, delay } from '../wire';
import { Kobo } from '../../lib/money';
import { DELAYS, TRANSFER_TRIGGERS, TransferTrigger } from './config';
import { isOffline } from './devFlags';

export type TransferRequest = {
  idempotencyKey: string;
  amount: Kobo;
  fee: Kobo;
  totalDebit: Kobo;
  bankCode: string;
  accountNumber: string;
  remark?: string;
};

type StoredTransfer = {
  result: WireResult<unknown>;
  /** Every request seen for this key, including replays that returned the stored result. */
  requests: number;
};

const store = new Map<string, StoredTransfer>();

const triggerFor = (amount: Kobo): TransferTrigger => {
  const wholeNaira = Math.floor(amount / 100);
  const suffix = String(wholeNaira).padStart(2, '0').slice(-2);
  return TRANSFER_TRIGGERS[suffix] ?? 'success';
};

const resultFor = (trigger: TransferTrigger, key: string): WireResult<unknown> => {
  switch (trigger) {
    case 'rejected':
      return {
        kind: 'http_error',
        status: 422,
        body: { message: 'Beneficiary account cannot receive this transfer' },
      };
    case 'server_error':
      return { kind: 'http_error', status: 500, body: { message: 'Upstream failure' } };
    case 'timeout':
      return { kind: 'timeout' };
    case 'success':
    case 'delayed_success':
      return {
        kind: 'ok',
        status: 200,
        body: {
          status: 'success',
          reference: `ZKR${key.slice(-8).toUpperCase()}`,
          completedAt: Date.now(),
        },
      };
  }
};

/**
 * Keyed by idempotency key: a replay is recorded but never creates a second transfer,
 * and always returns byte-identical output. This is what makes retrying a
 * pending_unknown safe rather than a gamble.
 */
export const submitTransfer = async (
  request: TransferRequest,
): Promise<WireResult<unknown>> => {
  const existing = store.get(request.idempotencyKey);
  if (existing) {
    existing.requests += 1;
    await delay(120);
    return existing.result;
  }

  const trigger = triggerFor(request.amount);

  if (isOffline()) {
    await delay(200);
    // Not persisted: an offline request never reached the server, so the key stays unused.
    return { kind: 'network_error' };
  }

  if (trigger === 'delayed_success') await delay(DELAYS.delayedSuccess);
  else if (trigger === 'timeout') await delay(DELAYS.timeout);
  else await delay(DELAYS.normal);

  const result = resultFor(trigger, request.idempotencyKey);
  store.set(request.idempotencyKey, { result, requests: 1 });
  return result;
};

export const __resetTransferStore = (): void => store.clear();
export const __transferRequestCount = (key: string): number =>
  store.get(key)?.requests ?? 0;
export const __transferCount = (): number => store.size;
