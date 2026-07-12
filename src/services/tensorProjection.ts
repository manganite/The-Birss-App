/**
 * tensorProjection.ts
 *
 * Numeric core: projects ED/MD/EQ tensors onto a magnetic point group's symmetry
 * operations (transform + average + basis reduction), and computes SHG source-term
 * polynomials and lab-frame basis vectors. Also hosts a handful of small,
 * dependency-free label/formatting helpers (getIndices, getLabel, formatCoeff,
 * cleanupExpressionSigns) shared by both this module and latexFormatting.ts.
 *
 * @see docs/references/BIRSS-APP-CONVENTIONS-REFERENCE.md, Step 5 (tensor forms &
 *      particularization: intrinsic symmetry = last two indices only).
 */

import {
  type Matrix3x3,
  EPSILON,
  AXIS_EPSILON,
  GENERATORS,
  getCachedFullGroup,
  det,
  getTransformedGenerators,
} from './symmetryGroups';
// Shared linear-algebra primitives (Wave-2 E3). rotX/rotY/rotZ/mat3mul are re-exported below so
// existing importers (orientation.ts, the projection/azimuth tests, symbolicProjection) keep their
// `from './tensorProjection'` import site unchanged.
import { rotX, rotY, rotZ, mat3mul, isIndependentOf } from './linalg';
import { COEFF_EPSILON, ROOT_MATCH_EPSILON } from './tolerances';

export { rotX, rotY, rotZ, mat3mul };

export type TensorType = 'ED' | 'MD' | 'EQ';
export type TensorTimeReversal = 'i' | 'c'; // i = time-even, c = time-odd

/** Collapses "+ -X" into "- X" after joining signed terms into a display string. */
export const cleanupExpressionSigns = (s: string): string => s.replace(/\+ -/g, '- ');

export function getIndices(idx: number, rank: number): number[] {
  const indices = [];
  let temp = idx;
  for (let i = 0; i < rank; i++) {
    indices.unshift(temp % 3);
    temp = Math.floor(temp / 3);
  }
  return indices;
}

/** Inverse of getIndices: the flat index for a base-3 multi-index (most-significant digit first).
 * Satisfies toFlatIndex(getIndices(i, rank), rank) === i. */
export function toFlatIndex(indices: number[], rank: number): number {
  let flat = 0;
  for (let r = 0; r < rank; r++) flat += indices[r] * Math.pow(3, rank - 1 - r);
  return flat;
}

export function getLabel(indices: number[]): string {
  const chars = ['x', 'y', 'z'];
  return '\\chi_{' + indices.map((i) => chars[i]).join('') + '}';
}

/** Field-pair keys ('00'..'12', i<=j) -> LaTeX quadratic field label. Crystal frame uses lowercase
 * axes (x,y,z); the lab frame uses uppercase (X,Y,Z). Shared by the numeric, symbolic, and
 * trig-polynomial formatters (Wave-2 E7). */
export const FIELD_LABELS_CRYSTAL: Record<string, string> = {
  '00': 'E_x^2',
  '11': 'E_y^2',
  '22': 'E_z^2',
  '01': 'E_x E_y',
  '02': 'E_x E_z',
  '12': 'E_y E_z',
};
export const FIELD_LABELS_LAB: Record<string, string> = {
  '00': 'E_X^2',
  '11': 'E_Y^2',
  '22': 'E_Z^2',
  '01': 'E_X E_Y',
  '02': 'E_X E_Z',
  '12': 'E_Y E_Z',
};

