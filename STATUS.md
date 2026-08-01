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

### Feature surface (shipped)

Recorded here rather than in section 1, which lists only what is open. **B15 — Explorer as
interactive Birss table** shipped through Phase 3 (v0.20.0) and is complete: the Tables page
gives the full rank 0–4 × polar/axial × i/c lookup with the Birss symbol classes (A–U), the
Tables 4a–4f / Table 7 chain, and Explorer cross-links; `computeTensorForm` is rank-parametrized
0–4 and bridged to the public `calculateTensorComponents` for all six tensor-type/time
combinations across all 122 groups (T4/F2). Its two near-term residues both closed on 2026-07-31:
the **Table-7 lookup-chain breadcrumb** for magnetic c-tensors (T7-BC — see `TODO-next.md`) and
the **Nye dot diagrams** (NYE — see the `LEDGER.md` entry and
`docs/findings/FINDING-2026-07-31-itc-d-rank3-scheme-defects.md`). **Accessibility completion**
closed 2026-07-16 (E24/T5a baseline, A1 ARIA tabs keyboard pattern, A2 walkthrough, A3 detent
snapping — A-series ledger in `TODO-next.md`).

Further Tables refinements are **unscoped**, not pending: nothing is queued behind these, and
candidates live in `docs/planning/BACKLOG.md` (the deprioritized LaTeX-copy item among them).

---

## 1. Open items

### NYE-F — Nye roving-tabindex fix + view-model audit sweep

**Status:** scheduled; work order pending. Raised by the external audit of 2026-07-31 (see the
`AUDIT 2026-07-31 (Codex)` block in `docs/planning/LEDGER.md`). The dot diagram's cell buttons
have no `tabIndex` management, so the whole grid sits in the tab order instead of behaving as one
roving-focus composite; the arrow-key handler and the focus read-out are already in place, so this
is a defect in the widget's tab contract, not in its navigation. The sweep pairs that fix with a
review of the view model for the same class of gap.

Nothing else is currently scheduled. Candidates for the next cycle live in
`docs/planning/BACKLOG.md`; nothing there is committed work until it is moved into this section.

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
