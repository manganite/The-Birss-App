import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { GENERATORS, getCachedFullGroup } from '../services/symmetryGroups';
import { POINT_GROUPS } from './pointGroups';
import { POLAR_DIRECTIONS, type PolarDirectionRow } from './polarDirections';
import { CRYSTAL_SYSTEMS } from './crystalSystems';

/**
 * Two guards for the ITC-derived data modules (anti-circular: the vendored ITC files are the print
 * anchor; these tests only pin the TS modules to them):
 *
 *  A. DRIFT -- re-parse `docs/references/ITC-table-3.2.2.2-polar-axes.md` and
 *     `ITC-table-2.1.1.1-crystal-systems.md` and assert `polarDirections.ts` / `crystalSystems.ts`
 *     match, in the app's conventions. For 622 the module must equal the PRINTED sets PLUS exactly
 *     the restored `[uv0]` primary set (with `printOmission` set) -- the test fails if someone later
 *     "fixes" the module to as-printed or drops the footnote.
 *
 *  B. OPS CONSISTENCY -- closes the gap the drift test cannot (a wrong ITC-row choice for the three
 *     30 deg-divergent trigonal classes). For all 21 classes, derive the polar predicate directly
 *     from the app's own operators (a direction d is polar iff no operation g sends d to -d) and
 *     assert it against the encoded module. This proves the App-frame <-> ITC-row mapping
 *     (`32`->312, `3m`->31m, `-6m2`->-62m) machine-wise, not just by argument.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ref = (name: string) => readFileSync(path.resolve(__dirname, '../../docs/references', name), 'utf8');

// ---------------------------------------------------------------------------------------------
// Parse ITC Table 3.2.2.2 into a map keyed by `${systemContext}||${class}`.
// ---------------------------------------------------------------------------------------------
interface ItcRow {
  polar: string[];
  nonpolar: string[][];
}

function parse3222(): Map<string, ItcRow> {
  const out = new Map<string, ItcRow>();
  let system = '';
  for (const line of ref('ITC-table-3.2.2.2-polar-axes.md').split('\n')) {
    if (!line.startsWith('|')) continue;
    const f = line.split('|').map((c) => c.trim());
    if (f.length < 5) continue;
    if (f[1] === 'System' || /^:?-+:?$/.test(f[1])) continue; // header / separator
    if (f[1]) system = f[1];
    const klass = f[2];
    if (!klass) continue;
    const stripFootnote = (s: string) => s.replace(/\s*\([a-z]\)\s*$/, '').trim();
    const polarCell = stripFootnote(f[3]);
    const polar =
      polarCell === 'None'
        ? []
        : /^\[/.test(polarCell)
          ? polarCell.split(',').map((s) => s.trim()) // direction list
          : [polarCell]; // descriptive phrase (cubic 23/-43m)
    const nonpolarCell = stripFootnote(f[4]);
    const nonpolar =
      nonpolarCell === 'None'
        ? []
        : nonpolarCell.split(';').map((setStr) => setStr.trim().split(/\s+/).filter(Boolean));
    out.set(`${system}||${klass}`, { polar, nonpolar });
  }
  return out;
}
const ITC = parse3222();

// App classical key -> the ITC 3.2.2.2 (systemContext, class) it is read from. Monoclinic uses the
// unique-c rows; trigonal uses hexagonal-axes rows; the three 30 deg-divergent classes are remapped.
const ITC_ROW: Record<string, string> = {
  '1': 'Triclinic||1',
  '2': 'Monoclinic, unique c||2',
  m: 'Monoclinic, unique c||m',
  '222': 'Orthorhombic||222',
  mm2: 'Orthorhombic||mm2',
  '4': 'Tetragonal||4',
  '-4': 'Tetragonal||-4',
  '422': 'Tetragonal||422',
  '4mm': 'Tetragonal||4mm',
  '-42m': 'Tetragonal||-42m',
  '3': 'Trigonal (hexagonal axes)||3',
  '32': 'Trigonal (hexagonal axes)||312', // 30 deg divergence
  '3m': 'Trigonal (hexagonal axes)||31m', // 30 deg divergence
  '6': 'Hexagonal||6',
  '-6': 'Hexagonal||-6',
  '622': 'Hexagonal||622',
  '6mm': 'Hexagonal||6mm',
  '-6m2': 'Hexagonal||-62m', // 30 deg divergence
  '23': 'Cubic||23',
  '432': 'Cubic||432',
  '-43m': 'Cubic||-43m',
};

const flatNonpolar = (row: PolarDirectionRow) => row.nonpolar.flatMap((s) => s.directions);

describe('polarDirections.ts drift vs ITC Table 3.2.2.2', () => {
  it('covers exactly the 21 noncentrosymmetric classical keys', () => {
    expect(Object.keys(POLAR_DIRECTIONS).sort()).toEqual(Object.keys(ITC_ROW).sort());
  });

  for (const key of Object.keys(ITC_ROW)) {
    it(`${key}: polar axes + nonpolar sets match the ITC row ${ITC_ROW[key]}`, () => {
      const itc = ITC.get(ITC_ROW[key]);
      expect(itc, `ITC row ${ITC_ROW[key]} not found`).toBeDefined();
      const mod = POLAR_DIRECTIONS[key];

      // polar axes: printed phrase for cubic 23/-43m, direction lists otherwise
      expect(mod.polarAxes).toEqual(itc!.polar);

      if (key === '622') {
        // 622: module == printed PLUS the restored [uv0] primary set; footnote present.
        const printed = itc!.nonpolar.flat();
        expect(printed).not.toContain('[uv0]'); // the documented omission
        expect(flatNonpolar(mod)).toEqual(['[uv0]', ...printed]); // exactly [uv0] restored
        expect(mod.printOmission, '622 must carry the print-omission footnote').toBeTruthy();
      } else {
        // grouping (per set) must match, direction-for-direction
        expect(mod.nonpolar.map((s) => s.directions)).toEqual(itc!.nonpolar);
        expect(mod.printOmission).toBeUndefined();
      }
    });
  }

  it('flags exactly the three 30 deg-divergent classes', () => {
    const flagged = Object.entries(POLAR_DIRECTIONS)
      .filter(([, r]) => r.frameDivergent)
      .map(([k]) => k)
      .sort();
    expect(flagged).toEqual(['-6m2', '32', '3m']);
  });
});

// ---------------------------------------------------------------------------------------------
// Parse ITC Table 2.1.1.1 (free parameters + Bravais lattices per crystal system, app rows).
// ---------------------------------------------------------------------------------------------
const GREEK: Record<string, string> = { alpha: 'α', beta: 'β', gamma: 'γ' };
const normParam = (s: string) => GREEK[s] ?? s;
const dropParens = (s: string) => s.replace(/\([^)]*\)/g, ' ');

function parse2111(): Record<string, { freeParams: string[]; bravais: string[] }> {
  const rows: { system: string; restrictions: string; params: string; bravais: string }[] = [];
  let system = '';
  for (const line of ref('ITC-table-2.1.1.1-crystal-systems.md').split('\n')) {
    if (!line.startsWith('|')) continue;
    const f = line.split('|').map((c) => c.trim());
    if (f.length < 9) continue;
    if (f[1] === 'Crystal family' || /^:?-+:?$/.test(f[1])) continue;
    if (f[3]) system = f[3];
    rows.push({ system, restrictions: f[6], params: f[7], bravais: f[8] });
  }
  const parseRow = (r: { params: string; bravais: string }) => ({
    freeParams: dropParens(r.params)
      .split(',')
      .map((s) => normParam(s.trim()))
      .filter(Boolean),
    bravais: dropParens(r.bravais)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  });
  const bySystem: Record<string, { freeParams: string[]; bravais: string[] }> = {};
  for (const r of rows) {
    // App-relevant row per system: monoclinic c-unique; trigonal hexagonal-axes (hP, params a,c).
    if (r.system === 'Monoclinic' && !/c-unique/.test(r.restrictions)) continue;
    if (r.system === 'Trigonal' && !/hP/.test(r.bravais)) continue;
    if (!bySystem[r.system]) bySystem[r.system] = parseRow(r);
  }
  return bySystem;
}
const ITC2111 = parse2111();

describe('crystalSystems.ts drift vs ITC Table 2.1.1.1', () => {
  it('covers the 7 crystal systems', () => {
    expect(Object.keys(CRYSTAL_SYSTEMS).sort()).toEqual([
      'Cubic',
      'Hexagonal',
      'Monoclinic',
      'Orthorhombic',
      'Tetragonal',
      'Triclinic',
      'Trigonal',
    ]);
  });
  for (const system of Object.keys(CRYSTAL_SYSTEMS)) {
    it(`${system}: free parameters and Bravais lattices match the reference`, () => {
      const itc = ITC2111[system];
      expect(itc, `no parsed 2.1.1.1 row for ${system}`).toBeDefined();
      expect(CRYSTAL_SYSTEMS[system].freeParams).toEqual(itc!.freeParams);
      expect(CRYSTAL_SYSTEMS[system].bravais).toEqual(itc!.bravais);
    });
  }
});

// ---------------------------------------------------------------------------------------------
// OPS-CONSISTENCY: derive the polar predicate from the app's own operators and assert vs the module.
// ---------------------------------------------------------------------------------------------

/** Parse an ITC direction index string (brackets stripped) into 3 linear-in-(u,v,w) index coeffs.
 * Coefficients are single-digit; a `0` index is always the constant 0 (never `0*var`). */