export function formatCoeff(c: number): string {
  const absC = Math.abs(c);
  if (absC < COEFF_EPSILON) return '0';

  const rounded = Math.round(absC);
  if (Math.abs(absC - rounded) < COEFF_EPSILON) {
    if (rounded === 1) return '';
    return rounded.toString();
  }

  for (let d = 2; d <= 8; d++) {
    const num = Math.round(absC * d);
    if (Math.abs(absC - num / d) < COEFF_EPSILON) {
      return `\\frac{${num}}{${d}}`;
    }
  }

  // Common fractions
  const fractions = [
    { val: 0.5, str: '\\frac{1}{2}' },
    { val: 0.25, str: '\\frac{1}{4}' },
    { val: 0.75, str: '\\frac{3}{4}' },
    { val: 0.125, str: '\\frac{1}{8}' },
    { val: 0.375, str: '\\frac{3}{8}' },
    { val: 0.625, str: '\\frac{5}{8}' },
    { val: 0.875, str: '\\frac{7}{8}' },
    { val: 1.5, str: '\\frac{3}{2}' },
    { val: 2.5, str: '\\frac{5}{2}' },
    { val: 1 / 3, str: '\\frac{1}{3}' },
    { val: 2 / 3, str: '\\frac{2}{3}' },
    { val: 4 / 3, str: '\\frac{4}{3}' },
  ];

  for (const frac of fractions) {
    if (Math.abs(absC - frac.val) < COEFF_EPSILON) return frac.str;
  }

  // Square roots and their combinations
  const roots = [
    { val: Math.SQRT2, str: '\\sqrt{2}' },
    { val: Math.sqrt(3), str: '\\sqrt{3}' },
    { val: 1 / Math.SQRT2, str: '\\frac{1}{\\sqrt{2}}' },
    { val: Math.sqrt(3) / 2, str: '\\frac{\\sqrt{3}}{2}' },
    { val: 1 / Math.sqrt(3), str: '\\frac{1}{\\sqrt{3}}' },
    { val: 1 / (2 * Math.SQRT2), str: '\\frac{1}{2\\sqrt{2}}' },
    { val: 1 / (4 * Math.SQRT2), str: '\\frac{1}{4\\sqrt{2}}' },
    { val: Math.sqrt(3) / 4, str: '\\frac{\\sqrt{3}}{4}' },
    { val: 1 / (2 * Math.sqrt(3)), str: '\\frac{1}{2\\sqrt{3}}' },
    { val: Math.sqrt(3) / 8, str: '\\frac{\\sqrt{3}}{8}' },
    { val: (3 * Math.sqrt(3)) / 8, str: '\\frac{3\\sqrt{3}}{8}' },
    { val: 2 * Math.SQRT2, str: '2\\sqrt{2}' },
    { val: 2 * Math.sqrt(3), str: '2\\sqrt{3}' },
    { val: Math.sqrt(2) / 3, str: '\\frac{\\sqrt{2}}{3}' },
    { val: (2 * Math.sqrt(2)) / 3, str: '\\frac{2\\sqrt{2}}{3}' },
    { val: Math.sqrt(6), str: '\\sqrt{6}' },
    { val: 1 / Math.sqrt(6), str: '\\frac{1}{\\sqrt{6}}' },
    { val: Math.sqrt(6) / 2, str: '\\frac{\\sqrt{6}}{2}' },
    { val: 2 / Math.sqrt(6), str: '\\frac{2}{\\sqrt{6}}' },
    { val: Math.sqrt(6) / 4, str: '\\frac{\\sqrt{6}}{4}' },
  ];

  for (const root of roots) {
    if (Math.abs(absC - root.val) < ROOT_MATCH_EPSILON) return root.str;
  }

  return Number(absC.toFixed(3)).toString();
}

/**
 * Equality/sign relation string for ONE symmetry-averaged basis vector, e.g.
 * `\chi_{xxx} = -\chi_{xyy}` -- each surviving component labelled and scaled relative to the lead
 * component. Returns `null` when no component survives. Shared by `latexFormatting.formatResults`
 * (ED/MD/EQ display) and `tensorForms.formatFormRelations` (the generalized Tables engine), which
 * were previously kept in lockstep by hand (Wave-2 E5). This builder does NOT special-case rank 0
 * (a bare scalar) -- at rank 0 it would emit `\chi_{}` -- so callers that allow a scalar (e.g.
 * formatFormRelations, which emits a bare `\chi`) must handle rank 0 before calling. The only other
 * caller, formatResults, is never invoked at rank 0.
 */
