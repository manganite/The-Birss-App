import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { GENERATORS, EPSILON } from './symmetryGroups';
import { computeTensorForm, type TensorParity } from './tensorForms';
import { POINT_GROUPS } from '../data/pointGroups';

/**
 * Part C guard, rank 3 -- the generalized engine reproduces Birss Table 4e (rank-3 tensor
 * components) for the 32 classical point groups, via the Table-4a symbol-class key.
 *
 * This extends `tables4bcd.reference.test.ts` (ranks 0-2) to rank 3. See
 * docs/findings/ANALYSIS-table-4b-4d-semantics.md (the 4e/4f addendum) for the cell-semantics
 * analysis: Table 4e groups the 27 components into families by "distinct unrestricted permutations"
 * (the `(3)` columns) plus singletons, and each cell is either `0`, a self-reference (the family is
 * free), a single mult-1 component reference (all family members equal +/-that component), or a
 * cross-reference to a same-size family related by an axis relabel (positional pairing via the
 * relabel bijection). Comparison is subspace-equality: the engine basis must satisfy every parsed
 * relation AND match the table's independent-component count.
 *
 * Rank 4 (Table 4f) is deliberately NOT guarded here -- its multi-member families use inconsistent
 * partial-permutation rules whose component-level pairing is underdetermined by the notation (no
 * principled reading reproduces the validated engine); see the addendum's STOP report.
 *
 * Tables 4a-4e are classical (no time reversal), so the guard runs Type I groups, time-even (i)
 * forms, at the Birss reference setting (app default, setting 1). Anti-circular: expected relations
 * come from the vendored table re-parsed at test time, never from `computeTensorForm`.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tbl = (name: string) => readFileSync(path.resolve(__dirname, '../../birss-tables', name), 'utf-8');
function tableRows(content: string): string[][] {
  return content.split('\n').filter(l => l.trim().startsWith('|'))
    .map(l => l.split('|').slice(1, -1).map(c => c.trim()))
    .filter(cells => !cells.every(c => /^:?-+:?$/.test(c)));
}

const RANK = 3;
const DIM = 3 ** RANK; // 27
const SYM = 'xyz';
const strToIdx = (s: string) => [...s].reduce((a, ch) => a * 3 + SYM.indexOf(ch), 0);

/** distinct permutations of a component string, in canonical (sorted) order */
function perms(s: string): string[] {
  const out = new Set<string>();
  const rec = (cur: string, rest: string) => {
    if (!rest) { out.add(cur); return; }
    for (let i = 0; i < rest.length; i++) rec(cur + rest[i], rest.slice(0, i) + rest.slice(i + 1));
  };
  rec('', s);
  return [...out].sort();
}

/** The ordered component family a header cell denotes: bare `xyz` -> [xyz]; `xxy(3)` -> the
 * distinct unrestricted permutations of `xxy`. (Table 4e uses only these two forms.) */
function familyOf(header: string): string[] {
  const m = header.match(/^([a-z]+)(?:\((\d+)\))?$/);
  if (!m) throw new Error(`unrecognized 4e header: ${header}`);
  return m[2] ? perms(m[1]) : [m[1]];
}

/** An axis relabel (bijection on x,y,z) mapping fromBase -> toBase, or null if none exists. */
function relabel(fromBase: string, toBase: string): Record<string, string> | null {
  const map: Record<string, string> = {};
  for (let i = 0; i < fromBase.length; i++) {
    const a = fromBase[i], b = toBase[i];
    if (map[a] && map[a] !== b) return null;
    map[a] = b;
  }
  const vals = Object.values(map);
  if (new Set(vals).size !== vals.length) return null; // must be injective
  return map;
}
const applyRelabel = (s: string, map: Record<string, string>) => [...s].map(c => map[c] ?? c).join('');

interface Relation { idx: number; terms: { idx: number; coeff: number }[] } // chi_idx = sum coeff*chi_term

/** Parse one table row (given the header) into linear relations among the 27 components. Throws if a
 * cell convention is not one of the established 4e forms (so an unexpected cell fails loudly). */
function buildConstraints(header: string[], row: string[]): Relation[] {
  const families = header.slice(1).map(familyOf);
  const bases = header.slice(1).map(h => h.match(/^([a-z]+)/)![1]);
  const compToFamily = new Map<string, { members: string[]; base: string }>();
  families.forEach((fam, k) => fam.forEach(mm => compToFamily.set(mm, { members: fam, base: bases[k] })));

  const relations: Relation[] = [];
  for (let k = 0; k < families.length; k++) {
    const fam = families[k], base = bases[k], cell = row[k + 1];
    if (cell === '0') { for (const mm of fam) relations.push({ idx: strToIdx(mm), terms: [] }); continue; }
    const sign = cell.startsWith('-') ? -1 : 1;
    const ref = cell.replace('-', '');
    if (ref === base) continue; // self-reference: family is free
    const refFam = compToFamily.get(ref);
    if (!refFam) throw new Error(`4e cell "${cell}" references unknown component`);
    if (refFam.members.length === 1) { // single mult-1 component: every family member = sign*ref
      for (const mm of fam) relations.push({ idx: strToIdx(mm), terms: [{ idx: strToIdx(ref), coeff: sign }] });
      continue;
    }
    if (refFam.members.length === fam.length) {
      const map = relabel(refFam.base, base);
      if (map) { // positional pairing via the relabel: chi_{relabel(m)} = sign*chi_m
        for (const mm of refFam.members) relations.push({ idx: strToIdx(applyRelabel(mm, map)), terms: [{ idx: strToIdx(mm), coeff: sign }] });
        continue;
      }
    }
    throw new Error(`4e cell "${cell}" (column ${header[k + 1]}) not resolvable by the established reading`);
  }
  return relations;
}