function parseIndices(s: string): { u: number; v: number; w: number; c: number }[] {
  const toks: { u: number; v: number; w: number; c: number }[] = [];
  let i = 0;
  while (i < s.length && toks.length < 3) {
    let sign = 1;
    if (s[i] === '-') {
      sign = -1;
      i++;
    }
    let coeff = 1,
      cst = 0,
      isConst = false;
    if (/[0-9]/.test(s[i])) {
      const d = Number(s[i]);
      i++;
      if (d !== 0 && i < s.length && /[uvw]/.test(s[i])) {
        coeff = d;
      } else {
        cst = d;
        isConst = true;
      }
    }
    const t = { u: 0, v: 0, w: 0, c: 0 };
    if (!isConst && i < s.length && /[uvw]/.test(s[i])) {
      t[s[i] as 'u' | 'v' | 'w'] = sign * coeff;
      i++;
    } else {
      t.c = sign * cst;
    }
    toks.push(t);
  }
  if (toks.length !== 3) throw new Error(`parseIndices: "${s}" did not yield 3 indices`);
  return toks;
}

/** Instantiate a direction string (e.g. "[u2uw]" or "[1-10]") to a hex/crystal index triple, using
 * generic (u,v,w) for families. */
function toIndexTriple(dir: string, U = 3, V = 1, W = 2): [number, number, number] {
  const inner = dir.replace(/[[\]]/g, '');
  const t = parseIndices(inner);
  return t.map((x) => x.u * U + x.v * V + x.w * W + x.c) as [number, number, number];
}

