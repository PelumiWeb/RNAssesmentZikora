import { Kobo } from '../lib/money';

export type TerminalStatus = 'success' | 'rejected' | 'failed' | 'pending_unknown';
export type TransferStatus = 'idle' | 'submitting' | TerminalStatus;

export type TransferIntent = {
  id: string;
  /**
   * Minted once, when the user commits to this intent. Every retry of the same intent
   * replays this key, which is what makes a retry provably harmless server-side.
   * Regenerating per network attempt would defeat the entire mechanism.
   */
  idempotencyKey: string;
  createdAt: number;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  sourceAccountId: string;
  amount: Kobo;
  fee: Kobo;
  totalDebit: Kobo;
  category?: string;
  remark?: string;
};

export type TransferReceipt = {
  reference: string;
  completedAt: number;
};

export type TransferWireResult =
  | { kind: 'ok'; status: number; body: unknown }
  | { kind: 'http_error'; status: number; body?: unknown }
  | { kind: 'network_error' }
  | { kind: 'timeout' };

const isSettledBody = (
  body: unknown,
): body is { status: 'success' | 'rejected'; reference?: string; message?: string } => {
  if (typeof body !== 'object' || body === null) return false;
  const status = (body as { status?: unknown }).status;
  return status === 'success' || status === 'rejected';
};

/**
 * The single place ambiguity is resolved, and it always resolves away from success:
 * a timeout, an unreadable body or an unrecognised status becomes pending_unknown,
 * never success and never a silent failure.
 */
export const classifyOutcome = (result: TransferWireResult): TerminalStatus => {
  switch (result.kind) {
    case 'timeout':
      return 'pending_unknown';
    case 'network_error':
      return 'failed';
    case 'http_error':
      if (result.status >= 400 && result.status < 500) return 'rejected';
      if (result.status >= 500) return 'failed';
      return 'pending_unknown';
    case 'ok': {
      if (result.status < 200 || result.status >= 300) return 'pending_unknown';
      if (!isSettledBody(result.body)) return 'pending_unknown';
      if (result.body.status === 'rejected') return 'rejected';
      return typeof result.body.reference === 'string' && result.body.reference.length > 0
        ? 'success'
        : 'pending_unknown';
    }
  }
};

export type TransferState = {
  status: TransferStatus;
  intent: TransferIntent | null;
  receipt: TransferReceipt | null;
  message: string | null;
  attempts: number;
};

export const initialTransferState: TransferState = {
  status: 'idle',
  intent: null,
  receipt: null,
  message: null,
  attempts: 0,
};

export type TransferEvent =
  | { type: 'INTENT_CREATED'; intent: TransferIntent }
  | { type: 'SUBMIT' }
  | { type: 'SETTLED'; outcome: TerminalStatus; receipt?: TransferReceipt; message?: string }
  | { type: 'RESET' };

const RETRYABLE: ReadonlySet<TransferStatus> = new Set<TransferStatus>([
  'rejected',
  'failed',
  'pending_unknown',
]);

/**
 * Success is terminal and submitting is exclusive, so a duplicate tap has nowhere to go.
 * The UI still holds an in-flight ref: state updates are async, and two taps in one tick
 * can both read a stale 'idle'.
 */
export const canSubmit = (state: TransferState): boolean =>
  state.intent !== null && (state.status === 'idle' || RETRYABLE.has(state.status));

export const transferReducer = (
  state: TransferState,
  event: TransferEvent,
): TransferState => {
  switch (event.type) {
    case 'INTENT_CREATED':
      return { ...initialTransferState, intent: event.intent };

    case 'SUBMIT':
      if (!canSubmit(state)) return state;
      return {
        ...state,
        status: 'submitting',
        receipt: null,
        message: null,
        attempts: state.attempts + 1,
      };

    case 'SETTLED':
      if (state.status !== 'submitting') return state;
      return {
        ...state,
        status: event.outcome,
        receipt: event.outcome === 'success' ? (event.receipt ?? null) : null,
        message: event.message ?? null,
      };

    case 'RESET':
      return initialTransferState;
  }
};

/** The receipt screen is reachable from exactly one state. */
export const canViewReceipt = (state: TransferState): boolean =>
  state.status === 'success' && state.receipt !== null;