/** Dimension of the solution space of the parsed relations (27 - rank of the constraint matrix). */
function tableDim(relations: Relation[]): number {
  const M = relations.map(r => {
    const row = new Array(DIM).fill(0);
    row[r.idx] += 1;
    for (const t of r.terms) row[t.idx] -= t.coeff;
    return row;
  });
  let rank = 0;
  for (let c = 0; c < DIM && rank < M.length; c++) {
    let piv = -1;
    for (let r = rank; r < M.length; r++) if (Math.abs(M[r][c]) > 1e-9) { piv = r; break; }
    if (piv < 0) continue;
    [M[rank], M[piv]] = [M[piv], M[rank]];
    const pv = M[rank][c];
    for (let j = 0; j < DIM; j++) M[rank][j] /= pv;
    for (let r = 0; r < M.length; r++) if (r !== rank && Math.abs(M[r][c]) > 1e-12) {
      const f = M[r][c];
      for (let j = 0; j < DIM; j++) M[r][j] -= f * M[rank][j];
    }
    rank++;
  }
  return DIM - rank;
}

// ---- Table 4a: point group -> symbol-class letter (odd-rank columns), reused shape from 4bcd ----
const toAppKey = (intl: string) => (intl === 'm3' ? 'm-3' : intl === 'm3m' ? 'm-3m' : intl);
const classLetter = (cell: string): string | null => {
  const m = cell.match(/^([A-U])_[mn]$/);
  return m ? m[1] : null;
};
interface ClassRow { group: string; polarOdd: string | null; axialOdd: string | null }
const CLASS_ROWS: ClassRow[] = [];
for (const cells of tableRows(tbl('table-4a.md'))) {
  if (cells[0] === 'System') continue;
  CLASS_ROWS.push({ group: toAppKey(cells[1]), polarOdd: classLetter(cells[5]), axialOdd: classLetter(cells[6]) });
}

// ---- Table 4e: header + one row per symbol class ----
const FE_ROWS = tableRows(tbl('table-4e.md'));
const FE_HEADER = FE_ROWS.find(r => r[0] === 'Row')!;
const FE_BY_LETTER: Record<string, string[]> = {};
for (const r of FE_ROWS) {
  const m = r[0].match(/^([A-U])3$/);
  if (m) FE_BY_LETTER[m[1]] = r;
}

function engineBasis(group: string, parity: TensorParity): number[][] {
  return computeTensorForm(group, 1, { rank: 3, parity, timeParity: 'i', intrinsic: 'none' })!.basisResults;
}

describe('Part C rank 3 -- Table 4e guard (32 classical groups via Table 4a)', () => {
  it('Table 4a maps 32 classical (Type I) groups; Table 4e has 21 class rows', () => {
    expect(CLASS_ROWS).toHaveLength(32);
    for (const c of CLASS_ROWS) {
      expect(GENERATORS[c.group], c.group).toBeDefined();
      expect(POINT_GROUPS.find(p => p.name === c.group)?.type, c.group).toBe('I');
    }
    expect(Object.keys(FE_BY_LETTER)).toHaveLength(21);
  });

  it('classical i-form == c-form for every group (no antiunitary elements)', () => {
    for (const c of CLASS_ROWS) {
      for (const parity of ['polar', 'axial'] as TensorParity[]) {
        const i = computeTensorForm(c.group, 1, { rank: 3, parity, timeParity: 'i', intrinsic: 'none' })!;
        const cc = computeTensorForm(c.group, 1, { rank: 3, parity, timeParity: 'c', intrinsic: 'none' })!;
        expect(cc.relations, `${c.group} ${parity}`).toEqual(i.relations);
      }
    }
  }, 120000); // generous explicit timeout: this rank-3 i-vs-c sweep (64 form computations) can far
  // exceed the 5s default under the heavier parallel CPU load added by the Table-7 rank-0/1/2/4
  // guard (which roughly doubles the suite's rank-4 workload). Assertions unchanged.

  const checkParity = (c: ClassRow, parity: TensorParity, letter: string | null) => {
    const basis = engineBasis(c.group, parity);
    if (letter === null) {
      expect(basis.length, `${c.group} ${parity}: Table 4a blank -> must vanish`).toBe(0);
      return;
    }
    const relations = buildConstraints(FE_HEADER, FE_BY_LETTER[letter]);
    // every engine basis vector satisfies every parsed relation
    for (const v of basis) {
      for (const rel of relations) {
        let s = v[rel.idx];
        for (const t of rel.terms) s -= t.coeff * v[t.idx];
        expect(Math.abs(s) < 1e-6, `${c.group}[${letter}] ${parity}: engine violates a Table-4e relation`).toBe(true);
      }
    }
    // dimensions match -> subspaces equal
    expect(basis.length, `${c.group}[${letter}] ${parity}: independent-count != Table 4e`).toBe(tableDim(relations));
  };

  for (const c of CLASS_ROWS) {
    it(`${c.group}: rank-3 polar & axial match Table 4e`, () => {
      checkParity(c, 'polar', c.polarOdd);
      checkParity(c, 'axial', c.axialOdd);
    });
  }
});