export function formatBasisRelation(basis: ArrayLike<number>, rank: number): string | null {
  const dim = Math.pow(3, rank);
  const members: string[] = [];
  let leadIdx = -1;
  const addedLabels = new Set<string>();

  for (let i = 0; i < dim; i++) {
    if (Math.abs(basis[i]) > EPSILON) {
      const label = getLabel(getIndices(i, rank));
      if (addedLabels.has(label)) continue;
      addedLabels.add(label);

      if (leadIdx === -1) leadIdx = i;
      const scale = basis[i] / basis[leadIdx];
      const sign = scale > 0 ? (members.length === 0 ? '' : ' = ') : ' = -';
      const scaleStr = formatCoeff(scale);
      members.push(`${sign}${scaleStr}${label}`);
    }
  }

  return members.length > 0 ? members.join('') : null;
}

export function transformTensor(
  tensor: number[],
  g: Matrix3x3,
  rank: number,
  isAxial: boolean,
  isTimeOdd: boolean,
): number[] {
  const dim = tensor.length;
  const result = new Array(dim).fill(0);
  const detG = det(g);

  let trFactor = 1;
  if (isTimeOdd && g.isAntiUnitary) {
    trFactor = -1;
  }

  const factor = (isAxial ? detG : 1) * trFactor;

  for (let idx = 0; idx < dim; idx++) {
    const indices = getIndices(idx, rank);
    for (let jdx = 0; jdx < dim; jdx++) {
      if (Math.abs(tensor[jdx]) < EPSILON) continue;
      const jIndices = getIndices(jdx, rank);
      let rProd = factor;
      for (let r = 0; r < rank; r++) {
        rProd *= g.m[indices[r]][jIndices[r]];
      }
      result[idx] += rProd * tensor[jdx];
    }
  }
  return result;
}

export function averageTensor(
  tensor: number[],
  group: Matrix3x3[],
  rank: number,
  isAxial: boolean,
  isTimeOdd: boolean,
): number[] {
  const dim = tensor.length;
  const sum = new Array(dim).fill(0);

  for (const g of group) {
    const transformed = transformTensor(tensor, g, rank, isAxial, isTimeOdd);
    for (let i = 0; i < dim; i++) {
      sum[i] += transformed[i];
    }
  }

  return sum.map((v) => v / group.length);
}

/**
 * Computes the independent, symmetrized tensor-component basis vectors for a group.
 * Returns null if the group is not in GENERATORS (caller decides how to report that).
 */
export function calculateTensorBasisResults(
  groupName: string,
  tensorType: TensorType,
  trType: TensorTimeReversal,
  setting: number = 1,
): { basisResults: number[][]; rank: number } | null {
  const generators = setting > 1 ? getTransformedGenerators(groupName, setting) : GENERATORS[groupName];
  if (!generators || generators.length === 0) return null;

  const cacheKey = setting > 1 ? `${groupName}::setting${setting}` : groupName;
  const group = getCachedFullGroup(cacheKey, generators);
  const rank = tensorType === 'EQ' ? 4 : 3;
  const isAxial = tensorType === 'MD';
  const isTimeOdd = trType === 'c';
  const dim = Math.pow(3, rank);

  const basisResults: number[][] = [];
  for (let i = 0; i < dim; i++) {
    const indices = getIndices(i, rank);
    const swappedIndices = [...indices];
    const temp = swappedIndices[rank - 1];
    swappedIndices[rank - 1] = swappedIndices[rank - 2];
    swappedIndices[rank - 2] = temp;

    let swappedIdx = 0;
    for (let r = 0; r < rank; r++) {
      swappedIdx += swappedIndices[r] * Math.pow(3, rank - 1 - r);
    }

    if (i > swappedIdx) continue; // Only process unique pairs

    const basisVector = new Array(dim).fill(0);
    basisVector[i] = 1;
    if (i !== swappedIdx) {
      basisVector[swappedIdx] = 1; // Symmetrize
    }
    const averaged = averageTensor(basisVector, group, rank, isAxial, isTimeOdd);

    const nonZero = averaged.some((v) => Math.abs(v) >= EPSILON);
    if (nonZero && isIndependentOf(averaged, basisResults, dim, EPSILON)) {
      basisResults.push(averaged);
    }
  }

  return { basisResults, rank };
}

