import { describe, it, expect } from 'vitest';
import { GENERATORS } from './symmetryGroups';
import { computeTensorForm, type TensorParity } from './tensorForms';
import { POINT_GROUPS } from '../data/pointGroups';
import {
  CLASS_ROWS,
  T4B,
  T4C,
  T4D,
  expected4b,
  expected4c,
  expected4d,
  engineFamilies,
  familySetsMatch,
  type FCell,
} from './testUtils/birssTableParsers';

/**
 * Part C guard -- the generalized engine reproduces Birss Tables 4b (rank 0), 4c (rank 1) and
 * 4d (rank 2) for the 32 classical point groups, via the Table-4a symbol-class key.
 *
 * See docs/findings/ANALYSIS-table-4b-4d-semantics.md for the full semantics analysis (what each
 * table tabulates, the row/column reading incl. the 4d `xz(2)`/`yz(2)` multiplicity columns, and
 * the axis convention). Tables 4a-4d are CLASSICAL (32 groups, no time reversal); the guard is
 * therefore restricted to Type I groups and time-even (i) tensors at the Birss reference setting
 * (app default, setting 1). The i/c magnetic split lives in Table 7 (out of Phase-1 scope).
 *
 * Anti-circular: expected forms come from the vendored tables, re-parsed at test time (shared
 * parsers in ./testUtils/birssTableParsers); nothing is taken from computeTensorForm.
 */

const CLASSICAL = CLASS_ROWS.map((r) => r.group);

describe('Part C -- Tables 4b/4c/4d guard (32 classical groups via Table 4a)', () => {
  it('Table 4a maps 32 classical groups, all Type I app keys', () => {
    expect(CLASS_ROWS).toHaveLength(32);
    for (const g of CLASSICAL) {
      expect(GENERATORS[g], `unknown app key ${g}`).toBeDefined();
      expect(POINT_GROUPS.find((p) => p.name === g)?.type, g).toBe('I');
    }
  });

  it('parses 21 symbol-class rows in each of 4b, 4c, 4d', () => {
    expect(Object.keys(T4B)).toHaveLength(21);
    expect(Object.keys(T4C)).toHaveLength(21);
    expect(Object.keys(T4D)).toHaveLength(21);
  });

  const check = (group: string, letter: string | null, parity: TensorParity, rank: 0 | 1 | 2, expected: FCell[][]) => {
    const form = computeTensorForm(group, 1, { rank, parity, timeParity: 'i', intrinsic: 'none' })!;
    if (expected.length === 0) {
      expect(form.isZero, `${group} ${parity} rank-${rank} should vanish`).toBe(true);
    } else {
      expect(form.isZero, `${group} ${parity} rank-${rank} should be nonzero`).toBe(false);
      expect(
        familySetsMatch(expected, engineFamilies(form.basisResults)),
        `${group} ${parity} rank-${rank}: engine form != table row`,
      ).toBe(true);
    }
  };

  for (const row of CLASS_ROWS) {
    it(`${row.group}: rank 0/1/2 polar & axial match Tables 4b/4c/4d`, () => {
      check(row.group, row.polarEven, 'polar', 0, expected4b(row.polarEven));
      check(row.group, row.axialEven, 'axial', 0, expected4b(row.axialEven));
      check(row.group, row.polarOdd, 'polar', 1, expected4c(row.polarOdd));
      check(row.group, row.axialOdd, 'axial', 1, expected4c(row.axialOdd));
      check(row.group, row.polarEven, 'polar', 2, expected4d(row.polarEven));
      check(row.group, row.axialEven, 'axial', 2, expected4d(row.axialEven));
    });
  }
});
