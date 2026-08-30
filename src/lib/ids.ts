let counter = 0;

const randomBlock = () =>
  Math.floor(Math.random() * 0x100000000)
    .toString(16)
    .padStart(8, '0');

/**
 * Local-only unique id. Not crypto-grade: there is no backend to defend against, and the
 * only requirement is that two intents in one session can never collide. Time + a
 * monotonic counter guarantee that on their own; the random block is belt-and-braces.
 */
export const newId = (prefix: string): string => {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${randomBlock()}`;
};

export const newIdempotencyKey = (): string => newId('idem');