export interface SHGExpression {
  component: string;
  expression: string;
  relation?: string;
  rawPoly?: Map<string, Map<string, number>>;
}

export interface SHGResult {
  induced: SHGExpression[];
  source: SHGExpression[];
}

export interface SHGOptions {
  groupName: string;
  tensorType: TensorType;
  trType: TensorTimeReversal;
  thetaX?: number;
  thetaY?: number;
  psi0?: number;
  phiX?: number;
  phiY?: number;
  psi?: number;
  setting?: number;
  labFrameDisplayMode?: 'EX_EY' | 'E0_THETA';
}

// ===========================================================================================
// Generic SHG contraction core (Wave-3 E8, audit H2). ONE contraction pipeline, generic over a
// scalar S with { number, TrigPoly } as its two instances, replacing the two hand-duplicated
// pipelines. calculateSHGExpressions (below, numeric) and calculateSymbolicSHGExpressions
// (symbolicProjection.ts) are now thin wrappers around computeShg.
//
// Homed in tensorProjection rather than a separate shgCore.ts (the WO's suggestion): the core needs
// this module's numeric primitives (averageTensor, getIndices/getLabel/toFlatIndex, formatCoeff,
// FIELD_LABELS_CRYSTAL), so a separate file would force an shgCore<->tensorProjection import cycle.
// See the E8 divergence report in the PR.
// ===========================================================================================

/** Minimal scalar algebra the SHG contraction needs. `isZero` is per-instance ON PURPOSE (rider R2):
 * the numeric instance uses EPSILON=1e-6, the TrigPoly instance uses trigIsZero (TRIG_EPSILON=1e-12);
 * the generic multiplyLinear/addPoly below must never substitute a shared threshold. */
export interface Scalar<S> {
  zero: S;
  one: S;
  add(a: S, b: S): S;
  mul(a: S, b: S): S;
  scaleByNumber(a: S, n: number): S;
  isZero(a: S): boolean;
}

/** The `number` instance. mul/scaleByNumber are plain arithmetic (no thresholding, R2); isZero
 * mirrors the original `Math.abs(x) > EPSILON` include-checks (a term is included iff !isZero). */
export const numberScalar: Scalar<number> = {
  zero: 0,
  one: 1,
  add: (a, b) => a + b,
  mul: (a, b) => a * b,
  scaleByNumber: (a, n) => a * n,
  isZero: (a) => Math.abs(a) <= EPSILON,
};

/** chi -> field-pair -> scalar coefficient (numeric Poly or symbolic SymPoly). */
export type SPoly<S> = Map<string, Map<string, S>>;

/** Field-pair outer product E_i E_m -> symmetric field-pair coefficients (keys '00'..'12'). Generic
 * replacement for linalg's multiplyLinear / multiplyLinearSym (E8: collapse the E3 pair). */
function multiplyLinearGeneric<S>(scalar: Scalar<S>, A: S[], B: S[]): Record<string, S> {
  const res: Record<string, S> = {
    '00': scalar.zero,
    '11': scalar.zero,
    '22': scalar.zero,
    '01': scalar.zero,
    '02': scalar.zero,
    '12': scalar.zero,
  };
  for (let i = 0; i < 3; i++) {
    for (let m = 0; m < 3; m++) {
      const coeff = scalar.mul(A[i], B[m]);
      if (!scalar.isZero(coeff)) {
        const key = i <= m ? `${i}${m}` : `${m}${i}`;
        res[key] = scalar.add(res[key], coeff);
      }
    }
  }
  return res;
}

/** res = a + scaleB * b, term-by-term over an SPoly. Mirrors the numeric addPoly / symbolic
 * addPolySym exactly (a added with the multiplicative identity, b scaled by scaleB) so accumulation
 * order and term order are preserved. */
