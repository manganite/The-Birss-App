/**
 * symbolicProjection.ts
 *
 * Symbolic SHG source terms (TrigPoly coefficients, symbolic in phiX, phiY, psi). Post-E8 this is a
 * thin wrapper: it builds the symbolic rotation R_sym (phi kept symbolic; only the preset
 * thetaX/thetaY/psi0 substituted), delegates the whole contraction to the SHARED generic core
 * `computeShg` (tensorProjection.ts) with the TrigPoly scalar instance, and applies the one
 * symbolic-only post-stage -- trigSimplify (cos^2+sin^2 reduction; the E1 liability, now explicit and
 * OUTSIDE the shared core). The numeric pipeline uses the same core with the number instance.
 */

import { type TrigPoly, trigAdd, trigMul, trigScale, trigIsZero, trigSimplify, TRIG_ZERO, TRIG_ONE } from './trigPoly';
import { type SHGOptions, type SHGExpression, type Scalar, computeShg } from './tensorProjection';
import {
  rotX,
  rotY,
  rotZ,
  mat3mul,
  symRotX,
  symRotY,
  symRotZ,
  trigMat3Mul,
  numToTrigMat3,
  type TrigMat3,
} from './linalg';
import { GENERATORS, getCachedFullGroup, getTransformedGenerators } from './symmetryGroups';

export type SymPoly = Map<string, Map<string, TrigPoly>>;

export interface SymbolicSHGExpression {
  component: string;
  symbolicPoly: SymPoly;
}

export interface SymbolicSHGResult {
  induced: SHGExpression[];
  source: SymbolicSHGExpression[];
}

export function buildSymbolicR(thetaX: number, thetaY: number, psi0 = 0): TrigMat3 {
  const R_preset = numToTrigMat3(mat3mul(rotZ(psi0), mat3mul(rotY(thetaY), rotX(thetaX))));
  // R = Ry(φ_y) · Rx(φ_x) · Rz(ψ) · R_preset — tilts lab-fixed, azimuth crystal-tied
  return trigMat3Mul(symRotY(), trigMat3Mul(symRotX(), trigMat3Mul(symRotZ(), R_preset)));
}

/** The TrigPoly instance of the SHG scalar interface. Per rider R2 isZero is trigIsZero
 * (TRIG_EPSILON=1e-12), distinct from the numeric instance's EPSILON=1e-6. */
const trigPolyScalar: Scalar<TrigPoly> = {
  zero: TRIG_ZERO,
  one: TRIG_ONE,
  add: trigAdd,
  mul: trigMul,
  scaleByNumber: (a, n) => trigScale(a, n),
  isZero: (a) => trigIsZero(a),
};

export function calculateSymbolicSHGExpressions(options: SHGOptions): SymbolicSHGResult {
  const { groupName, tensorType, trType, thetaX = 0, thetaY = 0, psi0 = 0, setting = 1 } = options;

  const generators = setting > 1 ? getTransformedGenerators(groupName, setting) : GENERATORS[groupName];
  if (!generators || generators.length === 0) return { induced: [], source: [] };

  const cacheKey = setting > 1 ? `${groupName}::setting${setting}` : groupName;
  const group = getCachedFullGroup(cacheKey, generators);

  // R_sym keeps phi symbolic (only the preset thetaX/thetaY/psi0 is substituted).
  const R_sym = buildSymbolicR(thetaX, thetaY, psi0);

  const { inducedCrystal, source } = computeShg(trigPolyScalar, group, tensorType, trType, R_sym);

  // Symbolic-only post-stage: cos^2+sin^2 simplification of every source coefficient. This is the
  // stage the applyPythagorean/E1 bug lived in; it is deliberately kept OUT of the shared core so it
  // can never silently diverge the two paths again.
  const tLabelsLab = ['X', 'Y', 'Z'];
  const sourceExprs: SymbolicSHGExpression[] = source.map((s, I) => {
    const simplified: SymPoly = new Map();
    for (const [chi, pairMap] of s.poly) {
      const simplifiedPairMap = new Map<string, TrigPoly>();
      for (const [pair, tp] of pairMap) {
        const simp = trigSimplify(tp);
        if (!trigIsZero(simp)) simplifiedPairMap.set(pair, simp);
      }
      if (simplifiedPairMap.size > 0) simplified.set(chi, simplifiedPairMap);
    }
    return { component: `S_${tLabelsLab[I]}`, symbolicPoly: simplified };
  });

  return { induced: inducedCrystal, source: sourceExprs };
}
