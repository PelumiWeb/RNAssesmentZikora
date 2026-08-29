import { Kobo, formatNaira } from '../lib/money';

export type TransactionDirection = 'credit' | 'debit';

export type Transaction = {
  id: string;
  amount: Kobo;
  direction: TransactionDirection;
  counterparty: string;
  description: string;
  timestamp: number;
  status: 'completed' | 'pending' | 'failed';
};

/**
 * Pages are merged through a Map rather than concatenated: the API can legitimately
 * repeat a row across page boundaries, and a duplicated key would otherwise render twice.
 * Last write wins so a refetched row replaces its stale copy.
 */
export const mergeTransactionPages = (
  pages: readonly (readonly Transaction[])[],
): Transaction[] => {
  const byId = new Map<string, Transaction>();
  for (const page of pages) {
    for (const tx of page) byId.set(tx.id, tx);
  }
  return sortTransactions([...byId.values()]);
};

/**
 * Newest first, with id as tiebreaker so rows keep a stable order across refetches
 * even when timestamps collide.
 */
export const sortTransactions = (list: readonly Transaction[]): Transaction[] =>
  [...list].sort((a, b) =>
    b.timestamp - a.timestamp || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0),
  );

export const signedAmountLabel = (tx: Transaction): string =>
  `${tx.direction === 'credit' ? '+' : '-'}${formatNaira(tx.amount)}`;

export const accessibleAmountLabel = (tx: Transaction): string =>
  `${tx.direction === 'credit' ? 'Credit' : 'Debit'} of ${formatNaira(tx.amount)}, ${tx.counterparty}`;
