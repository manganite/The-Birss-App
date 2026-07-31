# Backlog — the idea inventory

> **Content:** Every deferred idea, residual sub-item and unscoped proposal, in one place.
> **Status:** living
> **Authority:** authoritative for the idea inventory. Not a commitment or a priority order.

Nothing here is scheduled. `STATUS.md` section 1 remains the single list of what is actually
**open and in scope**; this file is where everything else waits so that section 1 can stay short.

Entries were **extracted** (moved, not rewritten) from `STATUS.md` sections 2–4 on 2026-07-31,
which in turn had carried them from `docs/planning/TODO-next.md` and `docs/planning/ROADMAP.md`.
Each entry carries its **provenance** (where it came from) and a **status tag**:

| tag | meaning |
|---|---|
| `unscoped` | a plain idea; no design decision pending, just unbuilt |
| `quick-win` | the groundwork exists; the remaining step is small and well understood |
| `needs-design-session` | cannot start without a design or product decision first |
| `gate` | not an idea at all — a rule that binds *when* related work happens |

---

## A. Residual sub-items

*Provenance: `STATUS.md` § 2 (2026-07-31), originally `[ ]` items inside TODO-next sections marked
**Status: Done** — the section shipped "enough to merge" but not every action item was checked off.*

### Verification / fixtures (B1) — `unscoped`

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

### k-direction presets (B7) — `unscoped`

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

- **Property flags (polar / chiral / centrosymmetric) in the header — `quick-win`.** The
  computation is done and print-reference-guarded since the T-series (`propertyFlags.ts` +
  `propertyFlags.reference.test.ts`, incl. magnetic i/c groups); the UI surfacing
  remains open (no component consumes the service yet).
- Independent-component count per multipole (ED/MD/EQ) at a glance. — `unscoped`
- Generators as compact alternative to listing all operations. — `unscoped`

### Note/callout styling (B25 — deferred unification) — `needs-design-session`

B25 closed by dropping the emphasis chips (v0.12.0) rather than building shared
components. Remaining design-system work:

- One `<Note>` / `<Callout>` component for all inline notes (currently: dashed
  border ALL-CAPS in Calculator, borderless sentence-case in Simulator, grey block
  in MathComponents — three styles).
- One reference-panel style for the grey `bg-ink/5` block used for lab-frame /
  monoclinic notes.
- Document the chosen note / emphasis tokens in a comment or `AGENTS.md`.

### Lab-frame panel (B19 — one deferred item) — `quick-win`

- Per-term tooltips / legend for `x_crys / X_LAB / …` and the `k`-relation.
  (B20 added the glossary infrastructure; this is a matter of writing the terms
  and placing a TermInfo icon on each vector label.)

---

## B. Old-roadmap leftovers

*Provenance: `STATUS.md` § 3 (2026-07-31) — items from the original `docs/planning/ROADMAP.md`
that were never fully addressed and do not appear in ROADMAP-next. Listed by old feature number.*

### Feature 2 — Symbolic source terms (partial) — `unscoped`

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
- **Mobile group-detail popup — `quick-win`**: confirm the `OperationsModal` renders correctly as
  a full-screen sheet on mobile (progressive-disclosure expandables must not break
  at 375px).

### Feature 8 — Desktop layout (items A, B, D) — `needs-design-session`

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

### Feature 9 — [hkl] surface orientation (Phase 2 residual) — `unscoped`

- The removed diagonal presets (`k∥xy`, `k∥xz`, `k∥yz` from the Feature 1B cleanup)
  were meant to return as first-class `[hkl]` surface orientations once Phase 2
  shipped. Phase 2 added the free [hkl] input for cubic (v0.7.0), but the diagonal
  presets as canonical named orientations in `K_ORIENTATION_PRESETS` were never
  restored.

### Feature 7 — Oblique-axis convention (provenance note) — `gate`

**This is a rule, not an idea.** It binds the next person who transcribes a fixture for these
systems, whenever that happens; it is not work to be scheduled on its own.

- **Golden fixture provenance for triclinic/monoclinic**: when transcribing any
  fixture for these systems, the source's setting (Birss first / ITC b-unique) and
  whether the first↔second-setting axis permutation (Matthies & Wenk eqs. 1–4, 23)
  was applied must be recorded in the fixture note. This is a documentation gate
  that must happen before any triclinic/monoclinic golden fixture is added.

*(The same rule is stated as a standing decision in `STATUS.md` § 5, "Oblique-axis Cartesian
convention". It is repeated here because this is where someone browsing the backlog would
otherwise mistake it for an optional item.)*

---

## C. Unscoped ideas

*Provenance: `STATUS.md` § 4 (2026-07-31), carried there from `ROADMAP.md` § Ideas / Parking Lot.
No commitment or priority order.*

