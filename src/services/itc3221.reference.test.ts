import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { computeTensorForm, type TensorSpec } from './tensorForms';
import { matrixRank, splitRow } from './testUtils/birssTableParsers';
import { GENERATORS, isCentrosymmetric } from './symmetryGroups';
import { isChiral } from './propertyFlags';
import { POINT_GROUPS } from '../data/pointGroups';

/**
 * Anti-circular guard: the engine (`computeTensorForm`) reproduces ITC Vol. D Table 3.2.2.1 --
 * the independent-component counts and property occurrence for the 21 noncentrosymmetric classical
 * crystal classes, across three tensor species, plus the structural totals printed in the header.
 *
 * Expected values are parsed from `docs/references/ITC-table-3.2.2.1-property-counts.md` at test
 * time; nothing is taken from the engine. On any mismatch this is a hard failure -- report the
 * group, spec, expected and engine counts; do not adjust the reference or special-case the engine.
 *
 * Spec mapping (from the reference file's "Spec mapping" section; verified to reproduce every printed
 * count): rank-1 = {1, polar, i, none}; rank-3 = {3, polar, i, jk} (piezoelectric / ED i-type);
 * axial rank-2 = {2, axial, i, ij} (the SYMMETRIC gyration tensor -- class 1 prints 6, not 9).
 * Independent count = span rank of the basis results (matrixRank at dim 3^rank), never
 * basisResults.length.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REF = readFileSync(path.resolve(__dirname, '../../docs/references/ITC-table-3.2.2.1-property-counts.md'), 'utf8');

const R1: TensorSpec = { rank: 1, parity: 'polar', timeParity: 'i', intrinsic: 'none' };
const R3: TensorSpec = { rank: 3, parity: 'polar', timeParity: 'i', intrinsic: 'jk' };
const A2: TensorSpec = { rank: 2, parity: 'axial', timeParity: 'i', intrinsic: 'ij' };

/** Span rank of the symmetry-reduced form = its true independent-component count. */
function count(group: string, spec: TensorSpec): number {
  const form = computeTensorForm(group, 1, spec)!;
  return form.isZero ? 0 : matrixRank(form.basisResults, 3 ** spec.rank);
}

/** The coordinate axes (x=0, y=1, z=2) spanned by a group's rank-1 polar form. */
function rank1Axes(group: string): number[] {
  const form = computeTensorForm(group, 1, R1)!;
  if (form.isZero) return [];
  const basis = form.basisResults;
  const base = matrixRank(basis, 3);
  const axes: number[] = [];
  for (let i = 0; i < 3; i++) {
    const e = [0, 0, 0];
    e[i] = 1;
    if (matrixRank([...basis, e], 3) === base) axes.push(i);
  }
  return axes;
}

// ---- parse Table 3.2.2.1: one row per noncentrosymmetric group ----
// The printed symbol for the hexagonal D3h class is `-62m`; the app's classical key is `-6m2`.
const SYMBOL_TO_KEY: Record<string, string> = { '-62m': '-6m2' };
const toKey = (sym: string) => SYMBOL_TO_KEY[sym] ?? sym;

// Printed direction (b-unique for monoclinic) -> the coordinate axes the free rank-1 component
// occupies in the app's first setting (z || c). See the reference file's convention notes: the
// monoclinic direction is printed unique-axis-b and must be permuted to c-unique.
const DIR_TO_AXES: Record<string, number[]> = {
  '[uvw]': [0, 1, 2], // class 1: every direction polar
  '[001]': [2], // z-axis groups (mm2, 4, 4mm, 3, 3m, 6, 6mm)
  '[010]': [2], // group 2, unique axis b -> 2-fold along z in the app frame
  '[u0w]': [0, 1], // group m, unique axis b (mirror plane) -> xy plane in the app frame
};

interface Row {
  symbol: string;
  key: string;
  known: boolean;
  r1: number;
  r3: number;
  a2: number;
  enantio: boolean;
  dir: string | null;
}

function parseCount(cell: string): number {
  if (cell === '-') return 0;
  const m = cell.match(/\((\d+)\)/);
  if (!m) throw new Error(`3.2.2.1: cannot parse count from "${cell}"`);
  return Number(m[1]);
}

