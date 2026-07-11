/**
 * Shared Birss reference-table parsers for the Table-4x / Table-7 guard tests.
 *
 * Move-only extraction: these helpers were previously duplicated inside
 * `tables4bcd.reference.test.ts` (Tables 4a/4b/4c/4d parsing + family comparison) and
 * `tables4f.reference.test.ts` (Table 4f lockstep parsing + subspace/rank helpers). Behaviour is
 * unchanged; `matrixRank`/`tableDim` gained an explicit `dim` parameter (defaulting to the rank-4
 * DIM of 81) so the same routines serve arbitrary ranks. The reference `.md` files are re-parsed at
 * import time -- anti-circular: expected values come from the vendored tables, never from
 * `computeTensorForm`.
 *
 * This module lives outside the vitest test glob (`testUtils/`, no `.test.` in the name) so it is a
 * plain support module, not a test file.
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { EPSILON } from '../symmetryGroups';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tbl = (name: string) => readFileSync(path.resolve(__dirname, '../../../birss-tables', name), 'utf-8');

export function tableRows(content: string): string[][] {
  return content
    .split('\n')
    .filter((l) => l.trim().startsWith('|'))
    .map((l) =>
      l
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim()),
    )
    .filter((cells) => !cells.every((c) => /^:?-+:?$/.test(c)));
}

// ---- Table 4a: point group -> symbol-class letter, per tensor type ----
// International symbol -> app key (only cubic m3/m3m differ from the app's bar notation).
export const toAppKey = (intl: string) => (intl === 'm3' ? 'm-3' : intl === 'm3m' ? 'm-3m' : intl);
export const classLetter = (cell: string): string | null => {
  const m = cell.match(/^([A-U])_[mn]$/);
  return m ? m[1] : null; // '-' (blank) -> null = tensor vanishes for this type
};

export interface ClassRow {
  group: string;
  polarEven: string | null;
  axialEven: string | null;
  polarOdd: string | null;
  axialOdd: string | null;
}
export const CLASS_ROWS: ClassRow[] = [];
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
export function parseFormTable(content: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const cells of tableRows(content)) {
    const m = cells[0].match(/^([A-U])[0-9]$/);
    if (!m) continue; // header row (e.g. "m = 0")
    out[m[1]] = cells.slice(1);
  }
  return out;
}
export const T4B = parseFormTable(tbl('table-4b.md')); // [x]                          (rank 0 scalar)
export const T4C = parseFormTable(tbl('table-4c.md')); // [x, y, z]                     (rank 1)
export const T4D = parseFormTable(tbl('table-4d.md')); // [xx,yy,zz,xy,yx,xz(2),yz(2)]  (rank 2)

// ---- family canonicalization (flat-index based, rank-agnostic) ----
export interface FCell {
  index: number;
  val: number;
}
export function canon(cells: FCell[]): FCell[] {
  const sorted = [...cells].sort((a, b) => a.index - b.index);
  const refVal = sorted[0].val;
  return sorted.map((c) => ({ index: c.index, val: c.val / refVal }));
}
export function familiesEqual(a: FCell[], b: FCell[]): boolean {
  return a.length === b.length && a.every((c, i) => c.index === b[i].index && Math.abs(c.val - b[i].val) < 1e-4);
}
export function familySetsMatch(a: FCell[][], b: FCell[][]): boolean {
  return (
    a.length === b.length &&
    a.every((x) => b.some((y) => familiesEqual(x, y))) &&
    b.every((y) => a.some((x) => familiesEqual(x, y)))
  );
}
export function engineFamilies(basis: number[][]): FCell[][] {
  return basis.map((vec) => {
    const cells: FCell[] = [];
    for (let i = 0; i < vec.length; i++) if (Math.abs(vec[i]) > EPSILON) cells.push({ index: i, val: vec[i] });
    return canon(cells);
  });
}

// ---- expected families from each table row ----
// A `null` class means the tensor vanishes (Table-4a blank) -> zero families.

/** rank 0: single scalar, value 'x' (survives) or '0'. */
export function expected4b(letter: string | null): FCell[][] {
  if (letter === null) return [];
  return T4B[letter][0] === '0' ? [] : [[{ index: 0, val: 1 }]];
}

