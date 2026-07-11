import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { GENERATORS, getFullGroup, det, type Matrix3x3 } from './symmetryGroups';

/**
 * Permanent guard: audits all 58 black-white rows of birss-tables/table-7.md at rank 3
 * (the four odd-rank columns: i-Polar-odd, i-Axial-odd, c-Polar-odd, c-Axial-odd) against
 * the app's own GENERATORS, closed via getFullGroup and projected onto the four rank-3
 * invariant subspaces (polar/axial x i/c). Both table-7.md and table-4e.md are parsed at
 * runtime -- no re-transcription -- so this test is anchored to the same source-of-record
 * files as the rest of the app, and will catch any future frame regression the way it
 * would have caught the 6'/mm'm bug (fixed in this PR) had it existed earlier.
 *
 * Scope: rank-3 (odd-n) columns only. Even-rank columns (Tables 4b/4d/4f) are a documented
 * follow-up, not covered here.
 *
 * Effective-transform rule (verified across all 58 rows, see
 * WORKORDER-6pmmpm-frame-fix-and-table7-guard.md Part 0 / SESSION-FINDINGS-2026-07-04):
 * a cell's Table-4e form is expressed in its SOURCE group's axes --
 *   i-columns:        source = G = unprime(column 2)  -> transform iff column 2 bracketed
 *   c-Polar-odd:       source = A                      -> transform iff A bracketed
 *   c-Axial-odd:       source = B                      -> transform iff B bracketed
 * Transform per bracketed source symbol: (m2m): z<->y permutation; (2mm)/(2'm'm): z<->x
 * permutation; (-4m2)/(-42m)/(-4'm2'): Rz(45deg); (-62m)/(-6'2m'): Rz(30deg).
 *
 * Two documented Birss book errors (Table 7, scan-verified 2026-07-04) are carried as
 * explicit exceptions -- see EXCEPTIONS below -- rather than silently special-cased.
 */