function addPolyGeneric<S>(scalar: Scalar<S>, a: SPoly<S>, b: SPoly<S>, scaleB: S): SPoly<S> {
  const res: SPoly<S> = new Map();
  const add = (p: SPoly<S>, scale: S) => {
    for (const [chi, pairMap] of p.entries()) {
      if (!res.has(chi)) res.set(chi, new Map());
      const resPairMap = res.get(chi)!;
      for (const [pair, coeff] of pairMap.entries()) {
        const existing = resPairMap.get(pair) ?? scalar.zero;
        resPairMap.set(pair, scalar.add(existing, scalar.mul(coeff, scale)));
      }
    }
  };
  add(a, scalar.one);
  add(b, scaleB);
  return res;
}

/** Format a numeric SPoly<number> to a display string using the given field-pair labels. Extracted
 * from the former formatPoly closure; the field-frame choice (crystal / lab / E0_theta) is the
 * caller's, passed as `fieldLabels`. */
export function formatPolyWith(poly: SPoly<number>, fieldLabels: Record<string, string>): string {
  const finalParts: string[] = [];
  const sortedChis = Array.from(poly.keys()).sort();
  for (const chi of sortedChis) {
    const pairMap = poly.get(chi)!;
    const fieldParts: { pair: string; coeff: number }[] = [];
    const sortedPairs = Array.from(pairMap.keys()).sort();
    for (const pair of sortedPairs) {
      const coeff = pairMap.get(pair)!;
      if (Math.abs(coeff) > EPSILON) fieldParts.push({ pair, coeff });
    }
    if (fieldParts.length === 0) continue;
    if (fieldParts.length === 1) {
      const { pair, coeff } = fieldParts[0];
      const fieldStr = fieldLabels[pair];
      const sign = coeff < 0 ? '-' : '';
      finalParts.push(`${sign}${formatCoeff(coeff)}${chi}${fieldStr}`);
    } else {
      const innerExpr = fieldParts
        .map((fp, idx) => {
          const fieldStr = fieldLabels[fp.pair];
          const c = fp.coeff;
          const coeffStr = formatCoeff(c);
          if (idx === 0) {
            return `${c < 0 ? '-' : ''}${coeffStr}${fieldStr}`;
          } else {
            return `${c < 0 ? '-' : '+'} ${coeffStr}${fieldStr}`;
          }
        })
        .join(' ');
      finalParts.push(`${chi}(${innerExpr})`);
    }
  }
  return finalParts.length > 0 ? cleanupExpressionSigns(finalParts.join(' + ')) : '0';
}

/** The source-term "relation" string (numeric-only output), e.g. `R P_x + ...`. */
export function formatRelation(coeffs: number[], labels: string[]): string {
  const parts: string[] = [];
  for (let i = 0; i < coeffs.length; i++) {
    const c = coeffs[i];
    if (Math.abs(c) > EPSILON) {
      const cStr = formatCoeff(c);
      const sign = c > 0 ? (parts.length === 0 ? '' : '+ ') : parts.length === 0 ? '-' : '- ';
      parts.push(`${sign}${cStr}${labels[i]}`);
    }
  }
  return parts.length > 0 ? cleanupExpressionSigns(parts.join(' ')) : '0';
}

/** Result of the generic contraction core. */
export interface ShgCoreResult<S> {
  /** Numeric crystal-frame induced expressions. SHARED-NUMERIC BY DISCOVERED DESIGN (rider R3): the
   * crystal induced is computed numerically in BOTH pipelines (identity fields), so it is not
   * S-generic; it is produced once here. See the E8 divergence report. */
  inducedCrystal: SHGExpression[];
  /** Per lab component I=0..2: the S-typed source polynomial and the R-derived coefficients used.
   * `coeffs` is consumed only by the numeric wrapper's formatRelation; the symbolic wrapper ignores
   * it (shared-numeric-by-discovered-design note above applies to its number instance). */
  source: { poly: SPoly<S>; coeffs: S[] }[];
}

