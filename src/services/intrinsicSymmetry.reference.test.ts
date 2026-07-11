import { describe, it, expect } from 'vitest';
import { computeTensorForm, type TensorIntrinsic, type TensorRank } from './tensorForms';
import { matrixRank } from './testUtils/birssTableParsers';
import { POINT_GROUPS } from '../data/pointGroups';

/**
 * Guards for the intrinsic index symmetries `ij` (rank 3), `ij_kl` and `voigt` (rank 4), added
 * alongside the existing `jk`. Counts are span rank of the basis (never basisResults.length).
 */

const CLASSICAL = POINT_GROUPS.filter((g) => g.type === 'I').map((g) => g.name);

const count = (group: string, rank: TensorRank, intrinsic: TensorIntrinsic): number => {
  const form = computeTensorForm(group, 1, { rank, parity: 'polar', timeParity: 'i', intrinsic })!;
  return form.isZero ? 0 : matrixRank(form.basisResults, 3 ** rank);
};

describe('Intrinsic index symmetries -- ij / ij_kl / voigt', () => {
  it('there are 32 classical point groups', () => {
    expect(CLASSICAL).toHaveLength(32);
  });

  // Class 1 (triclinic) imposes no crystal constraint, so the count is the intrinsic's own dimension:
  //   rank-3 ij   : the first index pair is symmetric -> 6 pair values x 3 (k) = 18
  //   rank-4 ij_kl: each pair symmetric, no pair exchange -> 6 x 6 = 36
  //   rank-4 voigt: + pair exchange -> a symmetric 6x6 matrix -> 6*7/2 = 21
  it('class 1 anchors: rank-3 ij = 18, rank-4 ij_kl = 36, rank-4 voigt = 21', () => {
    expect(count('1', 3, 'ij')).toBe(18);
    expect(count('1', 4, 'ij_kl')).toBe(36);
    expect(count('1', 4, 'voigt')).toBe(21);
  });

  // Index reversal (i,j,k) -> (k,j,i) carries the ij-symmetric class onto the jk-symmetric class and
  // commutes with the (index-uniform) group action, so the independent-component counts are equal for
  // every group. The jk side is print-anchored via ITC Table 3.2.2.1. A failure here would mean the
  // engine's index-symmetrisation is asymmetric between the two ends -- a real bug (do not weaken).
  it('rank-3 ij count == rank-3 jk count for every classical group', () => {
    for (const g of CLASSICAL) {
      expect(count(g, 3, 'ij'), `${g}: ij vs jk`).toBe(count(g, 3, 'jk'));
    }
  }, 30000);

  // Adding a symmetry can only remove independent components: voigt (pairs + exchange) is a
  // restriction of ij_kl (pairs only), which is a restriction of the general rank-4 tensor.
  it('rank-4 monotonicity per group: voigt <= ij_kl <= none', () => {
    for (const g of CLASSICAL) {
      const v = count(g, 4, 'voigt');
      const p = count(g, 4, 'ij_kl');
      const n = count(g, 4, 'none');
      expect(v <= p, `${g}: voigt(${v}) <= ij_kl(${p})`).toBe(true);
      expect(p <= n, `${g}: ij_kl(${p}) <= none(${n})`).toBe(true);
    }
  }, 60000); // 96 rank-4 projections -- generous headroom under parallel CPU load
});
