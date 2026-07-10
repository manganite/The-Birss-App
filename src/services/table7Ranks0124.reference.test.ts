import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { computeTensorForm, type TensorParity, type TensorTimeParity, type TensorRank } from './tensorForms';
import { TABLE_4A_CLASS_LETTERS } from '../data/groupNotation';
import { TABLE7_BW_ROWS } from '../data/table7Data';
import {
  expected4b, expected4c, expected4d, relationsForClass, matrixRank, tableDim, type FCell,
} from './testUtils/birssTableParsers';

/**
 * Table-7 class-indexed guard for the Tables engine (`computeTensorForm`) at ranks 0/1/2 (Tables
 * 4b/4c/4d) and 4 (Table 4f), across all four i- and all four c-columns of all 58 black-white
 * rows, at setting 1, intrinsic 'none'. The existing rank-3 audit
 * (`table7RankThree.audit.test.ts`) covers rank 3 with test-local projectors over `getFullGroup`;
 * THIS file puts the engine itself under the same Table-7 systematics at the remaining ranks.
 *
 * Cross-formula (Table 7 "Notes and Status"): a c-tensor cell's Table-4a class is read from A/B,
 *   c-Polar-even  = 4a(B) Axial-even     c-Axial-even = 4a(A) Axial-even
 *   c-Polar-odd   = 4a(A) Polar-odd      c-Axial-odd  = 4a(B) Polar-odd
 * and each i-cell is 4a(unprime column 2) of the matching parity/rank. A bracketed SOURCE group
 * (column 2 for i-cells; A/B for c-cells) means the class form is expressed in that source's rotated
 * reference axes, so in the row's own frame the expected span is the transformed form (transforms
 * per the audit's SRC_TRANSFORM, generalized to arbitrary rank).
 *
 * Anti-circular: expected letters/forms come from table-7.md (re-parsed here) and the vendored 4a/4b
 * /4c/4d/4f tables (shared parsers), and TABLE_4A_CLASS_LETTERS (itself guarded against table-4a.md
 * in groupNotation.test.ts); nothing is taken from `computeTensorForm`. Any physical mismatch is a
 * hard failure -- report the full evidence, do not adjust expectations.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TABLE7_PATH = path.resolve(__dirname, '../../birss-tables/table-7.md');

// ---------- app-key mapping (kept verbatim in lockstep with table7RankThree.audit.test.ts) ----------
const KEYMAP: Record<string, string> = { "m'3": "m'-3'", "m3m'": "m-3m'", "m'3m'": "m'-3'm'", "m'3m": "m'-3'm" };
const appKey = (sym: string) => KEYMAP[sym] ?? sym;

// ---------- transforms (kept verbatim in lockstep with table7RankThree.audit.test.ts SRC_TRANSFORM) --
const Rz = (deg: number): number[][] => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return [[c, -s, 0], [s, c, 0], [0, 0, 1]];
};
const P_zx = [[0, 0, 1], [0, 1, 0], [-1, 0, 0]];
const P_zy = [[1, 0, 0], [0, 0, -1], [0, 1, 0]];
const SRC_TRANSFORM: Record<string, number[][]> = {
  m2m: P_zy, '2mm': P_zx, "2'm'm": P_zx,
  '-4m2': Rz(45), '-42m': Rz(45), "-4'm2'": Rz(45),
  '-62m': Rz(30), "-6'2m'": Rz(30),
};

// ---------- family-class key of a source symbol (strip brackets+primes, map alternate spellings) --
const ALT_TO_4A: Record<string, string> = { m2m: 'mm2', '2mm': 'mm2', '-4m2': '-42m', '-62m': '-6m2', m3: 'm-3', m3m: 'm-3m' };
const familyKeyOf = (sym: string) => { const s = sym.replace(/[()']/g, ''); return ALT_TO_4A[s] ?? s; };

// ---------- table-7 BW-row parser (mirrors the rank-3 audit; all 8 letter cells) ----------
type ColKey = 'iPolEven' | 'iAxEven' | 'iPolOdd' | 'iAxOdd' | 'cPolEven' | 'cAxEven' | 'cPolOdd' | 'cAxOdd';
type Source = 'M' | 'A' | 'B';
type FourACol = 'polarEven' | 'axialEven' | 'polarOdd' | 'axialOdd';

interface ColSpec { field: number; parity: TensorParity; time: TensorTimeParity; ranks: TensorRank[]; source: Source; fourA: FourACol }
const COLUMNS: Record<ColKey, ColSpec> = {
  iPolEven: { field: 5, parity: 'polar', time: 'i', ranks: [0, 2, 4], source: 'M', fourA: 'polarEven' },
  iAxEven: { field: 6, parity: 'axial', time: 'i', ranks: [0, 2, 4], source: 'M', fourA: 'axialEven' },
  iPolOdd: { field: 7, parity: 'polar', time: 'i', ranks: [1], source: 'M', fourA: 'polarOdd' },
  iAxOdd: { field: 8, parity: 'axial', time: 'i', ranks: [1], source: 'M', fourA: 'axialOdd' },
  cPolEven: { field: 9, parity: 'polar', time: 'c', ranks: [0, 2, 4], source: 'B', fourA: 'axialEven' },
  cAxEven: { field: 10, parity: 'axial', time: 'c', ranks: [0, 2, 4], source: 'A', fourA: 'axialEven' },
  cPolOdd: { field: 11, parity: 'polar', time: 'c', ranks: [1], source: 'A', fourA: 'polarOdd' },
  cAxOdd: { field: 12, parity: 'axial', time: 'c', ranks: [1], source: 'B', fourA: 'polarOdd' },
};
const COL_KEYS = Object.keys(COLUMNS) as ColKey[];

interface Row {
  line: number;
  system: string;
  M: string; Mbr: boolean;
  A: string; Abr: boolean;
  B: string; Bbr: boolean;
  letters: Record<ColKey, string | null>;
}
const strip = (s: string) => ({ sym: s.replace(/[()]/g, ''), br: s.includes('(') });
function cellLetter(s: string, line: number): string | null {
  if (s === '-') return null;
  const m = s.match(/^\(?([A-U])_[mn]\)?$/); // parens optional; letter is all that matters here
  if (!m) throw new Error(`table-7.md: bad tensor cell "${s}" (line ${line})`);
  return m[1];
}
function parseTable7(): Row[] {
  const rows: Row[] = [];
  readFileSync(TABLE7_PATH, 'utf8').split('\n').forEach((line, li) => {
    if (!line.startsWith('|')) return;
    const f = line.split('|').map(s => s.trim());
    if (f.length < 14 || f[2].startsWith('--') || /Magnetic point group/.test(f[2]) || f[3] === '-') return;
    const M = strip(f[2]), A = strip(f[3]), B = strip(f[4]);
    const letters = {} as Record<ColKey, string | null>;
    for (const key of COL_KEYS) letters[key] = cellLetter(f[COLUMNS[key].field], li + 1);
    rows.push({ line: li + 1, system: f[1], M: M.sym, Mbr: M.br, A: A.sym, Abr: A.br, B: B.sym, Bbr: B.br, letters });
  });
  return rows;
}
const ROWS = parseTable7();

// ---------- source symbol + effective bracket per column ----------
function sourceOf(row: Row, col: ColSpec): { sym: string; br: boolean } {
  if (col.source === 'M') return { sym: row.M, br: row.Mbr };
  if (col.source === 'A') return { sym: row.A, br: row.Abr };
  return { sym: row.B, br: row.Bbr };
}

// ---------- documented Birss book errors (scan-verified 2026-07-04), generalized from the audit ----
// (-6'2m'): the i-cells' missing brackets are a print omission only -- the physical form is already
// the rotated one because column 2 is bracketed (Mbr=true drives the transform). No override needed.
// -6m'2': A is misprinted UNBRACKETED (-6m2), contradicting the row's own Table-6 generator sigma'(4)
// = m'_y, which forces A to the rotated (-62m) setting. For the A-sourced c-columns the printed
// bracket would build the WRONG expected span, so we force the Rz(30) transform (mirrors the audit's
// EXCEPTIONS["-6m'2'"].c_pol, extended to c-Axial-even at ranks 0/2/4 and c-Polar-odd at rank 1).
const FORCED_TRANSFORM: Partial<Record<string, Partial<Record<ColKey, number[][]>>>> = {
  "-6m'2'": { cAxEven: Rz(30), cPolOdd: Rz(30) },
};

// ---------- rank-general tensor transform  T'_{p...} = R_{p i} ... T_{i...} ----------
function transformTensor(R: number[][], v: number[], rank: number): number[] {
  const dim = 3 ** rank;
  if (rank === 0) return v.slice();
  const digitsOf = (flat: number): number[] => { const d = new Array(rank); let t = flat; for (let k = rank - 1; k >= 0; k--) { d[k] = t % 3; t = Math.floor(t / 3); } return d; };
  const DIG = Array.from({ length: dim }, (_, i) => digitsOf(i));
  const out = new Array(dim).fill(0);
  for (let s = 0; s < dim; s++) {
    const t = v[s];
    if (Math.abs(t) < 1e-14) continue;
    const si = DIG[s];
    for (let o = 0; o < dim; o++) {
      const oi = DIG[o];
      let coeff = 1;
      for (let k = 0; k < rank; k++) { coeff *= R[oi[k]][si[k]]; if (coeff === 0) break; }
      if (coeff !== 0) out[o] += coeff * t;
    }
  }
  return out;
}

// ---------- expected component span (explicit basis vectors of length 3^rank) ----------
const famToVec = (fams: FCell[][], dim: number): number[][] =>
  fams.map(f => { const v = new Array(dim).fill(0); for (const c of f) v[c.index] = c.val; return v; });

/** Basis of the solution space of the parsed rank-4 relations (81 - rank of the constraint matrix).
 * Memoized by class letter -- the same letter recurs across many rows/columns. */
