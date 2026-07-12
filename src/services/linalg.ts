/**
 * linalg.ts -- shared 3x3 rotation / matmul primitives and the field-pair "outer-product" builders
 * used by BOTH the numeric (tensorProjection) and symbolic (symbolicProjection) SHG pipelines.
 *
 * Wave-2 E3 extraction (audit H3/M1-adjacent): the numeric number[][] rotations + `mat3mul` lived in
 * tensorProjection and were imported cross-module; the TrigPoly rotations + `trigMat3Mul` were
 * duplicated in symbolicProjection; and the field-pair builder existed in two scalar variants
 * (`multiplyLinear` numeric, `multiplyLinearSym` TrigPoly). They are moved here verbatim -- behaviour
 * is unchanged. The two scalar variants deliberately stay as TWO functions; the generic-scalar
 * unification is Wave 3 (E8). The Float64Array flat-op hot path in tensorForms.ts (PR #91) is
 * intentionally NOT routed through this module.
 */
import { EPSILON } from './symmetryGroups';
import {
  type TrigPoly,
  trigConst,
  trigCos,
  trigSin,
  trigScale,
  trigAdd,
  trigMul,
  trigIsZero,
  TRIG_ZERO,
} from './trigPoly';

const DEG = Math.PI / 180;

// ---- numeric (number[][]) rotations + 3x3 multiply ----

export function rotX(deg: number): number[][] {
  const c = Math.cos(deg * DEG),
    s = Math.sin(deg * DEG);
  return [
    [1, 0, 0],
    [0, c, -s],
    [0, s, c],
  ];
}

export function rotY(deg: number): number[][] {
  const c = Math.cos(deg * DEG),
    s = Math.sin(deg * DEG);
  return [
    [c, 0, s],
    [0, 1, 0],
    [-s, 0, c],
  ];
}

export function rotZ(deg: number): number[][] {
  const c = Math.cos(deg * DEG),
    s = Math.sin(deg * DEG);
  return [
    [c, -s, 0],
    [s, c, 0],
    [0, 0, 1],
  ];
}

export function mat3mul(A: number[][], B: number[][]): number[][] {
  const R: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) R[i][j] += A[i][k] * B[k][j];
  return R;
}

// ---- symbolic (TrigPoly[][]) rotations + 3x3 multiply ----

export type TrigMat3 = TrigPoly[][];

export function trigMat3Mul(A: TrigMat3, B: TrigMat3): TrigMat3 {
  const R: TrigMat3 = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => TRIG_ZERO));
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) {
      let sum = TRIG_ZERO;
      for (let k = 0; k < 3; k++) sum = trigAdd(sum, trigMul(A[i][k], B[k][j]));
      R[i][j] = sum;
    }
  return R;
}

export function numToTrigMat3(m: number[][]): TrigMat3 {
  return m.map((row) => row.map((v) => trigConst(v)));
}

export function symRotX(): TrigMat3 {
  const c = trigCos('phiX'),
    s = trigSin('phiX');
  const one = trigConst(1),
    zero = TRIG_ZERO,
    ns = trigScale(s, -1);
  return [
    [one, zero, zero],
    [zero, c, ns],
    [zero, s, c],
  ];
}

export function symRotY(): TrigMat3 {
  const c = trigCos('phiY'),
    s = trigSin('phiY');
  const one = trigConst(1),
    zero = TRIG_ZERO,
    ns = trigScale(s, -1);
  return [
    [c, zero, s],
    [zero, one, zero],
    [ns, zero, c],
  ];
}

export function symRotZ(): TrigMat3 {
  const c = trigCos('psi'),
    s = trigSin('psi');
  const one = trigConst(1),
    zero = TRIG_ZERO,
    ns = trigScale(s, -1);
  return [
    [c, ns, zero],
    [s, c, zero],
    [zero, zero, one],
  ];
}

// ---- field-pair outer product: E_i E_m -> symmetric field-pair coefficients (keys '00'..'12') ----

export function multiplyLinear(A: number[], B: number[]): Record<string, number> {
  const res: Record<string, number> = { '00': 0, '11': 0, '22': 0, '01': 0, '02': 0, '12': 0 };
  for (let i = 0; i < 3; i++) {
    for (let m = 0; m < 3; m++) {
      const coeff = A[i] * B[m];
      if (Math.abs(coeff) > EPSILON) {
        const key = i <= m ? `${i}${m}` : `${m}${i}`;
        res[key] += coeff;
      }
    }
  }
  return res;
}

/**
 * Independent-basis test for the symmetry-averaged projectors: `true` iff `candidate` is NOT a
 * scalar multiple of any vector already in `basis` (i.e. it spans a new direction). Two vectors are
 * parallel when their nonzero-support ratios all agree within `eps` and neither has support where
 * the other is zero. Callers pre-screen the all-zero candidate separately. No per-candidate
 * allocation. Shared verbatim by `calculateTensorBasisResults` (number[]) and `computeBasis`
 * (Float64Array) -- hence the `ArrayLike<number>` signature (Wave-2 E4).
 */
export function isIndependentOf(
  candidate: ArrayLike<number>,
  basis: ReadonlyArray<ArrayLike<number>>,
  dim: number,
  eps: number,
): boolean {
  for (const existing of basis) {
    let ratio = 0;
    let match = true;
    for (let k = 0; k < dim; k++) {
      if (Math.abs(existing[k]) > eps) {
        const r = candidate[k] / existing[k];
        if (ratio === 0) ratio = r;
        else if (Math.abs(r - ratio) > eps) {
          match = false;
          break;
        }
      } else if (Math.abs(candidate[k]) > eps) {
        match = false;
        break;
      }
    }
    if (match) return false; // candidate is parallel to `existing` -> not a new direction
  }
  return true;
}

export function multiplyLinearSym(A: TrigPoly[], B: TrigPoly[]): Record<string, TrigPoly> {
  const res: Record<string, TrigPoly> = {
    '00': TRIG_ZERO,
    '11': TRIG_ZERO,
    '22': TRIG_ZERO,
    '01': TRIG_ZERO,
    '02': TRIG_ZERO,
    '12': TRIG_ZERO,
  };
  for (let i = 0; i < 3; i++) {
    for (let m = 0; m < 3; m++) {
      const coeff = trigMul(A[i], B[m]);
      if (!trigIsZero(coeff)) {
        const key = i <= m ? `${i}${m}` : `${m}${i}`;
        res[key] = trigAdd(res[key], coeff);
      }
    }
  }
  return res;
}