const E_VEC_FULL = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

/**
 * The one SHG contraction, generic over the scalar S. Computes the numeric independent-component
 * relation (`averageTensor` + foundRelation, numeric in both instances), the crystal-frame induced
 * expressions (numeric, shared), the S-typed lab-frame induced polynomials, and the ED/MD/EQ source
 * contraction. `R` is the (already built) rotation matrix in the scalar's type: numeric with the
 * angles substituted, or symbolic (TrigPoly, phi-dependent). Path-specific stages -- numeric source
 * formatting / rawPoly / relation strings, and the symbolic trigSimplify post-stage -- live in the
 * wrappers, NOT here.
 */
export function computeShg<S>(
  scalar: Scalar<S>,
  group: Matrix3x3[],
  rank: number,
  isAxial: boolean,
  isTimeOdd: boolean,
  tensorType: TensorType,
  R: S[][],
): ShgCoreResult<S> {
  const dim = Math.pow(3, rank);
  const tLabels = ['x', 'y', 'z'];

  // E_cryst_m = R[0][m] E_X + R[1][m] E_Y (E_Z lab = 0, transverse).
  const E_lab: S[][] = [
    [R[0][0], R[1][0], scalar.zero],
    [R[0][1], R[1][1], scalar.zero],
    [R[0][2], R[1][2], scalar.zero],
  ];

  const outputCount = tensorType === 'EQ' ? 9 : 3;
  const inducedLab: SPoly<S>[] = [];
  const inducedCrystal: SHGExpression[] = [];

  for (let outIdx = 0; outIdx < outputCount; outIdx++) {
    const outIndices = tensorType === 'EQ' ? [Math.floor(outIdx / 3), outIdx % 3] : [outIdx];
    const outLabel =
      tensorType === 'EQ'
        ? `Q_${tLabels[outIndices[0]]}${tLabels[outIndices[1]]}`
        : `${tensorType === 'ED' ? 'P' : 'M'}_${tLabels[outIndices[0]]}`;

    const crystalTerms: SPoly<number> = new Map();
    const labTerms: SPoly<S> = new Map();

    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        const fullIndices = [...outIndices, j, k];
        const flatIdx = toFlatIndex(fullIndices, rank);

        const swappedIndices = [...fullIndices];
        const temp = swappedIndices[rank - 1];
        swappedIndices[rank - 1] = swappedIndices[rank - 2];
        swappedIndices[rank - 2] = temp;
        const swappedIdx = toFlatIndex(swappedIndices, rank);

        const basisVector = new Array(dim).fill(0);
        basisVector[flatIdx] = 1;
        if (flatIdx !== swappedIdx) basisVector[swappedIdx] = 1;
        const averaged = averageTensor(basisVector, group, rank, isAxial, isTimeOdd);

        let foundRelation: { label: string; coeff: number } | null = null;
        for (let i = 0; i < dim; i++) {
          if (Math.abs(averaged[i]) > EPSILON) {
            foundRelation = { label: getLabel(getIndices(i, rank)), coeff: averaged[flatIdx] / averaged[i] };
            break;
          }
        }

        if (foundRelation) {
          // Crystal-frame induced (numeric, shared across both instances).
          const polyFull = multiplyLinearGeneric(numberScalar, E_VEC_FULL[j], E_VEC_FULL[k]);
          for (const [pair, pCoeff] of Object.entries(polyFull)) {
            if (Math.abs(pCoeff) > EPSILON) {
              if (!crystalTerms.has(foundRelation.label)) crystalTerms.set(foundRelation.label, new Map());
              const pm = crystalTerms.get(foundRelation.label)!;
              pm.set(pair, (pm.get(pair) || 0) + foundRelation.coeff * pCoeff);
            }
          }

          // Lab-frame induced (S-typed).
          const polyLab = multiplyLinearGeneric(scalar, E_lab[j], E_lab[k]);
          for (const [pair, pCoeffS] of Object.entries(polyLab)) {
            if (!scalar.isZero(pCoeffS)) {
              const totalS = scalar.scaleByNumber(pCoeffS, foundRelation.coeff);
              if (!labTerms.has(foundRelation.label)) labTerms.set(foundRelation.label, new Map());
              const pm = labTerms.get(foundRelation.label)!;
              pm.set(pair, scalar.add(pm.get(pair) ?? scalar.zero, totalS));
            }
          }
        }
      }
    }

    inducedLab.push(labTerms);
    inducedCrystal.push({ component: outLabel, expression: formatPolyWith(crystalTerms, FIELD_LABELS_CRYSTAL) });
  }

  const source: { poly: SPoly<S>; coeffs: S[] }[] = [];
  for (let I = 0; I < 3; I++) {
    let sPoly: SPoly<S> = new Map();
    let coeffs: S[];

    if (tensorType === 'ED') {
      coeffs = [scalar.zero, scalar.zero, scalar.zero];
      for (let i = 0; i < 3; i++) {
        const coeff = R[I][i];
        coeffs[i] = coeff;
        sPoly = addPolyGeneric(scalar, sPoly, inducedLab[i], coeff);
      }
    } else if (tensorType === 'MD') {
      coeffs = [scalar.zero, scalar.zero, scalar.zero];
      if (I === 0) {
        for (let i = 0; i < 3; i++) {
          const coeff = scalar.scaleByNumber(R[1][i], -1);
          coeffs[i] = coeff;
          sPoly = addPolyGeneric(scalar, sPoly, inducedLab[i], coeff);
        }
      } else if (I === 1) {
        for (let i = 0; i < 3; i++) {
          const coeff = R[0][i];
          coeffs[i] = coeff;
          sPoly = addPolyGeneric(scalar, sPoly, inducedLab[i], coeff);
        }
      }
    } else {
      coeffs = new Array<S>(9).fill(scalar.zero);
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const coeff = scalar.mul(R[2][i], R[I][j]);
          coeffs[i * 3 + j] = coeff;
          sPoly = addPolyGeneric(scalar, sPoly, inducedLab[i * 3 + j], coeff);
        }
      }
    }

    source.push({ poly: sPoly, coeffs });
  }

  return { inducedCrystal, source };
}

