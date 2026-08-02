/**
 * tensorProjection.ts
 *
 * Numeric core: projects ED/MD/EQ tensors onto a magnetic point group's symmetry
 * operations (transform + average + basis reduction), and computes SHG source-term
 * polynomials and lab-frame basis vectors. Also hosts a handful of small,
 * dependency-free label/formatting helpers (getIndices, getLabel, formatCoeff,
 * cleanupExpressionSigns) shared by both this module and latexFormatting.ts.
 *
 * Bases are MINIMAL: the seed projection's proportionality dedup is followed by an RREF reduction
 * wherever it is not already minimal, so free parameters are pivot-named and every consumer (the
 * relation display and the rawPoly parameter attribution) sees an identifiable parametrization (Q0).
 *
 * @see docs/references/BIRSS-APP-CONVENTIONS-REFERENCE.md, Step 5 -- tensor forms and
 *      particularization. ED/MD are symmetric in the last two, field, indices; EQ is additionally
 *      symmetric in the leading, quadrupole, pair -- the `ij_kl` class, see `intrinsicOrbit`.
 *      Step 5(f) covers the canonical presentation: minimal bases, constraint-view display.
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
import { rotX, rotY, rotZ, mat3mul, isIndependentOf, rref, spanRank, RANK_PIVOT_EPS } from './linalg';
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
 * component. Returns `null` when no component survives. Shared by `latexFormatting.calculateTensorComponentsView`
 * (ED/MD/EQ display) and `tensorForms.formatFormRelations` (the generalized Tables engine), which
 * were previously kept in lockstep by hand (Wave-2 E5). This builder does NOT special-case rank 0
 * (a bare scalar) -- at rank 0 it would emit `\chi_{}` -- so callers that allow a scalar (e.g.
 * formatFormRelations, which emits a bare `\chi`) must handle rank 0 before calling. The only other
 * caller, calculateTensorComponentsView, is never invoked at rank 0.
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

/** Where one component sits in the Q0 constraint-view partition: which proportionality class it
 * belongs to, and its signed ratio to that class's representative. */
export interface ConstraintMembership {
  /** Flat index of the class representative -- the lowest-index member of the class. */
  rep: number;
  /** This component's signed ratio to the representative (1 for the representative itself). */
  ratio: number;
}

/** One residual relation among class representatives: the point group forces a representative to be
 * a combination of the others, so the class is not a free parameter. Rendered in Birss's printed
 * sum-cell style (`T_xxxx = T_xxyy + 2T_xyxy`). */
export interface CompositeConstraint {
  /** Every representative (flat index) the relation involves, ascending. */
  involved: number[];
  /** Left-hand side of the printed form: the lowest-index involved representative. */
  lhs: number;
  /** Right-hand side, in ascending representative order. */
  terms: { rep: number; coeff: number }[];
  /** The representative this relation DETERMINES -- the non-pivot class of the representative-column
   * RREF. This, not `lhs`, is the class that stops being a free parameter. */
  determined: number;
}

/** The Q0 constraint-view partition of a minimal basis, as DATA. See `reducedPartition`. */
export interface ConstraintPartition {
  /** Class representatives (flat indices), ascending -- also the discovery order. */
  reps: number[];
  /** Every NON-VANISHING component -> its class and ratio. A component absent from this map
   * vanishes identically for this group/spec. */
  memberOf: Map<number, ConstraintMembership>;
  /** Residual relations among the representatives (empty for a disjoint-support cell). */
  composites: CompositeConstraint[];
}

/**
 * The Q0 constraint-view partition of a MINIMAL (RREF-reduced) basis: per component one of
 * {vanishing, class representative, class member with a signed ratio}, plus the residual composite
 * relations among the representatives.
 *
 * This is the DATA behind `formatReducedRelations`, which is the same partition rendered as display
 * strings. It is extracted so the Nye dot-diagram view (`nyeScheme.ts`) is a view over exactly the
 * partition the relation list shows, rather than a second, independently drifting derivation of it.
 * No group theory happens here -- the invariant subspace arrives already computed in `basis`.
 *
 * @see docs/references/BIRSS-APP-CONVENTIONS-REFERENCE.md § (f) (canonical presentation)
 */
