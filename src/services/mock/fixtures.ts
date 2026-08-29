import { Kobo, kobo } from '../../lib/money';
import { Transaction } from '../../domain/transactions';

/** Deterministic PRNG so the dataset is identical on every launch and in every test run. */
const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const ACCOUNT = {
  userId: 'usr_ada',
  name: 'Ada Obi',
  accountNumber: '0123456789',
  bankName: 'Zikora MFB',
  balance: kobo(2_450_000_00),
} as const;

export const BANKS = [
  { code: '058', name: 'GTBank' },
  { code: '011', name: 'First Bank' },
  { code: '033', name: 'UBA' },
  { code: '057', name: 'Zenith Bank' },
  { code: '044', name: 'Access Bank' },
  { code: '232', name: 'Sterling Bank' },
] as const;

export const SOURCE_ACCOUNTS = [
  { id: 'acc_main', label: 'Main Account', accountNumber: '0123456789', balance: ACCOUNT.balance },
] as const;

export const BENEFICIARIES = [
  { id: 'ben_1', name: 'Chidi Umeh', accountNumber: '2011223344', bankCode: '058', bankName: 'GTBank' },
  { id: 'ben_2', name: 'Ngozi Bala', accountNumber: '3044556677', bankCode: '033', bankName: 'UBA' },
  { id: 'ben_3', name: 'Tunde Bakare', accountNumber: '4077889900', bankCode: '011', bankName: 'First Bank' },
  { id: 'ben_4', name: 'Amara Eze', accountNumber: '5099001122', bankCode: '057', bankName: 'Zenith Bank' },
] as const;

const COUNTERPARTIES = [
  'Chidi Umeh', 'Ngozi Bala', 'Tunde Bakare', 'Amara Eze', 'Ifeanyi Nwosu',
  'Bola Adeyemi', 'Zikora Payments', 'MTN Data', 'Ikeja Electric', 'Shoprite Lekki',
];

const DESCRIPTIONS = [
  'Transfer', 'Airtime purchase', 'Salary', 'Utility bill', 'Card payment',
  'Refund', 'POS withdrawal', 'Data bundle',
];

const UNIQUE_COUNT = 3000;
/** Rows intentionally repeated so the page-boundary dedupe is demonstrable in the UI. */
const DUPLICATE_COUNT = 40;

const buildTransactions = (): Transaction[] => {
  const rand = mulberry32(20260829);
  const start = Date.UTC(2026, 7, 29, 9, 0, 0);
  const unique: Transaction[] = [];

  for (let i = 0; i < UNIQUE_COUNT; i += 1) {
    const credit = rand() > 0.62;
    unique.push({
      id: `txn_${String(i).padStart(5, '0')}`,
      amount: kobo(Math.floor(rand() * 250_000_00) + 100_00) as Kobo,
      direction: credit ? 'credit' : 'debit',
      counterparty: COUNTERPARTIES[Math.floor(rand() * COUNTERPARTIES.length)],
      description: DESCRIPTIONS[Math.floor(rand() * DESCRIPTIONS.length)],
      timestamp: start - i * 37 * 60 * 1000,
      status: 'completed',
    });
  }

  // Straddle the 50-row page size: each duplicate lands on the far side of a boundary
  // from its original, so concat-based paging would render it twice.
  const withDuplicates = [...unique];
  for (let d = 0; d < DUPLICATE_COUNT; d += 1) {
    const sourceIndex = d * 50 + 49;
    if (sourceIndex < unique.length) {
      withDuplicates.splice(sourceIndex + 1, 0, unique[sourceIndex]);
    }
  }
  return withDuplicates;
};

/** Built once per process; pages are slices of this array. */
export const ALL_TRANSACTIONS: readonly Transaction[] = buildTransactions();

export const PAGE_SIZE = 50;
