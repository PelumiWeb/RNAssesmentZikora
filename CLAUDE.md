# CLAUDE.md — Zikora Take-Home Build Spec

> Read this fully before writing code. This is the contract for the build. When any decision is
> ambiguous, the rules in **§1 Principles** win over convenience.

## 0. What this is graded on (read first)

This is a **safety-under-failure** test wearing a UI costume. The rubric states the correctness rules
are "where most of the marks are." Screens are necessary but not where the points concentrate.

Budget accordingly. Do **not** gold-plate UI while the correctness spine is thin. A submission that
nails idempotency, sessions, list correctness, and the 6 required tests with slightly rough screens
beats a beautiful UI that shows success once when it shouldn't.

**Time cap: 4 hours of actual work.** At the cap, stop, submit the strongest working version, and list
unfinished items in README. Log real time spent.

---

## 1. Principles (non-negotiable)

1. **On any ambiguity, default to the non-success branch.** A timeout, a dropped connection, a
   malformed response, an unknown status → never rendered as success. This single rule threads through
   login, transfers, and the must-pass list.
2. **Persistence never navigates.** Storage/session helpers read and write. They do not trigger
   routing, ever. Navigation decisions live in components/guards, not in storage utilities.
3. **Money is integer minor units (kobo).** No floats, no `parseFloat` on money. Parse → validate →
   store as `number` of kobo. Format only at the display edge.
4. **One idempotency key per transfer intent.** Created when the intent is created, reused on every
   retry of that intent. Never regenerated per network attempt.
5. **Distinct terminal states.** `success | rejected | failed | pending_unknown` are four different
   things. Collapsing any into another loses marks.
6. **No secrets, no sensitive logs.** `.env.example` only. Never `console.log` a token, password, or
   account number. Recording and screenshots use obviously-fake data so there's nothing to redact.

---

## 2. Stack (pinned — do not deliberate mid-build)

- **Expo** (SDK 51+, RN 0.74+), **TypeScript**, **Hermes on** (default).
- **React Navigation**: native-stack + bottom-tabs.
- **TanStack Query** for the transaction list. Rationale: "failed refresh preserves cached data" is
  near-free — on error the previous `data` is retained; never reset to `[]`. Use `placeholderData`/
  keep-previous semantics; do **not** clear cache on error.
- **Zustand** for session state, hydrated from storage on launch.
- **expo-secure-store** for the session token/expiry (security marks). AsyncStorage only for
  non-sensitive cache if needed.
- **FlashList** (Shopify) for the 3,000+ row list. Smoke-test scrolling in hour one; if it misbehaves
  on the arm64 emulator, fall back to `FlatList` with `windowSize`, `maxToRenderPerBatch`,
  `removeClippedSubviews`, `getItemLayout`.
- **Jest + React Native Testing Library.** E2E bonus (optional): **Maestro** (cheaper than Detox in 4h).
- Money/validation: a small hand-rolled `money.ts` util + Zod only if it earns its weight. No heavy
  form lib.
- **Comments: sparse.** Comment only where intent isn't obvious from the code (e.g. *why* the
  idempotency key is minted at intent-time, not per-request). No comments that restate what a line
  plainly does, no section-banner noise. Clear names over narration.

---

## 3. Build order (rough budget, 4h)

| Phase | Time | Output |
|---|---|---|
| Spine | ~70 min | mock service, session store, transfer status machine, idempotency, money util — all testable, no UI needed |
| Screens + list | ~90 min | Login, Home (+ virtualized list), Send Money, Receipt at just-enough fidelity |
| Tests | ~40 min | the 6 named tests in §8 — exactly those, not invented coverage |
| Docs + git | ~20 min | README / PERF.md / TESTS.md written as you go; small commits per slice |
| Recording + buffer | ~20 min | 2–5 min walkthrough hitting the rubric checklist in order |

### 3.1 Git & commit protocol (agent MUST follow)

