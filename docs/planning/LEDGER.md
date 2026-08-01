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
