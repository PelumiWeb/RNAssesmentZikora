# TESTS.md

## Commands and results

```bash
npm run lint       # 0 errors, 0 warnings
npm run typecheck  # tsc --noEmit, strict: true — clean
npm test           # 6 suites, 43 tests, all passing (~2.4s)
```

All three verified after a `npm ci` from the committed lockfile, so a reviewer starting from
a clean clone gets the same result.

The suite contains **no snapshot tests**. Every assertion states a behaviour.

---

## The six required behaviours

The brief names six things that must be tested. Each maps to one file.

### 1. Errors can't reach a success path
`src/__tests__/errors-never-reach-success.test.ts` — 23 tests

Eleven failure modes are driven through `classifyOutcome` **and** through the reducer, and
each is asserted twice: it never classifies as `success`, and it never unlocks the receipt.

| Case | | Case | |
|---|---|---|---|
| 400 | 401 | 409 | 422 |
| 500 | 503 | offline | timeout |
| 2xx, unreadable body | 2xx, unknown status | 2xx, success with no reference | |

The last three matter most: a malformed or unrecognisable 2xx is **not** treated as success.
A single positive control asserts that a confirmed 2xx carrying a reference *does* unlock it,
so the suite can't pass by refusing everything.

### 2. Repeat taps create one transfer attempt
`src/__tests__/repeat-taps-single-attempt.test.ts` — 4 tests

- A second `SUBMIT` while `submitting` is refused; `attempts` stays at 1.
- `success` is terminal — resubmitting returns the identical state object.
- **Three concurrent submits with one key produce one transfer**, and the results are
  asserted with `toBe` (identity), not `toEqual`.
- Retrying after `pending_unknown` reuses the *original* idempotency key.

### 3. Timeout yields `pending_unknown`
`src/__tests__/timeout-pending-unknown.test.ts` — 3 tests

A timeout classifies as `pending_unknown`; `network_error` classifies as `failed`; and the
two are explicitly asserted to be different states. The reducer surfaces `pending_unknown`
as its own terminal state with no receipt attached.

### 4. Failed refresh preserves cached data
`src/__tests__/failed-refresh-preserves-cache.test.tsx` — 2 tests

Renders the real query hook, loads page 0, forces offline via the dev flag, refetches, and
waits for the error state. Asserts the row count is unchanged, the first row's id is
unchanged, and the list is **not** empty. A second test asserts `dataUpdatedAt` does not
move on a failed refresh — the "Last Updated" stamp stays stale.

### 5. Duplicate identities collapse to one row
`src/__tests__/duplicate-identities-collapse.test.ts` — 5 tests

Within one page; across a page boundary; freshest copy wins on a repeat; stable
newest-first ordering with id as tiebreaker. The last test pages the **entire seeded
dataset** (3,040 raw rows in 61 pages) and asserts it collapses to exactly the unique count,
and that the count is still ≥ 3,000.

### 6. Session behaviour + accessibility
`src/__tests__/session-restore-and-a11y.test.ts` — 6 tests

The brief asks for one *or* the other; both are covered because both were cheap.

- Cold launch with a valid stored session → authenticated.
- Expired session → unauthenticated **and** cleared from storage.
- Malformed stored value → treated as no session (not a crash).
- Logout clears storage and returns to unauthenticated.
- An expiry that elapses while backgrounded is dropped on resume.
- A transaction's screen-reader label announces direction and formatted value:
  `"Debit of ₦1,000.50, Chidi Umeh"`.

`expo-secure-store` is mocked in-memory so the storage contract is asserted directly.

---

## Two defects the tooling caught

Both are worth naming, because in each case the tool was right and the first draft was wrong.

**1. Concurrent replays of one idempotency key were not identical.**
A test run failed intermittently. The cause was not flakiness in the test — it was a real bug
in the mock: three concurrent requests with the same key each ran to completion *before* any
of them wrote to the store, so each minted its own `completedAt: Date.now()`. Replays were
therefore not byte-identical, which is precisely the property being tested. Fixed by joining
concurrent same-key requests onto a single in-flight promise
(`src/services/mock/transferApi.ts`). The assertion was tightened from `toEqual` to `toBe`
so the weaker version cannot pass again.

**2. A ref was read during render.**
The Send Money retry fingerprint started life as a `useRef` read during render. ESLint's
`react-hooks/refs` rejected it. It was right: that value decides whether the button reads
"Continue" or "Try again", so it is render-relevant and belongs in state. Changed to
`useState`.

---

## Tested by hand

Not automated, exercised through the UI (see README for the trigger values):

- Login: success, 401, 500, timeout, slow, offline
- Home: copy account number, hide/show balance, pull-to-refresh success and failure
- Pay: beneficiary tap prefills the transfer form
- Send Money: each of the five amount triggers, quick-amount chips, optional Category and
  Remark never blocking Continue
- Receipt: reachable on success; direct navigation while not in a success state renders the
  blocked state instead

---

## What I'd add with more time

In rough priority order.

1. **Component-level test for the receipt gate.** The gate is unit-tested through
   `canViewReceipt`, but a rendering test that navigates to `Receipt` in each non-success
   state and asserts the blocked view would close the loop at the UI layer.
2. **A money property test.** `parseAmountToKobo` is load-bearing for every transfer and is
   currently only exercised indirectly. Fuzzing round-trips of parse → format → parse would
   be cheap and high value.
3. **A rendering test for repeat taps.** The guard is asserted at the reducer and service
   layers; firing two `press` events in one tick against the real button would assert the
   `useRef` guard itself rather than its neighbours.
4. **Maestro E2E** for the cold-launch-restore path, which is the one flow that spans process
   restarts and therefore can't be fully asserted in Jest.
5. **Fee boundary tests** at each tier edge (₦5,000 and ₦50,000 exactly).
6. **An accessibility sweep** with a11y assertions on every interactive element, rather than
   the single amount-label assertion that the brief asked for.
