import { describe, it, expect } from 'vitest';
import { computeTensorForm, type TensorSpec } from './tensorForms';
import { deriveNyeScheme, type NyeScheme } from './nyeScheme';
import { spanRank } from './linalg';

/**
 * Unit anchors for the Nye dot-diagram view model (`deriveNyeScheme`).
 *
 * The engine underneath is guarded upstream (`tensorForms.test.ts`, the Birss Table 4a-4f reference
 * tests, the goldens); nothing here re-verifies the physics. What these pin is the VIEW: that the
 * grid geometry, the per-cell partition and the derived class counts are what the Q0 constraint
 * view says, at the positions a Nye scheme puts them.
 *
 * The rank-3 expected values are the independently derivable ones -- 4mm, -42m and class 3 also
 * carry Yariv, *Quantum Electronics* 2nd ed., Table 16.1's printed parenthetical counts (3, 2 and 6
 * respectively), so the derived class counts below agree with print as well as with the engine.
 * Yariv is metadata here, not the anchor: the gated positional transcription is a separate fixture.
 */

const RANK3_JK: TensorSpec = { rank: 3, parity: 'polar', timeParity: 'i', intrinsic: 'jk' };
const RANK4_IJKL: TensorSpec = { rank: 4, parity: 'polar', timeParity: 'i', intrinsic: 'ij_kl' };

/** The scheme for a group/setting/spec, with the form computed for that same spec. */
function schemeFor(group: string, setting: number, spec: TensorSpec): NyeScheme {
  const form = computeTensorForm(group, setting, spec);
  expect(form, `no form for ${group}`).not.toBeNull();
  const scheme = deriveNyeScheme(form!, spec);
  expect(scheme, `no scheme for ${group}`).not.toBeNull();
  return scheme!;
}

/** Nye/Voigt cell name for a 3x6 scheme cell: d_il with i = 1..3 and l = 1..6. */
const dName = (cell: { row: number; col: number }) => `d${cell.row + 1}${cell.col + 1}`;

/** The class partition as sets of d_il names, in class order. */
function classSets(scheme: NyeScheme): string[][] {
  return scheme.classes.map((cls) => cls.cells.map((i) => dName(scheme.cells[i])));
}

describe('deriveNyeScheme -- grid geometry', () => {
  it('covers exactly the compressible layouts a dot diagram can express', () => {
    const cases: Array<[TensorSpec, string | null]> = [
      [{ rank: 2, parity: 'polar', timeParity: 'i', intrinsic: 'none' }, '3x3'],
      [{ rank: 2, parity: 'polar', timeParity: 'i', intrinsic: 'ij' }, '3x3'],
      [RANK3_JK, '3x6'],
      [RANK4_IJKL, '6x6'],
      [{ rank: 4, parity: 'polar', timeParity: 'i', intrinsic: 'voigt' }, '6x6'],
      // No scheme: these keep their existing display untouched.
      [{ rank: 0, parity: 'polar', timeParity: 'i', intrinsic: 'none' }, null],
      [{ rank: 1, parity: 'polar', timeParity: 'i', intrinsic: 'none' }, null],
      [{ rank: 3, parity: 'polar', timeParity: 'i', intrinsic: 'ij' }, null],
      [{ rank: 3, parity: 'polar', timeParity: 'i', intrinsic: 'none' }, null],
      [{ rank: 4, parity: 'polar', timeParity: 'i', intrinsic: 'none' }, null],
    ];
    for (const [spec, expected] of cases) {
      const form = computeTensorForm('1', 1, spec)!;
      const scheme = deriveNyeScheme(form, spec);
      expect(scheme?.grid ?? null, `spec ${JSON.stringify(spec)}`).toBe(expected);
    }
  });

  it('lays a 3x6 scheme out as rows x,y,z by columns in Voigt order', () => {
    const scheme = schemeFor('1', 1, RANK3_JK);
    expect(scheme.rows.map((r) => r.label)).toEqual(['x', 'y', 'z']);
    expect(scheme.cols.map((c) => c.label)).toEqual(['xx', 'yy', 'zz', 'yz', 'zx', 'xy']);
    expect(scheme.cells).toHaveLength(18);
    // Cell (row x, col zx) is the d_15 slot and stands for the component chi_xzx.
    const d15 = scheme.cells.find((c) => dName(c) === 'd15')!;
    expect(d15.label).toBe('\\chi_{xzx}');
  });
});

