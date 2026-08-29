import * as SecureStore from 'expo-secure-store';
import { useSessionStore } from '../state/sessionStore';
import { accessibleAmountLabel } from '../domain/transactions';
import { kobo } from '../lib/money';

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
  };
});

const KEY = 'zikora.session';
const seed = (value: string | null) => {
  const mocked = SecureStore as jest.Mocked<typeof SecureStore>;
  mocked.getItemAsync.mockImplementation(async () => value);
};

beforeEach(() => {
  jest.clearAllMocks();
  useSessionStore.setState({ phase: 'hydrating', session: null });
});

describe('cold launch restores a valid session and drops an invalid one', () => {
  it('lands authenticated when the stored session is still valid', async () => {
    const session = {
      token: 'tok_valid',
      userId: 'usr_ada',
      expiresAt: Date.now() + 60_000,
    };
    seed(JSON.stringify(session));

    await useSessionStore.getState().hydrate();

    expect(useSessionStore.getState().phase).toBe('authenticated');
    expect(useSessionStore.getState().session?.token).toBe('tok_valid');
  });

  it('treats an expired session as logged out and clears it', async () => {
    seed(
      JSON.stringify({ token: 'tok_old', userId: 'usr_ada', expiresAt: Date.now() - 1 }),
    );

    await useSessionStore.getState().hydrate();

    expect(useSessionStore.getState().phase).toBe('unauthenticated');
    expect(useSessionStore.getState().session).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(KEY);
  });

  it('treats a malformed stored value as no session', async () => {
    seed('{not json');

    await useSessionStore.getState().hydrate();

    expect(useSessionStore.getState().phase).toBe('unauthenticated');
    expect(useSessionStore.getState().session).toBeNull();
  });

  it('logging out clears storage and returns to unauthenticated', async () => {
    seed(
      JSON.stringify({
        token: 'tok_valid',
        userId: 'usr_ada',
        expiresAt: Date.now() + 60_000,
      }),
    );
    await useSessionStore.getState().hydrate();
    expect(useSessionStore.getState().phase).toBe('authenticated');

    await useSessionStore.getState().signOut();

    expect(useSessionStore.getState().phase).toBe('unauthenticated');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(KEY);
  });

  it('an expiry that passes while backgrounded is dropped on resume', async () => {
    useSessionStore.setState({
      phase: 'authenticated',
      session: { token: 'tok', userId: 'usr_ada', expiresAt: Date.now() - 1 },
    });

    await useSessionStore.getState().revalidate();

    expect(useSessionStore.getState().phase).toBe('unauthenticated');
  });
});

describe('transaction amounts carry a screen-reader label', () => {
  it('announces direction and formatted value', () => {
    const label = accessibleAmountLabel({
      id: 'txn_1',
      amount: kobo(100_050),
      direction: 'debit',
      counterparty: 'Chidi Umeh',
      description: 'Transfer',
      timestamp: 0,
      status: 'completed',
    });

    expect(label).toBe('Debit of ₦1,000.50, Chidi Umeh');
  });
});
