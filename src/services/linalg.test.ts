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
import { isIndependentOf, rref, spanRank } from './linalg';

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

// rref / spanRank: hand-derived textbook linear algebra. Every expected value is computable by
// inspection (stated per test) and is NOT captured from the functions under test.
describe('rref / spanRank (moved from TablesPage, R1)', () => {
  it('rref of an identity-like basis is itself', () => {
    // Already reduced: two pivots in columns 0 and 1, nothing to eliminate.
    expect(
      rref(
        [
          [1, 0, 0],
          [0, 1, 0],
        ],
        3,
      ),
    ).toEqual([
      [1, 0, 0],
      [0, 1, 0],
    ]);
  });

  it('rref normalises the pivot to 1', () => {
    // Single row [2,4,0] divided by its pivot 2 -> [1,2,0].
    expect(rref([[2, 4, 0]], 3)).toEqual([[1, 2, 0]]);
  });

  it('rref eliminates above and below the pivot', () => {
    // [[1,1,0],[0,1,1]]: col-1 pivot in row 1 eliminates the 1 in row 0 -> row0 = [1,1,0]-[0,1,1] = [1,0,-1].
    expect(
      rref(
        [
          [1, 1, 0],
          [0, 1, 1],
        ],
        3,
      ),
    ).toEqual([
      [1, 0, -1],
      [0, 1, 1],
    ]);
  });

  it('rref is idempotent', () => {
    // rref(rref(M)) == rref(M) for the rank-2 3x3 example above.
    const once = rref(
      [
        [1, 1, 0],
        [0, 1, 1],
      ],
      3,
    );
    expect(rref(once, 3)).toEqual(once);
  });

  it('rref drops dependent rows', () => {
    // [2,4,0] = 2*[1,2,0], so the second row eliminates to zero and is sliced off -> one row.
    const r = rref(
      [
        [1, 2, 0],
        [2, 4, 0],
      ],
      3,
    );
    expect(r).toEqual([[1, 2, 0]]);
    expect(r).toHaveLength(1);
  });

  it('rref ignores sub-tolerance noise as a pivot', () => {
    // 1e-8 is below RANK_PIVOT_EPS (1e-7): no column yields a pivot -> empty result.
    expect(rref([[1e-8, 0, 0]], 3)).toEqual([]);
  });

  it('spanRank counts independent vectors', () => {
    expect(spanRank([])).toBe(0); // no vectors -> rank 0
    expect(
      spanRank([
        [1, 0],
        [0, 1],
      ]),
    ).toBe(2); // two independent directions
    expect(
      spanRank([
        [1, 2],
        [2, 4],
      ]),
    ).toBe(1); // second row is 2x the first -> rank 1
  });

  it('spanRank matches rref row count', () => {
    // Voigt-like combination basis: two independent rows; both moved functions must agree.
    const basis = [
      [1, 0, 0, 0],
      [0, 1, 0, -1],
    ];
    expect(spanRank(basis)).toBe(2);
    expect(rref(basis, 4)).toHaveLength(2);
  });

  it('spanRank is noise-stable', () => {
    // 1e-16 (engine-noise scale) is below RANK_ELIM_EPS (1e-12), never counted as a direction -> rank 1.
    expect(
      spanRank([
        [1, 0],
        [1e-16, 0],
      ]),
    ).toBe(1);
  });
});
