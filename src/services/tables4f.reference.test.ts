import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { GENERATORS } from './symmetryGroups';
import { computeTensorForm, type TensorParity } from './tensorForms';
import { POINT_GROUPS } from '../data/pointGroups';

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
 * independent-component count). Anti-circular: relations are parsed from the vendored table, never
 * taken from `computeTensorForm`.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tbl = (name: string) => readFileSync(path.resolve(__dirname, '../../birss-tables', name), 'utf-8');
function tableRows(content: string): string[][] {
  return content.split('\n').filter(l => l.trim().startsWith('|'))
    .map(l => l.split('|').slice(1, -1).map(c => c.trim()))
    .filter(cells => !cells.every(c => /^:?-+:?$/.test(c)));
}

const RANK = 4;
const DIM = 3 ** RANK; // 81
const SYM = 'xyz';
const strToIdx = (s: string) => [...s].reduce((a, ch) => a * 3 + SYM.indexOf(ch), 0);
const applyPerm = (s: string, perm: number[]) => perm.map(p => s[p]).join('');

function allPerms(n: number): number[][] {
  if (n === 1) return [[0]];
  const out: number[][] = [];
  const rec = (chosen: number[], rest: number[]) => {
    if (!rest.length) { out.push(chosen); return; }
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
function annotationPerms(ann: string | undefined, base: string): number[][] {
  const n = base.length;
  if (!ann) return [range(n)];                                    // bare: identity only
  if (/^\d+$/.test(ann)) return allPerms(n);                      // (2)/(3)/(4): all permutations
  if (ann === 'c4') return range(n).map(k => range(n).map(i => (i + k) % n)); // cyclic shifts
  if (ann.includes('·') || ann.includes('.')) {                  // (x·3) or (x.3): fix the LAST index
    return allPerms(n - 1).map(p => [...p, n - 1]);
  }
  if (/^[a-z]:\d+$/.test(ann)) {                                  // (x:3): fix the FIRST index
    return allPerms(n - 1).map(p => [0, ...p.map(i => i + 1)]);
  }
  const m6 = ann.match(/^([a-z])([a-z]):\d+$/);                   // (xy:6): perms preserving x-before-y
  if (m6) {
    const [, a, b] = m6;
    return allPerms(n).filter(perm => { const s = applyPerm(base, perm); return s.indexOf(a) < s.indexOf(b); });
  }
  throw new Error(`unrecognized 4f annotation: (${ann})`);
}

interface Relation { idx: number; terms: { idx: number; coeff: number }[] } // chi_idx = sum coeff*chi_term

/** Parse one table row (with its header) into linear relations, expanding each annotated column in
 * lockstep. Throws on any cell shape outside the documented conventions (fails loudly). */
function buildConstraints(header: string[], row: string[]): Relation[] {
  const relations: Relation[] = [];
  for (let k = 1; k < header.length; k++) {
    const hm = header[k].match(/^([a-z]+)(?:\(([^)]+)\))?$/);
    if (!hm) throw new Error(`bad 4f header: ${header[k]}`);
    const base = hm[1], ann = hm[2];
    const perms = annotationPerms(ann, base);
    const cell = row[k];

    if (cell === '0') { for (const p of perms) relations.push({ idx: strToIdx(applyPerm(base, p)), terms: [] }); continue; }

    if (cell.includes('+')) { // sum cell: single-component column, direct equality (no expansion)
      if (perms.length !== 1) throw new Error(`sum cell in annotated column ${header[k]}`);
      relations.push({ idx: strToIdx(base), terms: cell.split('+').map(t => ({ idx: strToIdx(t.trim()), coeff: 1 })) });
      continue;
    }

    const sign = cell.startsWith('-') ? -1 : 1;
    const value = cell.replace('-', '');
    if (value === base && sign === 1) continue; // self-reference: the family is free
    // lockstep: same position permutation on base and on value
    for (const p of perms) relations.push({ idx: strToIdx(applyPerm(base, p)), terms: [{ idx: strToIdx(applyPerm(value, p)), coeff: sign }] });
  }
  return relations;
}

/** Rank of a set of length-DIM row vectors (Gaussian elimination with partial pivoting). */
function matrixRank(vectors: number[][]): number {
  const M = vectors.map(v => [...v]);
  let rank = 0;
  for (let c = 0; c < DIM && rank < M.length; c++) {
    let piv = rank;
    for (let r = rank + 1; r < M.length; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    if (Math.abs(M[piv][c]) < 1e-7) continue;
    [M[rank], M[piv]] = [M[piv], M[rank]];
    const pv = M[rank][c];
    for (let j = 0; j < DIM; j++) M[rank][j] /= pv;
    for (let r = 0; r < M.length; r++) if (r !== rank && Math.abs(M[r][c]) > 1e-12) { const f = M[r][c]; for (let j = 0; j < DIM; j++) M[r][j] -= f * M[rank][j]; }
    rank++;
  }
  return rank;
}

/** Dimension of the solution space of the parsed relations (81 - rank of the constraint matrix). */
function tableDim(relations: Relation[]): number {
  const M = relations.map(r => { const row = new Array(DIM).fill(0); row[r.idx] += 1; for (const t of r.terms) row[t.idx] -= t.coeff; return row; });
  return DIM - matrixRank(M);
}

// ---- Table 4a: point group -> even-rank symbol-class letter ----
const toAppKey = (i: string) => (i === 'm3' ? 'm-3' : i === 'm3m' ? 'm-3m' : i);
const classLetter = (cell: string): string | null => { const m = cell.match(/^([A-U])_[mn]$/); return m ? m[1] : null; };
interface ClassRow { group: string; polarEven: string | null; axialEven: string | null }
const CLASS_ROWS: ClassRow[] = [];
for (const cells of tableRows(tbl('table-4a.md'))) {
  if (cells[0] === 'System') continue;
  CLASS_ROWS.push({ group: toAppKey(cells[1]), polarEven: classLetter(cells[3]), axialEven: classLetter(cells[4]) });
}

// ---- Table 4f: two headers (Part I / Part II); per class letter, one row under each ----
const FF_ROWS = tableRows(tbl('table-4f.md'));
const FF_HEADERS = FF_ROWS.filter(r => r[0] === 'Row');
const FF_ROWS_BY_LETTER = new Map<string, string[][]>();
for (const r of FF_ROWS) {
  const m = r[0].match(/^([A-U])4$/);
  if (!m) continue;
  if (!FF_ROWS_BY_LETTER.has(m[1])) FF_ROWS_BY_LETTER.set(m[1], []);
  FF_ROWS_BY_LETTER.get(m[1])!.push(r);
}

const relationsCache = new Map<string, Relation[]>();
function relationsForClass(letter: string): Relation[] {
  const hit = relationsCache.get(letter);
  if (hit) return hit;
  const rws = FF_ROWS_BY_LETTER.get(letter);
  if (!rws || rws.length !== FF_HEADERS.length) {
    throw new Error(`Table 4f: class ${letter} has ${rws?.length ?? 0} rows, expected ${FF_HEADERS.length} (Part I + Part II)`);
  }
  const rels = rws.flatMap((row, i) => buildConstraints(FF_HEADERS[i], row)); // [Part I, Part II] in file order
  relationsCache.set(letter, rels);
  return rels;
}

describe('Part C rank 4 -- Table 4f guard (32 classical groups, lockstep pairing)', () => {
  it('Table 4a maps 32 classical (Type I) groups; Table 4f has two headers and 21 class rows', () => {
    expect(CLASS_ROWS).toHaveLength(32);
    for (const c of CLASS_ROWS) {
      expect(GENERATORS[c.group], c.group).toBeDefined();
      expect(POINT_GROUPS.find(p => p.name === c.group)?.type, c.group).toBe('I');
    }
    expect(FF_HEADERS).toHaveLength(2);
    expect(FF_ROWS_BY_LETTER.size).toBe(21);
    for (const [letter, rws] of FF_ROWS_BY_LETTER) expect(rws.length, `class ${letter} row count`).toBe(2); // Part I + Part II
  });

  it('classical i-form == c-form for every group (no antiunitary elements)', () => {
    for (const c of CLASS_ROWS) for (const parity of ['polar', 'axial'] as TensorParity[]) {
      const i = computeTensorForm(c.group, 1, { rank: 4, parity, timeParity: 'i', intrinsic: 'none' })!;
      const cc = computeTensorForm(c.group, 1, { rank: 4, parity, timeParity: 'c', intrinsic: 'none' })!;
      expect(cc.relations, `${c.group} ${parity}`).toEqual(i.relations);
    }
  }, 30000);

  const checkParity = (c: ClassRow, parity: TensorParity, letter: string | null) => {
    const basis = computeTensorForm(c.group, 1, { rank: 4, parity, timeParity: 'i', intrinsic: 'none' })!.basisResults;
    if (letter === null) { expect(basis.length, `${c.group} ${parity}: Table 4a blank -> must vanish`).toBe(0); return; }
    const relations = relationsForClass(letter);
    // (a) the engine's projected subspace satisfies every parsed table relation
    for (const v of basis) for (const rel of relations) {
      let s = v[rel.idx]; for (const t of rel.terms) s -= t.coeff * v[t.idx];
      expect(Math.abs(s) < 1e-6, `${c.group}[${letter}] ${parity}: engine violates a Table-4f relation at idx ${rel.idx}`).toBe(true);
    }
    // (b) dimensions match. Compare the RANK of the engine's span, not basisResults.length: for a
    // general (intrinsic-none) rank-4 tensor the seed-projection returns a non-minimal spanning set
    // (deduped only by proportionality), so its length can exceed the true independent-component
    // count. (a)+(b) => engine span == table solution space (subspace equality). See findings Sec. 8.
    expect(matrixRank(basis), `${c.group}[${letter}] ${parity}: independent-count != Table 4f`).toBe(tableDim(relations));
  };

  for (const c of CLASS_ROWS) {
    it(`${c.group}: rank-4 polar & axial match Table 4f`, () => {
      checkParity(c, 'polar', c.polarEven);
      checkParity(c, 'axial', c.axialEven);
    }, 20000);
  }
});
