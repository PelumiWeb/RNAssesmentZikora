# Zikora — React Native take-home

A mobile banking flow built against a local mock service: login, a 3,000-row transaction
list, and a bank transfer that survives timeouts, rejections and repeat taps without ever
showing a failure as a success.

**Target platform is Android.** The Figma frames are labelled "iPhone 13 & 14"; iOS-only
chrome is ignored deliberately.

---

## Setup

Requires Node 20.19+ (built on v20.20.2) and an Android emulator or device running Expo Go.

```bash
npm ci          # clean install from the lockfile
npm run android # or: npm start, then press 'a'
```

No native toolchain is needed. The project uses Expo's managed workflow — there are no
committed `android/` or `ios/` directories, and none are required to run or review the app.

Verification scripts — all three pass:

```bash
npm run lint
npm run typecheck
npm test
```

There is **no backend and no secret to supply.** `.env.example` documents the shape a real
integration would take; nothing in the app reads it.

---

## Mock credentials

| Field | Value |
|---|---|
| Email | any valid address, e.g. `ada@zikora.test` |
| Password | `Password123` |

The password is a hardcoded mock constant in `src/services/mock/config.ts`. It is published
here on purpose: it is not a secret, and there is no real account behind it.

---

## Reproducing every failure branch

No code changes needed. Route outcomes by typing magic values.

### Login — by email address

| Email | Result |
|---|---|
| `ada@zikora.test` (or any other address) | 200 success |
| `reject@zikora.test` | 401 → rejected |
| `error@zikora.test` | 500 → failed |
| `timeout@zikora.test` | timeout → **uncertain**, amber notice, not an error and not a pass |
| `slow@zikora.test` | delayed 200 (~3.2s) — exercises the loading state |

Any password other than `Password123` also yields a 401.

### Transfer — by the **last two digits of the whole-naira amount**

| Amount | Result |
|---|---|
| `1000`, `500`, or anything unmatched | success → receipt |
| `1011` | 422 → **rejected** |
| `1022` | 500 → **failed** |
| `1033` | timeout → **pending_unknown** |
| `1044` | delayed success (~4s) — the window that invites repeat taps |

So `10.11` will *not* trigger the rejection: the trigger reads the whole-naira part (`10`).
Use whole amounts.

### Offline / retry

A dev-only **"Force offline"** switch sits at the bottom of Login, Home and Send Money
(`__DEV__` only). Toggle it to make every mock endpoint return a network error. Use it for:

- login while offline
- **pull-to-refresh failure on Home** — the list keeps its rows and "Last Updated" stays stale
- transfer while offline → `failed`, safe to retry

### Duplicate rows

The seeded dataset is **3,040 raw rows collapsing to 3,000 unique**: 40 rows are repeated
deliberately, each placed on the far side of a 50-row page boundary. A `concat`-based pager
would render them twice; the `Map`-keyed merge collapses them. Scroll "See all" to confirm
no row appears twice.

---

## Versions

| | |
|---|---|
| Expo SDK | 57.0.18 |
| React Native | 0.86.3 |
| React | 19.2.3 |
| JS engine | **Hermes** (Expo default) |
| Android build mode | **debug / Expo Go** — no release build or EAS submission was produced |
| TypeScript | 6.0.3 (`strict: true`) |
| Navigation | `@react-navigation` native-stack 7.18.10 + bottom-tabs 7.18.18 |
| Server state | `@tanstack/react-query` 5.102.8 |
| Client state | `zustand` 5.0.15 |
| List | `@shopify/flash-list` 2.0.2 |
| Secure storage | `expo-secure-store` 57.0.2 |
| Tests | `jest-expo` 57.0.5, `@testing-library/react-native` 13.3.3 |

---

## Architecture

```
src/
  domain/      pure logic, no React, no I/O  <- most of the correctness lives here
  lib/         money (integer kobo), ids, time formatting
  services/    mock endpoints + secure-store adapter
  state/       zustand stores (session, transfer)
  hooks/       query hooks + the transfer submit hook
  screens/     Login, Home, Pay, Send Money, Receipt, All Transactions
  components/  shared UI
```

Four decisions worth explaining:

**1. Ambiguity resolves in exactly one function, always away from success.**
`classifyOutcome` in `src/domain/transfer.ts` is the only place a wire result becomes a
state. A timeout, an unreadable body, a 2xx whose status is unrecognised, or a "success"
carrying no reference all become `pending_unknown`. `success` requires a 2xx *and* a
well-formed body *and* a non-empty reference. Login has the same rule in `src/domain/auth.ts`.

`success | rejected | failed | pending_unknown` are four distinct states with four
distinct presentations — `pending_unknown` gets amber wording telling the user retrying is
safe, never a red failure and never a silent pass.

