# Ledger — series records, append-only

> **Content:** The running record of work series: what was decided, what shipped, what remains under observation.
> **Status:** living (append-only)
> **Authority:** authoritative for series closed on or after 2026-07-31.

Series closed **before** 2026-07-31 are recorded in `docs/planning/TODO-next.md`, which is frozen:
the E-, T-, F-, R-, A- and Q-series and T7-BC all live there and stay there. This file forks that
record forward — new series entries are appended here, and the archive is not reopened.

Conventions, carried over from the archive so the two read alike:

- **Append-only.** Entries are added, not edited. A superseded entry gets a dated follow-up
  underneath it rather than a rewrite.
- **Open / Completed split** per series, so an open observation point stays visible.
- Ideas that are *not* series work belong in `BACKLOG.md`; open, in-scope work belongs in
  `STATUS.md` section 1. This file is the record of how things got decided.

---

## Test-regime observations — T-series (continued)

*The T-series itself is closed and archived in `TODO-next.md`. Its one standing observation point
moved here on 2026-07-31 so that a live item is not stranded inside a frozen file.*

### Open

- **T-obs -- CI lane-splitting (observation point, not scheduled).** The evaluation proposed
  separate CI lanes (fast / exhaustive-scientific / generated-drift / browser) with deliberate
  worker counts and timeouts. Deferred measure-first in T1; the conceptual value landed
  separately as the filename-suffix taxonomy (`chore/test-taxonomy`: convenience scripts
  test:reference/audit/pins/interaction plus the AGENTS.md taxonomy section) -- local tools
  only, CI still runs the whole suite as one gate. The strongest structural argument for real
  CI lanes (a class with different execution requirements, i.e. browser binaries) lapsed with
  the T5a decision to decline Playwright, and T3/T4 removed the wall-time pressure (~155 s ->
  ~96 s full suite in the reviewer's container class). Revisit only if CI-side flakes or
  unacceptable wall-times reappear, or if a browser-runner class is ever introduced (T5b).

- **Two full-suite contention flakes, unattributed (2026-07-30/31).** Both were observed on the Q0
  branch and neither recurred:
  1. `m-3m1' EQ c` in `tensorCoverage.audit.test.ts` timed out at the 5 s default (5786 ms) under
     full-suite contention while passing in isolation. **Attributed and fixed** — that block now
     carries an explicit 30 s timeout, the same value and reasoning as `PIN_TIMEOUT_MS`. Recorded
     here only as the companion to the second observation.
  2. One further single-test failure in a full run immediately after that fix, which was **not
     captured** before the run scrolled and did not recur in the eight subsequent full-suite runs
     on that branch, nor in any run since. Every other test above ~5 s was confirmed to carry an
     explicit generous timeout, so the likeliest explanation is the same contention class; that is
     an inference, not a diagnosis.

  No action. Revisit only if a full-suite failure recurs without an obvious cause — at which point
  the first step is to capture the failing test name and duration before anything else.

- **Third occurrence, also uncaptured (2026-07-31, `chore/docs-consolidation` merge).** A full run
  on the merge commit reported `1 failed | 2292 passed`; the four runs before and after it were
  green. The failing test's identity was **again not captured** — the gate command filtered output
  with `grep -E "Tests +[0-9]+"`, which matches the summary lines but not the `FAIL <path> > <name>`
  line, so the detail was discarded at the moment it existed. That is the precise mistake the entry
  above tells the reader not to make, repeated by its own author within the hour.

  What this occurrence *does* establish, which the earlier two did not: the change under test
  **cannot** have caused it. That merge is 37 markdown files — zero code, zero configuration — so
  no execution path differs from the parent commit, which had just run green. This is now
  positively an environment/contention phenomenon rather than an unexplained one.

  Standing correction to the gate habit, not just to this entry: when a gate runs the suite, its
  output must be preserved in full (redirect to a file, then filter the file). Filtering a pipe
  discards the one thing worth having. Counter: three occurrences, two of them uncaptured for the
  same avoidable reason.

### Completed

*(none yet for the T-series in this file — see `TODO-next.md` for its closed entries.)*

---

## NYE — dot-diagram view for tensor forms (Tables Phase 4)

Branch `feat/nye-diagrams`, 2026-07-31. Closes the "Nye dot diagrams" residue of B15 in
`STATUS.md` § 1. Base `97cdf97`, suite 2293 green at branch point; 2394 green at close.

### Decisions

- **D-anchor**, as amended in-thread on 2026-07-31 after the premise pass: vocabulary = the Nye
  notation per ITC-D Sec. 1.1.4's legend (print-verified); the cell-set and count anchor for the
  app's 3×6 rank-3 `jk` grid = **Yariv, *Quantum Electronics* 2nd ed., Table 16.1**; ITC-D Ch. 1.1
  rank-3 material, **both** of its sections, is not a sole anchor for any cell set or count; Yariv
  and ITC-D share Nye ancestry and do not corroborate each other. The amendment was forced by the
  premise pass: the original decision cited ITC-D Sec. 1.1.4.8, which is the *general* 3×9 tensor,
  not the 3×6 Voigt matrix the app draws. The correct ITC-D counterpart is Sec. 1.1.4.10.4 — and it
  is unusable here anyway, because it carries the d_iμ factor 2 on μ = 4,5,6 while the app renders
  raw χ_i(jk) (the engine gives class 3's d₂₆ ratio as exactly −1, not −2, matching Yariv's
  field-product definition at his Eq. 16.1-4).
- **D-magnetic**: dissolved. The renderer is i/c-agnostic by construction; it never sees parity or
  time parity. Pinned twice in `nyeScheme.test.ts` — a bracketed-setting magnetic c case renders
  through the same path, and the derived scheme is unchanged when the spec's parity or time parity
  is altered under a fixed form. One legend sentence states it; no extension was built or claimed.
- **D-placement**: toggle beside the symbolic representation, v1 everywhere, default symbolic,
  choice persisted for the session. Simultaneous side-by-side on wide desktop is in `BACKLOG.md`,
  to be revisited with Feature 8.
- **Partition extraction** (maintainer, during the premise pass): Q0's constraint view existed only
  as rendered strings. It was extracted to `tensorProjection.reducedPartition` as data and
  `formatReducedRelations` now renders it, so the diagram and the relation list read the same call
  and cannot disagree. Behaviour-preserving; every pre-existing relation-string guard stayed green.
- **−42m book-error footnote** (maintainer, 2026-07-31): **no footnote**. The defect is in ITC-D
  prose, which the app's lookup chain never consults; the existing Table-7 footnote pattern is for
  misprints in sources the app actually reads. The finding is the record.
- **Contamination control** (maintainer, 2026-07-31): option (a) — transcribe everything, label the
  evidence — with two tightenings: blind sequencing (transcribe a panel before any engine query for
  it, and log the order), and ambiguity escalation (an ambiguous mark on an engine-known panel goes
  to print confirmation before freeze) rather than blanket second-reading.

### Method worth reusing

The premise pass extracted the **full text of both** ITC-D rank-3 sections from the chapter PDF and
swept **every** printed count against the engine, rather than spot-checking the two counts the draft
finding already named. That is what surfaced defects 3 and 4 — neither was suspected, and one of
them (32 in the Voigt section) sits in the section that actually corresponds to the app's grid. The
blueprint for any future scheme anchor: extract the source's own numbers wholesale, compare them all,
and treat the survivors as the anchor rather than the source as a whole.

### Print gate — Yariv Table 16.1, all 24 panels

Per panel: cells and links transcribed positionally; the class count **derived** from that
transcription; Yariv's printed parenthetical kept as metadata and compared; then cell set,
partition and sign structure gated against the engine. **All 24 passed on the first run.** No mark
on an engine-known panel was ambiguous, so the escalation channel never fired. The one logged
ambiguity (class 32, the start dot of the long diagonal reaching d₂₆) is on a blind panel and is
partition-invariant.

Evidence balance: **16 blind / 8 engine-known, unambiguous / 0 print-confirmed.**

| panel | cells | classes | printed | evidence |
| --- | --- | --- | --- | --- |
| Class 1 | 18 | 18 | (18) | blind |
| Class 2, 2‖x₂ (standard) | 8 | 8 | (8) | blind |
| Class 2, 2‖x₃ | 8 | 8 | (8) | blind |
| Class m, m⊥x₂ (standard) | 10 | 10 | (10) | blind |
| Class m, m⊥x₃ | 10 | 10 | (10) | blind |
| Class 222 | 3 | 3 | (3) | blind |
| Class mm2 | 5 | 5 | (5) | blind |
| Class 4 | 7 | 4 | (4) | blind |
| Class −4 | 7 | 4 | (4) | engine-known |
| Class 422 | 2 | 1 | (1) | blind |
| Class 4mm | 5 | 3 | (3) | engine-known |
| Class −42m, 2‖x₁ | 3 | 2 | (2) | engine-known |
| Class 432 (all moduli vanish) | 0 | 0 | (0) | engine-known |
| Classes −43m and 23 | 3 | 1 | (1) | engine-known |
| Class 3 | 13 | 6 | (6) | engine-known |
| Class 32 | 5 | 2 | (2) | blind |
| Class 3m, m⊥x₁ (standard) | 8 | 4 | (4) | blind |
| Class 3m, m⊥x₂ | 8 | 4 | (4) | engine-known |
| Class 6 (same as class 4) | 7 | 4 | (4) | blind |
| Class 6mm (same as class 4mm) | 5 | 3 | (3) | blind |
| Class 622 (same as class 422) | 2 | 1 | (1) | blind |
| Class −6 | 6 | 2 | (2) | engine-known |
| Class −6m2, m⊥x₁ (standard) | 3 | 1 | (1) | blind |
| Class −6m2, m⊥x₂ | 3 | 1 | (1) | blind |

Two page-level readings were corrected by per-panel photographs before freezing, both on −6m2: an
apparent mark near column 5 turned out to be the descent of the long diagonal. Crop rather than
interpretation was the right call — and the mechanism fired exactly once, on the one panel that
needed it.

### Setting inversion — an independent print result

Panel-to-setting assignment is an **output** of the gate: the test searches the app's settings for
the one reproducing each transcribed cell set and requires exactly one match. Across four group
families, Yariv's "standard orientation" is consistently the app's **alternate** setting:

    2‖x₂ → 2#2      2‖x₃ → 2#1
    m⊥x₂ → m#2      m⊥x₃ → m#1
    3m ⊥x₁ → 3m#2   3m ⊥x₂ → 3m#1
    −6m2 ⊥x₁ → −6m2#2   −6m2 ⊥x₂ → −6m2#1

Monoclinic, trigonal and hexagonal alike. This is independent print evidence on the setting
conventions, not an inference from the app's own frames, and it is pinned in the reference test.

### Findings produced

`docs/findings/FINDING-2026-07-31-itc-d-rank3-scheme-defects.md` — four erratum candidates in ITC-D
Ch. 1.1 (2nd ed., 2013). Two were known going in (−42m's printed count, 4mm's stray dot); two were
found by this series' sweep (3m general: printed 4, correct 5; 32 Voigt: printed 4, correct 2), with
a joint cross-contamination mechanism inside the trigonal block. The record also fixes the edition
and pages, raises the 3×9 column convention from assumption to confirmation, and adds the Nye
ancestry note.

### Completed

- Commit 2 `d215df2` — `services/nyeScheme.ts`, the scheme-derivation service, plus the shared
  `reducedPartition` extraction. 13 unit anchors.
- Commit 1 `888a3b6` — the finding vendored (revised before vendoring, not vendored-then-amended:
  freeze discipline protects frozen documents, and a never-committed draft is revisable).
- Commit 3 `528f7c1` — `yarivT161.reference.fixtures.ts` + gate, 77 assertions.
- Commit 4 `5e5db50` — `components/tables/NyeSchemeDiagram.tsx`, the toggle and the legend, 11 jsdom
  pins. One defect caught by those pins before it shipped: activation was written as a toggle, but
  `onMouseEnter` had already selected the class, so a mouse click cleared the highlight it was meant
  to show.
- Commit 5 — this entry, plus `CHANGELOG.md`, `STATUS.md` § 1 and the `BACKLOG.md` follow-up line.

### Open

*(none — the series is closed.)*

#### Follow-up 2026-07-31 — review of PR #123: one gate failure, one authorised extension

- **Gate failure at the PR head.** `format:check` failed on `NyeSchemeDiagram.tsx` in the
  reviewer's fresh clone, contradicting the branch report. Mechanism: commit 4's `prettier --write`
  ran during its full-gate step, and the removal of the then-unused `ref={gridRef}` happened
  *after* it — which shortened the remaining attributes enough that prettier wants them on one
  line. The follow-up gate was `lint` + `lint:eslint` only, so the regression was never measured.
  The claim was true when made and stale when reported. **Standing lesson, and the second of its
  kind in this file after the grep-filtered suite output: a gate result is only valid for the tree
  it ran against. Re-run the full gate set at the final HEAD before reporting, not at whichever
  commit was last convenient.** Fixed in `style(nye)`, a pure reflow hunk.
- **Commit 6 — rank-3 `(ij)k` as a 6×3 grid** (maintainer authorisation, in-thread WO amendment).
  The executor had flagged the exclusion as defensible-but-inconsistent and declined to widen scope
  unasked; the maintainer's ruling was to extend rather than ship the inconsistency. The 6×3 layout
  is Nye's converse-piezoelectric presentation, and it is a genuine transpose rather than a rotated
  drawing: `chi_abc -> chi_cba` is a bijection between the `ij`- and `jk`-symmetric invariant
  subspaces, because every index transforms with the same matrix and the projection therefore
  commutes with index permutation. That statement is derivable without either scheme, so the new
  sweep — 6×3 equals the transposed 3×6 cell for cell, class for class, sign for sign, over all
  classical classes with a non-vanishing rank-3 form — is a real check and not a restatement of the
  engine. Two expectation errors were caught by it and corrected: the sweep compares 20 classes, not
  21 (432's rank-3 form vanishes too), and class ids in the 6×3 layout follow its own reading order
  down the pair axis, so `chi_zzz` is class 2 there where it is class 3 in the 3×6 layout.

---

## AUDIT 2026-07-31 (Codex) — external review of the repository and its documentation

An external audit run against `main` @ `9c0c213`. Recorded here because its findings changed
documentation that other work depends on, and because an outside reading of this project's
assurance posture is worth keeping.

### Verification

Four findings, all **verified on the live tree** before any of them was acted on. None was
refuted; two turned out to be understated.

| finding | verified as | note |
| --- | --- | --- |
| `STATUS.md` section 1 drift | confirmed | Section 1 claimed to be the only open-work list while holding two blocks whose own text said they had shipped (B15, Accessibility completion). |
| Nye diagram has no `tabIndex` management | confirmed | `NyeSchemeDiagram.tsx` contains no `tabIndex` at all, so every cell button sits in the document tab order instead of the grid behaving as one roving-focus composite. Arrow keys and the focus read-out are already correct; the defect is in the tab contract only. |
| Stale `AGENTS.md` dependency line | confirmed, **understated** | The audit named one wrong line. A complete import enumeration found three wrong lines (`symmetryGroups`, `tensorProjection`, `symbolicProjection`, `trigPolyFormat`) and six modules missing from the section entirely. |
| `App` casts the navigation view | confirmed | `src/App.tsx:82` casts a plain `string` into the view union; the prop is typed `(view: string, …)` across every page component. |

One **calibration**, not a refutation. The audit's assurance-breadth observation is fair on its
own terms but understates two guards that were in place when it ran: the cross-geometry
**transpose sweep** in `nyeScheme.test.ts`, which checks two representations against each other
rather than both against the same source, and the **i/c-agnosticism pins**, which assert that a
magnetic c-tensor renders through the identical code path and that the derived scheme is
invariant under changing the spec's parity or time parity. Both are structural checks of a kind
that coverage-style reasoning does not surface.

### Dispositions

- **Documentation share → DOCS-TRUTH** (this work order): a truthful `STATUS.md` section 1, the
  architecture map rebuilt from the enumeration, fixture-provenance classes, and these entries.
- **`tabIndex` fix → NYE-F**, scheduled in `STATUS.md` § 1; work order pending. Paired with a
  view-model sweep for the same class of gap, since the Nye diagram is unlikely to be the only
  widget where a keyboard contract was half-implemented.
- **Two decisions parked in `BACKLOG.md` § D** — the browser layer (a Playwright smoke lane for
  the assertions jsdom cannot make) and the coverage signal (reinstate a provider or state that
  the project relies on targeted, provenance-classed assurance instead). Both are marked
  *to be decided*, not to be observed again; the observation is complete in each case.
- **Two refactor candidates in `BACKLOG.md` § D** — the TablesPage presentation-derivation
  extraction and typed navigation.

### External validation, recorded because it is independent

The audit names the **shared reduced-partition design** — one `reducedPartition` call feeding both
the relation list and the dot diagram, so the two cannot disagree — as the strongest recent
decision in the codebase, and rates the **scientific test strategy** as the project's strongest
asset. Both judgements were reached without sight of this ledger, which is what makes them worth
writing down: the two things an outside reader singled out are precisely the two the NYE series
spent its effort on.

---

## NYE-F — roving-tabindex fix and view-model audit sweep

Branch `fix/nye-focus-and-sweep`, 2026-08-01. Disposes of the two non-documentation findings of the
`AUDIT 2026-07-31 (Codex)` block above; closes the NYE-F item in `STATUS.md` § 1. Base `1e8c5ba`,
suite 2397 green at branch point; 2408 at close.

### Audit finding 2 — the tab contract

`NyeSchemeDiagram.tsx` had no `tabIndex` management although its docblock claimed roving focus. The
arrow navigation, wrapping, Home/End, Escape and the focus read-out were all correct; what was
missing was the property that makes a composite a composite. Every interactive cell was its own tab
stop, so crossing the widget took one Tab per surviving component.

**Red-proof**, captured against the unfixed tree before the fix existed, using the formulation
proposed when the item was scheduled — count the cells carrying a tab stop for 3m rank 4 `ij_kl`:

    AssertionError: expected [ <button …(4)>…(1)</button>, …(17) ]
      to have a length of 1 but got 18

5 of the 6 new assertions failed. Order used: red first, then the fix as commit 1, then the test
file as commit 2 — so the red is provable from the history rather than asserted in prose.

Two sub-decisions, both conventional, taken without a round-trip as the work order allowed:

- **Initial tab stop** = the first interactive cell in reading order, which is also where the
  already-pinned arrow contract begins. The alternative (no stop until first entry) would have made
  the widget unreachable by Tab on first render.
- **The stop persists** after focus leaves the grid, per the A-series precedent: returning by Tab
  lands where the user left. This is what makes the widget usable when the diagram is one of several
  controls on the page.

Implementation note worth keeping: `tabStop` stores a cell index and is validated against the
current scheme **in the render pass**, not in an effect. Switching group or spec replaces the cell
set, and a stale index must fall back to the first interactive cell; an effect would leave one frame
in which the grid has no tab stop at all, and a Tab arriving in that frame would skip the widget.

### Audit finding 3 — view-model assurance breadth

`src/services/nyeScheme.audit.test.ts` sweeps **4224 combinations**: 176 (group, setting) pairs —
122 groups plus 54 alternate settings — times the 24 diagram-capable specs. By geometry: 1408 × 3×3,
704 × 3×6, 704 × 6×3, 1408 × 6×6. 1486 are vanishing forms, deliberately in scope, since rendering
those as the all-zero scheme rather than skipping them is part of the contract. All four counts are
pinned so the sweep cannot quietly shrink.

Four structural properties, all green on the first run:

1. free diagram classes == `spanRank` of the same form — the load-bearing one, tying the diagram to
   the Q0 span rank rather than to a restatement of its own arithmetic;
2. the classes partition the surviving cells, in both directions;
3. no composite constraint is dropped, checked in both directions — every composite names a
   determined class, and every determined class is named by a composite;
4. internal consistency of ids, representatives, ratios and the zero case.

Each property accumulates all violations and asserts an empty list rather than failing on the first,
so a systematic defect would report its full extent in one run.

Runtime 4.2 s for the file; no timeout was widened, and none needed to be.

### Completed

- Commit 1 `39b9eed` — the roving-tabindex fix.
- Commit 2 `20bee0e` — the tab contract pinned in a sibling interaction file, deliberately not in
  the existing one: that suite pins what the diagram *does*, this one what it *occupies*, so a
  failure localises without reading the diff.
- Commit 3 `26820c6` — the exhaustive sweep.
- Commit 4 — this entry, plus the CHANGELOG `### Fixed` bullet and the `STATUS.md` § 1 closure.

### Open

*(none — the series is closed. `STATUS.md` § 1 now states that nothing is scheduled.)*

---

## B27-S — property flags in the group identity header

Branch `feat/property-flag-badges`, 2026-08-01. Closes the B27 property-flag residual from
`BACKLOG.md` § A. Base `33afdd4`, suite 2408 green at branch point; 2422 at close.

### The premise was false, and the drift is datable

The work order opened: *"`propertyFlags.ts` … has NO UI consumer -- the BACKLOG section-A
quick-win."* The premise pass found a consumer immediately.

| date | commit | event |
| --- | --- | --- |
| 2026-07-08 | `cd1532a` | `feat(explorer): property flags + 432-family SHG correction` — `OperationsModal.tsx` starts rendering the flags. The claim becomes false. |
| 2026-07-16 | `31922ff` | `docs(status): reconcile STATUS.md with the shipped state (D1)` writes "no component consumes the service yet" — eight days later, in a commit whose stated purpose was reconciling with the shipped state. |
| 2026-07-31 | `c95bee8` | The BACKLOG extraction moves the entry verbatim. It promised "moved, not rewritten" and delivered exactly that, stale claim included. |

The extraction is not at fault; it did what it said. The failure is at D1, and it is the same
species DOCS-TRUTH caught in `STATUS.md` § 1 — a document asserting a state it had not re-checked.

**Author rule adopted from this (maintainer, 2026-08-01):** *a work-order premise asserting the
ABSENCE of a consumer or a feature cites the usage grep that establishes it, or it is not written.*
Absence claims are the ones a reader cannot spot-check by reading the thing itself, and a
`grep -rl propertyFlags src/components` would have taken seconds. This generalises the Erratum-11
enumeration rule from findings to work-order premises.

### What was actually true, and what shipped

The flags were visible only in the Explorer's operations modal. Three of the four pages that show a
group identity — Calculator, Simulator, Tables — said nothing about what the group admits. So the
task was not "surface them" but "surface them on the other three", and the risk changed with it:
adding a second surface meant two files would separately decide which service function backs which
label. That is the Q0 shared-partition lesson at small scale, so the definitions were extracted to
`components/propertyFlagDefs.ts` first and the modal moved onto it before anything new was built.

Three decisions, all the maintainer's (2026-08-01), recorded at the definition list so the
divergence reads as intent:

- **Flag sets differ.** Modal: five chips plus a chiral row, piezo included — a lookup view.
  Header: the four material-class flags — piezo availability is already reachable through Tables
  by-effect, and a persistent header should not repeat it.
- **Absent flags differ.** Modal strikes them through, because in a lookup view the absence of a property is itself informative. Header
  omits them, because four struck-through badges on every centrosymmetric crystal on every page is
  noise.
- **Placement.** Own row below the collapsible block. The summary row is a `<button>`, so an info
  affordance inside it would nest interactive elements; the expandable panel starts collapsed for
  every group without alternate settings, so badges there would be hidden for most groups.

### Premise-pass results worth keeping

- **Header inventory:** one component, `GroupIdentityHeader` in `MathComponents.tsx`, three mounts
  (Calculator, Simulator, Tables). No others.
- **Grey groups:** 0 of 32 are ferromagnetic or magnetoelectric — pure time reversal kills every
  time-odd tensor. Polar and chiral match the classical parent in 32/32 cases.
- **Distribution over 122:** polar 31, chiral 32, ferromagnetic 31, magnetoelectric 58, no flag 32.
- **Two work-order errors corrected.** Group `1` admits all four flags, not the two the WO named —
  it has no symmetry operation, so nothing kills anything. And provenance is not uniformly ITC:
  ferromagnetic and magnetoelectric are anchored on ITC Tables 1.5.2.4 / 1.5.8.1, but polar is
  anchored on the 10 polar classes (Schmid, *Ferroelectrics* **162**, 317 (1994)) and chiral on the
  11 enantiomorphic classes. Following the WO literally would have printed a false citation on two
  of four badges.

### Verification

- **Witnesses** (read off the service, then hard-coded): `1` → all four; `2'/m'` → ferromagnetic
  only, print-verified in ITC 1.5.2.4 row 36; `-3'm'` → magnetoelectric only (Cr2O3); `m-3m` → no
  badge row; `11'` → polar and chiral only, the grey contrast against `1`.
- **Sweep:** all 122 groups render and show exactly the service's flag set, collected-and-compared
  rather than fail-on-first.
- **Modal behaviour pin:** chip markup captured by SSR *before* the extraction and re-captured
  after — five chips, same order, same admitted sets for four witnesses, byte-identical. The
  maintainer's condition on authorising the extraction, discharged with measurements.
- Real browser: `2'` shows the four badges under the summary row; `m-3m` shows no row.

### Completed

- Commit 1 `9c0af9e` — the shared definition list; modal moved onto it, behaviour-identical.
- Commit 2 `34c3424` — the header badge row, plus per-flag provenance in the four glossary briefs
  (shared with the modal, so both surfaces gained it).
- Commit 3 — the pins: witnesses, provenance strings, the 122-group sweep, the modal pin.
- Commit 4 — this entry, the CHANGELOG bullet, the STATUS closure, and the BACKLOG correction.

### Open

*(none — the series is closed. The two remaining B27 residuals stay in `BACKLOG.md`, unscoped.)*

---

## SIM-O — pseudo-3D sample-orientation widget for the Simulator

Branch `feat/sim-orientation-widget`, 2026-08-02. Base `e7733b2` (v0.24.0), suite 2422 green at
branch point; 2473 at close. Maintainer design recorded 2026-08-02: a small always-live scene beside
the crystal-rotation sliders — fixed axonometric viewpoint, a fixed lab triad in front of the sample
with Z ∥ k, the sample a flat cuboid rotating with the sliders and carrying a crystal triad anchored
at one corner. The cuboid is cut-independent; the cut changes only how the crystal axes lie inside
it. Desktop-only, because crystal rotation is.

### The premise pass held, and produced an engine change

All three premises checked out, but P2 did not resolve as written.

- **P1 (mount point, desktop/mobile reality).** The rotation controls sit in
  `SimulatorSetupPanel.tsx` inside an **unconditional** `hidden md:block` container — distinct from
  the setup block above it, which is `hidden md:block` only while the mobile disclosure is
  collapsed. There is no path on which they render on mobile, so the desktop-only premise held and
  the widget needed no gate of its own: it inherits that container's.
- **P2 (engine API).** No function returned the composed matrix. The composition was inlined
  identically at `tensorProjection.ts:927-928` (`calculateSHGExpressions`, the Simulator's path) and
  `:1000-1001` (`getLabFrameVectors`, the equation box), with a symbolic counterpart at
  `symbolicProjection.ts:41`. Citable, so the stop-trigger did not fire — but "the widget must use
  the same composition, from the same code" then had no code to point at.
- **P3 (patterns).** Desktop-only is pure Tailwind everywhere in `src`; the single `window.innerWidth`
  is tooltip positioning in `TermInfo.tsx`. The SVG precedent is `tables/NyeSchemeDiagram.tsx`
  (service supplies the view model, component only draws; fixed geometry constants; ink/paper only;
  `aria-hidden` glyph layer with a separate accessibility layer).

**Maintainer decision (2026-08-02) on P2:** extract `composeOrientationMatrix` into
`tensorProjection.ts` (layer 2), both inline sites rewired, `orientationScene` a layer-3 consumer.
The reasoning is the executor's own and is worth keeping: *the composition order is physics
convention — the order and sense of Ry·Rx·Rz·R_preset — not matrix algebra, so it belongs beside its
consumers and `linalg` stays convention-free.* Authorised with a neutrality condition: `rotatedSHG`,
`shgUnification.pins` and `azimuthConvention` green **unchanged, with no re-capture**, or stop. They
were, and the full suite stayed at 2422 with `tensorProjection.ts` the only file in the diff. The
symbolic path is a deliberate nil-action: it shares the order but keeps the angles symbolic over
`TrigMat3`, so it has no arithmetic to share. Noted in the new function's doc comment.

### Two corrections to the recorded anchor-corner rule

The rule as written — *the corner maximizing the minimum outward component of the three axes*, with
a priority order as tie-break — survives as the SELECTION metric. Two things around it did not.

**(i) The score's sign is not the defect criterion.** The stop-trigger read "an axis pointing INTO
the body is a rule defect". Evaluating the score over the complete cut space showed [110] at exactly
0 and [111] at −0.138071 for their best corners, which under the literal reading would have fired
the trigger for two of five cuts. But a negative score does not mean an axis enters the body: an
arrow from a corner enters the slab only if it runs inward along **all three** of that corner's
adjacent face normals at once, which is strictly weaker than the single-diagonal score. Under that
test no axis of any cut enters the body, with margins 1, 1, 1, 0.707, 0.577.

| cut | anchor corner | score | face-normal margin | axis into body? |
| --- | --- | --- | --- | --- |
| [100] | 4 = (−,+,+) | +0.577 | 1.000 | no |
| [010] | 2 = (+,−,+) | +0.577 | 1.000 | no |
| [001] | 0 = (+,+,+) | +0.577 | 1.000 | no |
| [110] | 0 = (+,+,+) | **0.000** (2-way tie) | 0.707 | no |
| [111] | 4 = (−,+,+) | **−0.138** (2-way tie) | 0.577 | no |

The maintainer separated the two roles accordingly: score selects, face-normal test detects defects.
`pointsIntoBody` is that criterion, exported and asserted for every axis of all five cuts.

**(ii) [110] is degenerate too, and more sharply than [111].** The work order named only [111]. Both
are two-way ties; [110]'s two corners tie at *exactly* zero, i.e. at `0` versus `-0` in floating
point, so a bare `>` comparison would have let the sign of a zero decide which corner the triad hangs
from. The tie-break takes the lowest corner index and compares with `AXIS_EPSILON` from
`tolerances.ts` — the maintainer's call, and the right home: it is documented there as the tolerance
for "dot-product sign checks", which is exactly this. Determinism is asserted for both degenerate
cuts.

**(iii) A third correction, found at the interaction layer.** The work order expected [111] to anchor
at a different corner from [100]. It does not — both land on corner 4. Under [100] the axes are
(z, y, −x); under [111] all three carry +1/√3 of Z; the same corner serves both. In the cubic preset
set it is [110] that re-anchors, so that is the pair the DOM test uses. Pinned in both layers as an
assertion, so the coincidence cannot later be mistaken for a bug.

### The cut space is complete, not sampled

`thetaX/thetaY/psi0` have exactly one writer, `KDirectionSelector` (mounted by the Simulator and, in
two places, the Calculator), offering five directions across all seven crystal systems: [100], [010],
[001], [110], [111]. The anchor is rotation-invariant by construction — body and triad carry the same
`R_user`, so every dot product in the rule is unchanged by it — so five presets is an exhaustive check
of the anchor rule, not a sample of it. That is what lets the table above be stated as a property
rather than as spot checks.

### Design decisions

- **No subscripts on the labels.** Lower-case x/y/z for the crystal axes against upper-case X/Y/Z for
  the lab — the app's established case convention — with `∥ k` on lab Z, the one fact the picture
  cannot show. The adjacent crystal-axes equation box keeps its subscripts and serves as the legend,
  so the picture does not have to repeat what sits two rows above it.
- **The picture is the equation box's general case.** At zero rotation the drawn triad IS
  `getLabFrameVectors`; under rotation it is the same matrix with the user angles filled in. Neither
  derives the matrix, so they cannot disagree. The unit tests assert that identity literally for all
  five cuts, with both sides carrying independently hand-written values.
- **Layout (probe result).** Beside the sliders from `lg` up; between `md` and `lg` the 276-unit scene
  would squeeze the slider tracks below usable length, so it drops below them there. Inside the
  `showRotation` disclosure, i.e. it appears with the sliders it mirrors rather than in place of them.
- **Accessibility.** One labelled image: `role="img"`, no tab stop, no interactive surface, and an
  aria-label naming the cut and the three angles in the same words the slider labels use.
- **Scene constants measured, not guessed.** The body and its triad sweep a square of about ±78 units
  about the body origin over the whole reachable space; the canvas was sized from that envelope and a
  bounds test re-checks it over the sweep.

### Verification

- **Unit (44).** Hand-derived expectations with the derivation in each fixture comment: the screen
  basis in closed form (r = (−sin a, cos a, 0), u = (−sin e cos a, −sin e sin a, cos e)), the beam
  axis drawn exactly vertical, the zero-rotation identity with the equation box for all five cuts,
  one 90° case per axis, a generic triple against an independent re-derivation of the product, the
  anchor corner and its tie-break for all five cuts, rigid-ride over a rotation sweep, the
  face-normal defect criterion with a positive control, projected handedness of both triads, and the
  canvas bounds. The rotation matrix is deliberately **not** re-derived — it is guarded upstream, and
  re-deriving it would only restate the convention against itself.
- **Interaction (7).** Mount and containment, the image contract, live redraw against the sliders
  with the lab triad held fixed, the aria-label tracking angles and cut, cut-switch re-mapping with
  the body unmoved, and re-anchoring on [100] → [110].
- **Browser (Playwright, review time).** 1440 px: beside the sliders. 900 px: below them. 390 px: in
  the DOM but not rendered. Zero rotation reproduces the equation box `x=X, y=Y, z=Z` on screen.

### Paragraph-D datapoint — the desktop cut is not assertable at the interaction layer

The work order asked for a jsdom pin that the widget "renders on a desktop viewport and NOT on a
mobile viewport". That cannot be written against a Tailwind-only implementation: jsdom applies no
stylesheet, so the element is in the DOM at every viewport and resizing the jsdom window proves
nothing. The alternative — a `matchMedia` gate — would buy testability at the price of STATUS § 5's
*"pure Tailwind responsive breakpoints; no UA sniffing"*, for a widget that needs no JS-side
knowledge of the viewport.

**Maintainer decision (2026-08-02):** keep Tailwind; re-formulate the pin as the containment
contract — the widget sits inside a container carrying the breakpoint classes, together with the
sliders it mirrors, and no ungated second instance exists — and take the rendered cut as
browser-layer evidence. Recorded here as one more datapoint on the standing question of what the
interaction layer can and cannot certify, not re-argued at the file. Third such datapoint after the
T5a fine-step boundary and the KaTeX accessible-name limitation; unlike those two, this one is about
CSS rather than about an unimplemented DOM API, which is the sharper version of the same gap.

### Completed

- Commit `574567f` — `composeOrientationMatrix` extracted, neutrality proven against the three named
  guards with no re-capture.
- Commit `0806082` — the scene service and its 44 unit anchors.
- Commit `a6f32c1` — the SVG widget and its desktop mount.
- Commit `46500d5` — the interaction pins.
- Commit 5 — this entry, the CHANGELOG bullet, the STATUS closure, and the AGENTS map correction
  (17 service modules, `orientationScene` at layer 3).

### Revision 2026-08-02 (pre-push) — the camera was wrong, and the tests could not see it

Appended rather than folded into the entry above, per the append-only rule: what the first pass got
wrong is part of the record.

**The defect.** Visual acceptance found the scene rendering a cyclic permutation of the lab axes —
Z_lab ran up the screen instead of across it, so the sample lay flat like a table instead of standing
as a wall facing the beam. Every direction, anchor and identity test stayed green throughout, and
correctly so: **they all compare LAB-space vectors, and are blind to where the camera puts them.**
The suite had no assertion about the picture's own geometry, only about the geometry it depicts.

**The root cause was the form of the constants, not their values.** The camera was parameterized as
azimuth + elevation with an implied world-up, and that construction can only make lab Z the vertical —
`SCREEN_RIGHT` was built as `normalize(Z × c)`, which bakes the beam axis into the definition of the
horizon. There was no value of the two angles that would have produced the intended picture.

**The fix.** The viewpoint is now stated directly as the screen images of the three lab axes
(`AXO_X`, `AXO_Y`, `AXO_Z`; u right, v up), which is a complete specification of a general
axonometric projection and makes the contract legible instead of implied. Backface culling takes the
line of sight from the projection's kernel — the cross product of its two rows — whose sign follows
the same right-handed rule an orthonormal camera obeys. The maintainer's target:

| axis | image (u, v) | reads as |
| --- | --- | --- |
| Y_lab | (0.00, 1.00) | exactly vertical, up — the picture's plumb line |
| Z_lab ∥ k | (0.94, 0.20) | to the right, slightly raised |
| X_lab | (−0.82, −0.42) | to the left and down |

Contractual is the sign structure, not the magnitudes (±10 % is aesthetic). The consequence is the
point: the large face is ⊥ k, so at zero rotation it spans the images of X and Y — the sample stands
as an obliquely seen wall and its thickness runs off to the right, along the "∥ k" arrow. The kernel
lands on the −Z side, which is exactly what puts the thickness right rather than left.

**The two pins that close the class**, and they divide the work — confirmed by mutation while
writing, not assumed:

- **Camera contract** — the sign structure of the three images, mutual non-degeneracy, and the
  hand-derived kernel. Restoring the old constants fails this test and five others.
- **Image parallelism at zero rotation, cut [100]** — the drawn x arrow is parallel to the drawn Z
  arrow, y to Y, and z ANTI-parallel to X, i.e. the equation box `x = Z, y = Y, z = −X` restated in
  screen space with its signs. Tolerance `AXIS_EPSILON`. This one is blind to the camera constants by
  design and catches the other half: reading the triad off the ROWS of R instead of its columns fails
  it. The old camera does **not** fail it — which is precisely why both are needed.

**The generalisable lesson**, offered for § 5 if the maintainer wants it there: *a test that asserts
the modelled quantity does not test the depiction of it.* The widget was the app's first drawing, and
the suite had grown up around services whose output IS the answer. Every fixture in the first pass
compared vectors the camera never touches.

Also in this revision: canvas re-measured under the new projection (the envelope is wider than tall
because the projection is oblique — ±83 by ±73 about the body origin at SCALE 26), all hand-derived
projection fixtures re-derived with their comments, and the layout changed to a two-column flex from
`md` with the slider group capped at `max-w-xl` and the scene `self-start`, so its top edge lines up
with the first slider row. Suite 2473 → 2474.

### Revision 2, 2026-08-02 (pre-push) — the camera was distorted, and the fix was in the brief

**The defect.** Visual acceptance found the body drawn as a rhomboid and the reading directions
still off. The axis directions were right this time; the *metric* was not.

**The cause is the specification of Revision 1, not its execution — and that specification is the
work order author's.** Revision 1 replaced the azimuth/elevation camera with three free axis-image
constants, on the reasoning that a parallel projection is fully determined by where it sends the
basis vectors. True, and the trap: not every such triple is an ORTHOGRAPHIC projection. By Gauss's
theorem of axonometry the three images, read as complex numbers, must satisfy
`z₁² + z₂² + z₃² = 0`; the prescribed triple `X(−0.82, −0.42)`, `Y(0, 1)`, `Z(0.94, 0.20)` gives
`0.3396 + 1.0648i`. It specified a shear. Constants cannot enforce a constraint they are free to
violate.

**The fix, per the maintainer's brief.** The camera is a rotation built from `linalg` primitives,
`M = Rx(−20°)·Ry(115°)`; the screen image of an axis is the first two components of the rotated
vector; the line of sight is the third row. Orthonormality is now structural. Verified against the
brief before implementing: all three target images reproduce to seven places, `M·Mᵀ = I` to 3.5e−17,
`row0 × row1 = row2` exactly, and Gauss goes from `0.3396 + 1.0648i` to ~1e−16.

| axis | image (u, v) | reads as |
| --- | --- | --- |
| Y_lab | (0.0000, 0.9397) | exactly vertical, up |
| Z_lab ∥ k | (0.9063, −0.1445) | to the right, slightly lowered |
| X_lab | (−0.4226, −0.3100) | to the left and down |

**On the sketch, for the record.** The brief's own note is confirmed: Z slightly RAISED is not
reachable by any orthographic camera that also has Y vertical and X pointing down. This is the
view-from-above; the mirror choice is elevation +20°, which raises Z but tips X upward with it. The
maintainer's acceptance decides.

**Three pins, and their measured division of labour.** Mutation-tested rather than argued — the
third row is the one that corrects an assumption in the brief:

| mutation | metric pin | screen identity [001] | parallelism [100] | orientation contract |
| --- | --- | --- | --- | --- |
| Revision 1 camera (permutation + shear) | **fails** | **fails** | green | fails |
| pure shear (Z image ×1.25, directions kept) | **fails** | **fails** | green | **green** |
| triad read off the ROWS of R (camera intact) | green | **green** | **fails** | green |

Row 2 is the class that shipped: a pure shear leaves every orientation assertion green. Row 3
corrects the brief's expectation that the screen-identity pin would also catch wiring — it cannot,
because it is set at [001] where `R_preset` is the identity and rows and columns coincide. That is
the parallelism pin's job, and it is set at [100] for exactly that reason. All three are needed;
none is redundant.

**Second evidence for the standing decision.** Promoted to `STATUS.md` § 5 with this case as its
second datapoint: *a test of the modelled quantity is not a test of its depiction; visualisation
contracts need their own orientation AND metric pins.* Revision 1 supplied the orientation half of
that lesson, Revision 2 the metric half — and the metric half is the harder one, because a shear is
invisible to every assertion the orientation half suggests.

Also in this revision: envelope re-measured (now a DISC of ±71 units at SCALE 28 — roundness is
itself a consequence of orthonormality, since the sweep is rotation-covariant), canvas 272×200, all
projection fixtures hand-derived for the third time with their comments, and the handedness identity
simplified back to a unit line of sight. Layout and the reported 30-px inner-padding point unchanged.
Suite 2474 → 2476.

### Revision 3, 2026-08-02 (pre-push) — the right maths, the wrong one of two cameras

**The defect.** Orthonormality held, the metric was clean, the signs matched — and at [001] the slab
was still drawn as a narrow upright sliver instead of showing its face. The camera was lab **X**'s
view, not the beam's.

**The cause is again the specification, and again the work order author's.** The Revision 2 contract
pinned orthonormality and four signs. That admits exactly two cameras here, and they are close
relatives:

| azimuth | \|image X\| | \|image Y\| | \|image Z\| | depth axis | what the slab looks like at [001] |
| --- | --- | --- | --- | --- | --- |
| 115° | 0.5241 | 0.9397 | 0.9178 | lab X | narrow upright sliver, seen nearly edge-on |
| **155°** | 0.9178 | 0.9397 | **0.5241** | **lab Z ∥ k** | flat plate showing its face, thickness short to the lower right |

The same three image lengths, X and Z exchanged. Both are proper orthographic views; both put Y
vertical, X to the left and down, Z to the right. Sign structure cannot separate them, and neither
can any metric identity — the squares sum to 2 either way. What separates them is what the picture
is FOR.

**The pin that closes it.** Two assertions, both in the camera-contract block:

- **(a) the beam is the depth axis:** `|image(Z)|` strictly less than `|image(X)|` and `|image(Y)|`.
  Because the squares sum to 2, shortening one axis lengthens the others — the three numbers are not
  independent, so this single ordering fixes the whole shape of the view.
- **(b) the sample shows its face:** at zero rotation the visible face carrying the largest depth is
  the −Z one, at 0.8517 against 0.3971 (−x) and 0.3420 (−y). Under the 115° camera it was −x at
  0.8517 — the acceptance finding, stated as a number.

**Mutation tableau, now four rows.** The new row is the point: the ambiguity was invisible to
everything that existed.

| mutation | metric | semantic | screen identity [001] | parallelism [100] | orientation contract |
| --- | --- | --- | --- | --- | --- |
| Revision 1 camera (permutation + shear) | **fails** | — | **fails** | green | fails |
| pure shear (Z image ×1.25, directions kept) | **fails** | — | **fails** | green | **green** |
| triad read off the ROWS of R (camera intact) | green | green | **green** | **fails** | green |
| **azimuth back to 115° (the sibling camera)** | **green** | **fails** | **fails** | green | **green** |

Row 4: metric green, signs green, wiring green — only the semantic pin and the length-ratio half of
the screen-identity pin see it. Which is exactly why Revisions 1 and 2 shipped a contract that could
not.

**Numbers checked against the brief before implementing**, as for every revision: the three target
images reproduce to seven places, and the length ordering holds. One correction — the brief gives
`|X| ≈ 0.930`; it is **0.9178**. The claim that mattered, `|Z| = 0.5241` being the minimum, is right.

**Third evidence for the standing decision**, and it extends it rather than repeating it. Revision 1
gave the ORIENTATION half of the lesson, Revision 2 the METRIC half, Revision 3 the SEMANTIC half:
sign structure and metric together still leave which-axis-is-depth free, and that is the one thing a
reader of the picture actually reads. `STATUS.md` § 5 now names all three as the minimum for any
future drawing surface.

Also in this revision: all projection fixtures hand-derived a fourth time with their comments (lab
tips, visible-face order and depths, handedness area 575.71594, screen-identity length ratios), and
`LAB_ORIGIN` moved 6 units right because X is now the long arrow and its label would otherwise leave
the canvas. The envelope is unchanged at ±71.3 — a rotation-covariant sweep under an orthonormal
camera traces the same disc whatever the angles, so the canvas needed nothing. Layout untouched.
Suite 2476 → 2477.

### Revision 4 (final), 2026-08-02 — the parity chain, and choosing by contact sheet

**The finding is the maintainer's** (2026-08-02): every rendering up to Revision 3 was, as a screen
image, LEFT-handed. The suspected mechanism was a net parity flip in the pipeline, and it is exactly
that.

**The parity chain — the mechanism, named.** Three frames sit between the world and the pixel, and
each may flip handedness:

    lab (right-handed)  ->  camera (rotation: parity preserved)  ->  SVG (y grows DOWNWARD: reflection)

A camera built purely from rotations preserves parity, so the chain's net effect is one flip. The
picture then carries two depth cues that contradict each other: the winding of the drawn triad says
one face of the slab is nearer, the occlusion says the other. A reader resolves that by trusting the
occlusion and concluding the axis labels are wrong — which is what the sample looked like all along.
Nothing in the suite could see it: `M·Mᵀ = I` is parity-blind, and so is every assertion about axis
directions or their signs. Parity is a fourth, independent property.

`SCREEN_PARITY_FIX = diag(1, 1, −1)` is the compensation: one declared reflection cancelling the one
SVG applies. The composed camera is consequently improper, `det = −1`. A mirrored orthography is an
ordinary drawing convention — but it must be **declared**, not discovered, which is what that named
constant and the H pin do between them. The `det = +1` pin is gone: it was asking the wrong question,
since it inspects the camera rather than the page. `det = −1` is now asserted as a *declaration*.

**The H pin.** `H = sign(cross2(drawn X, drawn Y)) · sign(Z · line-of-sight)`, with `cross2` taken in
SVG coordinates — computing it in maths coordinates flips H for every camera, so the convention is
part of the definition. `H = +1` is right-handed on the page, asserted for the lab triad, with both
factors asserted separately so a regression says which half moved.

**The contact-sheet method — adopted as standing practice for view acceptances.** Six candidate
cameras were rendered by the real component against the real service (camera injected, nothing
committed), each tile labelled with its measured invariants: azimuth, elevation, det, H, the three
image lengths and depth(Z). The maintainer chose from the sheet. Two things it made visible that no
prose specification had:

- **H is a family property.** All four proper cameras measured −1; both carrying the parity fix
  measured +1. The defect was not in the angles at all.
- **The mirror changes only occlusion.** M2's axis images are identical to P2's to the last decimal;
  `diag(1,1,−1)` moves the line of sight and nothing else. The sheet therefore showed the depth cue
  isolated — the one comparison that settles the question.

The rule: **candidate matrix with measured invariants before constant decree.**

**Chosen: M2** = `Rx(+20°)·Ry(205°)·diag(1,1,−1)`. Seen from slightly above; the slab shows its large
`+Z` face and its top; the beam is the short arrow to the lower right. Line of sight
`(0.3971, 0.3420, 0.8517)` — into the `+X/+Y/+Z` octant, so the visible faces at zero rotation are
the positive ones, depths `0.3971 (+x)`, `0.3420 (+y)`, `0.8517 (+z)`.

**Mutation tableau, all five rejected candidates. Each breaks at least one rung of the ladder:**

| candidate | metric (det decl.) | orientation | semantic | H | visible-face set |
| --- | --- | --- | --- | --- | --- |
| P1 (115°, −20°) | **fails** | green | **fails** | **fails** | **fails** |
| P2 (155°, −20°) | **fails** | green | **fails** | **fails** | **fails** |
| P3 (115°, +20°) | **fails** | **fails** | **fails** | **fails** | **fails** |
| P4 (155°, +20°) | **fails** | **fails** | **fails** | **fails** | **fails** |
| M1 (205°, −20°) | green | **fails** | green | green | **fails** |

M1 is the instructive row: same parity, same metric, same depth axis as the chosen camera — it
differs only in elevation sign, and only the visible-face set and the orientation contract catch it.
Its line of sight points below the plate, so the top face is not in view.

**The revision balance, honestly.** Four rounds, and three of them corrected a specification the work
order author had written down as fact: the **shear** (Revision 2 — free axis images do not make an
orthographic projection), the **camera branch** (Revision 3 — sign structure admits two cameras), and
the **parity premise** (Revision 4 — a rotation-only camera was assumed to draw right-handed). The
executor's premise pass checked every one of those numerically before implementing and reproduced the
stated targets each time; what it did not do, until asked, was question whether the stated contract
was *complete*. That is the transferable lesson, and it is now `STATUS.md` § 5: the contract ladder
for drawing surfaces — metric, orientation, semantics, screen handedness — plus choose views by
contact sheet, not by decree.

Fixtures derived a final time (camera rows, lab tips unchanged at X (22.436, 171.758) / Y (46,
143.568) / Z (56.988, 176.059) since M2 and P2 share their axis images, visible-face set and depths,
handedness area 575.71594 now written against `row0 × row1` so the identity is parity-agnostic).
Envelope unchanged at ±71.3, canvas unchanged. Direction, anchor, parallelism, screen-identity and
neutrality tests untouched in substance. Suite 2477 → 2478.

### Open

*(none — the series is closed.)*

---

## Releases

*One line per release cut from 2026-07-31 on. The detail lives in `CHANGELOG.md` and in the series
entries above; this is the index that says which series a given tag carried.*

- **v0.24.0** (2026-08-01) — the Nye-view release. Carries **NYE** (the dot-diagram view, its Yariv
  Table 16.1 print gate and the four ITC-D erratum candidates), **NYE-F** (roving tabindex plus the
  4224-combination view-model sweep) and **B27-S** (property-flag badges in the group identity
  header), together with the T7-BC footnote-affordance straggler that had been sitting in
  `[Unreleased]` since before the NYE series. MINOR: two new capabilities, no corrected calculated
  output. Suite 2422.

  Standing pattern recorded at this cut: **"Recently closed" in `STATUS.md` holds the series closed
  since the last release, and each release cut absorbs them into its release block**, leaving the
  subsection empty. Together with the section-1 entry and exit rules from DOCS-TRUTH and B27-S,
  that closes the loop — an item enters section 1 when promoted, leaves it entirely when it ships,
  is summarised under "Recently closed" until the next cut, and ends in the release block.
