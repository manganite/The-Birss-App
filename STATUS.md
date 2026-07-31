# Roadmap Status

> **Content:** What shipped, what is open right now, and which decisions still bind.
> **Status:** living
> **Authority:** authoritative for the current cycle. Section 1 is the ONLY list of open,
> in-scope work; deferred ideas live in `docs/planning/BACKLOG.md`.

_Last updated: 2026-07-31. Synthesises open points from the planning documents in
`docs/planning/` (`ROADMAP.md` and `ROADMAP-next.md` are closed out; `TODO-next.md` is the
frozen working-draft archive and series ledger). See those files for derivation details,
file:line anchors, and acceptance criteria. Since 2026-07-01,
two structural changes landed: the `birss-tables` consolidation (PR #48 — the transcribed
Birss reference tables now live in-repo under `birss-tables/`, full history preserved) and
the nomenclature generator + CI drift guard (PR #49 —
`birss-tables/tools/generate_nomenclature.py` regenerates `table-nomenclature.md`, CI fails
on drift)._

---

## Current release: v0.23.1 (2026-07-30)

**The EQ correction pair** — a PATCH carrying two corrections to calculated output for
fourth-rank tensors. **Q0:** rank-4 tensor bases are now minimal (RREF-reduced,
pivot-named parameters). For the twelve trigonal/hexagonal classes and their magnetic
derivatives the Simulator's rank-4 EQ polarimetry had been built from a **non-invariant**
tensor, and the Calculator/Tables relation lists showed overlapping chains that
contradicted each other as constraints; the display is now a consistent constraint view
with composite relations in Birss's printed sum-cell style, and a minimality census guards
all 122 groups. **Q1:** the electric-quadrupole channel now also enforces the quadrupole's
own index symmetry `Q_ij = Q_ji` (the `ij_kl` intrinsic class, Pershan 1963 / Hoshi 1995;
tracelessness deliberately not enforced), so EQ component counts drop to their physical
values. Independent-component counts were always correct under Q0, and ED/MD output is
bit-identical through both. `BIRSS-APP-CONVENTIONS-REFERENCE.md` Step 5(d) and 5(f) carry
the amended contract. Suite 2274 green. See `CHANGELOG.md` `[0.23.1]` for the corrected
count table and the affected surfaces, and
`docs/findings/FINDING-2026-07-29-rank4-trigonal-hexagonal-overcount.md` for the evidence
record. **Post-release:** Q2 landed the Hoshi 1995 reference goldens -- his Eqs. (11)-(12) split
by provenance, so the group-theory relations are asserted identically while his traceless
convention enters only through an explicit, exactly-verified conversion, with a negative control
pinning the app's deliberate non-enforcement of `Q_ii = 0`. **The EQ series is closed**; no open
items remain in the EQ physics block.

### v0.23.0 (2026-07-17)

Accessibility completion: the full ARIA tabs keyboard pattern (A1), restored slider
number-input focus outlines, an A2 walkthrough (crystal-cut legend label + state, mobile
slider coarse-step parity, `<nav aria-label="Main">`), and A3's detent-grid snapping for
coarse steps. Internally R1 (Tables linalg extraction) and R2 (dependency-free
`domainTypes` module; dist byte-identical). See `CHANGELOG.md` `[0.23.0]`.

### v0.22.0 (2026-07-16)

Tables rank-4 performance (allocation-free flat-array projector; build-time sharing partitions) and
the accessibility baseline (E24 declarative ARIA). Internally closed the tech-debt E-series, the
T-series test regime + F-series follow-ups, the D-series doc reconciliation, and the H-Mini hygiene
pass. See `CHANGELOG.md` `[0.22.0]`.

### Older releases

v0.21.0 and earlier: see `CHANGELOG.md` for the full, per-release detail.

---

## 1. Open items

### B15 — Explorer as interactive Birss table
**Status:** Shipped through Phase 3 (v0.20.0). The Tables page provides the full
rank 0-4 x polar/axial x i/c lookup with the Birss symbol classes (A-U) exposed,
the Tables 4a-4f / Table 7 chain, and Explorer cross-links. Backing: the
print-verified tables (Table 4f print-verified 2026-07-09, see
`birss-tables/table-4f.md`), the ~150 literature-anchored golden fixtures, and the
reference tests that re-parse the vendored tables at test time. The engine
(`computeTensorForm`) is rank-parametrized 0-4 and bridged to the public
`calculateTensorComponents` entry point for all six tensor-type/time combinations
across all 122 groups (T4/F2).

**Open residue (near-term, maintainer decision 2026-07-15):**
- ~~Nye dot diagrams for tensor forms (Tables Phase 4)~~ — **CLOSED 2026-07-31 (NYE)**. Shipped
  as a per-representation toggle beside the symbolic form, for the rank/intrinsic combinations
  that have a scheme geometry. The series also produced the app's first independent print anchor
  for the rank-3 `i(jk)` grid and for alternate-setting forms (Yariv Table 16.1, all 24 panels
  transcribed positionally and gated), and four erratum candidates in ITC-D Ch. 1.1's rank-3
  material. See the NYE entry in `docs/planning/LEDGER.md` and
  `docs/findings/FINDING-2026-07-31-itc-d-rank3-scheme-defects.md`.
