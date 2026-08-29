import { WireResult, delay } from '../wire';
import { Session } from '../../domain/session';
import { DELAYS, LOGIN_PASSWORD, LOGIN_TRIGGERS, SESSION_TTL_MS } from './config';
import { isOffline } from './devFlags';
import { ACCOUNT } from './fixtures';

export type LoginRequest = { email: string; password: string };

const issueSession = (): Session => ({
  token: `tok_${Date.now().toString(36)}`,
  userId: ACCOUNT.userId,
  expiresAt: Date.now() + SESSION_TTL_MS,
});

export const login = async ({
  email,
  password,
}: LoginRequest): Promise<WireResult<Session>> => {
  const normalised = email.trim().toLowerCase();

  if (isOffline()) {
    await delay(200);
    return { kind: 'network_error' };
  }

  switch (normalised) {
    case LOGIN_TRIGGERS.reject:
      await delay(DELAYS.normal);
      return { kind: 'http_error', status: 401, body: { message: 'Invalid credentials' } };
    case LOGIN_TRIGGERS.serverError:
      await delay(DELAYS.normal);
      return { kind: 'http_error', status: 500, body: { message: 'Service unavailable' } };
    case LOGIN_TRIGGERS.timeout:
      await delay(DELAYS.timeout);
      return { kind: 'timeout' };
    case LOGIN_TRIGGERS.slow:
      await delay(DELAYS.slow);
      return { kind: 'ok', status: 200, body: issueSession() };
    default:
      await delay(DELAYS.normal);
      if (password !== LOGIN_PASSWORD) {
        return { kind: 'http_error', status: 401, body: { message: 'Invalid credentials' } };
      }
      return { kind: 'ok', status: 200, body: issueSession() };
  }
};

export const refresh = async (): Promise<WireResult<Session>> => {
  if (isOffline()) return { kind: 'network_error' };
  await delay(DELAYS.normal);
  return { kind: 'ok', status: 200, body: issueSession() };
};
