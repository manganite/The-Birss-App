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
