import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { GENERATORS, EPSILON } from './symmetryGroups';
import { computeTensorForm, type TensorParity } from './tensorForms';
import { POINT_GROUPS } from '../data/pointGroups';

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
 * Anti-circular: expected forms come from the vendored tables, re-parsed at test time; nothing is
 * taken from computeTensorForm.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tbl = (name: string) => readFileSync(path.resolve(__dirname, '../../birss-tables', name), 'utf-8');

function tableRows(content: string): string[][] {
  return content.split('\n')
    .filter(l => l.trim().startsWith('|'))
    .map(l => l.split('|').slice(1, -1).map(c => c.trim()))
    .filter(cells => !cells.every(c => /^:?-+:?$/.test(c)));
}

// ---- Table 4a: point group -> symbol-class letter, per tensor type ----
// International symbol -> app key (only cubic m3/m3m differ from the app's bar notation).
const toAppKey = (intl: string) => (intl === 'm3' ? 'm-3' : intl === 'm3m' ? 'm-3m' : intl);
const classLetter = (cell: string): string | null => {
  const m = cell.match(/^([A-U])_[mn]$/);
  return m ? m[1] : null; // '-' (blank) -> null = tensor vanishes for this type
};

interface ClassRow { group: string; polarEven: string | null; axialEven: string | null; polarOdd: string | null; axialOdd: string | null }
const CLASS_ROWS: ClassRow[] = [];
for (const cells of tableRows(tbl('table-4a.md'))) {
  if (cells[0] === 'System') continue; // header
  // [System, IntlSymbol, Orientation, PolarEven, AxialEven, PolarOdd, AxialOdd]
  CLASS_ROWS.push({
    group: toAppKey(cells[1]),
    polarEven: classLetter(cells[3]),
    axialEven: classLetter(cells[4]),
    polarOdd: classLetter(cells[5]),
    axialOdd: classLetter(cells[6]),
  });
}

// ---- Tables 4b / 4c / 4d: symbol class -> component form (row label like "A0"/"A1"/"A2") ----
function parseFormTable(content: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const cells of tableRows(content)) {
    const m = cells[0].match(/^([A-U])[0-9]$/);
    if (!m) continue; // header row (e.g. "m = 0")
    out[m[1]] = cells.slice(1);
  }
  return out;
}
const T4B = parseFormTable(tbl('table-4b.md')); // [x]              (rank 0 scalar)
const T4C = parseFormTable(tbl('table-4c.md')); // [x, y, z]         (rank 1)
const T4D = parseFormTable(tbl('table-4d.md')); // [xx,yy,zz,xy,yx,xz(2),yz(2)]  (rank 2)

// ---- family canonicalization (flat-index based, rank-agnostic) ----
interface FCell { index: number; val: number }
function canon(cells: FCell[]): FCell[] {
  const sorted = [...cells].sort((a, b) => a.index - b.index);
  const refVal = sorted[0].val;
  return sorted.map(c => ({ index: c.index, val: c.val / refVal }));
}
function familiesEqual(a: FCell[], b: FCell[]): boolean {
  return a.length === b.length &&
    a.every((c, i) => c.index === b[i].index && Math.abs(c.val - b[i].val) < 1e-4);
}
function familySetsMatch(a: FCell[][], b: FCell[][]): boolean {
  return a.length === b.length &&
    a.every(x => b.some(y => familiesEqual(x, y))) &&
    b.every(y => a.some(x => familiesEqual(x, y)));
}
function engineFamilies(basis: number[][]): FCell[][] {
  return basis.map(vec => {
    const cells: FCell[] = [];
    for (let i = 0; i < vec.length; i++) if (Math.abs(vec[i]) > EPSILON) cells.push({ index: i, val: vec[i] });
    return canon(cells);
  });
}

// ---- expected families from each table row ----
// A `null` class means the tensor vanishes (Table-4a blank) -> zero families.

/** rank 0: single scalar, value 'x' (survives) or '0'. */
function expected4b(letter: string | null): FCell[][] {
  if (letter === null) return [];
  return T4B[letter][0] === '0' ? [] : [[{ index: 0, val: 1 }]];
}

/** rank 1: columns x,y,z (flat 0,1,2); each value '0' or its own coordinate -> independent family. */
function expected4c(letter: string | null): FCell[][] {
  if (letter === null) return [];
  const vals = T4C[letter];
  const fams: FCell[][] = [];
  for (let i = 0; i < 3; i++) if (vals[i] !== '0') fams.push([{ index: i, val: 1 }]);
  return fams;
}

/**
 * rank 2: columns [xx,yy,zz,xy,yx,xz(2),yz(2)]. Scalar columns (xx,yy,zz,xy,yx) name a family via
 * their (possibly signed) value symbol; the two `(2)` columns each stand for an independent pair
 * {xz,zx} / {yz,zy} that survives together (value != '0') or vanishes together (multiplicity
 * reading -- see the analysis doc; confirmed by class A2 = 9 independent).
 */
function expected4d(letter: string | null): FCell[][] {
  if (letter === null) return [];
  const vals = T4D[letter];
  const scalarCols: { idx: number }[] = [{ idx: 0 }, { idx: 4 }, { idx: 8 }, { idx: 1 }, { idx: 3 }]; // xx,yy,zz,xy,yx
  const byFamily = new Map<string, FCell[]>();
  scalarCols.forEach((col, k) => {
    const v = vals[k];
    if (v === '0') return;
    const sign = v.startsWith('-') ? -1 : 1;
    const base = v.replace('-', '');
    if (!byFamily.has(base)) byFamily.set(base, []);
    byFamily.get(base)!.push({ index: col.idx, val: sign });
  });
  const fams = [...byFamily.values()].map(canon);
  // (2) columns: xz(2)=vals[5] over {(0,2)=2,(2,0)=6}; yz(2)=vals[6] over {(1,2)=5,(2,1)=7}.
  if (vals[5] !== '0') fams.push([{ index: 2, val: 1 }], [{ index: 6, val: 1 }]);
  if (vals[6] !== '0') fams.push([{ index: 5, val: 1 }], [{ index: 7, val: 1 }]);
  return fams;
}

const CLASSICAL = CLASS_ROWS.map(r => r.group);

describe('Part C -- Tables 4b/4c/4d guard (32 classical groups via Table 4a)', () => {
  it('Table 4a maps 32 classical groups, all Type I app keys', () => {
    expect(CLASS_ROWS).toHaveLength(32);
    for (const g of CLASSICAL) {
      expect(GENERATORS[g], `unknown app key ${g}`).toBeDefined();
      expect(POINT_GROUPS.find(p => p.name === g)?.type, g).toBe('I');
    }
  });

  it('parses 21 symbol-class rows in each of 4b, 4c, 4d', () => {
    expect(Object.keys(T4B)).toHaveLength(21);
    expect(Object.keys(T4C)).toHaveLength(21);
    expect(Object.keys(T4D)).toHaveLength(21);
  });

  const check = (
    group: string, letter: string | null, parity: TensorParity, rank: 0 | 1 | 2, expected: FCell[][],
  ) => {
    const form = computeTensorForm(group, 1, { rank, parity, timeParity: 'i', intrinsic: 'none' })!;
    if (expected.length === 0) {
      expect(form.isZero, `${group} ${parity} rank-${rank} should vanish`).toBe(true);
    } else {
      expect(form.isZero, `${group} ${parity} rank-${rank} should be nonzero`).toBe(false);
      expect(familySetsMatch(expected, engineFamilies(form.basisResults)),
        `${group} ${parity} rank-${rank}: engine form != table row`).toBe(true);
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