export function reducedPartition(basis: number[][], rank: number): ConstraintPartition {
  const dim = Math.pow(3, rank);
  const empty: ConstraintPartition = { reps: [], memberOf: new Map(), composites: [] };
  if (basis.length === 0) return empty;

  // Column c of the reduced basis: the coordinate vector of component c in the pivot parameters.
  const col = (c: number): number[] => basis.map((row) => row[c]);
  const isZeroVec = (v: number[]) => v.every((x) => Math.abs(x) <= EPSILON);
  /** Ratio v/u if the two are proportional (u nonzero), else null. */
  const ratioOf = (v: number[], u: number[]): number | null => {
    let ratio: number | null = null;
    for (let k = 0; k < u.length; k++) {
      if (Math.abs(u[k]) > EPSILON) {
        const q = v[k] / u[k];
        if (ratio === null) ratio = q;
        else if (Math.abs(q - ratio) > EPSILON) return null;
      } else if (Math.abs(v[k]) > EPSILON) return null;
    }
    return ratio;
  };

  // (1) proportionality classes, discovered in ascending component order so the representative of
  // each class is its lowest index and the class order matches the old per-vector order.
  const reps: number[] = [];
  const memberOf = new Map<number, ConstraintMembership>();
  for (let c = 0; c < dim; c++) {
    const vc = col(c);
    if (isZeroVec(vc)) continue;
    let placed = false;
    for (const r of reps) {
      const ratio = ratioOf(vc, col(r));
      if (ratio !== null) {
        memberOf.set(c, { rep: r, ratio });
        placed = true;
        break;
      }
    }
    if (!placed) {
      reps.push(c);
      memberOf.set(c, { rep: c, ratio: 1 });
    }
  }

  // (2) residual composite relations: reduce the representative-column matrix; every non-pivot
  // representative is a combination of the pivot ones, which is a relation the point group forces.
  const repCols = reps.map(col);
  const M = basis.map((_, k) => repCols.map((v) => v[k]));
  const R = rref(M, reps.length);
  const pivotOf = R.map((row) => row.findIndex((x) => Math.abs(x) > RANK_PIVOT_EPS));
  const isPivot = new Set(pivotOf.filter((p) => p >= 0));

  const composites: CompositeConstraint[] = [];
  for (let j = 0; j < reps.length; j++) {
    if (isPivot.has(j)) continue;
    // Nullspace vector for free column j: a_j = 1, a_{pivot_k} = -R[k][j]. It states sum_i a_i T_i = 0.
    const a = new Map<number, number>([[j, 1]]);
    R.forEach((row, k) => {
      if (pivotOf[k] < 0 || Math.abs(row[j]) <= RANK_PIVOT_EPS) return;
      a.set(pivotOf[k], -row[j]);
    });
    const involved = [...a.keys()].sort((p, q) => reps[p] - reps[q]);
    if (involved.length < 2) continue;

    // Birss prints these with the SUM CELL's own component on the left and a plain sum on the right
    // (Table 4f row L4: `xxxx = yyxx+xyyx+yxyx`). Normalizing on the lowest-index involved
    // representative reproduces that shape, with each partner the canonical member of its class.
    const [lhs, ...rhs] = involved;
    const scale = -a.get(lhs)!;
    composites.push({
      involved: involved.map((p) => reps[p]),
      lhs: reps[lhs],
      terms: rhs.map((p) => ({ rep: reps[p], coeff: a.get(p)! / scale })),
      determined: reps[j],
    });
  }

  return { reps, memberOf, composites };
}

/**
 * The relation set of a MINIMAL (RREF-reduced) basis, as display strings (Q0, 2026-07-30).
 *
 * A relation list built one-string-per-basis-vector is only honest when each basis vector's support
 * is a proportionality class, i.e. when no component is touched by two basis vectors. That holds for
 * every cell except the coupled rank-4 blocks of the 3-/6-fold groups, where several free parameters
 * genuinely meet in the same components (Birss Table 4f rows K4-L4, N4, P4 print exactly this as a
 * SUM cell). There, per-vector chains overlap at `T_xxxx` and, read as simultaneous constraints,
 * contradict each other. So the output semantics is:
 *
 *   1. one chain per PROPORTIONALITY CLASS -- components whose columns across the reduced basis are
 *      proportional. For a disjoint-support cell this reproduces the per-vector chains exactly
 *      (the only row touching a class is the row spanning it), which is why every unaffected cell
 *      is byte-identical;
 *   2. the residual COMPOSITE relations among the class representatives -- the nullspace of the
 *      representative-column matrix, rendered in Birss's printed style
 *      (`T_xxxx = T_xxyy + T_xyxy + T_xyyx`), one relation per line, never mixed into a chain.
 *
 * Vanishing components are not listed (callers report them separately). Rank 0 must be handled by
 * the caller, as for `formatBasisRelation`.
 *
 * The partition itself lives in `reducedPartition`; this function only renders it, so the Nye
 * dot-diagram view and this list cannot disagree about what a component is.
 */