### Export & interoperability bundle — `needs-design-session`

*Bundled 2026-07-31 (maintainer decision): these four were separate parking-lot rows, but they
share one design question — what the app's export surface is, in which formats, and where the
controls live. Scoping any one of them alone would pre-decide the others.*

- **Python export** — Generate a `scipy.optimize.curve_fit`-compatible snippet from the current
  source-term model. Shares the symbolic core with Feature 2; remaining work is code generation +
  scaffold.
- **Data export** — CSV of tensor components / simulation data; SVG/PNG of polar plots. SVG most
  valuable for publication use.
- **LaTeX copy of tensor forms** — Tables Phase-4 item, deprioritized 2026-07-15: copy a displayed
  tensor form as a LaTeX snippet.
- **Save / load simulator state** — Persist and restore (group, tensor type, orientation,
  amplitudes, phases). Open design question: file download/upload vs. URL-encoded permalink
  (citable). Schema versioning needed.

### Classical lookup-chain affordance enrichment — `unscoped`

*Provenance: promoted 2026-07-31 from the T7-BC parking-lot note in `docs/planning/TODO-next.md`
(§ "Tables lookup chain -- T7-BC"). Copied, not moved: that file is frozen, so the original stays
where it is and this is the live copy.*

Bring the classical lookup chain up to the magnetic one's affordance level (group chip / family
class, tensor tag, Table-4a strip, terminal). This is design enrichment rather than a defect — the
classical chain is self-explanatory in a way the Table-7 route is not, which is plausibly why it
grew fewer affordances — and it needs Help-content decisions (there is no Help material behind
several of the candidate targets). Deliberately out of scope for T7-BC; raise with Thomas before
scoping.

*Context from the T7-BC survey: the asymmetry runs the other way from what was assumed. The
Table-7 variant carries `tbl-rotated`, `tbl-crossover` and `tbl-ref-axes`; the classical variant
carries `tbl-ref-axes` alone. So this entry is about raising the classical chain, not the
magnetic one.*

### Circular polarization basis — `unscoped`

Express source terms in E± = (E_X ± iE_Y)/√2. Unitary transformation of existing symbolic
polynomials — straightforward once Feature 2 is complete.

### Transmission vs. reflection geometry — `unscoped`

Adds Fresnel coefficients and refractive indices at ω and 2ω. More complex; possible "advanced
mode." Current model gives the source polarization, which is geometry-agnostic.

### Voigt notation (d-tensor) — `needs-design-session`

Display χ⁽²⁾_ijk in contracted 3×6 d_iα notation. Pure display change — engine already computes
the full tensor. Open decisions: include the factor ½ (Boyd convention)? 3×6 matrix grid or
component list? Extend to rank-4 EQ?

### PWA enhancement — `unscoped`

App is already installable via `vite-plugin-pwa`. A discreet install prompt and explicit offline
support would benefit lab use without network.

### B29 — context-sensitive coefficient formatter — `needs-design-session`

Moved from open items 2026-07-15; needs a relevance/approach decision first. Generalise
`formatCoeff`/`formatSubstitutedPolySum` per-context (e.g. `2cos²θ − 1` vs `cos(2θ)`); B28 covered
the 1/√6 case. Open: grouping unit, call sites, tie-breaking, interaction with B16's harmonic
default.

### Major dependency upgrades — `unscoped`

Run `npm outdated` for the current picture; `npm audit --omit=dev` clean (last checked
2026-07-15). Majors are deliberately deferred: batch and test major-version bumps separately
from routine patch bumps. The repo declares its Node floor in `engines.node` (binding
constraint: jsdom, since T5a).

**Named sub-item — the eslint 9 → 10 migration.** Promoted here from the
`chore(deps)` commit body of 2026-07-31 (`73914b8`), quoted verbatim so the analysis is not lost
in a commit log:

> Remaining: 11 high advisories, all rooted in brace-expansion reachable only through
> minimatch@3 (eslint internals) and filelist (via vite-plugin-pwa -> workbox-build -> ejs
> -> jake). No patched 1.x or 2.x line exists -- GHSA-mh99-v99m-4gvg is fixed only in
> 5.0.8+ -- so clearing them needs an eslint 9 -> 10 migration, which is a toolchain
> project with its own blast radius (eslint 10 unbundles @eslint/js, which eslint.config.js
> imports) and not a dependency bump. Left for a scoped work order. All of it is build-time
> only: dist contains no trace of any flagged package.

*Currency addendum (2026-07-31, not part of the extracted text):* the `--omit=dev` line above
still holds — it was re-checked on 2026-07-31 and is clean. These 11 advisories are
**development-scope only**, GitHub reports **0 open Dependabot alerts**, and they appear only in a
full `npm audit`, which does not filter by scope.
