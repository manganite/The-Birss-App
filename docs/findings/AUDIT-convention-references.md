# Audit: app vs. convention references — progress report

**Status: COMPLETE (2026-07-02).** All five phases are done and merged to `main`. Phase 1
(nomenclature, 122/122) and Phase 2 (operator-set, 122/122 after six app fixes + five
birss-tables corrections) landed via PR #47. Phases 3 (tensor-form coverage: ED 21/21 classes,
MD 11/11 achievable classes, EQ deferred as a documented residual), 4 (three named hand-Birss
end-to-end checks), and 5 (this final report) landed as local `--no-ff` merges to `main` per
`WORKORDER-audit-close-out.md`. Final gate: `tsc --noEmit` / `vite build` / `vitest run` all
green, 1331/1331 tests.

---

## Phase 1 — Nomenclature completeness (Step 1) — ✅ DONE, merged to `main`

**Anchor:** `docs/references/table-nomenclature.md` Table A (90 non-grey) + Table C (32 grey).

**What was built:** `src/data/nomenclature.reference.test.ts` — parses Table A/C from the
reference doc at test time (no hand-copied expected values) and asserts `POINT_GROUPS`
(`src/data/pointGroups.ts`) matches on key set, `type`, and `schoenflies` for all 122 groups.

**Discrepancies found (all display-only, zero calculated-output impact):**

1. **58 Type III (black-white) groups had no `schoenflies` field at all** (only 64/122
   populated — all Type I + Type II). Matches the work order's own estimate exactly.
2. **All 32 Type II (grey) groups were missing the ITC subscript-R suffix** — e.g. `11'` had
   `schoenflies: "C1"`, should be `"C1R"` per Table C and per
   `BIRSS-APP-CONVENTIONS-REFERENCE.md`'s own stated rule ("Grey Schoenflies use the ITC
   subscript R"). This was *not* anticipated by the work order text (which only flagged the 58
   missing ones) — the new test surfaced it as a second, independent gap. Confirmed with the
   user before fixing (scope went beyond "fill the missing 58").
3. **A genuine cross-source naming divergence**, found while investigating #1/#2: the `-3`
   point-group family (S₆ ≡ C₃ᵢ, same abstract group, two valid alternate Schoenflies names).
   `table-nomenclature.md`'s Table A (ITC-sourced) said `S6`; the app already used `C3i`, which
   matches `birss-tables/table-3.md` (the Birss book itself lists it `C3i(S6)`, C3i primary).
   Per the app's own "Birss wins where sources diverge" rule, resolved in favor of `C3i`. The
   user manually reconciled `table-nomenclature.md` (Table A rows for `-3`, `-3'`, `-3m'`,
   `6'/m'`, Table B's matching key labels, Table C's `-31'` row, and the footer sourcing note)
   to use `C3i` throughout, with the ITC `S6` alternate noted inline rather than silently lost.

**Fix:** filled all 58 missing + corrected all 32 R-suffix entries in `pointGroups.ts` (90
entries total), using the reconciled C3i-based naming for the `-3` family.

**Result:** 247/247 new assertions pass. Full gate green: `tsc --noEmit`, `vite build`,
`vitest run` (1041 tests, up from 794). Commit `e1f0e8a`, merged `--no-ff` to `main` as
`43e4b8d` (local merge, per work order's display-only/no-PR rule for Phase 1). **Not yet
pushed to origin.**

---

## Phase 2 — Operator-set audit (Steps 2–4) — ✅ RESOLVED, 122/122 green

**Anchor:** `docs/references/table-nomenclature.md` Table B (σ(N)/σ'(N) generator column,
cross-checked byte-for-byte against `birss-tables/table-6.md` directly — confirmed faithful
transcription) + Table C's "Parent" column for grey-group derivation.

**What was built:**
- `src/services/birssGenerators.reference.fixtures.ts` — an independently re-typed σ(0)–σ(9)
  matrix pool (transcribed from `BIRSS-APP-CONVENTIONS-REFERENCE.md` Step 3 /
  `birss-tables/conventions-reference.md` §4), with its own `refMultiply`/`refClose`/
  `refIsSameMatrix` primitives. Deliberately does **not** import anything from
  `symmetryGroups.ts`, so a bug in the app's own `GENERATORS` constants cannot cancel out in
  the comparison.
- `src/data/operatorSet.reference.test.ts` — parses Table B's generator column (not the
  "Symmetry operators" text column, which uses compressed multiplicity notation like `9(2)`
  for cubic groups), builds each group's reference generator set, closes it independently, and
  compares the resulting **matrix set** (not formatted display strings) against the app's real
  closure (`GENERATORS` + `getCachedFullGroup`, imported directly from `symmetryGroups.ts`).
  Grey groups derived as parent's σ(N) list + pure time-reversal generator, per Step 4's
  `grey = parent ⊗ {1, 1'}` rule. Includes named watch-list cases for `m'm'm`, the three
  bracketed groups, and the cubic bar family, plus the full 122-group loop.

