import type { TensorIntrinsic } from '../services/tensorForms';

/**
 * Display labels and word tooltips for the intrinsic index symmetries. Shared between the Tables-page
 * selector and the help effect-catalogue so the two cannot diverge. The `ij` label depends on rank
 * (`ij` at rank 2 = the whole symmetric tensor; `(ij)k` at rank 3 = the first pair of three indices).
 * "Voigt" names a NOTATION that exists at several ranks, not a symmetry, so it lives only in the
 * `voigt` tooltip -- the button reads `(ij)(kl) sym`.
 */
export function intrinsicLabel(intrinsic: TensorIntrinsic, rank: number): string {
  switch (intrinsic) {
    case 'none': return 'none';
    case 'ij': return rank === 2 ? 'ij' : '(ij)k';
    case 'jk': return 'i(jk)';
    case 'ij_kl': return '(ij)(kl)';
    case 'voigt': return '(ij)(kl) sym';
  }
}

export const INTRINSIC_TOOLTIP: Record<TensorIntrinsic, string> = {
  none: 'No intrinsic index symmetry -- the general tensor.',
  ij: 'The first two indices may be swapped freely (a symmetric index pair).',
  jk: 'The last two indices may be swapped freely -- e.g. coupling to a symmetric stress tensor.',
  ij_kl: 'Each index pair is individually symmetric, with no exchange between the pairs (e.g. the photoelastic tensor).',
  voigt: 'Full elastic (Voigt) symmetry: ij, kl, and pair exchange.',
};
