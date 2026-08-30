/**
 * Every failure mode is reachable from the UI with no code change, so an evaluator can
 * reproduce each branch by typing a magic value. Documented in README.
 */

export const LOGIN_PASSWORD = 'Password123';

export const LOGIN_TRIGGERS = {
  reject: 'reject@zikora.test',
  slow: 'slow@zikora.test',
  serverError: 'error@zikora.test',
  timeout: 'timeout@zikora.test',
} as const;

export const SUCCESS_EMAIL = 'ada@zikora.test';

export type TransferTrigger =
  | 'success'
  | 'rejected'
  | 'server_error'
  | 'timeout'
  | 'delayed_success';

/** Read from the last two digits of the whole-naira amount. */
export const TRANSFER_TRIGGERS: Record<string, TransferTrigger> = {
  '00': 'success',
  '11': 'rejected',
  '22': 'server_error',
  '33': 'timeout',
  '44': 'delayed_success',
};

export const DELAYS = {
  normal: 450,
  slow: 3200,
  timeout: 2500,
  delayedSuccess: 4000,
} as const;

export const SESSION_TTL_MS = 15 * 60 * 1000;