**Result of first run: 12 test failures across 9 distinct groups** (out of 122 — 113 pass
cleanly):

| Group | On watch list? | Pattern |
|---|---|---|
| `-4'm2'` | Yes (bracketed) | NOT a pure AU-swap — matrices genuinely differ |
| `4'/m'm'm` | No | Pure AU-swap (same matrices, opposite coset marked antiunitary) |
| `6'/m'` | No | Pure AU-swap |
| `6'/m` | No | Pure AU-swap |
| `6'mm'` | No | NOT a pure AU-swap |
| `-6m'2'` | No | NOT a pure AU-swap |
| `6'/m'mm'` | No | NOT a pure AU-swap |
| `m'-3'm'` | Yes (cubic bar family) | Pure AU-swap |
| `m'-3'm` | Yes (cubic bar family) | Pure AU-swap |

**Investigation so far, on `-4'm2'` (the deepest dive, since it's a named watch-list group):**

- Table B row (confirmed identical between local `table-nomenclature.md` and
  `birss-tables/table-6.md` directly): generators = σ(3), σ(4) / σ'(8); operators = `1, 2_z,
  -2_xy, -2_-xy, 2'_x, 2'_y, ±-4'_z`.
- Hand-derived what `{σ(3), σ(4), σ'(8)}` should close to under the σ-pool's own algebra:
  σ(3)=2_z, σ(4)=mirror⊥y, and their product σ(3)·σ(4)=mirror⊥x. Computationally closing all
  three generators (via the independent `refClose`) produces a unitary subgroup of
  `{1, 2_z, mirror⊥x, mirror⊥y}` — i.e. **axis-aligned** mirrors.
- But Table 6's own **operator column** for this exact row lists the unitary subgroup as
  `{1, 2_z, -2_xy, -2_-xy}` — **diagonal** mirrors (⊥ to [110]/[1-10]), not axis-aligned ones.
- These are genuinely different 4-element subgroups (diagonal mirrors ≠ axis mirrors), so this
  isn't a labeling/display artifact — the generator column and the operator column for this row
  don't appear to be mutually consistent under the σ-pool's stated algebra, as best verified so
  far.

**Working hypotheses — RESOLVED:**
1. A transcription/consistency issue in Birss's own Table 6 for this bracketed row specifically
   (birss-tables' own documentation already records two *other* known misprints elsewhere —
   6mm's and -6m2's generator lists — so an undiscovered third one in a bracketed/rotated-frame
   row, exactly the area flagged as highest-risk by `BIRSS-APP-CONVENTIONS-REFERENCE.md`, is
   plausible).
2. A gap in how σ(N) indices should be interpreted for bracketed/rotated-setting groups
   specifically (vs. the standard-orientation groups, where the same mechanism produces correct
   results — 113/122 groups pass cleanly).

Resolution: hypothesis 1 was confirmed. Fresh scans of the printed book pages showed the
transcribed operator column of `-4'm2'` (and four further entries) to be digitalization errors;
`birss-tables` table-6 pass 5 corrected them, after which σ-closure ≡ operator column for all 90
rows and the app-side audit isolates exactly the six generator bugs fixed in PR #47.

**Resolution.** Of the original 9 failing groups, investigation split them into two
independent categories:

1. **3 groups were pure `birss-tables/table-6.md` transcription/misprint issues** — the *app's*
   pre-existing generators were already correct; only the reference table was wrong. Fixed
   upstream in `birss-tables` pass 5 (see `docs/references/table-nomenclature.md`'s own
   Changelog, 2026-07-02 entry): `6'mm'`, `-6m'2'`, `6'/m'mm'` (σ'(N) generator-column entries).
   A fourth row, `6'22'` (two missing time-reversal primes), was fixed in the same pass but was
   not part of the original 9 — it had not yet tripped the audit test at the time of first
   discovery. No app code change was needed for any of these four; regenerating
   `table-nomenclature.md` Table B from the corrected upstream data was sufficient (see the
   uncommitted `table-nomenclature.md` diff carried into this session — folded into the same
   commit as the app fix below).
2. **6 groups had a genuine app-side `GENERATORS` bug** in `symmetryGroups.ts`, fixed in this
   session per `WORKORDER-fix-six-generators.md`, all verified by explicit matrix closure
   against the book-scan-verified Table-6 operator column:

   | Group | Bug | Root cause |
   |---|---|---|
   | `6'/m'` ↔ `6'/m` | inversion time-reversal flag swapped between the pair | the primed/unprimed `-1` was assigned to the wrong member of the pair |
   | `m'-3'm'` ↔ `m'-3'm` | 4-fold generator swapped | σ(7) (proper `4_z`, H = O) and σ(8) (roto-inversion `-4_z`, H = Td) were assigned to the wrong member of the pair |
   | `4'/m'm'm` | default built in the σ/4-rotated (`4'/m'mm'`) frame | used σ(4′)+mirror+primed-inversion instead of σ(8)+σ(2)+primed-inversion (H = `-42m` in the wrong orientation) |
   | `-4'm2'` | default built in the σ/4-rotated frame; also overlapped with `-4'm2'`'s own Table-6 **operator column** being transcribed in the wrong axis frame upstream (category 1 above) — a rare case where both the app *and* the reference table were independently wrong | used a primed `2_x` where the corrected row needs an unprimed mirror ⊥y |

   `-4'm2'` is the one row present in **both** categories: its Table-6 operator-column
   transcription error (upstream, category 1) and its app generator error (this session,
   category 2) were independent bugs that happened to affect the same row.

**Fix applied:** six exact generator-line replacements in `src/services/symmetryGroups.ts` (see
`WORKORDER-fix-six-generators.md` Phase 2 for the literal diffs). Verified test-first: Phase-1
golden fixtures (`src/services/goldenTensors.fixtures.ts`) were added and shown failing against
the *old* generators before the fix, then confirmed green after.

One deviation from the work order surfaced during independent fixture derivation: Phase 1f
(`4'/m'm'm`) claimed "ED i ≡ 0 and c ≡ 0" with **MD c** as the decisive frame-sensitive pin. An
independently re-implemented (calibrated, not app-derived) closure computation showed this is
backwards — MD-c is identically zero for this group (the antiunitary `-1'` imposes `T = -T` on
the axial c-type tensor via the extra `det(g)` factor), while **ED-c is the nonzero,
frame-sensitive tensor** (same magnetoelectric mechanism as the canonical Cr2O3 `-3'm'`
fixture: antiunitary `-1'` imposes `T = +T` on the polar c-type tensor). The fixture was written
using ED-c as the decisive pin instead; see its `note` in `goldenTensors.fixtures.ts` for the
full derivation.

**Result:** `src/data/operatorSet.reference.test.ts` — 122/122 groups pass (was 113/122 at first
discovery). Full gate green: `tsc --noEmit`, `vite build`, `vitest run` (1183 tests).

**Files added/changed this session** (branch `fix/operator-set-audit`):
- `src/services/symmetryGroups.ts` — six `GENERATORS` line fixes (Phase 2)
- `src/services/goldenTensors.fixtures.ts` — nine new Phase-1 golden fixtures for the six
  groups + one re-anchored fixture (`-4'm2'` Setting 2, Phase 3)
- `docs/references/table-nomenclature.md` — Table B regenerated from `birss-tables` pass 5
- `docs/references/BIRSS-APP-CONVENTIONS-REFERENCE.md` — Step 3 Test wording updated to match
  the pass-5 resolution (σ-closure and operator-column now agree for all 90 Type-III rows)

**Files added in the prior (pre-fix) investigation session, now folded into the same effort:**
- `src/services/birssGenerators.reference.fixtures.ts`
- `src/data/operatorSet.reference.test.ts`

---

## Phase 3 — Tensor-form coverage & gap-filling — ✅ DONE

**What was built:**
- `scripts/coverage_matrix.mjs` — enumerates all 122 groups × {ED, MD, EQ} × {i, c} (732
  cells) and classifies each as **ZERO** (via the app's own `calculateTensorComponents` —
  exhaustive and authoritative for this coverage catalog, since this is a catalog of what
  exists, not an independence check of any one value), **PINNED** (an exact fixture exists in
  `goldenTensors.fixtures.ts` for that `(group, tensor, tr)` at the Default setting), or
  **UNPINNED**. ZERO cells additionally get a best-effort `reason` annotation derived from the
  group's own closed operator set (grey rule, unitary/primed inversion parity) — this
  annotation is *not* exhaustive (some cells vanish for purely rotational reasons with no
  inversion involved, e.g. `432` ED-i, `m-3m` MD-i) and is labeled as a generic rotational
  vanishing in those cases.
- `src/data/tensorCoverage.audit.test.ts` — two guardrail test blocks:
  - **3b** — for all 32 grey (Type II) groups × {ED, MD, EQ}, asserts the c-tensor ≡ 0 (Step
    5e). 96 assertions, all green.
  - **3c** — for group `1` (no crystal constraint, the only case where Table 4e/4f's raw
    count is directly observable): asserts ED has 18 independent components and EQ has 54
    (empirically confirmed before writing the test, per the anti-circularity rule — 18 matches
    the existing `1`/A3 fixture, 54 is `9 × 6`: 9 free `(i,j)` output pairs × 6 `kl`-symmetrized
    field pairs), plus property-level checks that `χ_ijk=χ_ikj` (last-two) is imposed while
    `χ_ijk=χ_jik` (first-two) and the EQ `(i,j)` output pair are *not* collapsed.
- 43 new golden fixtures in `goldenTensors.fixtures.ts` (see below).

**Coverage-matrix summary** (`npx tsx scripts/coverage_matrix.mjs`, current state):

| Tensor | tr | ZERO | PINNED | UNPINNED | Total |
|---|---|---|---|---|---|
| ED | i | 56 | 25 | 41 | 122 |
| ED | c | 56 | 36 | 30 | 122 |
| MD | i | 11 | 15 | 96 | 122 |
| MD | c | 56 | 11 | 55 | 122 |
| EQ | i | 0 | 1 | 121 | 122 |
| EQ | c | 53 | 0 | 69 | 122 |
| **All** | **both** | **232** | **88** | **412** | **732** |

The completeness criterion for 3d is **per Table-4e/4f symbol class** (one representative
group per class suffices), *not* per-group — a group appearing UNPINNED above is expected and
fine as long as its class has a representative fixture elsewhere. Per-group UNPINNED counts stay
large by design (see the full grouped list in the `coverage_matrix.mjs` output; omitted here for
length — regenerate via the script rather than reading a stale copy).

**3d — Gap fixtures, by tensor:**

- **ED (rank-3 polar-odd, Table 4e) — fully pinned, 21/21 classes, both i and c.** All 21
  classes (A3–U3) already had an i-type representative from earlier work. Added 21 new ED
  c-type companion fixtures (`TYPE_I_I_EQUALS_C`) for the same 21 Type-I (classical) groups:
  each group's `GENERATORS` entry contains zero antiunitary elements, so `transformTensor`'s
  `trFactor` is unconditionally `+1` regardless of tr-type — the i-type and c-type averages are
  the *identical computation*, not merely equal in value (also Table 7's own stated rule for
  classical rows). `expected` is copied verbatim from the already table-anchored ED-i entry.
- **MD (rank-3 axial-odd, Table 4e reused with the axial transform law) — fully pinned across
  its structurally achievable range, 11/11.** Table 4a's "Axial tensor of odd rank n" column
  assigns exactly 11 distinct letters — `{A,B,D,F,H,K,L,N,P,S,T}` — across all 32 classical
  point groups (verified programmatically against the full table); the other 10 letters
  (`C,E,G,I,J,M,O,Q,R,U`) never appear in that column and so can **never** be an MD-i class for
  *any* group — not a gap, a structural fact. Those 11 letters belong to exactly the 11
  chiral/pure-rotation classical point groups (`1, 2, 222, 4, 422, 3, 32, 6, 622, 23, 432`),
  each of which has *zero* antiunitary elements (as above) *and* zero improper elements
  (`det(g) = +1` for every element), so `ED-i = ED-c = MD-i = MD-c` is the same computation for
  all four — verified computationally for all 11 groups before writing any fixture. Added 21 new
  MD fixtures (11 groups × {i, c}, minus one already-pinned duplicate found and skipped —
  `622` MD-i pre-existed from earlier work, cross-confirmed to the identical value).
- **EQ (rank-4 polar-even, Table 4f) — deferred as a documented residual**, per the Rules'
  explicit MD/EQ escape hatch. Table 4f's raw headers use several distinct multi-index
  permutation-family conventions not present in Table 4e (`yxxx(x·3)`, `xxyy(x:3)`,
  `xxyz(c4)`, `zzxy(xy:6)`, …); decoding each convention's jk-particularization behavior
  correctly (analogous to the Table-4e `(3)`-suffix decoding validated in Phase 1) needs its
  own dedicated pass with its own calibration fixtures, which risks rushing a physics-affecting
  data change. EQ-i is 1/122 pinned (`m-3m`, pre-existing) and EQ-c is 0/122 pinned; both are
  0/21 classes by direct citation. Left as residual for a future phase; see `WORKORDER-audit-
  close-out.md`'s own Definition of Done, which explicitly permits this.

**Anti-circularity:** every new `expected` value in this phase is either copied from an
already table-anchored fixture under an exact, code-verified structural argument (zero
antiunitary elements → tr-type is a no-op; zero improper elements → axial/polar is *also* a
no-op), or is a property-level assertion about the pipeline's own structure (3b/3c) — none is
read off a fresh app-output value. All new tests/fixtures passed on first run; no
stop-and-report findings in this phase.

**Gates:** `tsc --noEmit`, `vite build`, `vitest run` all green (1328 tests, up from 1183).

## Phase 4 — End-to-end hand-Birss regression tests — ✅ DONE

**What was built:** `src/services/handBirss.e2e.test.ts`, describe block `hand-Birss
end-to-end (audit Phase 4)`, three named tests asserted through the app's public
`calculateTensorComponents` entry point (the same function the UI calls) — no internal
projection helper is touched:

- **`mm2` (classical)** — ED `i` == Birss Table 4e row E3, jk-particularized (5 independent
  components). Anchor: `goldenTensors.fixtures.ts`, `'mm2'`/ED/i fixture (line 470 as of this
  commit; Step 5's own worked example in `BIRSS-APP-CONVENTIONS-REFERENCE.md`).
- **`-3'm'` (black-white, Cr₂O₃)** — ED `c` == the canonical magnetoelectric SHG source term.
  Anchor: `goldenTensors.fixtures.ts`, `"-3'm'"`/ED/c fixture (line 111); independently
  cross-checked against the primary literature source itself (Fiebig, Pavlov, Pisarev, *JOSA
  B* **22**, 96 (2005), Sec. 4.A.3, p.100), not merely against Birss.
- **`-43m` (cubic)** — ED `i` == Birss Table 4e row U3 (the Td-type single independent
  component). Anchor: `goldenTensors.fixtures.ts`, `'-43m'`/ED/i fixture (line 594).

`goldenTensors.test.ts` already asserts all three of these fixtures through this exact same
entry point (`calculateTensorComponents(f.group, f.tensor, f.tr, f.setting)`), so this phase
adds no new projection machinery — per the work order's own instruction, the three tests are
thin, explicitly-named wrappers that pin the audit's literal "app output = hand-Birss"
acceptance criterion as its own standalone, discoverable checkpoint. All three green, no
stop-and-report findings.

**Gates:** `tsc --noEmit`, `vite build`, `vitest run` all green (1331 tests, up from 1328).

## Phase 5 — Final report & gates — ✅ COMPLETE

**Final attribution summary.** The 6-group generator bug (PR #47) traces back to an initial
3-way consistency audit (`σ(N)`/`σ'(N)` closure vs. Table 6's operator column vs. the app's own
`GENERATORS`, all 90 Type-III rows) that flagged **9 distinct groups** on its first run. Full
resolution, cited against primary sources in `birss-tables` (cloned locally for this pass —
`table-6.md`, `conventions-reference.md`):

| Category | Count | Groups | Fix location |
|---|---|---|---|
| **App-side generator bugs** | 6 | `6'/m'`, `6'/m`, `m'-3'm'`, `m'-3'm`, `4'/m'm'm`, `-4'm2'` | `symmetryGroups.ts`, PR #47 |
| **`birss-tables` transcription/digitalization errors** (table-6.md's own markdown wrong; book itself correct) | 4 | `-4'm2'` operator column (wrong axis frame), `6'22'` (2 missing time-reversal primes), `6'mm'` (σ'(5)→σ'(3)), `-6m'2'` (σ'(2)→σ'(4)) | `birss-tables` pass 5 (`83a37f5`) |
| **Genuine misprint in the printed book itself** (newly found this pass; transcription was faithful) | 1 | `6'/m'mm'` (book's own σ(2) collides with unitary `2_y` ∈ H, closes to the wrong abstract group) | `birss-tables` pass 5 (`83a37f5`) |
| **Flagged by the 3-way audit, needed no change** (transcription already correct) | 1 | `6'/mm'm` | none — false alarm, documented in `table-6.md` |
| **Pre-existing, independently documented book misprints** (predate this audit; in Table 3, not Table 6) | 2 | `6mm`, `-6m2` generator lists | `birss-tables`, earlier pass (`53a17ed`) — cited here as the precedent the new `6'/m'mm'` misprint is analogous to |

Row counts: `-4'm2'` appears in **both** the app-bug row and the transcription-error row — an
independent, coincidental double-fault (its Table-6 operator column *and* the app's own
generator were each wrong, in different ways, for the same row). Excluding that overlap, the
original 9-group audit resolves as 6 app bugs + 3 pure-upstream fixes (`6'mm'`, `-6m'2'`,
`6'/m'mm'`) = 9; `6'22'` was a 10th, separate correction in the same pass-5 sweep, not part of
the original 9 (it had not yet tripped the audit test at first discovery). The 2 Table-3
misprints are older, independent history included here only because pass-5's write-up cites
them as precedent.

*(Note on the work order's shorthand "5 initial false alarms (σ-column anchor)" line: this
report does not reproduce that exact figure. The only confirmed no-change-needed case found in
the primary-source review is `6'/mm'm` (1 group). If "5" refers to the 5 groups whose bug
pattern was a clean antiunitary-coset swap — `4'/m'm'm`, `6'/m'`, `6'/m`, `m'-3'm'`, `m'-3'm`
— those were **not** false alarms; they are 5 of the 6 confirmed app bugs above, the "clean
swap" pattern being what made them straightforward to fix rather than evidence they weren't
real. This report presents the fully-source-verified breakdown in place of the shorthand.)*

**Residuals (open items, none blocking):**
- **Table 4f (EQ)** is not yet print-verified and its class-form fixtures are not yet written
  (Phase 3d, deferred as a documented residual — see Phase 3 above). EQ-i is 1/122 pinned
  (pre-existing, `m-3m`), EQ-c is 0/122 pinned; 0/21 classes covered by direct citation either
  way. A future pass needs its own decoding + calibration of Table 4f's multi-index
  permutation-family header conventions (`x·3`, `x:3`, `c4`, `xy:6`) before any Table-4f-cited
  fixture can be written, per this document's own anti-circularity rule.
- **MD (Table 4e, axial)** is fully pinned across its structurally achievable i-type range
  (11/11 classes) but the remaining ~10 letters are permanently unreachable for MD-i (a
  structural fact, not a gap — see Phase 3). MD-c's achievable range is wider (up to 21
  letters, reachable only through specific black-white groups' cross-formula) and was not
  separately audited; any MD-c-specific gap-filling is left to a future pass.
- Part 0b flipped 11 markers to `VERIFIED:`, signed off against the printed Birss Table 4e
  (2026-07-02). 7 `VERIFY:` markers remain open in `goldenTensors.fixtures.ts` as of this
  writing (lines 978, 984, 1343, 1349, 1360, 1366, 1372), pending human sign-off against
  Fiebig et al. (2005) / the printed Birss tables — not yet resolved.

**Final gates** (this commit, `main`): `npx tsc --noEmit` — clean. `npx vite build` — clean.
`npx vitest run` — **1331/1331 passing** (13 test files), up from 1183 at the start of this
work order. `npx tsx scripts/coverage_matrix.mjs` — 88 PINNED / 232 ZERO / 412 UNPINNED of 732
cells (UNPINNED is per-group, not per-class; see Phase 3's completeness criterion).