const nullSpaceCache = new Map<string, number[][]>();
function nullSpaceBasis(letter: string): number[][] {
  const cached = nullSpaceCache.get(letter);
  if (cached) return cached;
  const dim = 81;
  const relations = relationsForClass(letter);
  const M = relations.map(r => { const row = new Array(dim).fill(0); row[r.idx] += 1; for (const t of r.terms) row[t.idx] -= t.coeff; return row; });
  const pivotCols: number[] = [];
  let pr = 0;
  for (let c = 0; c < dim && pr < M.length; c++) {
    let piv = -1, best = 1e-7;
    for (let r = pr; r < M.length; r++) if (Math.abs(M[r][c]) > best) { best = Math.abs(M[r][c]); piv = r; }
    if (piv === -1) continue;
    [M[pr], M[piv]] = [M[piv], M[pr]];
    const pv = M[pr][c];
    for (let j = 0; j < dim; j++) M[pr][j] /= pv;
    for (let r = 0; r < M.length; r++) if (r !== pr && Math.abs(M[r][c]) > 1e-12) { const fac = M[r][c]; for (let j = 0; j < dim; j++) M[r][j] -= fac * M[pr][j]; }
    pivotCols.push(c); pr++;
  }
  const pivotSet = new Set(pivotCols);
  const basis: number[][] = [];
  for (let fc = 0; fc < dim; fc++) {
    if (pivotSet.has(fc)) continue;
    const v = new Array(dim).fill(0);
    v[fc] = 1;
    for (let i = 0; i < pivotCols.length; i++) v[pivotCols[i]] = -M[i][fc];
    basis.push(v);
  }
  nullSpaceCache.set(letter, basis);
  return basis;
}

