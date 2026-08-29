export type Session = {
  token: string;
  userId: string;
  expiresAt: number;
};

/**
 * Pure predicate. Nothing here reads storage or navigates -- the root guard owns that
 * decision, so an expired session can never be "silently kept" by a storage helper.
 */
export const isSessionValid = (
  session: Session | null | undefined,
  now: number = Date.now(),
): session is Session => {
  if (!session) return false;
  if (typeof session.token !== 'string' || session.token.length === 0) return false;
  if (typeof session.userId !== 'string' || session.userId.length === 0) return false;
  if (typeof session.expiresAt !== 'number' || !Number.isFinite(session.expiresAt)) {
    return false;
  }
  return session.expiresAt > now;
};

/** Narrow a value read back from storage; anything malformed is treated as no session. */
export const parseStoredSession = (raw: string | null): Session | null => {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { token, userId, expiresAt } = parsed as Partial<Session>;
    if (typeof token !== 'string' || typeof userId !== 'string') return null;
    if (typeof expiresAt !== 'number') return null;
    return { token, userId, expiresAt };
  } catch {
    return null;
  }
};
