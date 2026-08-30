import { WireResult, delay } from '../wire';
import { Transaction } from '../../domain/transactions';
import { DELAYS } from './config';
import { isOffline } from './devFlags';
import { ALL_TRANSACTIONS, ACCOUNT, PAGE_SIZE } from './fixtures';

export type TransactionPage = {
  items: Transaction[];
  nextPage: number | null;
};

export const fetchTransactionsPage = async (
  page: number,
): Promise<WireResult<TransactionPage>> => {
  if (isOffline()) {
    await delay(200);
    return { kind: 'network_error' };
  }
  await delay(DELAYS.normal);

  const start = page * PAGE_SIZE;
  const items = ALL_TRANSACTIONS.slice(start, start + PAGE_SIZE);
  const nextPage = start + PAGE_SIZE < ALL_TRANSACTIONS.length ? page + 1 : null;
  return { kind: 'ok', status: 200, body: { items: [...items], nextPage } };
};

export const fetchAccount = async (): Promise<WireResult<typeof ACCOUNT>> => {
  if (isOffline()) return { kind: 'network_error' };
  await delay(DELAYS.normal);
  return { kind: 'ok', status: 200, body: ACCOUNT };
};