/** The expected span for a (letter, rank), as explicit basis vectors (empty = the tensor vanishes). */
function expectedVectors(letter: string, rank: TensorRank): number[][] {
  switch (rank) {
    case 0: return famToVec(expected4b(letter), 1);
    case 1: return famToVec(expected4c(letter), 3);
    case 2: return famToVec(expected4d(letter), 9);
    case 4: return nullSpaceBasis(letter);
    default: throw new Error(`unexpected rank ${rank} in Table-7 even/odd guard`);
  }
}

// ---------- the guard ----------
describe('Table 7 ranks 0/1/2/4 -- structural parsing', () => {
  it('parses exactly 58 BW rows', () => {
    expect(ROWS.length).toBe(58);
  });
  it('every row maps to a TABLE7_BW_ROWS app key (barless-cubic remapped)', () => {
    for (const row of ROWS) {
      const key = appKey(row.M);
      expect(TABLE7_BW_ROWS[key], `no TABLE7_BW_ROWS entry for "${key}" (row ${row.M})`).toBeDefined();
    }
  });
});

describe('table7Data.ts drift guard (re-parse == generated module)', () => {
  it('the generated TABLE7_BW_ROWS equals a fresh parse of table-7.md (58 keys, every field)', () => {
    const fresh: Record<string, unknown> = {};
    for (const row of ROWS) {
      fresh[appKey(row.M)] = {
        system: row.system,
        m: row.M, mBracketed: row.Mbr,
        a: row.A, aBracketed: row.Abr,
        b: row.B, bBracketed: row.Bbr,
      };
    }
    expect(Object.keys(TABLE7_BW_ROWS)).toHaveLength(58);
    expect(TABLE7_BW_ROWS).toEqual(fresh);
  });
});

