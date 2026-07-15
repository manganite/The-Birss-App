import { describe, it, expect } from 'vitest';
import { SHARING_PARTITIONS } from './sharingPartitions';
import { buildAllPartitions } from '../../scripts/sharingPartitionLib';
import { enumerateUiSpecs, specKeyOf } from './uiTensorSpecs';
import { POINT_GROUPS } from './pointGroups';

/**
 * Drift guard for the generated sharing partitions. Recomputes the full partition for every
 * UI-reachable spec at test time (fast since the flat-array projector landed) and deep-compares
 * against the committed src/data/sharingPartitions.ts. If this fails, run `npm run sharingdata`.
 *
 * Full recompute (all 40 specs) takes roughly 20 s under full-suite contention (2026-07-15
 * measurement; heavier when the process is instrumented), so the explicit timeout below is
 * deliberately generous: this is a correctness drift guard, not a performance assertion --
 * performance regressions are the bench's job (tensorForms.bench.ts).
 */
describe('sharingPartitions is in sync with the tensor-form engine', () => {
  // Explicit timeout: generous by design (see the docblock) -- a drift guard must not flake on
  // slow or instrumented machines; it fails on DRIFT, not on duration.
  it('generated partitions equal a live recompute for every UI-reachable spec', () => {
    const recomputed = buildAllPartitions();
    expect(recomputed).toEqual(SHARING_PARTITIONS);
  }, 120000);

  it('every spec key is present and every point group appears exactly once per partition', () => {
    const allNames = POINT_GROUPS.map((g) => g.name).sort();
    for (const spec of enumerateUiSpecs()) {
      const key = specKeyOf(spec);
      const partition = SHARING_PARTITIONS[key];
      expect(partition, `missing partition for ${key}`).toBeDefined();
      const flat = partition.flat();
      expect(flat.length, `duplicate/missing members for ${key}`).toBe(POINT_GROUPS.length);
      expect([...flat].sort()).toEqual(allNames);
    }
  });
});
