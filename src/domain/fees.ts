import { Kobo, addKobo, kobo } from '../lib/money';

const TIERS: readonly { upTo: number; fee: number }[] = [
  { upTo: 5_000_00, fee: 10_00 },
  { upTo: 50_000_00, fee: 25_00 },
  { upTo: Number.POSITIVE_INFINITY, fee: 50_00 },
];

/** Fee is itself an integer kobo amount, so total debit never involves float addition. */
export const feeForAmount = (amount: Kobo): Kobo => {
  const tier = TIERS.find((t) => amount <= t.upTo) ?? TIERS[TIERS.length - 1];
  return kobo(tier.fee);
};

export const totalDebitFor = (amount: Kobo): Kobo =>
  addKobo(amount, feeForAmount(amount));