describe('deriveNyeScheme -- rank-3 jk cell sets and class counts', () => {
  it('4mm: 5 nonzero cells in 3 classes', () => {
    const scheme = schemeFor('4mm', 1, RANK3_JK);
    expect(scheme.cells.filter((c) => c.kind !== 'zero')).toHaveLength(5);
    expect(classSets(scheme)).toEqual([['d15', 'd24'], ['d31', 'd32'], ['d33']]);
    expect(scheme.classes).toHaveLength(3);
    for (const cell of scheme.cells) {
      if (cell.kind !== 'zero') expect(cell.ratio).toBeCloseTo(1, 9);
    }
  });

  it('-42m: 3 nonzero cells in 2 classes', () => {
    const scheme = schemeFor('-42m', 1, RANK3_JK);
    expect(scheme.cells.filter((c) => c.kind !== 'zero')).toHaveLength(3);
    expect(classSets(scheme)).toEqual([['d14', 'd25'], ['d36']]);
    expect(scheme.classes).toHaveLength(2);
  });

  it('3: 13 nonzero cells in 6 classes, with the sign partners the class rows carry', () => {
    const scheme = schemeFor('3', 1, RANK3_JK);
    expect(scheme.cells.filter((c) => c.kind !== 'zero')).toHaveLength(13);
    expect(scheme.classes).toHaveLength(6);
    expect(classSets(scheme)).toEqual([
      ['d11', 'd12', 'd26'],
      ['d14', 'd25'],
      ['d15', 'd24'],
      ['d16', 'd21', 'd22'],
      ['d31', 'd32'],
      ['d33'],
    ]);
    // Every partner is +-1 of its class representative; the opposite-sign ones are the sign-ring
    // cells the diagram draws with an open partner.
    const negatives = scheme.cells.filter((c) => c.kind !== 'zero' && c.ratio < 0).map(dName);
    expect(negatives).toEqual(['d12', 'd22', 'd25', 'd26']);
    for (const cell of scheme.cells) {
      if (cell.kind !== 'zero') expect(Math.abs(cell.ratio)).toBeCloseTo(1, 9);
    }
  });

  it('marks exactly one representative per class, in reading order', () => {
    for (const group of ['4mm', '-42m', '3', '3m', '-4', '23']) {
      const scheme = schemeFor(group, 1, RANK3_JK);
      const reps = scheme.cells.filter((c) => c.kind === 'representative');
      expect(reps, group).toHaveLength(scheme.classes.length);
      for (const cls of scheme.classes) {
        expect(scheme.cells[cls.cells[0]].kind, `${group} class ${cls.id}`).toBe('representative');
        expect(scheme.cells[cls.cells[0]].ratio).toBe(1);
      }
    }
  });

  it('derived class counts equal the engine independent-component count', () => {
    for (const group of [
      '1',
      '2',
      'm',
      '222',
      'mm2',
      '4',
      '-4',
      '422',
      '4mm',
      '-42m',
      '3',
      '32',
      '3m',
      '6',
      '6mm',
      '622',
      '-6',
      '-6m2',
      '23',
      '-43m',
    ]) {
      const form = computeTensorForm(group, 1, RANK3_JK)!;
      const scheme = deriveNyeScheme(form, RANK3_JK)!;
      const free = scheme.classes.filter((c) => !c.determined).length;
      expect(free, group).toBe(spanRank(form.basisResults));
    }
  });
});

