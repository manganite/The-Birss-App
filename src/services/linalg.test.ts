/**
 * Unit tests for linalg.isIndependentOf — the independent-direction predicate shared by the
 * numeric and Float64Array symmetry-form reducers.
 *
 * All expected booleans below are pure linear algebra, decidable by inspection (is `candidate`
 * a scalar multiple of a vector in span{basis}?) — NOT captured from app output. This is the
 * anti-circularity guard for E28: the predicate's correctness is anchored to the mathematics,
 * not to whatever the current engine happens to emit.
 *
 * The `[0,0,1]` vs `[[1,0,1]]` case is the E28 counterexample: it exercises the former
 * `ratio === 0` "unset" sentinel, where a legitimate ratio of 0 (candidate[k]==0, existing[k]!=0)
 * was indistinguishable from "not yet set", silently skipping the consistency check. It FAILS on
 * the pre-fix code (returns false) and passes after the locked-flag fix.
 */
import { describe, it, expect } from 'vitest';
import { isIndependentOf } from './linalg';

const EPS = 1e-9;
const DIM = 3;

describe('isIndependentOf', () => {
  it('[0,0,1] is independent of span{[1,0,1]} (E28 zero-ratio counterexample)', () => {
    // [0,0,1] = c·[1,0,1] would need c=0 (from x) and c=1 (from z): impossible → independent.
    expect(isIndependentOf([0, 0, 1], [[1, 0, 1]], DIM, EPS)).toBe(true);
  });

  it('[0,0,1] is parallel to span{[0,0,2]} through a shared zero pattern → dependent', () => {
    // [0,0,1] = 0.5·[0,0,2] → parallel.
    expect(isIndependentOf([0, 0, 1], [[0, 0, 2]], DIM, EPS)).toBe(false);
  });

  it('[2,0,2] is a scalar multiple of [1,0,1] → dependent', () => {
    // [2,0,2] = 2·[1,0,1].
    expect(isIndependentOf([2, 0, 2], [[1, 0, 1]], DIM, EPS)).toBe(false);
  });

  it('[1,2,3] is independent of the 2-basis {[1,0,0],[0,1,0]}', () => {
    // Nonzero z-component escapes the xy-plane span → independent.
    expect(
      isIndependentOf(
        [1, 2, 3],
        [
          [1, 0, 0],
          [0, 1, 0],
        ],
        DIM,
        EPS,
      ),
    ).toBe(true);
  });

  it('exercises the existing[k]≈0 / candidate[k]≠0 branch, positive component', () => {
    // [1,1,0] vs span{[1,0,0]}: existing has 0 at k=1 where candidate is nonzero → independent.
    expect(isIndependentOf([1, 1, 0], [[1, 0, 0]], DIM, EPS)).toBe(true);
  });

  it('exercises the existing[k]≈0 / candidate[k]≠0 branch, negative component', () => {
    // [1,-1,0] vs span{[1,0,0]}: same branch, opposite sign → still independent.
    expect(isIndependentOf([1, -1, 0], [[1, 0, 0]], DIM, EPS)).toBe(true);
  });
});
