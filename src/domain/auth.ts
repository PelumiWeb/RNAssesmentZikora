import { Session, isSessionValid } from './session';

export type LoginOutcome =
  | { kind: 'success'; session: Session }
  | { kind: 'rejected'; message: string }
  | { kind: 'failed'; message: string }
  | { kind: 'unknown'; message: string };

type Wire =
  | { kind: 'ok'; status: number; body: unknown }
  | { kind: 'http_error'; status: number; body?: unknown }
  | { kind: 'network_error' }
  | { kind: 'timeout' };

/**
 * Same rule as transfers: a login only succeeds on a 2xx carrying a session that is
 * actually valid. A timeout is 'unknown' -- we cannot claim the user is signed in, and
 * we must not claim they were rejected either.
 */
export const classifyLogin = (wire: Wire): LoginOutcome => {
  switch (wire.kind) {
    case 'timeout':
      return {
        kind: 'unknown',
        message: "We couldn't confirm your login. Check your connection and try again.",
      };
    case 'network_error':
      return {
        kind: 'failed',
        message: "You appear to be offline. Your details weren't sent.",
      };
    case 'http_error':
      if (wire.status >= 400 && wire.status < 500) {
        return { kind: 'rejected', message: 'Invalid email or password.' };
      }
      return { kind: 'failed', message: "We couldn't sign you in. Please try again." };
    case 'ok': {
      const session = wire.body as Session | null;
      if (wire.status >= 200 && wire.status < 300 && isSessionValid(session)) {
        return { kind: 'success', session };
      }
      return {
        kind: 'unknown',
        message: "We couldn't confirm your login. Please try again.",
      };
    }
  }
};
