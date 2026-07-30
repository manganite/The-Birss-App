import { describe, it, expect } from 'vitest';
import { computeTensorForm, type TensorSpec, type TensorIntrinsic, type TensorParity } from './tensorForms';
import { spanRank } from './linalg';
import { POINT_GROUPS } from '../data/pointGroups';

/**
 * Q0 audit (2026-07-30): the tensor-form bases are MINIMAL, and the relation display is a faithful
 * constraint set.
 *
 * Both guard the defect class found in
 * `docs/findings/FINDING-2026-07-29-rank4-trigonal-hexagonal-overcount.md`: the seed projection
 * dedupes candidate directions by proportionality only, which for the coupled rank-4 blocks of the
 * 3-/6-fold groups left a non-minimal spanning set (478 of 12200 cells). The span was right, so every
 * subspace-equality guard (Table 4b-4f, Table 7, ITC 3.2.2.1) stayed green for years; what broke was
 * the presented family list -- overlapping relation chains that contradict each other as constraints,
 * and a redundant, misattributed parameter set in the Calculator/Simulator. Nothing in the suite
 * asserted minimality, so nothing caught it. These two tests do.
 */

const INTRINSICS: TensorIntrinsic[] = ['none', 'jk', 'ij_kl', 'voigt'];

describe('Q0 audit — tensor-form bases are minimal', () => {
  // Generous timeout by design: this is a correctness census over 1952 rank-4 cells, not a
  // performance assertion (performance is the bench's job -- tensorForms.bench.ts).
  it('rank 4: basisResults.length === spanRank for all 122 groups x parity x intrinsic x time', () => {
    const offenders: string[] = [];
    let cells = 0;
    for (const parity of ['polar', 'axial'] as TensorParity[])
      for (const intrinsic of INTRINSICS)
        for (const timeParity of ['i', 'c'] as const)
          for (const pg of POINT_GROUPS) {
            const spec: TensorSpec = { rank: 4, parity, timeParity, intrinsic };
            const form = computeTensorForm(pg.name, 1, spec);
            if (!form) continue;
            cells++;
            const rank = spanRank(form.basisResults);
            if (form.basisResults.length !== rank)
              offenders.push(`${pg.name} ${parity} ${timeParity} ${intrinsic}: ${form.basisResults.length} != ${rank}`);
          }
    // Guards against a silently-vacuous sweep as much as against redundancy.
    expect(cells).toBe(POINT_GROUPS.length * 2 * INTRINSICS.length * 2);
    expect(offenders, `non-minimal bases:\n${offenders.join('\n')}`).toEqual([]);
  }, 180000);

  it('ranks 0-3 are minimal too (they never exhibited redundancy; pin it)', () => {
    const offenders: string[] = [];
    for (const rank of [0, 1, 2, 3] as const)
      for (const parity of ['polar', 'axial'] as TensorParity[])
        for (const intrinsic of ['none', 'ij', 'jk'] as TensorIntrinsic[])
          for (const timeParity of ['i', 'c'] as const)
            for (const pg of POINT_GROUPS) {
              const form = computeTensorForm(pg.name, 1, { rank, parity, timeParity, intrinsic });
              if (!form) continue;
              if (form.basisResults.length !== spanRank(form.basisResults))
                offenders.push(`${pg.name} r${rank} ${parity} ${timeParity} ${intrinsic}`);
            }
    expect(offenders, `non-minimal bases:\n${offenders.join('\n')}`).toEqual([]);
  }, 180000);
});

/**
 * Parses one displayed relation into linear constraints over the 3^rank components. Strict on
 * purpose: an unrecognised coefficient throws rather than being silently skipped, so a formatter
 * change cannot quietly weaken the check.
 */
