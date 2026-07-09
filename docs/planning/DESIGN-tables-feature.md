# DESIGN -- "Tables": the interactive Birss-tables feature (B15)

Status: maintainer-approved design decisions locked 2026-07-09; phase-1 analysis items open.
Place in repo: `docs/planning/DESIGN-tables-feature.md` (committed with the Phase-1 work order).

## Goal
A standalone page that makes the Birss tables interactively usable: for any of the 122 magnetic
point groups, show the group's reference information (as in the Explorer popup, but as a full
page) AND the symmetry-reduced form of an arbitrary tensor up to rank 4 -- selected either via a
physical effect or directly via (rank, polar/axial, i/c). The experience should mirror the manual
Birss lookup: group -> symbol class & reference axes (Table 4a) -> form row (Tables 4b-4f).

## Locked decisions (maintainer, 2026-07-09)
1. Page name: **Tables** (new nav item, positioned between Simulator and Help:
   Explorer / Calculator / Simulator / Tables / Help).
2. Effect catalogue v1 = the minimal seven, but DATA-DRIVEN so extending is one array entry:
   pyroelectricity (rank 1, polar, i) ; spontaneous magnetization (rank 1, axial, c) ;
   electric permittivity (rank 2, polar, i, symmetric) ; linear magnetoelectric effect
   (rank 2, axial, c) ; piezoelectricity = ED-SHG form (rank 3, polar, i, jk-symmetric) ;
   piezomagnetism (rank 3, axial, c, jk-symmetric) ; elasticity (rank 4, polar, i, Voigt
   pair symmetry).
3. Rank-4 display: relation list only (no 6x6 scheme) -- rarely used, keep it simple.
4. Form-class overview ("all groups sharing a form", like the printed spread): DEFERRED, but the
   engine design must keep it cheap (see "Design hooks" below).
5. Explorer popup gets a THIRD footer button "Open in Tables" (next to Calculator / Simulator),
   opening the Tables page with the group preselected.
6. The property chips in the Explorer popup become links: clicking a chip opens Tables with the
   group AND the matching effect preselected (chip -> effect: Polar -> pyroelectricity,
   Piezoelectric -> piezoelectricity, Ferromagnetic -> spontaneous magnetization, Piezomagnetic ->
   piezomagnetism, Magnetoelectric -> linear magnetoelectric effect). Only ALLOWED chips link
   (maintainer decision); forbidden chips stay non-interactive.
7. When an effect is selected, the Tables page shows the effect's DEFINING EQUATION(S) where one
   exists (e.g. linear ME: P_i = alpha_ij H_j and M_j = alpha_ij E_i; pyroelectricity:
   Delta P_i = p_i Delta T; permittivity: D_i = eps_0 eps_ij E_j; piezoelectricity:
   P_i = d_ijk sigma_jk; piezomagnetism: M_i = Lambda_ijk sigma_jk; elasticity:
   sigma_ij = c_ijkl eps_kl). Equations live as LaTeX in the effect catalogue entries.
8. The Tables page fully supports the global Birss | ITC convention mode AND the per-group
   setting selection, exactly like the Calculator (forms are frame-dependent; labels follow the
   active convention; the standard setting on open follows the convention).

## Architecture

### 1. Engine: TensorSpec + generalized form extraction
```
interface TensorSpec {
  rank: 0 | 1 | 2 | 3 | 4;
  parity: 'polar' | 'axial';         // det(R) factor
  timeParity: 'i' | 'c';             // antiunitary sign
  intrinsic: 'none' | 'ij' | 'jk' | 'voigt';  // index-permutation symmetry, v1 set
}
```
- Rank 0 (maintainer addition 2026-07-09): the four scalar kinds are included -- polar-i (trivial,
  always allowed), axial-i pseudoscalar (allowed exactly for the chiral groups), polar-c time-odd
  scalar (allowed exactly for Type I groups -- any primed operation kills it), axial-c time-odd
  pseudoscalar (the magnetoelectric monopole, i.e. the trace of alpha_ij; allowed iff
  det(R)*s = +1 for every element). Engine-wise this is just the group average of the prefactors;
  display is a single allowed/vanishes statement. `intrinsic` is not applicable at rank 0.
