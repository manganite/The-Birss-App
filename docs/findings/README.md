# docs/findings/

> **Content:** What the findings folder holds and how to read it.
> **Status:** living
> **Authority:** descriptive. The normative rules live in the documentation map in `AGENTS.md`.

Dated investigation records: audits, verification passes, bug analyses, sign-offs.

**Everything here is frozen by default.** A finding records what was established on a particular
date; it is not updated as the code moves on. When a finding is overtaken, it gets a dated
supersession line in its banner pointing at the successor — it is not rewritten. Read the banner
at the top of each file before trusting its contents.

| file | subject |
| --- | --- |
| [`FINDING-2026-07-29-rank4-trigonal-hexagonal-overcount.md`](FINDING-2026-07-29-rank4-trigonal-hexagonal-overcount.md) | The rank-4 minimal-basis defect for 3-/6-fold groups (shipped as Q0 in v0.23.1). |
| [`SESSION-FINDINGS-2026-07-04-6pmmpm-and-table7.md`](SESSION-FINDINGS-2026-07-04-6pmmpm-and-table7.md) | `6'/mm'm` frame error, Table-7 bracket semantics, the 58-row audit. |
| [`AUDIT-convention-references.md`](AUDIT-convention-references.md) | The five-phase audit of the app against its convention references. |
| [`ANALYSIS-table-4b-4d-semantics.md`](ANALYSIS-table-4b-4d-semantics.md) | Semantics of Birss Tables 4b/4c/4d and the lockstep pairing rule. |
| [`TECH-DEBT-AUDIT-2026-07-11.md`](TECH-DEBT-AUDIT-2026-07-11.md) | The technical-debt snapshot that seeded the E-series. |
| [`SIGNOFF-rank3-verify-2026-07-09.md`](SIGNOFF-rank3-verify-2026-07-09.md) | Human sign-off for the seven rank-3 VERIFY golden fixtures. |
| [`FINDING-trigonal-3m-prime-bug.md`](FINDING-trigonal-3m-prime-bug.md) | The `-3'm'` generator bug and the Cr₂O₃ fixture it invalidated. |
| [`verification-trigonal-magnetic-groups.md`](verification-trigonal-magnetic-groups.md) | Verification of the 11 trigonal rows of tables 6 and 7 (German). |
| [`DISCREPANCIES.md`](DISCREPANCIES.md) | App vs. vendored tables comparison passes. **Partially superseded.** |
| [`ED-tensor-components-per-group.md`](ED-tensor-components-per-group.md) | Allowed ED SHG components per magnetic point group. |
| [`CODE_REVIEW_REPORT.md`](CODE_REVIEW_REPORT.md) | Full-codebase review of v0.7.0 (German). Largely historical. |
