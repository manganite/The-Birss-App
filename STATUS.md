# Roadmap Status

_Last updated: 2026-07-16. Synthesises open points from `docs/planning/ROADMAP-next.md`,
`docs/planning/TODO-next.md`, and the original `docs/planning/ROADMAP.md`. See those
files for derivation details, file:line anchors, and acceptance criteria. Since 2026-07-01,
two structural changes landed: the `birss-tables` consolidation (PR #48 — the transcribed
Birss reference tables now live in-repo under `birss-tables/`, full history preserved) and
the nomenclature generator + CI drift guard (PR #49 —
`birss-tables/tools/generate_nomenclature.py` regenerates `table-nomenclature.md`, CI fails
on drift)._

---

## Current release: v0.22.0 (2026-07-16)

**Tables rank-4 performance** — allocation-free flat-array projector (cold rank-4 form
~256 ms → ~14 ms, identical results) and build-time precomputed "groups sharing this
form" partitions (O(1) open) — and the **accessibility baseline** (E24 declarative
ARIA: tab widgets, `aria-current` navigation, slider/input labels). Internally this
release closes the entire tech-debt E-series (E1–E30 + Wave-5 tail), the T-series
test-regime program (T1–T5 + taxonomy) with its F-series follow-ups (F1–F4), the
D-series documentation reconciliation, and the H-Mini hygiene pass (zero eslint
warnings; empty vendor chunk dropped). Suite at 2,200+ green across a six-combination
engine/entry-point bridge matrix. Post-release: R1 (Tables linalg extraction, behavior-preserving) landed on main. See `CHANGELOG.md` `[0.22.0]`.

### v0.21.0 (2026-07-11)

Table-7 guards + lookup-chain breadcrumb/diagram, Tables help + tooltips, vendored ITC references +
count guards, Explorer polar directions + lattice info, Tables refinements, ESLint/CI guardrails, and
the symbolic-EQ correctness fix (E1). See `CHANGELOG.md` `[0.21.0]`.

### v0.20.0 (2026-07-10)

Tables **"By effect" mode**: a seven-effect catalogue (pyroelectricity, spontaneous magnetization,
permittivity, linear magnetoelectric effect, piezoelectricity, piezomagnetism, elasticity), each with
its defining equation and its own tensor symbol; allowed Explorer property chips deep-link into the
matching effect; and a frame-canonical "groups sharing this form" view whose partition is anchored to
the ITC 1.5.8.1 magnetoelectric F-blocks. Also corrects the lookup-chain breadcrumb for magnetic
c-tensors (a Table-7 note instead of the classical Table-4a tail). See `CHANGELOG.md` `[0.20.0]`.

### v0.19.0 (2026-07-10)

New **Tables** page: interactive Birss-table lookup — pick any tensor by rank (0–4), spatial parity
(polar/axial) and time parity (i/c), plus intrinsic index symmetry where meaningful, and see its
symmetry-reduced form, with the Birss lookup-chain breadcrumb (family class → reference axes → table
row) and an "Open in Tables" entry point in the Explorer popup. Backed by the print-anchored
tensor-form engine (`computeTensorForm`, validated against Birss tables 4b–4f across the 32 classical
groups via the lockstep rule). See `CHANGELOG.md` `[0.19.0]`.

### v0.18.0 (2026-07-09)

Enriched Explorer popup (Shubnikov/full HM, group order, parent + halving subgroup, per-setting
Birss/ITC standards, print-anchored property flags); corrected the `432`-family ED-SHG consequence;
app-wide portal tooltips; unified simulator/Help intensity notation. See `CHANGELOG.md` `[0.18.0]`.

### v0.17.0 (2026-07-08)

Explorer per-crystal-system info panel; crystal-cut and rotation-angle (φ_X/φ_Y) label corrections;
Help/README tab and cross-link fixes. Display-only. See `CHANGELOG.md` `[0.17.0]`.

### v0.16.0 (2026-07-05)

