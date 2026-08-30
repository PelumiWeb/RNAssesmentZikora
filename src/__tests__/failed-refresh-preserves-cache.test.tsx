import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useRecentTransactions } from '../hooks/useTransactions';
import { useDevFlags } from '../services/mock/devFlags';

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

beforeEach(() => useDevFlags.getState().reset());
afterEach(() => useDevFlags.getState().reset());

describe('a failed refresh preserves the cached list', () => {
  it('keeps the previously loaded rows when the refresh fails', async () => {
    const { result } = renderHook(() => useRecentTransactions(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 5000 });

    const loaded = result.current.transactions;
    expect(loaded.length).toBeGreaterThan(0);
    const firstId = loaded[0].id;

    useDevFlags.getState().setForceOffline(true);
    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 });

    expect(result.current.transactions).toHaveLength(loaded.length);
    expect(result.current.transactions[0].id).toBe(firstId);
    expect(result.current.transactions).not.toHaveLength(0);
  });

  it('does not advance the last-updated stamp on a failed refresh', async () => {
    const { result } = renderHook(() => useRecentTransactions(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 5000 });
    const stampAfterSuccess = result.current.dataUpdatedAt;
    expect(stampAfterSuccess).toBeGreaterThan(0);

    useDevFlags.getState().setForceOffline(true);
    await act(async () => {
      await result.current.refetch();
    });
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 });

    expect(result.current.dataUpdatedAt).toBe(stampAfterSuccess);
  });
});