/** rank 1: columns x,y,z (flat 0,1,2); each value '0' or its own coordinate -> independent family. */
export function expected4c(letter: string | null): FCell[][] {
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
export function expected4d(letter: string | null): FCell[][] {
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

// ---- Table 4f: lockstep pairing parser + subspace/rank helpers ----
const RANK4_DIM = 3 ** 4; // 81
const SYM = 'xyz';
export const strToIdx = (s: string) => [...s].reduce((a, ch) => a * 3 + SYM.indexOf(ch), 0);
export const applyPerm = (s: string, perm: number[]) => perm.map((p) => s[p]).join('');

function allPerms(n: number): number[][] {
  if (n === 1) return [[0]];
  const out: number[][] = [];
  const rec = (chosen: number[], rest: number[]) => {
    if (!rest.length) {
      out.push(chosen);
      return;
    }
    for (let i = 0; i < rest.length; i++) rec([...chosen, rest[i]], [...rest.slice(0, i), ...rest.slice(i + 1)]);
  };
  rec([], [...Array(n).keys()]);
  return out;
}
const range = (n: number) => [...Array(n).keys()];

/**
 * The set of index-position permutations a column's annotation denotes (each `perm` applied as
 * `result[i] = str[perm[i]]`). Applied in lockstep to both the base and the cell value.
 */
export function annotationPerms(ann: string | undefined, base: string): number[][] {
  const n = base.length;
  if (!ann) return [range(n)]; // bare: identity only
  if (/^\d+$/.test(ann)) return allPerms(n); // (2)/(3)/(4): all permutations
  if (ann === 'c4') return range(n).map((k) => range(n).map((i) => (i + k) % n)); // cyclic shifts
  if (ann.includes('·') || ann.includes('.')) {
    // (x·3) or (x.3): fix the LAST index
    return allPerms(n - 1).map((p) => [...p, n - 1]);
  }
  if (/^[a-z]:\d+$/.test(ann)) {
    // (x:3): fix the FIRST index
    return allPerms(n - 1).map((p) => [0, ...p.map((i) => i + 1)]);
  }
  const m6 = ann.match(/^([a-z])([a-z]):\d+$/); // (xy:6): perms preserving x-before-y
  if (m6) {
    const [, a, b] = m6;
    return allPerms(n).filter((perm) => {
      const s = applyPerm(base, perm);
      return s.indexOf(a) < s.indexOf(b);
    });
  }
  throw new Error(`unrecognized 4f annotation: (${ann})`);
}

export interface Relation {
  idx: number;
  terms: { idx: number; coeff: number }[];
} // chi_idx = sum coeff*chi_term

/** Parse one table row (with its header) into linear relations, expanding each annotated column in
 * lockstep. Throws on any cell shape outside the documented conventions (fails loudly). */
export function buildConstraints(header: string[], row: string[]): Relation[] {
  const relations: Relation[] = [];
  for (let k = 1; k < header.length; k++) {
    const hm = header[k].match(/^([a-z]+)(?:\(([^)]+)\))?$/);
    if (!hm) throw new Error(`bad 4f header: ${header[k]}`);
    const base = hm[1],
      ann = hm[2];
    const perms = annotationPerms(ann, base);
    const cell = row[k];

    if (cell === '0') {
      for (const p of perms) relations.push({ idx: strToIdx(applyPerm(base, p)), terms: [] });
      continue;
    }

    if (cell.includes('+')) {
      // sum cell: single-component column, direct equality (no expansion)
      if (perms.length !== 1) throw new Error(`sum cell in annotated column ${header[k]}`);
      relations.push({
        idx: strToIdx(base),
        terms: cell.split('+').map((t) => ({ idx: strToIdx(t.trim()), coeff: 1 })),
      });
      continue;
    }

    const sign = cell.startsWith('-') ? -1 : 1;
    const value = cell.replace('-', '');
    if (value === base && sign === 1) continue; // self-reference: the family is free
    // lockstep: same position permutation on base and on value
    for (const p of perms)
      relations.push({
        idx: strToIdx(applyPerm(base, p)),
        terms: [{ idx: strToIdx(applyPerm(value, p)), coeff: sign }],
      });
  }
  return relations;
}

/** Rank of a set of length-`dim` row vectors (Gaussian elimination with partial pivoting). */
export function matrixRank(vectors: number[][], dim: number = RANK4_DIM): number {
  const M = vectors.map((v) => [...v]);
  let rank = 0;
  for (let c = 0; c < dim && rank < M.length; c++) {
    let piv = rank;
    for (let r = rank + 1; r < M.length; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    if (Math.abs(M[piv][c]) < 1e-7) continue;
    [M[rank], M[piv]] = [M[piv], M[rank]];
    const pv = M[rank][c];
    for (let j = 0; j < dim; j++) M[rank][j] /= pv;
    for (let r = 0; r < M.length; r++)
      if (r !== rank && Math.abs(M[r][c]) > 1e-12) {
        const f = M[r][c];
        for (let j = 0; j < dim; j++) M[r][j] -= f * M[rank][j];
      }
    rank++;
  }
  return rank;
}

/** Dimension of the solution space of the parsed relations (`dim` - rank of the constraint matrix). */
export function tableDim(relations: Relation[], dim: number = RANK4_DIM): number {
  const M = relations.map((r) => {
    const row = new Array(dim).fill(0);
    row[r.idx] += 1;
    for (const t of r.terms) row[t.idx] -= t.coeff;
    return row;
  });
  return dim - matrixRank(M, dim);
}

// ---- Table 4f: two headers (Part I / Part II); per class letter, one row under each ----
const FF_ROWS = tableRows(tbl('table-4f.md'));
export const FF_HEADERS = FF_ROWS.filter((r) => r[0] === 'Row');
export const FF_ROWS_BY_LETTER = new Map<string, string[][]>();
for (const r of FF_ROWS) {
  const m = r[0].match(/^([A-U])4$/);
  if (!m) continue;
  if (!FF_ROWS_BY_LETTER.has(m[1])) FF_ROWS_BY_LETTER.set(m[1], []);
  FF_ROWS_BY_LETTER.get(m[1])!.push(r);
}

const relationsCache = new Map<string, Relation[]>();
export function relationsForClass(letter: string): Relation[] {
  const hit = relationsCache.get(letter);
  if (hit) return hit;
  const rws = FF_ROWS_BY_LETTER.get(letter);
  if (!rws || rws.length !== FF_HEADERS.length) {
    throw new Error(
      `Table 4f: class ${letter} has ${rws?.length ?? 0} rows, expected ${FF_HEADERS.length} (Part I + Part II)`,
    );
  }
  const rels = rws.flatMap((row, i) => buildConstraints(FF_HEADERS[i], row)); // [Part I, Part II] in file order
  relationsCache.set(letter, rels);
  return rels;
}