export function formatReducedRelations(basis: number[][], rank: number): string[] {
  const dim = Math.pow(3, rank);
  if (basis.length === 0) return [];

  const { reps, memberOf, composites } = reducedPartition(basis, rank);

  // Each class becomes a synthetic vector fed to the SAME builder the per-vector path used, so the
  // chain strings (ratios, signs, coefficient formatting) are produced by identical code.
  const relations: string[] = [];
  for (const r of reps) {
    const v = new Array(dim).fill(0);
    for (const [c, m] of memberOf) if (m.rep === r) v[c] = m.ratio;
    const chain = formatBasisRelation(v, rank);
    if (chain !== null) relations.push(chain);
  }

  for (const comp of composites) relations.push(formatCompositeConstraint(comp, rank));

  return relations;
}

/** One composite relation as a display string, in Birss's printed sum-cell style
 * (`\chi_{xxxx} = \chi_{xxyy} + 2\chi_{xyxy}`). Shared by the relation list and the Nye view. */
export function formatCompositeConstraint(comp: CompositeConstraint, rank: number): string {
  const terms = comp.terms.map(({ rep, coeff }, n) => {
    const piece = `${formatCoeff(Math.abs(coeff))}${getLabel(getIndices(rep, rank))}`;
    return n === 0 ? (coeff < 0 ? `-${piece}` : piece) : coeff < 0 ? `- ${piece}` : `+ ${piece}`;
  });
  return `${getLabel(getIndices(comp.lhs, rank))} = ${terms.join(' ')}`;
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
 * The intrinsic index symmetry of the SHG channels, as position-permutation orbits (`p[k]` names
 * the source position feeding output position `k`, the same convention as `tensorForms`).
 *
 * - **rank 3** (ED/MD, `chi_ijk E_j E_k`): identity + swap(1,2) -- the two identical driving fields.
 * - **rank 4** (EQ, `Q_ij = chi_ijkl E_k E_l`): identity, swap(0,1), swap(2,3) and their product --
 *   the `ij_kl` class. The trailing pair is the field pair as at rank 3; the LEADING pair carries
 *   the quadrupole's own symmetry `Q_ij = Q_ji` (Pershan 1963; Hoshi 1995 eq. 10), which is
 *   frequency-independent and is what separates the EQ channel from the MD one. Q1, 2026-07-29.
 *
 * Ranks other than 3/4 do not occur on these paths; they degrade to the identity orbit.
 */
export function intrinsicOrbit(rank: number): number[][] {
  const id = Array.from({ length: rank }, (_, k) => k);
  const swap = (a: number, b: number): number[] => {
    const p = [...id];
    p[a] = b;
    p[b] = a;
    return p;
  };
  if (rank === 3) return [id, swap(1, 2)];
  if (rank === 4) return [id, swap(0, 1), swap(2, 3), [1, 0, 3, 2]];
  return [id];
}

/** The distinct flat indices reachable from `idx` under `perms` (which is already a closed orbit). */
function intrinsicOrbitOf(idx: number, rank: number, perms: number[][]): number[] {
  const indices = getIndices(idx, rank);
  const seen = new Set<number>();
  for (const p of perms) {
    let out = 0;
    for (let k = 0; k < rank; k++) out += indices[p[k]] * Math.pow(3, rank - 1 - k);
    seen.add(out);
  }
  return [...seen];
}

/** The intrinsic-symmetric unit seed for component `idx`: 1 at every member of its intrinsic orbit
 * (the field pair at rank 3; the field pair and the quadrupole pair at rank 4). */
function seedVector(idx: number, rank: number, perms: number[][]): number[] {
  const seed = new Array(Math.pow(3, rank)).fill(0);
  for (const s of intrinsicOrbitOf(idx, rank, perms)) seed[s] = 1;
  return seed;
}

/** Memoized `tensorBasisFor` results, keyed by the cached full-group array identity (stable per
 * group/setting via `getCachedFullGroup`) and then by the spec. Same pattern as `tensorForms`'
 * `flatOpCache`. The basis depends only on (group, rank, isAxial, isTimeOdd) and is never mutated by
 * callers, so this is a pure memo. It matters because Q0 made `computeShg` need the basis IN ADDITION
 * to its per-seed projections on the uncoupled path: without the memo a repeated rank-4 SHG
 * evaluation (every Simulator angle change re-derives the same group's basis) cost ~1.5-2x its
 * pre-Q0 time. */
const basisCache = new WeakMap<Matrix3x3[], Map<string, { basis: number[][]; reduced: boolean }>>();

function tensorBasisFor(
  group: Matrix3x3[],
  rank: number,
  isAxial: boolean,
  isTimeOdd: boolean,
): { basis: number[][]; reduced: boolean } {
  let perGroup = basisCache.get(group);
  if (!perGroup) {
    perGroup = new Map();
    basisCache.set(group, perGroup);
  }
  const cacheKey = `${rank}:${isAxial}:${isTimeOdd}`;
  const cached = perGroup.get(cacheKey);
  if (cached) return cached;
  const computed = computeTensorBasis(group, rank, isAxial, isTimeOdd);
  perGroup.set(cacheKey, computed);
  return computed;
}

/**
 * The symmetry-averaged basis of the invariant subspace, as a MINIMAL (RREF) basis.
 *
 * The seed projection alone returns a spanning set deduped only by proportionality
 * (`isIndependentOf`), which for the coupled rank-4 blocks of the 3-/6-fold groups is non-minimal:
 * several seeds land on distinct-but-dependent directions (census: 478 of 12200 cells, all rank 4,
 * excess +1 or +2). The span was always right, but a non-minimal family list makes the relation
 * display self-contradictory and the parameter attribution ill-defined, so the reduction happens
 * HERE -- before any consumer -- and every consumer sees pivot-named free parameters. RREF is unique
 * for a given span, so the pivots (and hence the parameter names) are well-defined; for the
 * disjoint-support cells that are already minimal it is a no-op up to normalization, verified across
 * all 5935 non-redundant non-zero cells. See docs/findings (Q0, 2026-07-30).
 */
function computeTensorBasis(
  group: Matrix3x3[],
  rank: number,
  isAxial: boolean,
  isTimeOdd: boolean,
): { basis: number[][]; reduced: boolean } {
  const dim = Math.pow(3, rank);
  const perms = intrinsicOrbit(rank);
  const spanning: number[][] = [];
  for (let i = 0; i < dim; i++) {
    const orbit = intrinsicOrbitOf(i, rank, perms);
    if (i !== Math.min(...orbit)) continue; // process each intrinsic orbit once, from its minimum

    const averaged = averageTensor(seedVector(i, rank, perms), group, rank, isAxial, isTimeOdd);

    const nonZero = averaged.some((v) => Math.abs(v) >= EPSILON);
    if (nonZero && isIndependentOf(averaged, spanning, dim, EPSILON)) {
      spanning.push(averaged);
    }
  }
  // Reduce ONLY when the spanning set is actually non-minimal, and report which happened. The guard
  // is a MINIMALITY test (`spanning.length === spanRank(spanning)`) -- there is deliberately no
  // `rank === 4` check; the tensor rank is merely where non-minimality happens to occur. Reason:
  // RREF's extra eliminations perturb the last bits, and on the irrational trigonal/hexagonal
  // entries that is enough to tip a display rounding boundary (5/16 printing as 0.313 vs 0.312).
  // Skipping the reduction where it is not needed keeps every already-minimal cell -- all of
  // rank <= 3, and the whole census complement at rank 4 -- BIT-identical, while the coupled blocks
  // still get a canonical, uniquely-pivoted basis.
  if (spanning.length === spanRank(spanning)) return { basis: spanning, reduced: false };
  return { basis: rref(spanning, dim), reduced: true };
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

  return { basisResults: tensorBasisFor(group, rank, tensorType === 'MD', trType === 'c').basis, rank };
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
  tensorType: TensorType,
  trType: TensorTimeReversal,
  R: S[][],
): ShgCoreResult<S> {
  // rank / isAxial / isTimeOdd are derived here (not passed in) so an inconsistent combination
  // (e.g. tensorType 'MD' with isAxial false) is unrepresentable at the call site.
  const rank = tensorType === 'EQ' ? 4 : 3;
  const isAxial = tensorType === 'MD';
  const isTimeOdd = trType === 'c';
  const dim = Math.pow(3, rank);
  const tLabels = ['x', 'y', 'z'];

  // E_cryst_m = R[0][m] E_X + R[1][m] E_Y (E_Z lab = 0, transverse).
  const E_lab: S[][] = [
    [R[0][0], R[1][0], scalar.zero],
    [R[0][1], R[1][1], scalar.zero],
    [R[0][2], R[1][2], scalar.zero],
  ];

  const outputCount = tensorType === 'EQ' ? 9 : 3;
  const perms = intrinsicOrbit(rank);
  const inducedLab: SPoly<S>[] = [];
  const inducedCrystal: SHGExpression[] = [];

  // Parameter attribution over the MINIMAL basis (Q0, 2026-07-30). In RREF each row's pivot column
  // is a unit vector, so the coordinate of a general invariant tensor T along row m is literally
  // T[pivot_m]: hence, exactly,
  //     T_ijkl = sum_m basis[m][ijkl] * chi_{pivot_m}
  // and every component is a SUM over the free parameters it actually depends on. The previous code
  // instead labelled each component by the lowest-index nonzero of its own projected seed and scaled
  // by a ratio, which silently asserts T_ijkl / T_label to be constant over the whole invariant
  // subspace. That holds only inside a proportionality class; in the coupled rank-4 blocks of the
  // 3-/6-fold groups it is false, and the implied tensor is not even group-invariant (it violates
  // the in-plane isotropy condition chi_xxxx = chi_xxyy + chi_xyxy + chi_xyyx). Since the Simulator
  // evaluates these polynomials directly -- one amplitude/phase slider per chi key -- the fix also
  // makes its parametrization identifiable and its tensor invariant.
  // `reduced` is exactly the census split: true for the coupled rank-4 cells whose seed projection
  // was non-minimal, false everywhere else. Where it is false the historical per-seed attribution is
  // provably equivalent (each component's projection is parallel to the single row spanning its
  // proportionality class), so that path is kept verbatim and those cells stay BIT-identical; where
  // it is true only the coordinate form is correct.
  const { basis, reduced } = tensorBasisFor(group, rank, isAxial, isTimeOdd);
  const pivots = basis.map((row) => {
    const p = row.findIndex((x) => Math.abs(x) > RANK_PIVOT_EPS);
    return p < 0 ? null : { label: getLabel(getIndices(p, rank)), value: row[p] };
  });

  for (let outIdx = 0; outIdx < outputCount; outIdx++) {
    const outIndices = tensorType === 'EQ' ? [Math.floor(outIdx / 3), outIdx % 3] : [outIdx];
    const outLabel =
      tensorType === 'EQ'
        ? `Q_{${tLabels[outIndices[0]]}${tLabels[outIndices[1]]}}`
        : `${tensorType === 'ED' ? 'P' : 'M'}_${tLabels[outIndices[0]]}`;

    const crystalTerms: SPoly<number> = new Map();
    const labTerms: SPoly<S> = new Map();

    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        const flatIdx = toFlatIndex([...outIndices, j, k], rank);

        // The free parameters this component genuinely depends on, with their coordinates.
        const terms: { label: string; weight: number }[] = [];
        if (reduced) {
          for (let m = 0; m < basis.length; m++) {
            const pivot = pivots[m];
            if (pivot === null) continue;
            const weight = basis[m][flatIdx] / pivot.value;
            if (Math.abs(weight) > EPSILON) terms.push({ label: pivot.label, weight });
          }
        } else {
          // Historical single-parameter attribution, verbatim: label and scale read off this
          // component's own projected seed. Equivalent here, and bit-for-bit reproducible.
          const averaged = averageTensor(seedVector(flatIdx, rank, perms), group, rank, isAxial, isTimeOdd);
          for (let i = 0; i < dim; i++) {
            if (Math.abs(averaged[i]) > EPSILON) {
              terms.push({ label: getLabel(getIndices(i, rank)), weight: averaged[flatIdx] / averaged[i] });
              break;
            }
          }
        }

        for (const { label, weight } of terms) {
          // Crystal-frame induced (numeric, shared across both instances).
          const polyFull = multiplyLinearGeneric(numberScalar, E_VEC_FULL[j], E_VEC_FULL[k]);
          for (const [pair, pCoeff] of Object.entries(polyFull)) {
            if (Math.abs(pCoeff) > EPSILON) {
              if (!crystalTerms.has(label)) crystalTerms.set(label, new Map());
              const pm = crystalTerms.get(label)!;
              pm.set(pair, (pm.get(pair) || 0) + weight * pCoeff);
            }
          }

          // Lab-frame induced (S-typed).
          const polyLab = multiplyLinearGeneric(scalar, E_lab[j], E_lab[k]);
          for (const [pair, pCoeffS] of Object.entries(polyLab)) {
            if (!scalar.isZero(pCoeffS)) {
              const totalS = scalar.scaleByNumber(pCoeffS, weight);
              if (!labTerms.has(label)) labTerms.set(label, new Map());
              const pm = labTerms.get(label)!;
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

/** The six rotation angles, in degrees: the crystal cut as preset angles, plus the user rotation. */
export interface OrientationAngles {
  /** Preset inner tilt about lab-x (deg) — part of the crystal cut. */
  thetaX?: number;
  /** Preset inner tilt about lab-y (deg) — part of the crystal cut. */
  thetaY?: number;
  /** Preset azimuth offset about the beam (deg) — the azimuth-zero convention, see orientation.ts. */
  psi0?: number;
  /** User tilt about lab-x (deg), lab-fixed. */
  phiX?: number;
  /** User tilt about lab-y (deg), lab-fixed. */
  phiY?: number;
  /** User azimuth about the beam (deg), crystal-tied. */
  psi?: number;
}

/**
 * The crystal → lab rotation matrix for a cut and a user rotation:
 *
 *     R_preset = Rz(psi0) · Ry(thetaY) · Rx(thetaX)
 *     R        = Ry(phiY) · Rx(phiX) · Rz(psi) · R_preset
 *
 * Tilts (φ_x, φ_y) are lab-fixed; the azimuth (ψ) is crystal-tied, which is why it sits INSIDE the
 * tilts and outside the preset. Crystal axis i expressed in the lab basis is column i of R; lab axis
 * i expressed in the crystal basis is row i (see `getLabFrameVectors`).
 *
 * THE COMPOSITION ORDER IS A CONVENTION, NOT ALGEBRA — it fixes what the app means by φ_x, φ_y, ψ,
 * and every surface that draws or computes an orientation must share it rather than restate it.
 * This function is its single numeric home: it was inlined identically in `calculateSHGExpressions`
 * and `getLabFrameVectors` before SIM-O, which needed a third consumer (`orientationScene`) and made
 * the duplication a drift risk. The symbolic path builds the same product over `TrigMat3` in
 * `symbolicProjection.ts` and is deliberately NOT unified with this one: it keeps the user angles
 * symbolic, so it shares the order but not the arithmetic.
 */
export function composeOrientationMatrix(angles: OrientationAngles = {}): number[][] {
  const { thetaX = 0, thetaY = 0, psi0 = 0, phiX = 0, phiY = 0, psi = 0 } = angles;
  const R_preset = mat3mul(rotZ(psi0), mat3mul(rotY(thetaY), rotX(thetaX)));
  return mat3mul(rotY(phiY), mat3mul(rotX(phiX), mat3mul(rotZ(psi), R_preset)));
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

  // Numeric: angles are substituted now, so R is a plain number matrix (the symbolic path keeps
  // them symbolic in TrigPoly instead). Composition order lives in composeOrientationMatrix.
  const R = composeOrientationMatrix({ thetaX, thetaY, psi0, phiX, phiY, psi });

  const { inducedCrystal, source } = computeShg(numberScalar, group, tensorType, trType, R);

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

/** Kept as a named alias: `LabFrameOptions` is the long-standing public name of this angle set. */
export type LabFrameOptions = OrientationAngles;

export function getLabFrameVectors(options: LabFrameOptions = {}) {
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

  const R = composeOrientationMatrix(options);

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
