import { useCallback, useRef } from 'react';
import {
  TransferIntent,
  TransferReceipt,
  TransferWireResult,
  classifyOutcome,
} from '../domain/transfer';
import { submitTransfer } from '../services/mock/transferApi';
import { useTransferStore } from '../state/transferStore';

const MESSAGES = {
  rejected: 'This transfer was declined. No money has left your account.',
  failed: "The transfer didn't go through. You can try again.",
  pending_unknown:
    "We couldn't confirm this transfer. Check your transactions before retrying — retrying is safe, it reuses the same reference.",
} as const;

const receiptFrom = (wire: TransferWireResult): TransferReceipt | undefined => {
  if (wire.kind !== 'ok') return undefined;
  const body = wire.body as { reference?: unknown; completedAt?: unknown };
  if (typeof body?.reference !== 'string') return undefined;
  return {
    reference: body.reference,
    completedAt: typeof body.completedAt === 'number' ? body.completedAt : Date.now(),
  };
};

const messageFor = (wire: TransferWireResult, outcome: keyof typeof MESSAGES): string => {
  if (wire.kind === 'http_error') {
    const body = wire.body as { message?: unknown } | undefined;
    if (typeof body?.message === 'string') return body.message;
  }
  return MESSAGES[outcome];
};

export const useTransfer = () => {
  const state = useTransferStore((s) => s.state);
  const dispatch = useTransferStore((s) => s.dispatch);

  /**
   * The real repeat-tap guard. `state.status` is updated asynchronously, so two taps in
   * the same tick can both observe 'idle'; a ref flips synchronously and cannot.
   */
  const inFlight = useRef(false);

  const run = useCallback(
    async (intent: TransferIntent) => {
      if (inFlight.current) return;
      inFlight.current = true;
      dispatch({ type: 'SUBMIT' });

      try {
        const wire = await submitTransfer({
          idempotencyKey: intent.idempotencyKey,
          amount: intent.amount,
          fee: intent.fee,
          totalDebit: intent.totalDebit,
          bankCode: intent.bankCode,
          accountNumber: intent.accountNumber,
          remark: intent.remark,
        });

        const outcome = classifyOutcome(wire);
        if (outcome === 'success') {
          const receipt = receiptFrom(wire);
          // A success we cannot build a receipt from is not a success we may show.
          if (!receipt) {
            dispatch({
              type: 'SETTLED',
              outcome: 'pending_unknown',
              message: MESSAGES.pending_unknown,
            });
            return;
          }
          dispatch({ type: 'SETTLED', outcome: 'success', receipt });
          return;
        }

        dispatch({ type: 'SETTLED', outcome, message: messageFor(wire, outcome) });
      } finally {
        inFlight.current = false;
      }
    },
    [dispatch],
  );

  const start = useCallback(
    (intent: TransferIntent) => {
      if (inFlight.current) return;
      dispatch({ type: 'INTENT_CREATED', intent });
      void run(intent);
    },
    [dispatch, run],
  );

  /** Retry replays the existing intent, and therefore the original idempotency key. */
  const retry = useCallback(() => {
    const current = useTransferStore.getState().state.intent;
    if (current) void run(current);
  }, [run]);

  const reset = useCallback(() => dispatch({ type: 'RESET' }), [dispatch]);

  return { state, start, retry, reset };
};
