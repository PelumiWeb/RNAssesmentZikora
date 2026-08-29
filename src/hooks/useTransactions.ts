import { useMemo } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { WireResult } from '../services/wire';
import { fetchAccount, fetchTransactionsPage } from '../services/mock/transactionsApi';
import { mergeTransactionPages } from '../domain/transactions';

const MESSAGES: Record<string, string> = {
  network_error: "You're offline. Showing the last data we loaded.",
  timeout: "We couldn't confirm the refresh. Showing the last data we loaded.",
  http_error: "We couldn't refresh right now. Showing the last data we loaded.",
};

/** Throwing is what puts the query in an error state while it keeps its previous data. */
const unwrap = <T>(result: WireResult<T>): T => {
  if (result.kind === 'ok') return result.body;
  throw new Error(MESSAGES[result.kind] ?? MESSAGES.http_error);
};

/**
 * Home owns a single-page query so pull-to-refresh costs one request; the full list
 * owns the infinite query. Both keep their cached data when a refresh fails.
 */
export const useRecentTransactions = () => {
  const query = useQuery({
    queryKey: ['transactions', 'recent'],
    queryFn: async () => unwrap(await fetchTransactionsPage(0)),
  });

  const transactions = useMemo(
    () => mergeTransactionPages(query.data ? [query.data.items] : []),
    [query.data],
  );

  return { ...query, transactions };
};

export const useAllTransactions = () => {
  const query = useInfiniteQuery({
    queryKey: ['transactions', 'all'],
    queryFn: async ({ pageParam }) => unwrap(await fetchTransactionsPage(pageParam)),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextPage,
  });

  const transactions = useMemo(
    () => mergeTransactionPages((query.data?.pages ?? []).map((p) => p.items)),
    [query.data],
  );

  return { ...query, transactions };
};

export const useAccount = () =>
  useQuery({
    queryKey: ['account'],
    queryFn: async () => unwrap(await fetchAccount()),
  });
