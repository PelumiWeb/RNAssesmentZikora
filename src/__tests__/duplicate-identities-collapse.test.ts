import { Transaction, mergeTransactionPages } from '../domain/transactions';
import { kobo } from '../lib/money';
import { ALL_TRANSACTIONS, PAGE_SIZE } from '../services/mock/fixtures';

const tx = (id: string, timestamp: number): Transaction => ({
  id,
  amount: kobo(100_00),
  direction: 'debit',
  counterparty: 'Chidi Umeh',
  description: 'Transfer',
  timestamp,
  status: 'completed',
});

describe('duplicate identities collapse to one row', () => {
  it('collapses a duplicate within a single page', () => {
    const merged = mergeTransactionPages([[tx('a', 3), tx('b', 2), tx('a', 3)]]);
    expect(merged.map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('collapses a duplicate that straddles a page boundary', () => {
    const merged = mergeTransactionPages([
      [tx('a', 3), tx('b', 2)],
      [tx('b', 2), tx('c', 1)],
    ]);
    expect(merged.map((t) => t.id)).toEqual(['a', 'b', 'c']);
  });

  it('keeps the freshest copy of a repeated id', () => {
    const stale = { ...tx('a', 3), counterparty: 'Stale Name' };
    const fresh = { ...tx('a', 3), counterparty: 'Fresh Name' };
    const merged = mergeTransactionPages([[stale], [fresh]]);
    expect(merged).toHaveLength(1);
    expect(merged[0].counterparty).toBe('Fresh Name');
  });

  it('sorts newest first with id as a stable tiebreaker', () => {
    const merged = mergeTransactionPages([[tx('b', 5), tx('a', 5), tx('c', 9)]]);
    expect(merged.map((t) => t.id)).toEqual(['c', 'b', 'a']);
  });

  it('dedupes the seeded dataset down to its unique rows', () => {
    const pages: Transaction[][] = [];
    for (let i = 0; i < ALL_TRANSACTIONS.length; i += PAGE_SIZE) {
      pages.push([...ALL_TRANSACTIONS.slice(i, i + PAGE_SIZE)]);
    }
    const merged = mergeTransactionPages(pages);
    const uniqueIds = new Set(ALL_TRANSACTIONS.map((t) => t.id));

    expect(ALL_TRANSACTIONS.length).toBeGreaterThan(uniqueIds.size);
    expect(merged).toHaveLength(uniqueIds.size);
    expect(merged.length).toBeGreaterThanOrEqual(3000);
  });
});
