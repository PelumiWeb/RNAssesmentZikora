/** Transport-level shape every mock endpoint returns. Deliberately mirrors what a real
 *  client can observe, including the two cases that are not an HTTP status at all. */
export type WireResult<TBody> =
  | { kind: 'ok'; status: number; body: TBody }
  | { kind: 'http_error'; status: number; body?: unknown }
  | { kind: 'network_error' }
  | { kind: 'timeout' };

export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