function parseRows(): Row[] {
  const out: Row[] = [];
  for (const line of REF.split('\n')) {
    if (!line.startsWith('|')) continue;
    const f = splitRow(line);
    // f: ['', System, Laue, Group, Rank-1, Rank-3, Enantiomorphism, Axial-rank-2, '']
    if (f.length < 8) continue;
    const group = f[3];
    if (!group || group === 'Group' || /^-+$/.test(group)) continue; // header / separator
    const dirMatch = f[4].match(/\[[^\]]+\]/);
    out.push({
      symbol: group,
      key: toKey(group),
      known: !!GENERATORS[toKey(group)],
      r1: parseCount(f[4]),
      r3: parseCount(f[5]),
      a2: parseCount(f[7]),
      enantio: f[6] === '+',
      dir: dirMatch ? dirMatch[0] : null,
    });
  }
  return out;
}

const ROWS = parseRows();
const APP = ROWS.filter((r) => r.known); // the 21 noncentrosymmetric classical groups
const CENTRO = POINT_GROUPS.filter((g) => g.type === 'I' && isCentrosymmetric(g.name)).map((g) => g.name);

describe('ITC Table 3.2.2.1 -- structural parsing', () => {
  it('parses 23 rows: 21 app groups + icosahedral + spherical (the latter two skipped)', () => {
    expect(ROWS.length).toBe(23);
    expect(APP.length).toBe(21);
    // the two skipped rows are exactly the non-crystallographic ones
    expect(
      ROWS.filter((r) => !r.known)
        .map((r) => r.symbol)
        .sort(),
    ).toEqual(['2-inf (inf inf)', '235 (532)']);
  });
  it('the 11 centrosymmetric classical (Laue) groups are exactly the Type-I centro keys', () => {
    expect(CENTRO.length).toBe(11);
  });
});

describe('ITC Table 3.2.2.1 -- independent-component counts vs computeTensorForm', () => {
  for (const row of APP) {
    it(`${row.symbol}: rank-1 / rank-3 / axial rank-2 counts match`, () => {
      expect(count(row.key, R1), `${row.symbol} rank-1`).toBe(row.r1);
      expect(count(row.key, R3), `${row.symbol} rank-3`).toBe(row.r3);
      expect(count(row.key, A2), `${row.symbol} axial rank-2`).toBe(row.a2);
    });
  }

  it('the 11 centrosymmetric groups vanish for all three tensor species', () => {
    for (const g of CENTRO) {
      expect(count(g, R1), `${g} rank-1`).toBe(0);
      expect(count(g, R3), `${g} rank-3`).toBe(0);
      expect(count(g, A2), `${g} axial rank-2`).toBe(0);
    }
  });
});

describe('ITC Table 3.2.2.1 -- rank-1 polar-axis directions (setting-mapped)', () => {
  for (const row of APP.filter((r) => r.r1 > 0)) {
    it(`${row.symbol}: free rank-1 component lies on the expected axes (${row.dir})`, () => {
      const expected = DIR_TO_AXES[row.dir!];
      expect(expected, `no axis mapping for printed direction ${row.dir}`).toBeDefined();
      expect(rank1Axes(row.key)).toEqual(expected);
    });
  }
});

describe('ITC Table 3.2.2.1 -- structural totals and property flags', () => {
  it('10 pyroelectric, 20 piezoelectric, 15 optically active classes', () => {
    expect(APP.filter((r) => r.r1 > 0).length, 'pyroelectric').toBe(10);
    expect(APP.filter((r) => r.r3 > 0).length, 'piezoelectric').toBe(20);
    expect(APP.filter((r) => r.a2 > 0).length, 'optically active').toBe(15);
  });

  it('monoclinic rank-1: 1 (group 2) + 2 (group m) = 3 (group 1)', () => {
    const by = (s: string) => APP.find((r) => r.symbol === s)!;
    expect(by('2').r1 + by('m').r1).toBe(by('1').r1);
    expect(by('2').r1).toBe(1);
    expect(by('m').r1).toBe(2);
    expect(by('1').r1).toBe(3);
  });

  it('enantiomorphism column == isChiral over the 21 groups (11 marked +); centro groups all "-"', () => {
    for (const r of APP) expect(isChiral(r.key), `${r.symbol} enantiomorphism`).toBe(r.enantio);
    expect(APP.filter((r) => r.enantio).length).toBe(11);
    for (const g of CENTRO) expect(isChiral(g), `${g} (centro) must be non-chiral`).toBe(false);
  });
});