Birss/ITC convention as a global mode; per-crystal-system axis tooltips, reworked group header,
app-wide LaTeX rendering, route-level code splitting; grey alternate-setting `1'` and monoclinic
axis-orientation fixes. Display/verification-only. See `CHANGELOG.md` `[0.16.0]`.

### v0.15.0 (2026-07-04)

Adds the Birss/ITC symbol-convention toggle (setting labels, standard badges,
group-string synonyms, convention-aware axis display, in-app Birss↔ITC
explanations) and ITC Table 1.5.7.1 as an independent MD-c (piezomagnetic)
verification anchor (15 literature-anchored golden fixtures, 71-entry
cross-validation test). Both display/verification-only — no computed output
changes. See `CHANGELOG.md` `[0.15.0]` for details.

### v0.14.1 (2026-07-04)

Patch: corrected the generators of `6'/mm'm` (default-setting frame was
rotated 30° from Birss); ED-c default now yyy-family per Birss Table 7,
anchored by a new VERIFIED golden fixture. See `CHANGELOG.md` `[0.14.1]`.

### v0.14.0 (2026-07-02)

The complete transcribed Birss (1966) reference tables now ship in-repo under
`birss-tables/` (merged from `manganite/birss-tables`, PR #48), plus the
nomenclature generator + CI drift guard (PR #49). See `CHANGELOG.md`
`[0.14.0]`.

### v0.13.1 (2026-07-01)

Patch on top of v0.13.0: corrected two orthorhombic Type-III data bugs — `mmm'`/
`m'm'm` had each other's generator/operator sets (unprimed vs. primed inversion
swapped), and `2'm'm`'s Default orientation was rotated 90° from its own HM symbol.
Also removed the spurious a-/b-unique settings selector on `222`, `mmm`, `2221'`,
`mmm1'` (all three axes are symmetry-equivalent for them). Scoped from an external
work order (`WORKORDER-orthorhombic-naming-fix.md`), not a ROADMAP-next item — see
`CHANGELOG.md` `[0.13.1]` for the literature anchors. Supersedes the "no change
needed" note under §1's Settings taxonomy in `TODO-next.md` re: orthorhombic
settings — that note predates this fix and missed both bugs.

### v0.13.0 (2026-06-30)

Ships: B2 (settings fully surfaced), B14 (Help tabs), B16 + A1-Sim (source-term
simplification), B20 (glossary tooltip layer, 16 terms), B22 (Help audit), B30
(−3′m′ generator data fix). All ROADMAP-next waves through E are complete except
B15 and B29.

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
- Nye dot diagrams for tensor forms (Tables Phase 4).
- Complete the Table-7 lookup-chain breadcrumb for magnetic c-tensors (currently a
  neutral "runs via Table 7" placeholder).
- Further Tables refinements pending maintainer scoping.

(LaTeX copy of tensor forms moved to the parking lot, section 4.)

### Accessibility completion (promoted from the parking lot, 2026-07-15)
**Status:** Baseline shipped; completion scheduled near-term (maintainer decision).
Shipped baseline: additive ARIA (tab widgets, `aria-current` navigation,
slider/number-input `aria-label`s — E24, v0.21+), tested dialog focus management
(focus trap/restore, jsdom interaction tests — T5a), labelled icon buttons.
Remaining:
- Keyboard operation of the Simulator sliders.
- Systematic focus-visible states for preset/toggle buttons (currently only
  `TensorComponentControls` and `SimulatorSetupPanel` carry focus styling).
- A full keyboard-navigation audit.

---

## 2. Residual sub-items — from "Done" sections in TODO-next.md

These are `[ ]` items within sections marked **Status: Done**. The section shipped
"enough to merge" but not every action item was checked off. Items below are
genuinely deferred, not done-but-unchecked (marked accordingly where uncertain).

### Verification / fixtures (B1)
- Confirm the Mechanism-2 setting set against local ITC Vol. A copy.
- Extend settings machinery (`S·G·S⁻¹`) to cover the remaining colorless and grey
  multi-setting groups (Type I/II).
- ~~Add principal-axis rotation transforms (45° about z for `−42m↔−4m2`;
  30° for hexagonal pairs).~~ **Done** — these transforms exist in `ALTERNATE_SETTINGS`
  (the `−42m` family settings ship in the app).
- ~~Transcribe golden fixtures for at least one colorless and one grey alternate-setting
  group to pin the tensor form.~~ **Done** — `goldenTensors.fixtures.ts` carries 63
  `setting: 2` entries across 25 groups, including 16 colorless (e.g. `-42m`, `2/m`,
  `mm2`) and multiple grey groups.

### k-direction presets (B7)
- Orthorhombic → cubic preset cleanup: replace symmetry-equivalent `[001]/[100]/[010]`
  triples with a canonical crystallographic labeling per system.
- Label presets with standard Miller indices (e.g. `[1̄20]` for the hexagonal
  in-plane direction, `b*` for monoclinic).
- ~~Triclinic / monoclinic: document what the current conventional-axis presets mean
  in terms of the Hausühl Cartesian convention (x ∥ a, y ∥ b*, z ∥ c) — no new
  controls, just an inline label/tooltip.~~ **Done** — delivered by the crystal-cut
  label rework (buttons show [hkl]/Cartesian/crystallographic designations,
  setting-aware for monoclinic) and the axis-orientation tooltips.

### Group-identity header (B27 — lower-priority candidates)
The high-value fields shipped in v0.12.0 (Schoenflies, parent group, halving
subgroup H, SHG consequence, "Open in Explorer"). Remaining lower-priority items:
- Property flags (polar / chiral / centrosymmetric) in the header — the computation
  is done and print-reference-guarded since the T-series (`propertyFlags.ts` +
  `propertyFlags.reference.test.ts`, incl. magnetic i/c groups); the UI surfacing
  remains open (no component consumes the service yet).
- Independent-component count per multipole (ED/MD/EQ) at a glance.
- Generators as compact alternative to listing all operations.

### Note/callout styling (B25 — deferred unification)
B25 closed by dropping the emphasis chips (v0.12.0) rather than building shared
components. Remaining design-system work:
- One `<Note>` / `<Callout>` component for all inline notes (currently: dashed
  border ALL-CAPS in Calculator, borderless sentence-case in Simulator, grey block
  in MathComponents — three styles).
- One reference-panel style for the grey `bg-ink/5` block used for lab-frame /
  monoclinic notes.
- Document the chosen note / emphasis tokens in a comment or `AGENTS.md`.

### Lab-frame panel (B19 — one deferred item)
- Per-term tooltips / legend for `x_crys / X_LAB / …` and the `k`-relation.
  (B20 added the glossary infrastructure; this is a matter of writing the terms
  and placing a TermInfo icon on each vector label.)

---

## 3. Old roadmap (ROADMAP.md) — open sub-items by feature

Items from the original roadmap (`ROADMAP.md`) that were never fully addressed and
do not appear in ROADMAP-next. Listed by old feature number.

### Feature 2 — Symbolic source terms (partial)
- **Rotation-axis selector in the Calculator** (Source Terms tab): a control to
  choose the active rotation axis was planned as part of Feature 2 but not shipped.
  (The Simulator has sliders; the Calculator currently just shows angle-free terms.)
- **Symbolic crystal-orientation display**: update the AxisOrientationInfo / lab-
  frame panel to show the convention symbolically (z ∥ c, y ∥ b*, x ∥ a) in the
  Calculator and Simulator, not just numeric matrices.

### Feature 5 — Explorer enrichment (Phase 1 and 2 mostly = B15)
The big open items from Feature 5 Phase 1/2 collapse into B15. Additional smaller
items independent of B15:
- ~~**Generators in group popup**~~ **Done** — `OperationsModal` renders a
  "Generators (n)" section via `getGeneratorSymbols`.
- ~~**Shubnikov notation**~~ **Done** — `OperationsModal` renders the Shubnikov
  symbol (via the `SHUBNIKOV` map) alongside HM.
- **Mobile group-detail popup**: confirm the `OperationsModal` renders correctly as
  a full-screen sheet on mobile (progressive-disclosure expandables must not break
  at 375px).

### Feature 8 — Desktop layout (items A, B, D)
Three structural desktop layout issues identified at 1440 × 900 that were explicitly
deferred and never shipped:
- **A — Classification sidebar**: still consumes a permanent third of the viewport.
  Proposed: compact persistent group indicator + expandable panel giving full width
  to the main content.
- **B — Setup controls above the fold**: Tensor Classification + Time Reversal render
  as two full-width rows at the top of both Calculator and Simulator before any
  results. Proposed: a single compact control strip shared between the two views.
- **D — Label hierarchy**: almost all labels use the same 10px uppercase style with
  no visual distinction between primary section headers and secondary sublabels.
  Proposed: two levels of label treatment for scannability.

### Feature 9 — [hkl] surface orientation (Phase 2 residual)
- The removed diagonal presets (`k∥xy`, `k∥xz`, `k∥yz` from the Feature 1B cleanup)
  were meant to return as first-class `[hkl]` surface orientations once Phase 2
  shipped. Phase 2 added the free [hkl] input for cubic (v0.7.0), but the diagonal
  presets as canonical named orientations in `K_ORIENTATION_PRESETS` were never
  restored.

### Feature 7 — Oblique-axis convention (provenance note)
- **Golden fixture provenance for triclinic/monoclinic**: when transcribing any
  fixture for these systems, the source's setting (Birss first / ITC b-unique) and
  whether the first↔second-setting axis permutation (Matthies & Wenk eqs. 1–4, 23)
  was applied must be recorded in the fixture note. This is a documentation gate
  that must happen before any triclinic/monoclinic golden fixture is added.

---

## 4. Parking lot — ideas not yet scoped

Carried from `ROADMAP.md § Ideas / Parking Lot`. No commitment or priority order.

| Idea | Notes |
|------|-------|
| **Python export** | Generate a `scipy.optimize.curve_fit`-compatible snippet from the current source-term model. Shares the symbolic core with Feature 2; remaining work is code generation + scaffold. |
| **Data export** | CSV of tensor components / simulation data; SVG/PNG of polar plots. SVG most valuable for publication use. |
| **Save / load simulator state** | Persist and restore (group, tensor type, orientation, amplitudes, phases). Open design question: file download/upload vs. URL-encoded permalink (citable). Schema versioning needed. |
| **Circular polarization basis** | Express source terms in E± = (E_X ± iE_Y)/√2. Unitary transformation of existing symbolic polynomials — straightforward once Feature 2 is complete. |
| **Transmission vs. reflection geometry** | Adds Fresnel coefficients and refractive indices at ω and 2ω. More complex; possible "advanced mode." Current model gives the source polarization, which is geometry-agnostic. |
| **Voigt notation (d-tensor)** | Display χ⁽²⁾_ijk in contracted 3×6 d_iα notation. Pure display change — engine already computes the full tensor. Open decisions: include the factor ½ (Boyd convention)? 3×6 matrix grid or component list? Extend to rank-4 EQ? |
| **PWA enhancement** | App is already installable via `vite-plugin-pwa`. A discreet install prompt and explicit offline support would benefit lab use without network. |
| **LaTeX copy of tensor forms** | Tables Phase-4 item, deprioritized 2026-07-15: copy a displayed tensor form as a LaTeX snippet. |
| **B29 — context-sensitive coefficient formatter** | Moved from open items 2026-07-15; needs a relevance/approach decision first. Generalise `formatCoeff`/`formatSubstitutedPolySum` per-context (e.g. `2cos²θ − 1` vs `cos(2θ)`); B28 covered the 1/√6 case. Open: grouping unit, call sites, tie-breaking, interaction with B16's harmonic default. |
| **Major dependency upgrades** | Run `npm outdated` for the current picture; `npm audit --omit=dev` clean (last checked 2026-07-15). Majors are deliberately deferred: batch and test major-version bumps separately from routine patch bumps. The repo declares its Node floor in `engines.node` (binding constraint: jsdom, since T5a). |

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
