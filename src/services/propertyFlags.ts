/**
 * propertyFlags.ts -- physical-property flags for the 122 magnetic point groups.
 *
 * Each flag is a projection-nonzero test: a property with a characteristic tensor is admitted iff
 * the symmetry-averaged (Reynolds) projection of that tensor over the full magnetic group has a
 * nonzero invariant subspace. Antiunitary (time-reversed) elements carry a sign `s` (+1 for
 * time-even, -1 for time-odd) and axial tensors carry the parity factor det(R) -- exactly the
 * `isAxial`/`isTimeOdd` handling already in `tensorProjection.transformTensor`.
 *
 * Every flag is independently anchored against a printed reference or a classical property-class
 * list in `propertyFlags.reference.test.ts` (anti-circular: expected sets come from ITC Tables
 * 1.5.2.4 / 1.5.7.1 / 1.5.8.1 and the multiferroics literature, never from these functions).
 *
 * Dependency direction: this is a consumer layer above `tensorProjection` and `symmetryGroups`;
 * it is NOT imported by them (it may import physics, never the reverse).
 */
import {
  GENERATORS,
  getCachedFullGroup,
  isCentrosymmetric,
  isSameMatrix,
  multiply,
  snapMatrix,
  inversion,
  det,
  EPSILON,
  type Matrix3x3,
} from './symmetryGroups';
import { averageTensor, calculateTensorBasisResults } from './tensorProjection';
import { getFamilyClass } from '../data/groupNotation';
import { POINT_GROUPS } from '../data/pointGroups';

/** The full magnetic group (matrices, with antiunitary flags) for an app group key, or null for an
 * unknown key -- so the public flags treat unknown groups as "no property" rather than crashing. */
function fullGroup(groupName: string): Matrix3x3[] | null {
  const generators = GENERATORS[groupName];
  if (!generators) return null;
  return getCachedFullGroup(groupName, generators);
}

/** Memoize a boolean group flag: the flags are pure and called repeatedly at render time
 * (per popup open, and by `getSHGConsequenceShort` in the Calculator/Simulator headers). */
function memoizeFlag(fn: (group: string) => boolean): (group: string) => boolean {
  const cache = new Map<string, boolean>();
  return (group: string) => {
    const hit = cache.get(group);
    if (hit !== undefined) return hit;
    const value = fn(group);
    cache.set(group, value);
    return value;
  };
}

/**
 * True iff the symmetry-averaged projection of a rank-`rank` tensor over `group` has a nonzero
 * invariant subspace -- i.e. some basis tensor survives the average. `isAxial` applies the det(R)
 * parity factor; `isTimeOdd` flips the sign on antiunitary elements.
 */
function hasNonzeroInvariant(group: Matrix3x3[], rank: number, isAxial: boolean, isTimeOdd: boolean): boolean {
  const dim = Math.pow(3, rank);
  for (let i = 0; i < dim; i++) {
    const basis = new Array(dim).fill(0);
    basis[i] = 1;
    const averaged = averageTensor(basis, group, rank, isAxial, isTimeOdd);
    if (averaged.some((v) => Math.abs(v) > EPSILON)) return true;
  }
  return false;
}

/** Polar: admits a spontaneous polarization (time-even polar vector, rank 1). Pyro-/ferroelectric
 * coincide with this at the point-group level. */
export const isPolar = memoizeFlag((group: string) => {
  const g = fullGroup(group);
  return g !== null && hasNonzeroInvariant(g, 1, false, false);
});

/** Ferromagnetic (incl. ferri-/weak): admits a spontaneous magnetization (time-odd axial vector,
 * rank 1). */
export const isFerromagnetic = memoizeFlag((group: string) => {
  const g = fullGroup(group);
  return g !== null && hasNonzeroInvariant(g, 1, true, true);
});

/** Magnetoelectric: admits a linear magnetoelectric tensor alpha_ij (time-odd axial rank 2). */
export const isMagnetoelectric = memoizeFlag((group: string) => {
  const g = fullGroup(group);
  return g !== null && hasNonzeroInvariant(g, 2, true, true);
});

/** Piezoelectric: the time-even polar rank-3 (jk-symmetric) tensor is nonzero -- exactly the app's
 * ED i-type form. */
