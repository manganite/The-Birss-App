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

## Phase 2 — Operator-set audit (Steps 2–4) — 🔴 IN PROGRESS, real findings surfaced

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

**Not yet done:** the same close reading for the other 8 failing groups (started noticing a
"pure AU-swap" sub-pattern across 5 of them, which may be a distinct, simpler issue from
`-4'm2'`'s — needs its own investigation before concluding anything). No fix has been applied
yet. Per the work order's non-negotiable stop-and-report rule, this is being treated as a
finding to investigate carefully rather than a discrepancy to force-fix quickly.

**Files added, not yet committed** (still on branch `fix/operator-set-audit`):
- `src/services/birssGenerators.reference.fixtures.ts`
- `src/data/operatorSet.reference.test.ts`

---

## Phase 3 — Tensor-form coverage & gap-filling — not started

## Phase 4 — End-to-end hand-Birss regression tests — not started

## Phase 5 — Final report & gates — not started (this document becomes that report)
