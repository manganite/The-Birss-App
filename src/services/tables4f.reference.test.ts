import { describe, it, expect } from 'vitest';
import { GENERATORS } from './symmetryGroups';
import { computeTensorForm, type TensorParity } from './tensorForms';
import { POINT_GROUPS } from '../data/pointGroups';
import {
  CLASS_ROWS,
  FF_HEADERS,
  FF_ROWS_BY_LETTER,
  relationsForClass,
  matrixRank,
  tableDim,
  type ClassRow,
} from './testUtils/birssTableParsers';

/**
 * Part C guard, rank 4 -- the generalized engine reproduces Birss Table 4f (rank-4 tensor
 * components) for the 32 classical point groups, via the Table-4a even-rank class letters.
 *
 * Resolves the Sec.-8.3 STOP: the maintainer supplied Birss's own pairing rule (printed pages
 * 62-66, text preceding the table). LOCKSTEP: a column header's permutation annotation
 * (`(4)`,`(c4)`,`(x.3)`,`(x:3)`,`(xy:6)`, ...) defines a set of INDEX-POSITION permutations; the
 * SAME permutations are applied to the cell value, giving one relation per family member. It is NOT
 * an axis relabel (which is why the relabel reading failed for the c4 block). Example -- K4 column
 * `xxyz(c4)` cell `-yyyz`: the four cyclic position shifts give T_xxyz=-T_yyyz, T_zxxy=-T_zyyy,
 * T_yzxx=-T_yzyy, T_xyzx=-T_yyzy. Sum cells (single-component columns, e.g. `xxxx = yyxx+xyyx+yxyx`)
 * are direct equalities with no expansion.
 *
 * See docs/findings/ANALYSIS-table-4b-4d-semantics.md Sec. 8. Classical tables (no time reversal):
 * Type I groups, time-even (i) forms, setting 1; the guard also asserts i-form == c-form. Comparison
 * is subspace equality (engine basis satisfies every parsed relation AND matches the
 * independent-component count). Anti-circular: relations are parsed from the vendored table (shared
 * parsers in ./testUtils/birssTableParsers), never taken from `computeTensorForm`.
 *
 * `CLASS_ROWS` carries all four Table-4a letter columns; this rank-4 guard reads only the even-rank
 * ones (polarEven / axialEven).
 */

describe('Part C rank 4 -- Table 4f guard (32 classical groups, lockstep pairing)', () => {
  it('Table 4a maps 32 classical (Type I) groups; Table 4f has two headers and 21 class rows', () => {
    expect(CLASS_ROWS).toHaveLength(32);
    for (const c of CLASS_ROWS) {
      expect(GENERATORS[c.group], c.group).toBeDefined();
      expect(POINT_GROUPS.find((p) => p.name === c.group)?.type, c.group).toBe('I');
    }
    expect(FF_HEADERS).toHaveLength(2);
    expect(FF_ROWS_BY_LETTER.size).toBe(21);
    for (const [letter, rws] of FF_ROWS_BY_LETTER) expect(rws.length, `class ${letter} row count`).toBe(2); // Part I + Part II
  });

  it('classical i-form == c-form for every group (no antiunitary elements)', () => {
    for (const c of CLASS_ROWS)
      for (const parity of ['polar', 'axial'] as TensorParity[]) {
        const i = computeTensorForm(c.group, 1, { rank: 4, parity, timeParity: 'i', intrinsic: 'none' })!;
        const cc = computeTensorForm(c.group, 1, { rank: 4, parity, timeParity: 'c', intrinsic: 'none' })!;
        expect(cc.relations, `${c.group} ${parity}`).toEqual(i.relations);
      }
  }, 120000); // generous explicit timeout: this rank-4 i-vs-c sweep (128 form computations) can
  // exceed the previous 30s cap under the heavier parallel CPU load added by the Table-7
  // rank-0/1/2/4 guard (which roughly doubles the suite's rank-4 workload). Assertions unchanged.

  const checkParity = (c: ClassRow, parity: TensorParity, letter: string | null) => {
    const basis = computeTensorForm(c.group, 1, { rank: 4, parity, timeParity: 'i', intrinsic: 'none' })!.basisResults;
    if (letter === null) {
      expect(basis.length, `${c.group} ${parity}: Table 4a blank -> must vanish`).toBe(0);
      return;
    }
    const relations = relationsForClass(letter);
    // (a) the engine's projected subspace satisfies every parsed table relation
    for (const v of basis)
      for (const rel of relations) {
        let s = v[rel.idx];
        for (const t of rel.terms) s -= t.coeff * v[t.idx];
        expect(
          Math.abs(s) < 1e-6,
          `${c.group}[${letter}] ${parity}: engine violates a Table-4f relation at idx ${rel.idx}`,
        ).toBe(true);
      }
    // (b) dimensions match. Compare the RANK of the engine's span, not basisResults.length: for a
    // general (intrinsic-none) rank-4 tensor the seed-projection returns a non-minimal spanning set
    // (deduped only by proportionality), so its length can exceed the true independent-component
    // count. (a)+(b) => engine span == table solution space (subspace equality). See findings Sec. 8.
    expect(matrixRank(basis), `${c.group}[${letter}] ${parity}: independent-count != Table 4f`).toBe(
      tableDim(relations),
    );
  };

  for (const c of CLASS_ROWS) {
    it(`${c.group}: rank-4 polar & axial match Table 4f`, () => {
      checkParity(c, 'polar', c.polarEven);
      checkParity(c, 'axial', c.axialEven);
    }, 20000);
  }
});
