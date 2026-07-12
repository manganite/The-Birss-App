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
 * Full recompute (all 40 specs) is well under the 30 s budget with the optimized engine, so no
 * subset restriction is needed. An explicit per-file testTimeout is set below regardless.
 */
describe('sharingPartitions is in sync with the tensor-form engine', () => {
  // Explicit timeout: the full 40-spec recompute is ~3-4 s locally with the optimized engine; this
  // headroom covers slower CI without ever masking a real regression.
  it('generated partitions equal a live recompute for every UI-reachable spec', () => {
    const recomputed = buildAllPartitions();
    expect(recomputed).toEqual(SHARING_PARTITIONS);
  }, 30000);

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
