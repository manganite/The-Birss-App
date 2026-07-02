# Audit: app vs. convention references — progress report

**Status: IN PROGRESS.** This document is being built incrementally as
`WORKORDER-audit-against-references.md` proceeds phase by phase, per that work order's own
instruction to append findings after each phase. It is not yet the final Phase 5 report —
Phase 2 has an open, unresolved finding (see below) and Phases 3–5 have not started.

**Plan:** `/home/thomas/.claude/plans/here-is-a-another-expressive-quill.md`

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

**Working hypotheses, not yet resolved:**
1. A transcription/consistency issue in Birss's own Table 6 for this bracketed row specifically
   (birss-tables' own documentation already records two *other* known misprints elsewhere —
   6mm's and -6m2's generator lists — so an undiscovered third one in a bracketed/rotated-frame
   row, exactly the area flagged as highest-risk by `BIRSS-APP-CONVENTIONS-REFERENCE.md`, is
   plausible).
2. A gap in how σ(N) indices should be interpreted for bracketed/rotated-setting groups
   specifically (vs. the standard-orientation groups, where the same mechanism produces correct
   results — 113/122 groups pass cleanly).

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

## Phase 3 — Tensor-form coverage & gap-filling — not started

## Phase 4 — End-to-end hand-Birss regression tests — not started

## Phase 5 — Final report & gates — not started (this document becomes that report)
