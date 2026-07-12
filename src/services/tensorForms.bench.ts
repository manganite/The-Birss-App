import { bench, describe } from 'vitest';
import { computeTensorForm, getCanonicalFormSignature, _clearTensorFormCaches, type TensorSpec } from './tensorForms';
import { _clearGroupCache } from './symmetryGroups';
import { POINT_GROUPS } from '../data/pointGroups';

/**
 * Benchmarks for the rank-4 engine hot paths (perf/rank4-engine-and-sharing). Each bench clears the
 * memoization caches inside the measured function so every iteration is COLD -- these numbers track
 * the real first-paint cost on the Tables page, not warm cache hits (which are ~0 ms).
 */
const clearAll = () => {
  _clearTensorFormCaches();
  _clearGroupCache();
};

// Heaviest single Type-III group (cubic Oh, 48 operations).
const HEAVY_TYPE3 = "m'-3'm'";
const RANK4_C: TensorSpec = { rank: 4, parity: 'polar', timeParity: 'c', intrinsic: 'none' };
const RANK3_C: TensorSpec = { rank: 3, parity: 'polar', timeParity: 'c', intrinsic: 'none' };

describe('tensorForm rank-4 hot paths (cold)', () => {
  bench('(a) computeTensorForm — one Type-III group, rank-4 c', () => {
    clearAll();
    computeTensorForm(HEAVY_TYPE3, 1, RANK4_C);
  });

  bench('(b) canonical-signature sweep — 122 groups, rank-4 c', () => {
    clearAll();
    for (const g of POINT_GROUPS) getCanonicalFormSignature(g.name, RANK4_C);
  });

  bench('(c) canonical-signature sweep — 122 groups, rank-3 c', () => {
    clearAll();
    for (const g of POINT_GROUPS) getCanonicalFormSignature(g.name, RANK3_C);
  });
});