- ~~Complete the Table-7 lookup-chain breadcrumb for magnetic c-tensors~~ — **CLOSED
  2026-07-31 (T7-BC)**. This entry's "currently a neutral 'runs via Table 7' placeholder"
  wording was stale from v0.21.0: the full chain (A/B fork, source reference axes, the
  Table-4a column with the parity crossover marked, the class → rank-table tail, the grey
  tail, and the misprint footnote) has shipped since then. A premise survey found the
  residue to be one defect only — the diagram rendered the book-misprint footnote without
  the breadcrumb's "Learn more" link — now fixed. See `docs/planning/TODO-next.md`, T7-BC,
  for the affordance inventory and why the second documented misprint does not apply to
  this route.
- Further Tables refinements pending maintainer scoping.

(LaTeX copy of tensor forms moved to the parking lot, section 4.)

### Accessibility completion (promoted from the parking lot, 2026-07-15)
**Status:** Closed 2026-07-16.
Baseline (E24/T5a): additive ARIA (tab widgets, `aria-current` navigation, slider/input
`aria-label`s) and tested dialog focus management. A1 added the full ARIA tabs keyboard pattern,
un-suppressed the slider number-input focus outlines (option a: UA defaults), pinned the slider
coarse-step contract, and corrected the "slider keyboard absent" misdiagnosis. A2 ran a scripted
keyboard walkthrough that returned a clean bill on tab order, labels, the search combobox, and the
dialog flows, and fixed three low findings: the crystal-cut legend label upgrade, mobile
coarse-step parity, and the `<nav aria-label="Main">` landmark. See the A-series ledger in
`docs/planning/TODO-next.md` for detail.

---

## 2-4. Deferred ideas, residual sub-items, parking lot

Moved to **`docs/planning/BACKLOG.md`** on 2026-07-31 (extraction, nothing dropped):

- former section 2, residual sub-items -> BACKLOG § A
- former section 3, old-roadmap leftovers -> BACKLOG § B
- former section 4, parking lot -> BACKLOG § C

Keeping them here made section 1 hard to find. Nothing there is scheduled; if something
from BACKLOG gets picked up, it moves into section 1.

---

## 5. Standing decisions (still binding)

Carried from `ROADMAP.md` and `ROADMAP-next.md`. These constrain future work.

- **Pre-1.0 / no backwards-compatibility promise.** SemVer: MINOR for features +
  data corrections; PATCH for display-only fixes. Data-affecting changes take a
  CHANGELOG data flag.
- **`birss-tables/` integration:** ✅ done — merged in-repo via `git subtree` (full
  history preserved). The typed-data and drift-protection intent is fulfilled by the
  generated `table7Data.ts`/`sharingPartitions` modules, the CI-regenerated
  `table-nomenclature.md` gate, and the reference tests that re-parse the vendored
  tables at test time.
- **Setting counts:** geometric vs. user-facing; monoclinic = 2 (b/c; a-unique not
  standard); orthorhombic = 3. Max 3, never 4.
- **Mobile / desktop split:** mobile = read-and-lookup; desktop = manipulate-and-
  explore. Pure Tailwind responsive breakpoints; no UA sniffing.
- **Tab order:** Explorer → Calculator → Simulator → Tables → Help.
- **Oblique-axis Cartesian convention:** Z ∥ c, Y ∥ (c×a), X = Y×Z (Hausühl 1983 /
  IRE 1949). App uses Birss setting (monoclinic z-unique). Must be documented in
  every triclinic/monoclinic fixture note before the fixture is transcribed.
- **Orientation-(in)dependence split:** Calculator owns crystal-frame, angle-free
  results; Simulator owns lab-frame, orientation-dependent results. Source Terms tab
  is the frozen-vs-swept handoff.
- **Anti-circular fixtures:** two classes with distinct rules (T2). Correctness
  goldens come from print-verified literature, never from app output; behavioral
  regression pins (`rotatedSHG.fixtures.ts`, `shgUnification.pins.test.ts`) are
  captured from a known-good revision and regenerated only by re-capture — never
  edited to turn a red pin green. For any data/math item, extend the relevant
  fixture first and require it green, then change the code.
- **Authoritative convention references:** `docs/references/BIRSS-APP-CONVENTIONS-REFERENCE.md`
  (convention contract & verification ladder) and `birss-tables/table-nomenclature.md`
  (122-group nomenclature + operators/generators) are the two central, cross-linked
  references. Any change to group keys, generators, or tensor forms is validated against
  them and their Birss/ITC table anchors, not against app output.
