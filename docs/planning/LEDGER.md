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

### Completed

*(none yet in this file — see `TODO-next.md` for the closed T-series entries.)*