describe('Table 7 cross-formula consistency (printed letters == 4a(A/B) via TABLE_4A_CLASS_LETTERS)', () => {
  // For every BW row and all 8 letter cells, recompute the letter from the source's family class and
  // the cross-formula's 4a column, and assert it equals the printed letter (both letters and '-').
  // This pins table-7.md against TABLE_4A_CLASS_LETTERS (guarded vs table-4a.md) and the generated
  // module. The two documented book errors are FRAME (bracket) errors, not letter errors, so they do
  // NOT deviate here -- any deviation would be a NEW finding.
  it('all 58 rows x 8 cells agree with the cross-formula', () => {
    const deviations: string[] = [];
    for (const row of ROWS) {
      for (const key of COL_KEYS) {
        const col = COLUMNS[key];
        const src = sourceOf(row, col);
        const famKey = familyKeyOf(src.sym);
        const expected = TABLE_4A_CLASS_LETTERS[famKey]?.[col.fourA] ?? null;
        const printed = row.letters[key];
        if (expected !== printed) deviations.push(`${row.M} ${key}: cross-formula ${expected ?? '-'} != printed ${printed ?? '-'}`);
      }
    }
    expect(deviations, deviations.join('\n')).toEqual([]);
  });
});

describe('Table 7 ranks 0/1/2/4 -- computeTensorForm class-indexed guard (58 BW rows)', () => {
  for (const row of ROWS) {
    it(`${row.M}: engine i/c tensors match Table 7 (ranks 0/1/2/4)`, () => {
      const key = appKey(row.M);
      for (const colKey of COL_KEYS) {
        const col = COLUMNS[colKey];
        const letter = row.letters[colKey];
        const src = sourceOf(row, col);
        const forced = FORCED_TRANSFORM[row.M]?.[colKey];
        if (src.br && !forced && !SRC_TRANSFORM[src.sym]) {
          throw new Error(`no transform for bracketed source "${src.sym}" (row ${row.M}, ${colKey})`);
        }
        const R = forced ?? (src.br ? SRC_TRANSFORM[src.sym] : null);

        for (const rank of col.ranks) {
          const form = computeTensorForm(key, 1, { rank, parity: col.parity, timeParity: col.time, intrinsic: 'none' })!;
          const ctx = `${row.M} ${colKey} rank ${rank} (letter ${letter ?? '-'}${src.br ? `, bracketed src ${src.sym}` : ''}${forced ? ', forced transform' : ''})`;

          if (letter === null) {
            expect(form.isZero, `${ctx}: printed '-' but engine form is non-zero`).toBe(true);
            continue;
          }

          let expected = expectedVectors(letter, rank);
          if (R && expected.length) expected = expected.map(v => transformTensor(R, v, rank));

          const dim = 3 ** rank;
          if (expected.length === 0) {
            // letter present but the class form of this rank/parity vanishes (e.g. axial rank-0
            // pseudoscalar for an achiral class) -> engine must also vanish.
            expect(form.isZero, `${ctx}: expected span is empty but engine form is non-zero`).toBe(true);
            continue;
          }

          const engine = form.basisResults;
          const rExp = matrixRank(expected, dim);
          const rEng = matrixRank(engine, dim);
          const rUnion = matrixRank([...expected, ...engine], dim);
          // (a) engine subspace lies inside the expected span (union adds nothing) ...
          expect(rUnion, `${ctx}: engine span not contained in the Table-7 expected span`).toBe(rExp);
          // ... (b) and the two spans have equal dimension -> subspace equality.
          expect(rEng, `${ctx}: independent-component count != Table-7 expected`).toBe(rExp);
        }
      }
    }, 60000); // per-row batch (<= 4 rank-4 projections/row); generous headroom under parallel load.
  }
});

// Sanity: the rank-4 null-space basis dimension agrees with the constraint-rank formula for every
// class letter that appears in the BW rows (catches a broken nullSpaceBasis independently of the
// physical assertions above).
describe('Table 7 rank-4 null-space basis dimension == tableDim', () => {
  it('nullSpaceBasis(letter).length == tableDim(relations) for every even-rank BW letter', () => {
    const letters = new Set<string>();
    for (const row of ROWS) for (const key of COL_KEYS) {
      if (COLUMNS[key].ranks.includes(4) && row.letters[key]) letters.add(row.letters[key]!);
    }
    for (const letter of letters) {
      expect(nullSpaceBasis(letter).length, `class ${letter}`).toBe(tableDim(relationsForClass(letter), 81));
    }
  });
});