describe('deriveNyeScheme -- composite relations', () => {
  it('3m rank-4 ij_kl: the composite marks only the class the relation determines', () => {
    const scheme = schemeFor('3m', 1, RANK4_IJKL);
    expect(scheme.composites).toHaveLength(1);
    const [composite] = scheme.composites;
    expect(composite.text).toBe('\\chi_{xxxx} = \\chi_{xxyy} + 2\\chi_{xyxy}');

    // The determined class -- chi_xyxy and its intrinsic partners -- collapses to the single Voigt
    // cell (xy, xy), and that is the only cell carrying the composite kind.
    const cellName = (i: number) =>
      `${scheme.rows[scheme.cells[i].row].label}${scheme.cols[scheme.cells[i].col].label}`;
    const marked = scheme.cells.map((c, i) => [c, i] as const).filter(([c]) => c.kind === 'composite');
    expect(marked.map(([, i]) => cellName(i))).toEqual(['xyxy']);
    expect(composite.determinedClassId).toBe(scheme.cells[marked[0][1]].classId);
    expect(scheme.classes.filter((c) => c.determined)).toHaveLength(1);

    // The other cells the relation involves keep their own class identity -- the xxxx = yyyy and
    // xxyy = yyxx equalities are not swallowed by the composite -- but do reference it.
    expect(composite.cells.map(cellName)).toEqual(['xxxx', 'xxyy', 'yyxx', 'yyyy', 'xyxy']);
    for (const i of composite.cells) expect(scheme.cells[i].compositeRefs).toEqual([0]);
    const referencing = scheme.cells.filter((c) => c.compositeRefs.length > 0);
    expect(referencing).toHaveLength(5);
  });

  it('a composite class is not counted as a free parameter', () => {
    const form = computeTensorForm('3m', 1, RANK4_IJKL)!;
    const scheme = deriveNyeScheme(form, RANK4_IJKL)!;
    expect(scheme.classes).toHaveLength(9);
    expect(scheme.classes.filter((c) => !c.determined)).toHaveLength(spanRank(form.basisResults));
    expect(spanRank(form.basisResults)).toBe(8);
  });

  it('leaves composites empty for a disjoint-support cell', () => {
    expect(schemeFor('4mm', 1, RANK3_JK).composites).toEqual([]);
    expect(schemeFor('mm2', 1, RANK4_IJKL).composites).toEqual([]);
  });
});

describe('deriveNyeScheme -- vanishing forms', () => {
  it("a grey group's c-tensor gives the all-zero scheme, not a missing one", () => {
    const cSpec: TensorSpec = { ...RANK3_JK, timeParity: 'c' };
    const form = computeTensorForm("4mm1'", 1, cSpec)!;
    expect(form.isZero).toBe(true);

    const scheme = deriveNyeScheme(form, cSpec)!;
    expect(scheme.grid).toBe('3x6');
    expect(scheme.isZero).toBe(true);
    expect(scheme.cells).toHaveLength(18);
    expect(scheme.cells.every((c) => c.kind === 'zero')).toBe(true);
    expect(scheme.cells.every((c) => c.classId === null)).toBe(true);
    expect(scheme.classes).toEqual([]);
    expect(scheme.composites).toEqual([]);
  });
});

describe('deriveNyeScheme -- i/c agnosticism', () => {
  /**
   * The renderer is i/c-agnostic by construction: it reads the computed form, never the tensor's
   * parity or time parity. Magnetic c-tensors reach the same class rows via Birss's Table 7; i/c and
   * the magnetic lookup select WHICH form applies, never how it is notated. These two pin that.
   */
  it('renders a bracketed-setting magnetic c-tensor through the same code path', () => {
    // 3m' is Type III (black-and-white); setting 2 is its bracketed alternate 31m', the 30deg-rotated
    // trigonal frame Birss prints in parentheses.
    const cSpec: TensorSpec = { ...RANK3_JK, timeParity: 'c' };
    const form = computeTensorForm("3m'", 2, cSpec)!;
    expect(form.isZero).toBe(false);

    const scheme = deriveNyeScheme(form, cSpec)!;
    expect(scheme.grid).toBe('3x6');
    expect(scheme.classes).toHaveLength(2);
    expect(scheme.cells.filter((c) => c.kind !== 'zero')).toHaveLength(5);
    expect(scheme.classes.filter((c) => !c.determined)).toHaveLength(spanRank(form.basisResults));
    // No magnetic extension of the notation: the vocabulary in use is the same finite set.
    expect(new Set(scheme.cells.map((c) => c.kind))).toEqual(new Set(['zero', 'representative', 'member']));
  });

  it('produces an identical scheme whatever parity/time parity the spec claims', () => {
    const form = computeTensorForm("3m'", 2, { ...RANK3_JK, timeParity: 'c' })!;
    const asMagneticC = deriveNyeScheme(form, { ...RANK3_JK, timeParity: 'c' });
    const asClassicalI = deriveNyeScheme(form, { ...RANK3_JK, timeParity: 'i' });
    const asAxial = deriveNyeScheme(form, { ...RANK3_JK, parity: 'axial' });
    expect(asClassicalI).toEqual(asMagneticC);
    expect(asAxial).toEqual(asMagneticC);
  });
});
