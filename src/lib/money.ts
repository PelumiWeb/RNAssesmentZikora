/**
 * All money in this app is an integer count of kobo. Floats never touch a balance:
 * parsing goes string -> digits -> integer arithmetic, so 0.1 + 0.2 problems cannot occur.
 */

const KOBO_PER_NAIRA = 100;

/** Branded so a naira number can never be passed where kobo is expected. */
export type Kobo = number & { readonly __brand: 'kobo' };

export const kobo = (n: number): Kobo => {
  if (!Number.isSafeInteger(n)) {
    throw new Error(`kobo must be a safe integer, received ${n}`);
  }
  return n as Kobo;
};

export const ZERO: Kobo = kobo(0);

export const addKobo = (...values: Kobo[]): Kobo =>
  kobo(values.reduce<number>((sum, v) => sum + v, 0));

export const subKobo = (a: Kobo, b: Kobo): Kobo => kobo(a - b);

/** Upper bound on a single parsed amount: 100,000,000 naira. */
const MAX_KOBO = 100_000_000 * KOBO_PER_NAIRA;

export type ParseFailure =
  | 'empty'
  | 'invalid'
  | 'too_many_decimals'
  | 'not_positive'
  | 'too_large';

export type ParseResult =
  | { ok: true; value: Kobo }
  | { ok: false; reason: ParseFailure };

const AMOUNT_PATTERN = /^(\d*)(?:\.(\d*))?$/;

/**
 * Parses user-entered naira into kobo. Deliberately not parseFloat: the fractional
 * part is padded to two digits and folded in as an integer.
 */
export const parseAmountToKobo = (raw: string): ParseResult => {
  const cleaned = raw.replace(/[₦,\s]/g, '');
  if (cleaned.length === 0) return { ok: false, reason: 'empty' };

  const match = AMOUNT_PATTERN.exec(cleaned);
  if (!match) return { ok: false, reason: 'invalid' };

  const [, whole = '', fraction] = match;
  if (whole.length === 0 && (fraction === undefined || fraction.length === 0)) {
    return { ok: false, reason: 'invalid' };
  }
  if (fraction !== undefined && fraction.length > 2) {
    return { ok: false, reason: 'too_many_decimals' };
  }

  const nairaPart = whole.length > 0 ? Number(whole) : 0;
  const koboPart = fraction ? Number(fraction.padEnd(2, '0')) : 0;
  if (!Number.isSafeInteger(nairaPart)) return { ok: false, reason: 'too_large' };

  const total = nairaPart * KOBO_PER_NAIRA + koboPart;
  if (total <= 0) return { ok: false, reason: 'not_positive' };
  if (total > MAX_KOBO) return { ok: false, reason: 'too_large' };

  return { ok: true, value: kobo(total) };
};

const groupThousands = (digits: string): string =>
  digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** Display edge only. Never feed the output of this back into arithmetic. */
export const formatNaira = (
  amount: Kobo,
  options: { symbol?: boolean } = {},
): string => {
  const { symbol = true } = options;
  const negative = amount < 0;
  const absolute = Math.abs(amount);
  const whole = Math.trunc(absolute / KOBO_PER_NAIRA);
  const remainder = absolute % KOBO_PER_NAIRA;
  const body = `${groupThousands(String(whole))}.${String(remainder).padStart(2, '0')}`;
  return `${negative ? '-' : ''}${symbol ? '₦' : ''}${body}`;
};
