# docs/references/

> **Content:** What the references folder holds and which file outranks which.
> **Status:** living
> **Authority:** descriptive. The normative rules live in the documentation map in `AGENTS.md`.

Two kinds of file live here, and they are not equal.

**Convention contracts** — the app's own authoritative statements about how it maps onto the
literature. These are living documents and they win over source-side material when the two are
compared.

| file | role |
| --- | --- |
| [`BIRSS-APP-CONVENTIONS-REFERENCE.md`](BIRSS-APP-CONVENTIONS-REFERENCE.md) | The convention contract and verification ladder. The central document for anything touching group data or tensor logic. |
| [`BIRSS-ITC-CONVENTION-DIVERGENCES.md`](BIRSS-ITC-CONVENTION-DIVERGENCES.md) | Authoritative for every Birss↔ITC symbol, setting and orientation divergence. |
| [`DECISION-group-registry-policy.md`](DECISION-group-registry-policy.md) | An accepted decision record (E23 / audit M13). Superseded only by a later dated decision. |

**Transcribed ITC tables** — source-side material, vendored so the reference tests can re-parse
them at test time. Change these only to correct a transcription against print.

| file |
| --- |
| [`ITC-table-1.5.2.4-ferromagnetic.md`](ITC-table-1.5.2.4-ferromagnetic.md) |
| [`ITC-table-1.5.7.1-piezomagnetic.md`](ITC-table-1.5.7.1-piezomagnetic.md) |
| [`ITC-table-1.5.8.1-magnetoelectric-groups.md`](ITC-table-1.5.8.1-magnetoelectric-groups.md) |
| [`ITC-table-2.1.1.1-crystal-systems.md`](ITC-table-2.1.1.1-crystal-systems.md) |
| [`ITC-table-2.1.3.1-symmetry-directions.md`](ITC-table-2.1.3.1-symmetry-directions.md) |
| [`ITC-table-3.2.2.1-property-counts.md`](ITC-table-3.2.2.1-property-counts.md) |
| [`ITC-table-3.2.2.2-polar-axes.md`](ITC-table-3.2.2.2-polar-axes.md) |

The PDFs alongside them are the primary literature the app cites. The Birss tables themselves are
**not** here — they are vendored under `birss-tables/` at the repository root.