**The agent never runs git.** No `add`, `commit`, `push`, `branch`, `PR`, or `merge` — ever. Hassan owns
every git operation so he owns every change (also satisfies the rubric's "you must own every change").

At the end of each completed vertical slice, the agent **stops and emits a commit checkpoint** instead
of committing:

```
▶ COMMIT CHECKPOINT
  when:    ~t+35 min (pace against the §3 budget — don't stack these seconds apart)
  files:   <the specific files this slice touched>
  message: <concise, imperative, explains the WHY not just the what>
  then:    make this commit yourself, then reply "next" to continue.
```

Rules for the checkpoints:
- **Sequential, one logical commit at a time** — one slice, one commit, in order. Never a bulk commit,
  never several at once.
- **Paced across the working session.** Each checkpoint carries a suggested time offset tied to the
  §3 phase budget, so the history reads as genuine incremental ~4h work, not a burst. The agent waits
  for Hassan's "next" before proceeding — it does not race ahead and pile up uncommitted slices.
- Messages are short and explain intent (e.g. `add idempotency key at intent creation, reuse on retry`).
- Branch, PR, and time-spent notes are Hassan's to write. Feature branch, **unmerged** PR, no self-merge.
- At each checkpoint the agent states its **key decisions in 1–2 plain-English lines** (why this
  approach, what the trade-off was) so Hassan can explain and defend every choice in review.
  Understanding the submitted code is a graded requirement, and the assessment (README §11) requires
  disclosing AI/tool use — keep that disclosure honest and complete.

---

## 4. Mock service (no backend)

Local mock for **login**, **refresh**, **transfer**. Deterministic, evaluator-triggerable.

**Trigger mechanism (document in README):** route outcomes by magic input values so an evaluator can
reproduce each case with no code changes. Suggested:

- Login: `reject@zikora.test` → 401; `offline` toggle in a dev-only switch → network error;
  `slow@zikora.test` → delayed 200.
- Transfer: amount ending `…00` → success; `…11` → 400/422 rejection; `…22` → 500;
  `…33` → timeout/unknown; `…44` → **delayed success that invites repeat taps**.
- A dev-only "Force offline" toggle for the offline/retry paths.

Each mock must be able to produce: **success, 4xx (400/401/409/422), 500, offline, timeout/unknown,
and a delayed response.** The transfer mock is **keyed by idempotency key** — same key returns the same
result, so retries are provably harmless.

---

## 5. Sessions

- Session = `{ token, userId, expiresAt }`. `expiresAt` is a real timestamp so expiry is deterministic,
  not vibes.
- **Cold launch**: read session from secure-store → if present and `expiresAt > now`, land on Home;
  else Login. This gate lives in a root guard/component, **not** in the storage helper.
- **Background/resume**: re-check expiry on resume.
- **Logout**: clears session, routes to Login.
- **Expiry**: an expired session is treated as logged-out on next check; never silently kept.
- A successful login **survives app restart** unless logged out or expired. Storage helpers never drop a
  valid session and never navigate.

---

## 6. Transactions (Home list)

- **3,000+ records**, genuinely virtualized (FlashList), loaded in **bounded pages**.
- **Dedupe** repeated identities within and across pages: merge pages through a `Map` keyed on stable
  transaction id — **not** `array.concat`. Same id seen twice → one row.
- **Sort consistently**: by timestamp desc, **id as tiebreaker** for stable row identity across
  refetches. `keyExtractor` uses the stable id.
- **Credit/debit styling** correct; amounts accessible (screen-reader label includes direction +
  formatted value).
- **Pull-to-refresh**: on refresh **failure**, keep the last valid content. Never
  `setState([])` on error. (With TanStack Query this is the default — just don't fight it.)

---

## 7. Transfers

- **Status machine:** `idle → submitting → (success | rejected | failed | pending_unknown)`.
  - timeout / uncertain response → `pending_unknown` (NOT failed, NOT success).
  - 4xx → `rejected`; 5xx / network → `failed`; 2xx confirmed → `success`.
- **Idempotency key** generated at **intent creation** (when user taps Continue → intent object with a
  UUID). Reused on every retry of that intent.
- **Repeat-tap protection:** guard with a `useRef` in-flight flag, **not** just state — state updates
  are async, so two taps in one tick can both pass a state check. Disable the submit button while a
  request is active. Repeat taps must create **one** attempt.
- **Receipt** is reachable **only** from `success`. Mock values only. No token/secret/real PII on it.
- Money entry: parse input → integer kobo → validate (positive, within balance, non-empty bank/account/
  amount). Continue button reflects valid/invalid/loading states.
- **Transfer fee:** the send amount and the fee are both integer kobo; total debit = amount + fee, added
  in kobo (never float-add). Decide **once** whether the receipt's "Transaction Amount" means the send
  amount or amount + fee, then apply it consistently everywhere — this is exactly the kind of money
  decision the rubric rewards being deliberate about.

---

## 8. Required tests (write exactly these — not snapshots)

1. Errors can't reach a success path (rejected/failed/offline never renders receipt).
2. Repeat taps create **one** transfer attempt (idempotency + in-flight guard).
3. Timeout yields `pending_unknown` (never success, never silent failure).
4. Failed refresh preserves cached data (list is unchanged, not empty).
5. Duplicate identities collapse to one row (within + across pages).
6. One accessibility **or** session behaviour (e.g., cold-launch restore, or amount a11y label).

Minimum 6 focused unit/component tests. `lint`, `typecheck`, `test` scripts must all pass.

---

## 9. Screens (build to the supplied designs — don't redesign, don't add screens)

Frames are labelled "iPhone 13 & 14" but the build targets **Android** — ignore iOS-only chrome.
Required path follows the **design's own flow**: Login → Home → (Transfer action) → **Pay** →
"Send Money to Bank Account" → Send Money form → Receipt. Build only what's designed — you may *improve*
a given screen, never invent a new one. Budget/Cards/Account tabs and the onboarding ("Get Started")
screen are bonus; stub those. The **Pay hub is on the critical path** — build it.

- **Login:** "Personal / Business Account" toggle (Personal is enough; stub Business). Email + password
  with visibility toggle, "Forgot Password?" (inert), green Login with disabled/loading states,
  "Create an account" (inert), "Contact Support" footer. Accessible labels. Handle invalid input,
  rejected creds, offline+retry. **Never present failure as success.**
- **Home:** time-of-day greeting + name + avatar, account number with **copy-to-clipboard**, "Your
  Balance" with a **hide/show toggle**, and a **"Last Updated" timestamp** that advances only on a
  *successful* refresh (stale timestamp stays put on failed refresh — ties to §6). Dark action card
  (Transfer / Buy Data / Help / Savings). "Recent Transactions" + See all → the virtualized list.
  Credit = green `+`, debit = red `-`. Bottom nav (Home active).
- **Pay:** reached from Home's Transfer action. Beneficiaries row (horizontal + See all) — tapping a
  beneficiary prefills the transfer (this is the bonus beneficiary-selection feature). "Send Money"
  section: **"Send Money to Bank Account" → the Send Money form** (the live path); "Send Money via
  Phone Number/Email" inert. "Pay Bills" (Buy Airtime, Pay a Bill) inert. Bottom nav (Pay active).
- **Send Money:** Choose Bank (dropdown), Your Account (dropdown), Account Number, Amount, a **transfer
  fee notice** ("attracts a charge of N…"), quick-amount chips (50/100/500/1000), Category (Optional),
  Remark (optional). Required = bank + account + amount; Category/Remark never block Continue. Continue
  reflects valid/invalid/loading. Consistent naira formatting.
- **Receipt:** shown only after confirmed success. Amount, type (e.g. INTER-BANK), sender, beneficiary
  (name / account / bank), narration, **reference**, status ("… Successful"), disclaimer. All values
  mock; reference and account numbers are fake — nothing real to redact.

**Exact tokens (color, spacing, type) come from Figma:** file `Clive-Assessments`, entry node
`47-1478` (the assessment's official design reference:
https://www.figma.com/design/6uJ0kItHvi9IB5nW4uRjXL/Clive-Assessments?node-id=47-1478) — via Dev Mode /
the Figma MCP if it's wired in. Match ~390×844, then verify layout on a **smaller** screen (~360×640):
no clipping or overflow.

---

## 10. Security

- `.env.example` only — no committed secrets.
- Mask passwords; never log tokens/passwords/account numbers.
- Redact identifiers in screenshots/docs; fake data in the recording.
- Mock config clearly separated from anything production-looking.

---

## 11. Deliverables checklist

- [ ] Private/public GitHub repo with reviewer access.
- [ ] Feature branch + **unmerged** PR (do not self-merge). PR description explains reasoning.
- [ ] Small, logical commits (per slice), not one bulk commit.
- [ ] Builds from a clean install per your instructions.
- [ ] **README** — setup, mock credentials, scenario triggers, versions (RN/Expo, JS engine, Android
      build mode, key libs), architecture notes, time spent, AI/tool disclosure, unfinished items.
- [ ] **PERF.md** — device/emulator config, build mode, list strategy, observed memory behaviour,
      trade-offs.
- [ ] **TESTS.md** — what you tested, commands + results, what you'd add with more time.
- [ ] **Recording (2–5 min)** — cold launch → UI fidelity → scrolling → failed refresh → repeat-tap
      protection → pending/unknown handling → confirmed receipt.
- [ ] lint / typecheck / test all pass.

## 12. Must-pass gate (if any fail, fix before polishing anything)

Installs & launches from your instructions · lint/typecheck/tests pass · no crash or OOM in the
low-memory flow · rejected/failed/offline/uncertain never shown as success · repeat taps can't
duplicate a transfer · no secrets or real data exposed.
