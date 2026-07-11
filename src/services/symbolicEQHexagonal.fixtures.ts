import type { TensorTimeReversal } from './tensorCalculator';

/**
 * Golden fixtures for the symbolic SHG source term of EQ (rank-4) tensors on the
 * groups with a 3-/6-fold axis (3m, 6mm, -6m2, -3'm) at GENERIC azimuth -- the
 * cells that exposed backlog item E1 (symbolic path diverged from the numeric
 * engine off-normal). Each fixture pins the coefficient of `\chi_{xxxx} * E_X^2`
 * in the S_X lab-frame source term at a generic angle triple.
 *
 * PROVENANCE (anti-circular). These values are NOT captured from the symbolic
 * engine (which was wrong here). They are the app's trusted numeric engine's
 * output, INDEPENDENTLY confirmed from first principles: a standalone rank-4
 * rotation + contraction that imports neither pipeline reproduces them to ~1e-16.
 * For the representative cell 3m EQ i-type at (30,45,60):
 *
 *   R = Ry(45)·Rx(30)·Rz(60)   (standard right-handed active rotations)
 *   coeff = Σ_{ijkl} R[2][i] R[0][j] R[0][k] R[0][l] · χ_{ijkl}
 *   with the 3m EQ χ_xxxx-family tensor (crystal frame, transcribed from the
 *   app's displayed form): χ_xxxx=1, χ_xxyy=χ_yyxx=3, χ_yyyy=1,
 *   χ_xyxy=χ_xyyx=χ_yxxy=χ_yxyx=1
 *   → coeff = -0.8565704386826372  (numeric engine: -0.8565704386826373)
 *
 * The buggy symbolic engine returned -0.9034454386826374 (off by exactly 3/64).
 * All four 3-/6-fold groups share this in-plane χ_xxxx structure, so the value is
 * identical across them (verified against the numeric engine per cell).
 * Confirmed 2026-07-11.
 */
export interface SymbolicEQHexFixture {
  id: string;
  groupName: string;
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

const AT_30_45_60 = -0.8565704386826373;
const AT_15_m20_75 = 0.46858615787930735;

// The 14 cells that diverged: {3m, 6mm, -6m2} x {i, c} x {two triples} plus -3'm i x {two triples}.
// (-3'm c-type has no χ_xxxx S_X term, so it never diverged and is not pinned here.)
export const SYMBOLIC_EQ_HEX_FIXTURES: SymbolicEQHexFixture[] = [
  ['3m', 'i'],
  ['3m', 'c'],
  ['6mm', 'i'],
  ['6mm', 'c'],
  ['-6m2', 'i'],
  ['-6m2', 'c'],
  ["-3'm", 'i'],
].flatMap(([groupName, trType]) => [
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