- Projection over the full group (existing machinery: rank-3/4 in `tensorCalculator`, rank-1/2
  since the property flags) unified behind one `computeTensorForm(group, setting, spec)`.
- Output: the SAME symbolic relation structure the golden fixtures use (independent components +
  equality/sign relations, e.g. `chi_xxx = -chi_xyy`), so display and testing reuse established
  formats. Identically-zero tensors are an explicit result state ("vanishes for this group").
- `intrinsic` is modelled as a set of index-permutation generators behind the enum, so adding a
  new symmetry class later (e.g. full symmetrization) is data, not code surgery.
- Cache per (group, setting, spec); specs are few and forms are small.

### 2. Effect catalogue (data file)
`src/data/tensorEffects.ts`: `{ id, label, spec, blurb, equation?, reference }[]` -- the seven v1
entries, each with a one-line physical description, the defining equation(s) as LaTeX where one
exists (decision 7), and a literature pointer. Adding an effect = one entry.

### 3. Page UI ("Tables")
- Header: the group identity block (reuse the popup/info-header building blocks: notation,
  order, parent group, settings, reference axes, properties).
- Deep links: the page is addressable with group (+ setting) and effect/spec preselected --
  the entry path for the popup's "Open in Tables" button and the property-chip links
  (decisions 5/6).
- Controls: mode toggle **By effect | By tensor type**; effect dropdown OR the three/four spec
  selectors (rank, polar/axial, i/c, intrinsic where applicable); the standard group picker with
  convention + setting awareness (forms are frame-dependent -- respect the selected setting and
  the global Birss/ITC mode exactly like the Calculator).
- Effect mode shows the defining equation(s) above the form (decision 7).
- Result: rank-specific rendering -- rank 0: allowed/vanishes statement (with the physical
  reading, e.g. "time-odd pseudoscalar -- magnetoelectric monopole"); rank 1: vector column; rank 2: 3x3 matrix (like the ME
  F1-F11 schemes); rank 3 jk-symmetric: 3x6 Nye scheme; rank 3 general and rank 4: relation list.
- Lookup chain strip (the "Birss feel"): `group -> family class (Table 4a) -> reference axes ->
  form`, rendered as a compact breadcrumb so the manual lookup path stays visible.

### 4. Anchors (anti-circularity)
- Guard tests parse the vendored `table-4b/4c/4d/4e/4f.md` and compare computed forms, following
  the established re-parse-at-test-time pattern.
- PREREQUISITE (synergy with roadmap gap F4): Table 4f is transcribed but NOT print-verified;
  print-verify it (and close the seven rank-3 VERIFY sign-offs) during Phase 1, BEFORE wiring
  rank-4 guards.
- Phase-1 analysis item: pin down the exact row/column semantics of tables 4b-4d (which symbol
  classes, i vs c variants, axis conventions) before writing the parsers -- do not assume.

### 5. Design hooks for the deferred overview
- The engine exposes a canonical, hashable form signature (normal-ordered relation set) per
  (group, spec); the later overview is then a groupBy over 122 signatures -- no engine rework.
- The page layout reserves a secondary view slot ("Groups sharing this form") without building it.

## Phasing
- **Phase 1 (engine + anchors, no UI):** TensorSpec, unified extraction, 4b-4d semantics
  analysis, parsers + guards; 4f print verification + the seven VERIFY sign-offs (closes F4).
- **Phase 2 (page, by-type mode):** route + code-split page (deep-linkable), spec selectors,
  form rendering, lookup-chain strip; the popup's "Open in Tables" button (decision 5).

- **Phase 3 (effects + polish):** effect catalogue UI incl. defining equations, the property-chip
  deep links (decision 6), "groups sharing this form" overview, chain refinements.
- **Phase 4 (nice-to-have):** LaTeX copy, possibly classic Nye dot diagrams.

## Open items (resolve in Phase 1, before coding)
1. Exact semantics of tables 4b-4d (rows, columns, i/c coverage, magnetic vs classical classes).
2. Final intrinsic-symmetry model (permutation-generator representation).
3. Zero-tensor and "effect forbidden" presentation (align with the property-flag chips).
4. Routing/code-splitting details (match the existing route-level splitting).
