import type { TensorTimeReversal } from './tensorCalculator';
import type { GroupKey } from '../data/pointGroups';

/**
 * Golden fixtures for the symbolic SHG source term of EQ (rank-4) tensors on the
 * groups with a 3-/6-fold axis (3m, 6mm, -6m2, -3'm) at GENERIC azimuth -- the
 * cells that exposed backlog item E1 (symbolic path diverged from the numeric
 * engine off-normal). Each fixture pins the coefficient of `\chi_{xxxx} * E_X^2`
 * in the S_X lab-frame source term at a generic angle triple.
 *
 * PROVENANCE (anti-circular). RE-ANCHORED 2026-07-30 (Q0). These values are NOT
 * captured from either app pipeline. They come from the maintainer's standalone
 * projector, and the corrected engine reproduces them independently (two-source
 * crosscheck, see below).
 *
 * Derivation method (maintainer, 2026-07-30; scripts in the Q0 session record):
 * generators taken from the app's own GENERATORS data, group closure, the twisted
 * (det/antiunitary) group average, intrinsic symmetrization, then RREF
 * canonicalization -- the same canonical basis the engine now uses -- followed by
 * the contraction formula below with the geometry from the 2026-07-11 header:
 *
 *   R = Ry(phiY)·Rx(phiX)·Rz(psi)   (standard right-handed active rotations)
 *   coeff = Σ_{ijkl} R[2][i] R[0][j] R[0][k] R[0][l] · χ_{ijkl}
 *
 * with the RREF χ_xxxx family for all four 3-/6-fold groups:
 *   χ_xxxx = χ_yyyy = 1, χ_xyxy = χ_xyyx = χ_yxxy = χ_yxyx = 1/2, χ_xxyy = 0.
 * -> coeff = -15/64 = -0.234375 exactly at (30,45,60).
 *
 * WHY THE OLD CONSTANTS WERE WRONG (2026-07-11 -- 2026-07-30). The old header
 * transcribed the χ_xxxx family from the app's *displayed* form:
 * χ_xxxx=1, χ_xxyy=χ_yyxx=3, χ_yyyy=1, four xy-quads=1. That family is NOT
 * invariant under Rz(120) -- it violates the in-plane isotropy condition
 * χ_xxxx = χ_xxyy + χ_xyxy + χ_xyyx (1 vs 3+1+1) forced by a 3-/6-fold axis -- so
 * the pinned coefficients described a tensor no trigonal crystal can have. Its
 * source was the pre-Q0 per-seed parameter attribution, which asserted a fixed
 * ratio T_ijkl/T_label across the whole invariant subspace; that holds only inside
 * a proportionality class and is false in these coupled blocks. The fixture
 * faithfully recorded the engine, and the engine was wrong. See
 * docs/findings/FINDING-2026-07-29-rank4-trigonal-hexagonal-overcount.md.
 *
 * TWO-SOURCE CROSSCHECK (Q0 red report): against the corrected engine the hand
 * values reproduce as -0.23437499999999994 and 0.2671367647553548 -- agreement to
 * ~1e-16 from two independent derivations (hand projector vs. app pipeline).
 *
 * (Historical, kept for the record: the E1 bug of 2026-07-11 was a symbolic-path
 * divergence, where the buggy symbolic engine returned a value off by exactly
 * 3/64 from the then-numeric one. That defect is separate from this re-anchoring
 * and remains fixed; these fixtures still guard the symbolic path against the
 * numeric one at generic angles.)
 */
export interface SymbolicEQHexFixture {
  id: string;
  groupName: GroupKey;
  trType: TensorTimeReversal;
  phiX: number;
  phiY: number;
  psi: number;
  /** Lab-frame source component whose coefficient is pinned. */
  sourceComponent: string;
  /** Crystal-tensor coefficient label (rawPoly / SymPoly outer key). */
  chi: string;
  /** Field-pair key (inner key); '00' == E_X^2. */
  pair: string;
  /** Correct coefficient (numeric engine, independently confirmed). */
  expected: number;
}

/** Exactly -15/64. See the PROVENANCE block above (independent derivation, Q0 2026-07-30). */
const AT_30_45_60 = -0.234375;
const AT_15_m20_75 = 0.267136764755355;

// The 14 cells that diverged: {3m, 6mm, -6m2} x {i, c} x {two triples} plus -3'm i x {two triples}.
// (-3'm c-type has no χ_xxxx S_X term, so it never diverged and is not pinned here.)
export const SYMBOLIC_EQ_HEX_FIXTURES: SymbolicEQHexFixture[] = (
  [
    ['3m', 'i'],
    ['3m', 'c'],
    ['6mm', 'i'],
    ['6mm', 'c'],
    ['-6m2', 'i'],
    ['-6m2', 'c'],
    ["-3'm", 'i'],
  ] as [GroupKey, TensorTimeReversal][]
).flatMap(([groupName, trType]) => [
  {
    id: `${groupName}-EQ-${trType}-30_45_60`,
    groupName,
    trType: trType as TensorTimeReversal,
    phiX: 30,
    phiY: 45,
    psi: 60,
    sourceComponent: 'S_X',
    chi: '\\chi_{xxxx}',
    pair: '00',
    expected: AT_30_45_60,
  },
  {
    id: `${groupName}-EQ-${trType}-15_-20_75`,
    groupName,
    trType: trType as TensorTimeReversal,
    phiX: 15,
    phiY: -20,
    psi: 75,
    sourceComponent: 'S_X',
    chi: '\\chi_{xxxx}',
    pair: '00',
    expected: AT_15_m20_75,
  },
]);