function constraintsOf(relation: string, rank: number): number[][] {
  const dim = 3 ** rank;
  const idxOf = (label: string): number => {
    const letters = label.replace(/\\chi_\{|\}/g, '');
    expect(letters.length, `component label ${label} at rank ${rank}`).toBe(rank);
    return [...letters].reduce((acc, ch) => acc * 3 + 'xyz'.indexOf(ch), 0);
  };
  const coeffOf = (text: string): number => {
    const t = text.trim();
    if (t === '') return 1;
    const frac = t.match(/^\\frac\{(\d+)\}\{(\d+)\}$/);
    if (frac) return Number(frac[1]) / Number(frac[2]);
    const int = t.match(/^\d+$/);
    if (int) return Number(int[0]);
    throw new Error(`unparseable coefficient ${JSON.stringify(t)} in ${JSON.stringify(relation)}`);
  };
  /** One side of an `=`: a signed sum of coefficient*component terms. */
  const parseSide = (side: string): Map<number, number> => {
    const terms = new Map<number, number>();
    // Split before each signed term, keeping the sign.
    for (const raw of side.trim().split(/(?=[+-]?\s*(?:\\frac|\d|\\chi))/)) {
      const piece = raw.trim();
      if (piece === '' || piece === '+' || piece === '-') continue;
      const sign = piece.startsWith('-') ? -1 : 1;
      const body = piece.replace(/^[+-]\s*/, '');
      const at = body.indexOf('\\chi');
      expect(at, `term ${JSON.stringify(piece)} names a component`).toBeGreaterThanOrEqual(0);
      const idx = idxOf(body.slice(at));
      terms.set(idx, (terms.get(idx) ?? 0) + sign * coeffOf(body.slice(0, at)));
    }
    return terms;
  };

  const sides = relation.split('=').map(parseSide);
  const rows: number[][] = [];
  for (let s = 1; s < sides.length; s++) {
    const row = new Array(dim).fill(0);
    for (const [i, c] of sides[0]) row[i] += c;
    for (const [i, c] of sides[s]) row[i] -= c;
    rows.push(row);
  }
  return rows;
}

describe('Q0 audit — the displayed relations are a faithful constraint set', () => {
  /**
   * Reads the DISPLAY as a reader would -- every printed relation is an equation, every component
   * absent from the display is zero -- and checks that the resulting solution space has exactly the
   * dimension the header advertises. Before Q0 the affected cell failed this: its four overlapping
   * T_xxxx chains, taken together, forced T_xxxx = 0, so the solution space was strictly smaller
   * than the 14 components the page counted.
   */
  const check = (group: string, intrinsic: TensorIntrinsic, expectedDim: number) => {
    const form = computeTensorForm(group, 1, { rank: 4, parity: 'polar', timeParity: 'i', intrinsic })!;
    const dim = 81;
    expect(form.basisResults.length).toBe(expectedDim);

    const rows: number[][] = [];
    const mentioned = new Set<number>();
    for (const rel of form.relations) {
      for (const m of rel.matchAll(/\\chi_\{([xyz]+)\}/g))
        mentioned.add([...m[1]].reduce((acc, ch) => acc * 3 + 'xyz'.indexOf(ch), 0));
      rows.push(...constraintsOf(rel, 4));
    }
    // Components the display does not mention are asserted to vanish.
    for (let i = 0; i < dim; i++)
      if (!mentioned.has(i)) {
        const row = new Array(dim).fill(0);
        row[i] = 1;
        rows.push(row);
      }

    // Solution space of the displayed constraints = dim - rank(constraints).
    expect(
      dim - spanRank(rows),
      `${group} ${intrinsic}: displayed constraints do not span ${expectedDim} free components`,
    ).toBe(expectedDim);
  };

  it('coupled cell (3m, rank-4 none): 14 free components, composite relation included', () => {
    // Birss Table 4f row L4: three pair equalities + T_xxxx = T_yyxx + T_xyyx + T_yxyx (printed as a
    // sum cell) + T_yyyy = T_xxxx + the 11 z-block chains. 15 classes - 1 composite = 14.
    const form = computeTensorForm('3m', 1, { rank: 4, parity: 'polar', timeParity: 'i', intrinsic: 'none' })!;
    expect(form.relations).toContain('\\chi_{xxxx} = \\chi_{xxyy} + \\chi_{xyxy} + \\chi_{xyyx}');
    expect(form.relations).toContain('\\chi_{xxxx} = \\chi_{yyyy}');
    check('3m', 'none', 14);
  }, 60000);

  it('disjoint cell (mm2, rank-4 none): chains only, no composite', () => {
    const form = computeTensorForm('mm2', 1, { rank: 4, parity: 'polar', timeParity: 'i', intrinsic: 'none' })!;
    expect(form.relations.length).toBe(form.basisResults.length);
    check('mm2', 'none', form.basisResults.length);
  }, 60000);
});
