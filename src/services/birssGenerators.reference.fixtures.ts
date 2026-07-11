/**
 * birssGenerators.reference.fixtures.ts
 *
 * Independent re-typing of the Birss σ(0)-σ(9) generating-matrix pool, transcribed
 * directly from docs/references/BIRSS-APP-CONVENTIONS-REFERENCE.md Step 3 (itself
 * mirroring birss-tables/conventions-reference.md §4) — NOT imported from
 * symmetryGroups.ts, so a bug in that module's GENERATORS constants cannot cancel
 * out in the Phase-2 operator-set comparison (operatorSet.reference.test.ts).
 * Own multiply/closure primitives for the same reason.
 */

export interface RefMatrix3x3 {
  m: number[][];
  isAntiUnitary?: boolean;
}

const SQRT3_2 = Math.sqrt(3) / 2;

const SIGMA: Record<number, number[][]> = {
  0: [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ], // identity
  1: [
    [-1, 0, 0],
    [0, -1, 0],
    [0, 0, -1],
  ], // inversion
  2: [
    [-1, 0, 0],
    [0, 1, 0],
    [0, 0, -1],
  ], // 2-fold about y
  3: [
    [-1, 0, 0],
    [0, -1, 0],
    [0, 0, 1],
  ], // 2-fold about z
  4: [
    [1, 0, 0],
    [0, -1, 0],
    [0, 0, 1],
  ], // mirror perp y
  5: [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, -1],
  ], // mirror perp z
  6: [
    [-0.5, SQRT3_2, 0],
    [-SQRT3_2, -0.5, 0],
    [0, 0, 1],
  ], // 3-fold (120 deg) about z
  7: [
    [0, 1, 0],
    [-1, 0, 0],
    [0, 0, 1],
  ], // 4-fold about z
  8: [
    [0, -1, 0],
    [1, 0, 0],
    [0, 0, -1],
  ], // -4 roto-inversion about z
  9: [
    [0, 1, 0],
    [0, 0, 1],
    [1, 0, 0],
  ], // 3-fold about [111], cyclic x->y->z->x
};

export function sigma(n: number): RefMatrix3x3 {
  const m = SIGMA[n];
  if (!m) throw new Error(`Unknown sigma index: ${n}`);
  return { m };
}

export function sigmaPrime(n: number): RefMatrix3x3 {
  return { ...sigma(n), isAntiUnitary: true };
}

export function refMultiply(a: RefMatrix3x3, b: RefMatrix3x3): RefMatrix3x3 {
  const res = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        res[i][j] += a.m[i][k] * b.m[k][j];
      }
    }
  }
  return { m: res, isAntiUnitary: (a.isAntiUnitary ?? false) !== (b.isAntiUnitary ?? false) };
}

// Only the values the sigma(0)-sigma(9) pool's own algebra can produce under closure:
// no sqrt(2)/2, since that's only introduced by the 45 deg alternate-setting rotations,
// which are out of scope (Default settings only, per BIRSS-APP-CONVENTIONS-REFERENCE.md).
const REF_SNAP_VALUES = [0, 1, -1, 0.5, -0.5, SQRT3_2, -SQRT3_2];
const REF_SNAP_EPSILON = 1e-9;
const REF_EPSILON = 1e-6;
const REF_MAX_GROUP_SIZE = 200;

function refSnap(a: RefMatrix3x3): RefMatrix3x3 {
  return {
    m: a.m.map((row) =>
      row.map((v) => {
        for (const snap of REF_SNAP_VALUES) {
          if (Math.abs(v - snap) < REF_SNAP_EPSILON) return snap;
        }
        return v;
      }),
    ),
    isAntiUnitary: a.isAntiUnitary,
  };
}

export function refIsSameMatrix(a: RefMatrix3x3, b: RefMatrix3x3): boolean {
  if ((a.isAntiUnitary ?? false) !== (b.isAntiUnitary ?? false)) return false;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (Math.abs(a.m[i][j] - b.m[i][j]) > REF_EPSILON) return false;
    }
  }
  return true;
}

export function refClose(generators: RefMatrix3x3[]): RefMatrix3x3[] {
  const group = generators.map(refSnap);
  let changed = true;
  while (changed) {
    changed = false;
    const currentSize = group.length;
    for (let i = 0; i < currentSize; i++) {
      for (let j = 0; j < currentSize; j++) {
        const prod = refSnap(refMultiply(group[i], group[j]));
        if (!group.some((m) => refIsSameMatrix(m, prod))) {
          if (group.length >= REF_MAX_GROUP_SIZE) {
            throw new Error('Reference closure failed to terminate — check generator parsing');
          }
          group.push(prod);
          changed = true;
        }
      }
    }
  }
  return group;
}

/** Set equality (matrix identity + antiunitary flag) between a reference-closed group and any equal-shaped matrix array, e.g. the app's own Matrix3x3[]. */
export function refSetsEqual(a: RefMatrix3x3[], b: { m: number[][]; isAntiUnitary?: boolean }[]): boolean {
  if (a.length !== b.length) return false;
  const usedB = new Array(b.length).fill(false);
  for (const ma of a) {
    const idx = b.findIndex((mb, i) => !usedB[i] && refIsSameMatrix(ma, mb));
    if (idx === -1) return false;
    usedB[idx] = true;
  }
  return true;
}