**2. Money is a branded integer count of kobo.**
`Kobo = number & { __brand }` in `src/lib/money.ts`. Parsing goes string → digits →
integer arithmetic; `parseFloat` is never used on money. The fee is itself kobo, so
`totalDebit = amount + fee` is an integer add. Formatting happens only at the display edge.

> **Fee decision:** the receipt's **"Transaction Amount" is the send amount** — what the
> beneficiary receives. The fee and the total debit are disclosed on Send Money, where the
> user is still deciding, rather than after the fact. Applied consistently in both places.

**3. The idempotency key is minted at intent creation, never per request.**
When Continue is pressed, a `TransferIntent` is built with a UUID-ish key
(`src/domain/transferIntent.ts`). Every retry of that intent replays the same key. Editing
any field changes the form fingerprint and mints a *new* intent, because a different
transfer deserves a different key. The mock is keyed on it and returns byte-identical
output for replays — including joining concurrent replays onto one in-flight request, so
two taps in the same tick cannot produce two outcomes.

Repeat taps are blocked three ways: the button disables on `submitting`, the reducer
refuses `SUBMIT` unless `canSubmit`, and a `useRef` flag flips **synchronously**. Only the
ref actually catches two taps in one tick — state hasn't re-rendered yet, so both would
read a stale `idle`.

**4. Persistence never navigates.**
`src/services/sessionStorage.ts` only reads, writes and clears. Expiry is a pure predicate
(`isSessionValid`). The routing decision lives in `RootNavigator`, which reacts to session
phase. Cold launch, logout and expiry-on-resume therefore all route through one code path.
Login itself never calls `navigate` — it calls `signIn` and the guard swaps the stack.

The receipt is gated by `canViewReceipt(state)`, which is true only for
`status === 'success'` with a receipt attached. The screen re-checks it on render, so it
cannot be reached by any other route.

---

## Security notes

- **No secrets are committed.** `.env.example` contains no values the app reads; there is no
  backend and no key to supply.
- **The mock password (`Password123`) is published on purpose** — it is a hardcoded constant
  in `src/services/mock/config.ts` with no real account behind it.
- **No signing material is committed.** The project runs in Expo Go; there is no keystore,
  provisioning profile or release key anywhere in the repo.
- **Nothing sensitive is logged.** There is not a single `console.*` call anywhere in `src/`.
- **All data is fake.** Names, account numbers, balances and references are invented fixtures,
  so nothing in the app or a recording of it needs redacting.
- The session token lives in `expo-secure-store` (Keystore/Keychain-backed), not
  AsyncStorage.

## Deliberate deviations from the design

Flagged rather than hidden — each is one line to reverse.

1. **Currency symbol.** The frames render `N 500, 000.00`; the app renders `₦`. I read the
   `N` as a missing glyph rather than intent. One constant in `src/lib/money.ts`.
2. **Login backdrop.** The frame shows the login sheet over the onboarding photo collage.
   The app uses a plain dimmed backdrop — the collage needs three photographs I do not have,
   and inventing artwork was out of scope.
3. **Receipt close button.** Added a `✕` top-right. Without it the screen is escapable only
   by hardware back.
4. **Send Money total line.** Added "Total debited from your account" beneath the fee
   notice. The frame shows the fee alone; showing what actually leaves the account seemed
   the more honest reading of the same requirement.
5. **Design tokens were sampled from the supplied screenshots**, not pulled from Figma —
   the Figma MCP connector was not authorised in the build session. All tokens live in
   `src/theme/tokens.ts` and can be replaced wholesale.

---

## Not done

- **Onboarding / "Get Started" screen** — bonus per the brief, and its collage needs three
  photographs that were not supplied.
- **Budget, Cards, Account tabs** — stubbed, as the brief allows. They render a label so the
  tab bar matches the design.
- **Business Account login** — the toggle works and explains that business accounts are not
  available in this build; only Personal authenticates.
- **Inert by design** (present in the UI, no destination): Forgot Password, Create an
  account, Contact Support, Home's `+`, Buy Data / Help / Savings, Beneficiaries "See all",
  Send via Phone/Email, Buy Airtime, Pay a Bill.
- **No E2E** — the optional Maestro bonus was not attempted.
- **No release build** — verified via `expo export` (the Android bundle compiles) and Expo Go,
  not a signed APK.

---

## Time spent

`START_TIME 22:55` → `02:35`.
  `TESTS.md`: a concurrency bug in the mock's idempotency handling, surfaced by an
  intermittent test failure, and a ref-read-during-render caught by ESLint.

See `PERF.md` for list strategy and memory behaviour, and `TESTS.md` for what is tested.