export function calculateSHGExpressions(options: SHGOptions): SHGResult {
  const {
    groupName,
    tensorType,
    trType,
    thetaX = 0,
    thetaY = 0,
    psi0 = 0,
    phiX = 0,
    phiY = 0,
    psi = 0,
    setting = 1,
    labFrameDisplayMode = 'EX_EY',
  } = options;
  const generators = setting > 1 ? getTransformedGenerators(groupName, setting) : GENERATORS[groupName];
  if (!generators || generators.length === 0) return { induced: [], source: [] };

  const cacheKey = setting > 1 ? `${groupName}::setting${setting}` : groupName;
  const group = getCachedFullGroup(cacheKey, generators);
  const rank = tensorType === 'EQ' ? 4 : 3;
  const isAxial = tensorType === 'MD';
  const isTimeOdd = trType === 'c';

  // R = Ry(φ_y) · Rx(φ_x) · Rz(ψ) · R_preset, where R_preset = Rz(psi0) · Ry(thetaY) · Rx(thetaX).
  // Tilts (φ_x, φ_y) are lab-fixed; azimuth (ψ) is crystal-tied. Numeric: angles substituted now, so
  // R is a plain number matrix (the symbolic path keeps them symbolic in TrigPoly instead).
  const R_preset = mat3mul(rotZ(psi0), mat3mul(rotY(thetaY), rotX(thetaX)));
  const R = mat3mul(rotY(phiY), mat3mul(rotX(phiX), mat3mul(rotZ(psi), R_preset)));

  const { inducedCrystal, source } = computeShg(numberScalar, group, rank, isAxial, isTimeOdd, tensorType, R);

  // Path-specific output shaping (numeric-only): lab-frame source strings, relation strings, rawPoly.
  const labFieldLabels: Record<string, string> =
    labFrameDisplayMode === 'E0_THETA'
      ? {
          '00': 'E_0^2 \\cos^2(\\theta_{pol})',
          '11': 'E_0^2 \\sin^2(\\theta_{pol})',
          '22': '0',
          '01': 'E_0^2 \\cos(\\theta_{pol}) \\sin(\\theta_{pol})',
          '02': '0',
          '12': '0',
        }
      : FIELD_LABELS_LAB;

  const relationLabels: Record<TensorType, string[]> = {
    ED: ['P_x', 'P_y', 'P_z'],
    MD: ['M_x', 'M_y', 'M_z'],
    EQ: ['Q_{xx}', 'Q_{xy}', 'Q_{xz}', 'Q_{yx}', 'Q_{yy}', 'Q_{yz}', 'Q_{zx}', 'Q_{zy}', 'Q_{zz}'],
  };
  const tLabelsLab = ['X', 'Y', 'Z'];
  const sourceExprs: SHGExpression[] = source.map((s, I) => ({
    component: `S_${tLabelsLab[I]}`,
    expression: formatPolyWith(s.poly, labFieldLabels),
    relation: formatRelation(s.coeffs, relationLabels[tensorType]),
    rawPoly: s.poly,
  }));

  return { induced: inducedCrystal, source: sourceExprs };
}

