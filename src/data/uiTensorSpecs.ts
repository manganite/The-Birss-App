import type { TensorRank, TensorParity, TensorTimeParity, TensorIntrinsic, TensorSpec } from '../services/tensorForms';

/** Which intrinsic index symmetries are offered (and meaningful) at each rank in the Tables UI. */
export const INTRINSIC_BY_RANK: Record<number, TensorIntrinsic[]> = {
  0: ['none'],
  1: ['none'],
  2: ['none', 'ij'],
  3: ['none', 'ij', 'jk'],
  4: ['none', 'ij_kl', 'voigt'],
};

const RANKS: TensorRank[] = [0, 1, 2, 3, 4];
const PARITIES: TensorParity[] = ['polar', 'axial'];
const TIME_PARITIES: TensorTimeParity[] = ['i', 'c'];

/** Stable string key for a spec (matches the engine's internal specKey and the generated
 * sharing-partition keys). */
export const specKeyOf = (s: TensorSpec): string => `${s.rank}:${s.parity}:${s.timeParity}:${s.intrinsic}`;

/**
 * Every UI-reachable tensor spec: rank (0-4) x parity (polar/axial) x time parity (i/c) x the valid
 * intrinsic symmetries for that rank. This is the canonical spec domain the sharing partitions are
 * generated over and the drift guard checks.
 */
export function enumerateUiSpecs(): TensorSpec[] {
  const specs: TensorSpec[] = [];
  for (const rank of RANKS) {
    for (const parity of PARITIES) {
      for (const timeParity of TIME_PARITIES) {
        for (const intrinsic of INTRINSIC_BY_RANK[rank]) {
          specs.push({ rank, parity, timeParity, intrinsic });
        }
      }
    }
  }
  return specs;
}