export const isPiezoelectric = memoizeFlag((group: string) => {
  const result = calculateTensorBasisResults(group, 'ED', 'i');
  return result !== null && result.basisResults.length > 0;
});

/** Piezomagnetic: the time-odd axial rank-3 (jk-symmetric) tensor is nonzero -- exactly the app's
 * MD c-type form. */
export const isPiezomagnetic = memoizeFlag((group: string) => {
  const result = calculateTensorBasisResults(group, 'MD', 'c');
  return result !== null && result.basisResults.length > 0;
});

/** The 11 Laue classes: the classical (Type I) centrosymmetric point-group keys. */
const LAUE_KEYS = POINT_GROUPS.filter((g) => g.type === 'I' && isCentrosymmetric(g.name)).map((g) => g.name);

function sameMatrixSet(a: Matrix3x3[], b: Matrix3x3[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((x) => b.some((y) => isSameMatrix(x, y)));
}

/** The family group unioned with inversion·(family group) — the centrosymmetric Laue supergroup. */
function closeWithInversion(family: string): Matrix3x3[] {
  const base = getCachedFullGroup(family, GENERATORS[family]);
  const result = [...base];
  for (const m of base) {
    const prod = snapMatrix(multiply(inversion, m));
    if (!result.some((x) => isSameMatrix(x, prod))) result.push(prod);
  }
  return result;
}

const laueCache = new Map<string, string>();

/**
 * The Laue class of a group: its classical family closed with inversion, expressed as the matching
 * centrosymmetric classical key (one of the 11 Laue classes).
 */
export function getLaueClass(group: string): string {
  const family = getFamilyClass(group);
  const cached = laueCache.get(family);
  if (cached) return cached;
  const closed = closeWithInversion(family);
  for (const key of LAUE_KEYS) {
    if (sameMatrixSet(closed, getCachedFullGroup(key, GENERATORS[key]))) {
      laueCache.set(family, key);
      return key;
    }
  }
  throw new Error(`getLaueClass: no Laue class matched for ${group} (family ${family})`);
}

/**
 * Chiral (enantiomorphic): the classical family contains no improper operation (det = -1). Time
 * reversal does not affect spatial handedness, so primes are irrelevant -- the family group alone
 * decides.
 */
export const isChiral = memoizeFlag((group: string) => {
  const g = fullGroup(getFamilyClass(group));
  return g !== null && g.every((m) => det(m) > 0);
});

const SHG_CONSEQUENCE = {
  centro: { premise: 'Centrosymmetric', consequence: 'ED SHG forbidden (bulk); EQ/MD can contribute' },
  allowed: { premise: 'Non-centrosymmetric', consequence: 'ED SHG allowed' },
  vanishes: { premise: 'Non-centrosymmetric', consequence: 'ED SHG vanishes despite non-centrosymmetry (432 family)' },
} as const;

function shgConsequence(group: string) {
  if (isCentrosymmetric(group)) return SHG_CONSEQUENCE.centro;
  // The `.vanishes` label names the 432 family explicitly, and that is exact: among the 21
  // non-centrosymmetric crystal classes, 432 is the unique one whose polar rank-3 (ED / piezo)
  // tensor vanishes identically (see the piezoelectric anchor -- piezoelectric == non-centro minus
  // 432). So `non-centrosymmetric AND ED form zero` is precisely the 432 family.
  return isPiezoelectric(group) ? SHG_CONSEQUENCE.allowed : SHG_CONSEQUENCE.vanishes;
}

/**
 * The SHG consequence of the group's symmetry, derived from the computed ED i-type tensor form
 * rather than centrosymmetry alone: a non-centrosymmetric group whose ED tensor vanishes
 * identically (the `432` family) does NOT allow ED SHG.
 */
export function getSHGConsequence(group: string): string {
  const { premise, consequence } = shgConsequence(group);
  return `${premise} → ${consequence}`;
}

/** The consequence half of `getSHGConsequence`, for display alongside a Centro/Non-Centro label
 * that already states the premise. */
export function getSHGConsequenceShort(group: string): string {
  return shgConsequence(group).consequence;
}