type Vec = number[];
const idx = (s: string) => 9 * 'xyz'.indexOf(s[0]) + 3 * 'xyz'.indexOf(s[1]) + 'xyz'.indexOf(s[2]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TABLE7_PATH = path.resolve(__dirname, '../../birss-tables/table-7.md');
const TABLE4E_PATH = path.resolve(__dirname, '../../birss-tables/table-4e.md');

// ---------- parse table-4e ----------
const t4e = readFileSync(TABLE4E_PATH, 'utf8');
const HDR = [
  'xxx',
  'yyy',
  'zzz',
  'xxy(3)',
  'yyx(3)',
  'xxz(3)',
  'yyz(3)',
  'zzx(3)',
  'zzy(3)',
  'xyz',
  'xzy',
  'zxy',
  'yxz',
  'yzx',
  'zyx',
];
const perm3 = (s: string) => {
  const [a, b, c] = s.split('');
  return [...new Set([a + b + c, a + c + b, c + a + b])];
};
const COLCOMPS = HDR.map((h) => (h.endsWith('(3)') ? perm3(h.slice(0, 3)) : [h]));

function parseTable4e(): Record<string, Vec[]> {
  const forms: Record<string, Vec[]> = {};
  for (const line of t4e.split('\n')) {
    const m = line.match(/^\| ([A-U]3) \|(.*)\|\s*$/);
    if (!m) continue;
    const cells = m[2].split('|').map((s) => s.trim());
    if (cells.length !== 15) throw new Error(`table-4e.md row ${m[1]}: expected 15 cells, got ${cells.length}`);
    const bySym: Record<string, Vec> = {};
    cells.forEach((cell, ci) => {
      if (cell === '0') return;
      const neg = cell.startsWith('-');
      const sym = neg ? cell.slice(1) : cell;
      if (!/^[xyz]{3}$/.test(sym)) throw new Error(`table-4e.md: bad cell grammar "${cell}" (row ${m[1]})`);
      bySym[sym] ??= new Array(27).fill(0);
      for (const comp of COLCOMPS[ci]) bySym[sym][idx(comp)] += neg ? -1 : 1;
    });
    forms[m[1][0]] = Object.values(bySym);
  }
  return forms;
}
const FORMS = parseTable4e();

// ---------- parse table-7 BW rows ----------
type CellCol = 'i_pol' | 'i_ax' | 'c_pol' | 'c_ax';
interface Row {
  line: number;
  M: string;
  Mbr: boolean;
  A: string;
  Abr: boolean;
  B: string;
  Bbr: boolean;
  cells: Record<CellCol, { letter: string | null; br: boolean }>;
}
const strip = (s: string) => ({ sym: s.replace(/[()]/g, ''), br: s.includes('(') });

function parseTable7(): Row[] {
  const t7 = readFileSync(TABLE7_PATH, 'utf8');
  const rows: Row[] = [];
  t7.split('\n').forEach((line, li) => {
    if (!line.startsWith('|')) return;
    const f = line.split('|').map((s) => s.trim());
    if (f.length < 14 || f[2].startsWith('--') || /Magnetic/.test(f[2]) || f[3] === '-') return;
    const cell = (s: string): { letter: string | null; br: boolean } => {
      if (s === '-') return { letter: null, br: false };
      // Parens must be balanced -- (X_n) or X_n only, not the mismatched X_n) / (X_n.
      const mm = s.match(/^(?:\(([A-U])_n\)|([A-U])_n)$/);
      if (!mm) throw new Error(`table-7.md: bad tensor cell grammar "${s}" (line ${li + 1})`);
      return { letter: mm[1] ?? mm[2], br: mm[1] !== undefined };
    };
    const M = strip(f[2]),
      A = strip(f[3]),
      B = strip(f[4]);
    rows.push({
      line: li + 1,
      M: M.sym,
      Mbr: M.br,
      A: A.sym,
      Abr: A.br,
      B: B.sym,
      Bbr: B.br,
      cells: { i_pol: cell(f[7]), i_ax: cell(f[8]), c_pol: cell(f[11]), c_ax: cell(f[12]) },
    });
  });
  return rows;
}
const ROWS = parseTable7();

// ---------- app-key mapping (documented barless-cubic convention) ----------
const KEYMAP: Record<string, string> = { "m'3": "m'-3'", "m3m'": "m-3m'", "m'3m'": "m'-3'm'", "m'3m": "m'-3'm" };
const appKey = (sym: string) => KEYMAP[sym] ?? sym;

// ---------- transforms ----------
const Rz = (deg: number) => {
  const a = (deg * Math.PI) / 180,
    c = Math.cos(a),
    s = Math.sin(a);
  return [
    [c, -s, 0],
    [s, c, 0],
    [0, 0, 1],
  ];
};
const P_zx = [
  [0, 0, 1],
  [0, 1, 0],
  [-1, 0, 0],
];
const P_zy = [
  [1, 0, 0],
  [0, 0, -1],
  [0, 1, 0],
];
const SRC_TRANSFORM: Record<string, number[][]> = {
  m2m: P_zy,
  '2mm': P_zx,
  "2'm'm": P_zx,
  '-4m2': Rz(45),
  '-42m': Rz(45),
  "-4'm2'": Rz(45),
  '-62m': Rz(30),
  "-6'2m'": Rz(30),
};

const matVec27 = (R: number[][], v: Vec): Vec => {
  const o = new Array(27).fill(0);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      for (let k = 0; k < 3; k++) {
        const t = v[9 * i + 3 * j + k];
        if (Math.abs(t) < 1e-14) continue;
        for (let p = 0; p < 3; p++)
          for (let q = 0; q < 3; q++)
            for (let r = 0; r < 3; r++) {
              o[9 * p + 3 * q + r] += R[p][i] * R[q][j] * R[r][k] * t;
            }
      }
  return o;
};

// ---------- app projectors ----------
function projector(els: { R: number[][]; sgn: number }[]) {
  const apply = (v: Vec) => {
    const acc = new Array(27).fill(0);
    for (const e of els) {
      const w = matVec27(e.R, v);
      for (let i = 0; i < 27; i++) acc[i] += (e.sgn * w[i]) / els.length;
    }
    return acc;
  };
  // trace is only needed for cells printed as '-'; compute lazily so the 27 extra apply()
  // calls aren't paid for the (much more common) lettered cells.
  let cachedTrace: number | undefined;
  return {
    apply,
    get trace() {
      if (cachedTrace === undefined) {
        cachedTrace = 0;
        for (let i = 0; i < 27; i++) {
          const u = new Array(27).fill(0);
          u[i] = 1;
          cachedTrace += apply(u)[i];
        }
      }
      return cachedTrace;
    },
  };
}
const inImage = (P: { apply: (v: Vec) => Vec }, v: Vec) => {
  const w = P.apply(v);
  let d = 0,
    n = 0;
  for (let i = 0; i < 27; i++) {
    d += (w[i] - v[i]) ** 2;
    n += v[i] ** 2;
  }
  return Math.sqrt(d) < 1e-7 * Math.max(1, Math.sqrt(n));
};

// ---------- exceptions: the two documented Birss Table 7 book errors (scan-verified 2026-07-04) ----------
interface CellException {
  forceTransform?: number[][]; // override the expected transform for the PHYSICAL assertion
  documentedPrintOmission?: boolean; // this cell's bracket-vs-rule deviation is a known book error, not a new finding
  reason: string;
}
const EXCEPTIONS: Partial<Record<string, Partial<Record<CellCol, CellException>>>> = {
  "-6'2m'": {
    i_pol: {
      documentedPrintOmission: true,
      reason:
        'Book omission (scan-verified 2026-07-04): i-cells R_m, R_n printed unparenthesized here, ' +
        "though column 2 is bracketed and R is frame-sensitive -- the orthorhombic (2'm'm) and " +
        "tetragonal (-4'm2') analogues DO bracket their i-cells. Physical form is unaffected: " +
        'forced correct by the bracketed column 2 regardless.',
    },
  },
  "-6m'2'": {
    c_pol: {
      forceTransform: Rz(30),
      reason:
        'Book error (scan-verified 2026-07-04): A printed -6m2 and c-cells R_m, R_n printed ' +
        "unparenthesized, contradicting the row's own Table-6 generator sigma'(4) = m'_y " +
        '(scan-verified), which forces A to the rotated (-62m) setting and ED-c to the ' +
        'yyy-family (rotated R3). The app is verified correct here; this override reflects the ' +
        'forced physics, not the printed (misprinted) bracket state.',
    },
  },
};

function buildProjectors(key: string) {
  const gens = GENERATORS[key];
  if (!gens) throw new Error(`no GENERATORS entry for "${key}"`);
  const els = getFullGroup(gens, key).map((m: Matrix3x3) => ({ R: m.m, a: !!m.isAntiUnitary, d: det(m) }));
  return {
    i_pol: projector(els.map((e) => ({ R: e.R, sgn: 1 }))),
    i_ax: projector(els.map((e) => ({ R: e.R, sgn: e.d }))),
    c_pol: projector(els.map((e) => ({ R: e.R, sgn: e.a ? -1 : 1 }))),
    c_ax: projector(els.map((e) => ({ R: e.R, sgn: e.d * (e.a ? -1 : 1) }))),
  };
}

describe('Table 7 rank-3 audit (58 BW rows) -- structural parsing', () => {
  it('parses exactly 58 BW rows from table-7.md', () => {
    expect(ROWS.length).toBe(58);
  });
  it('parses exactly 21 Table-4e rows from table-4e.md', () => {
    expect(Object.keys(FORMS).length).toBe(21);
  });
  it('every row maps to a GENERATORS key that exists', () => {
    for (const row of ROWS) {
      const key = appKey(row.M);
      expect(GENERATORS[key], `no GENERATORS entry for "${key}" (row ${row.M})`).toBeDefined();
    }
  });
});

describe('Table 7 rank-3 audit (58 BW rows) -- physical assertions', () => {
  for (const row of ROWS) {
    it(`${row.M}: app tensors match Table 7 / Table 4e (rank 3)`, () => {
      const key = appKey(row.M);
      const proj = buildProjectors(key);
      const srcOf: Record<CellCol, { sym: string; br: boolean }> = {
        i_pol: { sym: row.M, br: row.Mbr },
        i_ax: { sym: row.M, br: row.Mbr },
        c_pol: { sym: row.A, br: row.Abr },
        c_ax: { sym: row.B, br: row.Bbr },
      };
      (['i_pol', 'i_ax', 'c_pol', 'c_ax'] as CellCol[]).forEach((col) => {
        const cell = row.cells[col];
        const P = proj[col];
        const exc = EXCEPTIONS[row.M]?.[col];
        if (cell.letter === null) {
          expect(Math.abs(P.trace), `${row.M} ${col}: printed '-' but app dim=${P.trace}`).toBeLessThan(1e-6);
          return;
        }
        const E = FORMS[cell.letter];
        const src = srcOf[col];
        const T = exc?.forceTransform ?? (src.br ? SRC_TRANSFORM[src.sym] : null);
        if (src.br && !exc?.forceTransform && !T) {
          throw new Error(`no transform for bracketed source "${src.sym}" (row ${row.M}, ${col})`);
        }
        const Eeff = T ? E.map((v) => matVec27(T, v)) : E;
        const okEff = Eeff.every((v) => inImage(P, v));
        expect(
          okEff,
          `${row.M} ${col}: expected letter ${cell.letter}${src.br ? '(bracketed source)' : ''} ` +
            `does not fit the app's projected space${exc ? ` [exception applied: ${exc.reason}]` : ''}`,
        ).toBe(true);
      });
    });
  }
});

describe('Table 7 rank-3 audit (58 BW rows) -- print-pattern exceptions', () => {
  // Secondary, non-physical check: cell bracket == (source bracketed AND letter frame-sensitive
  // under the source transform). Verified against all 58 rows: exactly the two documented book
  // errors above deviate from this rule. Anything else deviating would be a NEW finding.
  function sameSpan(Ea: Vec[], Eb: Vec[]): boolean {
    const fit = (basis: Vec[], v: Vec) => {
      let r = v.slice();
      const ortho: Vec[] = [];
      for (const b of basis) {
        let u = b.slice();
        for (const o of ortho) {
          const d = u.reduce((s, x, i) => s + x * o[i], 0);
          u = u.map((x, i) => x - d * o[i]);
        }
        const n = Math.sqrt(u.reduce((s, x) => s + x * x, 0));
        if (n > 1e-10) ortho.push(u.map((x) => x / n));
      }
      for (const o of ortho) {
        const d = r.reduce((s, x, i) => s + x * o[i], 0);
        r = r.map((x, i) => x - d * o[i]);
      }
      return Math.sqrt(r.reduce((s, x) => s + x * x, 0)) < 1e-8;
    };
    return Ea.every((v) => fit(Eb, v)) && Eb.every((v) => fit(Ea, v));
  }

  const deviations: string[] = [];
  for (const row of ROWS) {
    const srcOf: Record<CellCol, { sym: string; br: boolean }> = {
      i_pol: { sym: row.M, br: row.Mbr },
      i_ax: { sym: row.M, br: row.Mbr },
      c_pol: { sym: row.A, br: row.Abr },
      c_ax: { sym: row.B, br: row.Bbr },
    };
    (['i_pol', 'i_ax', 'c_pol', 'c_ax'] as CellCol[]).forEach((col) => {
      const cell = row.cells[col];
      if (cell.letter === null) return;
      const src = srcOf[col];
      const T = src.br ? SRC_TRANSFORM[src.sym] : null;
      const E = FORMS[cell.letter];
      const shouldBr =
        src.br &&
        !!T &&
        !sameSpan(
          E,
          E.map((v) => matVec27(T, v)),
        );
      if (cell.br !== shouldBr) {
        deviations.push(`${row.M} ${col}`);
      }
    });
  }

  it('has exactly the one documented print-pattern deviation, and no others', () => {
    // -6m'2' has no print-pattern deviation by this rule: both the printed cell and A are
    // unbracketed, so they're naively "consistent" with each other even though physically
    // wrong (that row's issue is a physical exception, not a print-pattern one -- see the
    // physical-assertions suite above and EXCEPTIONS["-6m'2'"].c_pol).
    const expected = ["-6'2m' i_pol"];
    expect(deviations.slice().sort()).toEqual(expected);
  });
});
