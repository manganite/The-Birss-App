# Decision: group-registry policy (E23 / audit M13)

> **Content:** The accepted decision on group-registry policy (E23 / audit M13).
> **Status:** living (accepted decision)
> **Authority:** authoritative for the decision it records. Decisions are superseded by a later dated decision, never edited in place.

Status: accepted, 2026-07-12. Supersedes the M13 recommendation to generate
the hand-transcribed notation maps.

## Context

Audit M13 flagged that ~8 data files key per-group data off the 32/122 group
registry "with no single source-of-truth object; consistency enforced only
post-hoc by tests", and noted an asymmetry: `table7Data.ts` is generated
(`DO NOT EDIT`) while `groupNotation.ts` (the `SHUBNIKOV` / `FULL_HM` /
`REFERENCE_AXES` maps) is hand-transcribed from the same vendored markdown.

## Why the registry is already sound

1. Single source for the key enumeration. `GROUP_KEYS` (`src/data/
   pointGroups.ts`, added in E30) is the one canonical group-key list, and
   `GroupKey` is derived from it. A drift-guard test
   (`pointGroups.test.ts`) locks `GROUP_KEYS` to `POINT_GROUPS.map(g =>
   g.name)`. Group-key literals are typechecked against `GroupKey` at the
   authoring layer, so a mistyped key is a compile error.

2. The per-facet data files are legitimate separation, not redundant
   re-enumeration. `groupNotation.ts` (notation), `polarDirections.ts`
   (directions), `table7Data.ts` (Table-7 rows), `crystalSystems.ts` /
   `crystalSystemInfo.ts`, `sharingPartitions.ts`, `tensorEffects.ts` each
   hold a distinct facet keyed by the same registry. A single mega-object
   holding all facets would be a monolith and would lose the per-facet
   drift guards below.

3. The hand-transcribed maps cannot silently drift. `groupNotation.test.ts`
   re-parses the vendored source tables at test time --
   `birss-tables/table-nomenclature.md` (Table A + Table C) for `SHUBNIKOV`
   and `FULL_HM`, `birss-tables/table-4a.md` for `REFERENCE_AXES` -- and
   asserts each map equals the parsed table entry-for-entry (all 122 groups
   / 32 classes; "no missing, no extra, no differing"; in CI, none skipped).
   This is the same re-parse-at-test-time anti-drift pattern the whole
   codebase uses for correctness; "consistency post-hoc by tests" is the
   intended design, not a gap.

## Decision

Keep `groupNotation.ts` hand-transcribed under its existing drift guards. Do
NOT build a generator for it.

Rationale: a generator would add parsing/emit tooling plus a CI regen check
to reproduce 545 lines exactly, for zero correctness gain -- the drift guards
already guarantee equivalence with the vendored source -- and near-zero
maintenance gain, since the source tables are frozen literature (Birss 1966).
The `table7Data.ts`-vs-`groupNotation.ts` generation asymmetry is an accepted
tradeoff: `table7Data.ts` is generated because Table 7 is large and
mechanical; the notation maps are small, stable, and fully guarded.

## Revisit if

- the notation maps grow substantially, or a third+ consumer needs the same
  transcription, or
- the source tables begin changing often, or hand-transcription errors recur
  despite the guards.

In any of those cases, generating `groupNotation.ts` from the vendored
markdown (mirroring `table7Data.ts` via a `tools/` script, informed by
`GROUP_KEYS`) becomes worth the tooling cost.