const SQRT3_2 = Math.sqrt(3) / 2;
/** Crystallographic index triple -> Cartesian direction. Hexagonal/trigonal uses a1||x, a2 at 120 deg,
 * c||z (c/a is irrelevant to every polar test here). Other systems use orthonormal axes. */
function toCartesian(system: string, [u, v, w]: [number, number, number]): [number, number, number] {
  if (system === 'Trigonal' || system === 'Hexagonal') return [u - v / 2, v * SQRT3_2, w];
  return [u, v, w];
}

const applyMat = (m: number[][], d: number[]): number[] =>
  [0, 1, 2].map((i) => m[i][0] * d[0] + m[i][1] * d[1] + m[i][2] * d[2]);

/** A direction is polar iff no group operation sends it to its negative. */
function isPolarByOps(ops: { m: number[][] }[], d: number[]): boolean {
  for (const g of ops) {
    const gd = applyMat(g.m, d);
    if (gd.every((x, i) => Math.abs(x + d[i]) < 1e-9)) return false;
  }
  return true;
}

describe('OPS consistency: module polarity == app operators (all 21 classes)', () => {
  // sanity-check the index tokenizer on the trickiest patterns
  it('parseIndices handles compact ITC patterns', () => {
    expect(toIndexTriple('[u2uw]', 1, 0, 3)).toEqual([1, 2, 3]);
    expect(toIndexTriple('[-u0w]', 1, 0, 3)).toEqual([-1, 0, 3]);
    expect(toIndexTriple('[0-vw]', 0, 1, 3)).toEqual([0, -1, 3]);
    expect(toIndexTriple('[-2-10]')).toEqual([-2, -1, 0]);
    expect(toIndexTriple('[1-10]')).toEqual([1, -1, 0]);
  });

  for (const key of Object.keys(POLAR_DIRECTIONS)) {
    it(`${key}: every polar axis is polar and every nonpolar direction is nonpolar (by ops)`, () => {
      const system = POINT_GROUPS.find((g) => g.name === key)!.crystalSystem;
      const ops = getCachedFullGroup(key, GENERATORS[key]);
      const mod = POLAR_DIRECTIONS[key];
      const cart = (dir: string) => toCartesian(system, toIndexTriple(dir));

      // polar axes: use explicit dirs for the cubic descriptive phrase
      const polarDirs = mod.polarAxisDirs ?? (mod.allDirectionsNote ? [] : mod.polarAxes);
      for (const dir of polarDirs) {
        expect(isPolarByOps(ops, cart(dir)), `${key}: polar axis ${dir} should be polar by ops`).toBe(true);
      }
      // nonpolar directions (a generic representative of each family)
      for (const set of mod.nonpolar) {
        for (const dir of set.directions) {
          expect(isPolarByOps(ops, cart(dir)), `${key}: nonpolar ${dir} should be nonpolar by ops`).toBe(false);
        }
      }
    });
  }
});