export interface LabFrameOptions {
  thetaX?: number;
  thetaY?: number;
  psi0?: number;
  phiX?: number;
  phiY?: number;
  psi?: number;
}

export function getLabFrameVectors(options: LabFrameOptions = {}) {
  const { thetaX = 0, thetaY = 0, psi0 = 0, phiX = 0, phiY = 0, psi = 0 } = options;

  const formatVecLab = (v: number[]) => {
    const terms: string[] = [];
    const labels = ['X', 'Y', 'Z'];
    for (let i = 0; i < 3; i++) {
      if (Math.abs(v[i]) > AXIS_EPSILON) {
        const coeff = formatCoeff(v[i]);
        const sign = v[i] < 0 ? '-' : terms.length > 0 ? '+' : '';
        terms.push(`${sign}${coeff}\\mathbf{${labels[i]}}_{LAB}`);
      }
    }
    return terms.length > 0 ? terms.join(' ') : '0';
  };

  const formatVecCryst = (v: number[]) => {
    const terms: string[] = [];
    const labels = ['x', 'y', 'z'];
    for (let i = 0; i < 3; i++) {
      if (Math.abs(v[i]) > AXIS_EPSILON) {
        const coeff = formatCoeff(v[i]);
        const sign = v[i] < 0 ? '-' : terms.length > 0 ? '+' : '';
        terms.push(`${sign}${coeff}\\mathbf{${labels[i]}}_{crys}`);
      }
    }
    return terms.length > 0 ? terms.join(' ') : '0';
  };

  // R = Ry(φ_y) · Rx(φ_x) · Rz(ψ) · R_preset
  const R_preset = mat3mul(rotZ(psi0), mat3mul(rotY(thetaY), rotX(thetaX)));
  const R = mat3mul(rotY(phiY), mat3mul(rotX(phiX), mat3mul(rotZ(psi), R_preset)));

  // Forward: crystal axes in lab basis (columns of R^T)
  const x_crys = [R[0][0], R[1][0], R[2][0]];
  const y_crys = [R[0][1], R[1][1], R[2][1]];
  const z_crys = [R[0][2], R[1][2], R[2][2]];

  // Inverse: lab axes in crystal basis (rows of R)
  const X_lab = [R[0][0], R[0][1], R[0][2]];
  const Y_lab = [R[1][0], R[1][1], R[1][2]];
  const Z_lab = [R[2][0], R[2][1], R[2][2]];

  return {
    X: formatVecLab(x_crys),
    Y: formatVecLab(y_crys),
    Z: formatVecLab(z_crys),
    inverse: {
      X: formatVecCryst(X_lab),
      Y: formatVecCryst(Y_lab),
      Z: formatVecCryst(Z_lab),
    },
  };
}
