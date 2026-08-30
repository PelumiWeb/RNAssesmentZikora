# PERF.md

## Scope of what was actually measured

**Read this first.** The list strategy below is implemented and verified by unit tests and a
successful Android bundle. **On-device memory and scroll profiling was not performed** — no
emulator was attached during the build session. Rather than invent numbers, the measurement
section is left as a checklist with the exact commands to fill it in.

What *was* verified:

- `npx expo export --platform android` produces a Hermes bytecode bundle (~2.6 MB) with no
  resolution or transform errors.
- `npm ci` from the committed lockfile installs clean; `lint`, `typecheck` and `test` all
  pass afterwards.
- Dedupe and ordering across all 61 pages of the seeded dataset are asserted in
  `src/__tests__/duplicate-identities-collapse.test.ts`.


---

## Build configuration

| | |
|---|---|
| Build mode | **Debug** (Metro + Expo Go). No release/EAS build produced. |
| JS engine | Hermes (Expo SDK 57 default) |
| Architecture | New Architecture (Fabric), the RN 0.86 default |
| Bundle | 2.6 MB Android `.hbc` |

Debug mode matters when reading any timing: Metro's dev bundle, the React DevTools hook and
unminified frames all cost frame budget that a release build does not pay. Numbers collected
in Expo Go should be treated as a **floor on performance, not a measurement of it.**

---

## List strategy

**3,040 raw rows → 3,000 unique**, in 50-row pages.

1. **Virtualization — `@shopify/flash-list` 2.0.2.** FlashList v2 auto-measures, so
   `estimatedItemSize` is gone (it was removed from the API; passing it is a type error).
   Rows are a fixed 72 px, which is what actually makes recycling cheap.

2. **Bounded paging.** `useInfiniteQuery` fetches 50 rows at a time, `onEndReachedThreshold`
   0.6. The full 3,000 rows are never held in one fetch.

3. **Dedupe through a `Map`, not `concat`.** Pages merge keyed on transaction id, so a row
   repeated across a page boundary collapses to one. Last write wins, so a refetched row
   replaces its stale copy. The seeded data deliberately repeats 40 rows across page
   boundaries to make this observable rather than theoretical.

4. **Stable identity.** Sort is `timestamp` descending with **id as tiebreaker**, so rows
   keep their order across refetches when timestamps collide. `keyExtractor` uses the same
   id, so FlashList's recycling never re-keys a row mid-scroll.

5. **`memo`'d rows.** `TransactionRow` is `React.memo` and `renderItem` is `useCallback`, so
   a parent re-render (pull-to-refresh, a page append) does not re-render 3,000 children.

---

## The refresh trade-off (the interesting one)

TanStack Query's `refetch()` on an infinite query refetches **every loaded page**. After
scrolling 60 pages, one pull-to-refresh would fire 60 sequential requests.

The obvious fix — `resetQueries` — is wrong here: it clears the cache, so a *failed* refresh
would blank the list. That directly violates the requirement that a failed refresh preserves
what is on screen.

**Resolution: two queries instead of one.**

| Screen | Query | Refresh cost |
|---|---|---|
| Home ("Recent Transactions") | `useQuery`, page 0 only | 1 request |
| See all | `useInfiniteQuery`, paged | all loaded pages |

Home — where pull-to-refresh actually gets used — is always one request. The full list keeps
correct-but-heavier refresh semantics. The cost is two cache keys rather than one.

"Last Updated" reads the query's `dataUpdatedAt`, which TanStack only advances on a
**successful** fetch. The stale-timestamp-on-failure behaviour is therefore structural, not
something a developer has to remember to guard. Asserted in
`src/__tests__/failed-refresh-preserves-cache.test.tsx`.

---

## Memory notes (design intent)

- Fixtures are generated **once per process** by a seeded PRNG (`mulberry32`) into one frozen
  array. Paging slices that array; no per-page allocation of new row objects.
- Deterministic seeding means the dataset is byte-identical across reloads and test runs, so
  a memory difference between two runs is a real regression, not fixture noise.
- The merge allocates one `Map` and one sorted array per data change, not per render — it is
  inside a `useMemo` keyed on the query's pages.
- Money is a plain `number` (branded at the type level only), so there is no boxing cost per
  row.

---

## To complete before submission

Run on the target emulator, then replace this section with the numbers.

```bash
# 1. Launch a device, then:
npm run android

# 2. Scroll "See all" to the bottom (60 pages) while watching memory:
adb shell dumpsys meminfo <package> | grep TOTAL     # sample before / mid / after
adb shell am start -W <package>/.MainActivity        # cold launch time

# 3. Frame timing during a fast fling:
adb shell dumpsys gfxinfo <package> framestats
```

- [ ] Emulator model / Android API level / RAM
- [ ] Cold launch time
- [ ] Memory at rest / after scrolling all 3,000 rows / after returning to Home
- [ ] Dropped frames during a fast fling
- [ ] Confirm no OOM in the low-memory flow

---

## Known trade-offs

| Choice | Cost | Why |
|---|---|---|
| Two query keys for transactions | Slightly more cache to reason about | Keeps Home's refresh at one request without ever risking cache loss on failure |
| `Map` merge on every data change | O(n) rebuild per page append | Correctness of dedupe outranks an incremental-merge micro-optimisation at this size |
| Fixtures held fully in memory | ~3,040 objects resident | It is a mock; a real API would page server-side and this array would not exist |
| Debug build only | No release-mode numbers | Time budget; called out rather than papered over |
