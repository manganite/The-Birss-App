import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { GENERATORS, ALTERNATE_SETTINGS } from './symmetryGroups';
import { computeTensorForm, type TensorSpec } from './tensorForms';
import { calculateTensorComponents } from './tensorCalculator';
import { isPolar, isFerromagnetic, isMagnetoelectric, isChiral } from './propertyFlags';
import { POINT_GROUPS } from '../data/pointGroups';
import {
  tableRows,
  stripBackticks,
  sliceBetween,
  canon,
  engineFamilies,
  familySetsMatch,
  type FCell,
} from './testUtils/birssTableParsers';

/**
 * Part B anchors for the generalized tensor-form engine (`computeTensorForm`).
 *
 * These bind the engine against artefacts that are ALREADY independently verified: the
 * print-anchored property flags (ITC 1.5.2.4 / Schmid), the ITC 1.5.8.1 magnetoelectric table
 * (parsed at test time), and the app's own book-verified ED/MD/EQ golden paths. Nothing here takes
 * an expected value from `computeTensorForm` itself (anti-circular).
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ref = (name: string) => readFileSync(path.resolve(__dirname, '../../docs/references', name), 'utf-8');
const NOMENCLATURE = readFileSync(path.resolve(__dirname, '../../birss-tables/table-nomenclature.md'), 'utf-8');

const ALL = POINT_GROUPS.map((g) => g.name);
const typeOf = (name: string) => POINT_GROUPS.find((p) => p.name === name)!.type;
const isZeroForm = (name: string, setting: number, spec: TensorSpec) => computeTensorForm(name, setting, spec)!.isZero;

// =====================================================================================
// Part B.3 -- internal consistency: the engine reproduces the app's own ED/MD/EQ paths.
// {rank, parity, timeParity, intrinsic:'jk'} must equal calculateTensorComponents exactly.
// =====================================================================================
describe('B.3 internal consistency -- jk-symmetric forms reproduce ED/MD/EQ', () => {
  const zeroSentinel = ['All components are zero.'];
  const relsOf = (name: string, spec: TensorSpec) => {
    const f = computeTensorForm(name, 1, spec)!;
    return f.isZero ? zeroSentinel : f.relations;
  };

  it('{3,polar,i,jk} == ED i-type for all 122 groups', () => {
    for (const g of ALL) {
      expect(relsOf(g, { rank: 3, parity: 'polar', timeParity: 'i', intrinsic: 'jk' }), g).toEqual(
        calculateTensorComponents(g, 'ED', 'i', 1),
      );
    }
  }, 30000);
  it('{3,axial,c,jk} == MD c-type for all 122 groups', () => {
    for (const g of ALL) {
      expect(relsOf(g, { rank: 3, parity: 'axial', timeParity: 'c', intrinsic: 'jk' }), g).toEqual(
        calculateTensorComponents(g, 'MD', 'c', 1),
      );
    }
  }, 30000);
  it('{4,polar,i,jk} == EQ i-type (representative groups spanning all systems/types)', () => {
    // Rank-4 projection (dim 81) is heavy; rank-3 all-122 above already proves the algorithm
    // equivalence, so rank-4 is a representative spread rather than all 122.
    // Higher-symmetry groups (few independent rank-4 components -> fast and timeout-stable under
    // full-suite parallel load); the low-symmetry general case is covered by the rank-3 all-122
    // check above, which shares the exact basis-reduction code path.
    const sample = [
      'mm2',
      '222',
      '-42m',
      '422',
      '32',
      '3m',
      '-6m2',
      '622',
      '23',
      '432',
      'm-3m',
      "-3'm'",
      "m'-3'm'",
    ].filter((g) => GENERATORS[g]);
    for (const g of sample) {
      expect(relsOf(g, { rank: 4, parity: 'polar', timeParity: 'i', intrinsic: 'jk' }), g).toEqual(
        calculateTensorComponents(g, 'EQ', 'i', 1),
      );
    }
  }, 60000);
  it('reproduces ED/MD/EQ in alternate settings too (spot-check dual-setting groups)', () => {
    const dual = Object.keys(ALTERNATE_SETTINGS).filter((k) => GENERATORS[k]);
    for (const g of dual) {
      for (let s = 1; s <= ALTERNATE_SETTINGS[g].length + 1; s++) {
        const f = computeTensorForm(g, s, { rank: 3, parity: 'polar', timeParity: 'i', intrinsic: 'jk' })!;
        const rels = f.isZero ? zeroSentinel : f.relations;
        expect(rels, `${g} setting ${s}`).toEqual(calculateTensorComponents(g, 'ED', 'i', s));
      }
    }
  }, 30000);
});

// =====================================================================================
// Part B.1 -- rank-1 consistency against the print-anchored property flags.
// =====================================================================================
describe('B.1 rank-1 forms match the property flags (all 122 groups)', () => {
  it('{1,polar,i} nonzero  <=>  isPolar', () => {
    for (const g of ALL) {
      expect(!isZeroForm(g, 1, { rank: 1, parity: 'polar', timeParity: 'i', intrinsic: 'none' }), g).toBe(isPolar(g));
    }
  });
  it('{1,axial,c} nonzero  <=>  isFerromagnetic', () => {
    for (const g of ALL) {
      expect(!isZeroForm(g, 1, { rank: 1, parity: 'axial', timeParity: 'c', intrinsic: 'none' }), g).toBe(
        isFerromagnetic(g),
      );
    }
  });
});

// =====================================================================================
// Part B.0 -- the four rank-0 scalar kinds (all 122 groups).
// =====================================================================================
describe('B.0 rank-0 scalar kinds (all 122 groups)', () => {
  const allowed = (g: string, spec: TensorSpec) => !isZeroForm(g, 1, spec);

  it('{0,polar,i} (trivial scalar) allowed everywhere', () => {
    for (const g of ALL) {
      expect(allowed(g, { rank: 0, parity: 'polar', timeParity: 'i', intrinsic: 'none' }), g).toBe(true);
    }
  });
  it('{0,axial,i} (pseudoscalar) allowed  <=>  isChiral', () => {
    for (const g of ALL) {
      expect(allowed(g, { rank: 0, parity: 'axial', timeParity: 'i', intrinsic: 'none' }), g).toBe(isChiral(g));
    }
  });
  it('{0,polar,c} (time-odd scalar) allowed  <=>  Type I (no primed operation)', () => {
    for (const g of ALL) {
      expect(allowed(g, { rank: 0, parity: 'polar', timeParity: 'c', intrinsic: 'none' }), g).toBe(typeOf(g) === 'I');
    }
  });
  it("{0,axial,c} (ME monopole) allowed  <=>  the group's ITC 1.5.8.1 block has nonzero trace", () => {
    // Derive the monopole set from the parsed 1.5.8.1 matrix forms (trace not identically zero),
    // not a hardcoded block list -- anti-circular against the vendored table.
    expect(monopoleAllowedSet.size).toBeGreaterThan(0);
    for (const g of ALL) {
      expect(allowed(g, { rank: 0, parity: 'axial', timeParity: 'c', intrinsic: 'none' }), g).toBe(
        monopoleAllowedSet.has(g),
      );
    }
  });
});

// =====================================================================================
// Part B.2 -- rank-2 axial c-tensor reproduces ITC Table 1.5.8.1 (the linear ME tensor).
// =====================================================================================

// Schoenflies -> app key, via table-nomenclature (Tables A + C); ITC S6 == app/Birss C3i.
const schToKey: Record<string, string> = {};
for (const cells of [
  ...tableRows(sliceBetween(NOMENCLATURE, '## Table A', '## Table B')),
  ...tableRows(sliceBetween(NOMENCLATURE, '## Table C', '## Changelog')),
]) {
  if (cells[1] === 'Schoenflies') continue;
  const sch = cells[1].replace(/<\/?sub>/g, '').replace(/<\/?sup>/g, '');
  schToKey[sch] = stripBackticks(cells[2]);
}

const ME = ref('ITC-table-1.5.8.1-magnetoelectric-groups.md');

// group app-key -> block id (F1..F11)
const groupBlock: Record<string, string> = {};
for (const cells of tableRows(sliceBetween(ME, '## Group list', '## Matrix forms'))) {
  if (!/^F\d+$/.test(cells[0])) continue;
  const sch = cells[1].replace(/S6/g, 'C3i');
  const key = schToKey[sch];
  if (key) groupBlock[key] = cells[0];
}

// block id -> 9 row-major tokens (e.g. 'a11','0','-a12',...)
const blockTokens: Record<string, string[]> = {};
{
  const formSec = ME.split('## Matrix forms')[1];
  const re = /^-\s*(F\d+):\s*(\[\[.*?\]\])/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(formSec)) !== null) {
    blockTokens[m[1]] = m[2].replace(/[[\]\s]/g, '').split(',');
  }
  // F1 is described in prose ("all nine components independent"), not as a matrix literal.
  if (!blockTokens['F1']) {
    blockTokens['F1'] = ['a11', 'a12', 'a13', 'a21', 'a22', 'a23', 'a31', 'a32', 'a33'];
  }
}

// The ME-monopole (rank-0 axial-c) set: groups whose block's diagonal (trace) is not identically 0.
const monopoleAllowedSet = new Set<string>();
{
  const traceNonzero = (tokens: string[]): boolean => {
    const coeff = new Map<string, number>();
    for (const k of [0, 4, 8]) {
      const t = tokens[k];
      if (t === '0') continue;
      const sign = t.startsWith('-') ? -1 : 1;
      const sym = t.replace('-', '');
      coeff.set(sym, (coeff.get(sym) ?? 0) + sign);
    }
    return [...coeff.values()].some((v) => Math.abs(v) > 0);
  };
  for (const [key, block] of Object.entries(groupBlock)) {
    if (traceNonzero(blockTokens[block])) monopoleAllowedSet.add(key);
  }
}

// ---- family canonicalization: shared FCell helpers from birssTableParsers. For these 3x3
// magnetoelectric cells, index = 3*row + col preserves the (row, col) lexicographic order the
// previous local Cell version sorted by; the reference-value normalization, the familiesEqual
// 1e-4 tolerance, and the EPSILON extraction threshold (same import from symmetryGroups) are
// identical, so the comparison semantics are unchanged. ----
function itcFamilies(tokens: string[]): FCell[][] {
  const bySym = new Map<string, FCell[]>();
  for (let k = 0; k < 9; k++) {
    const t = tokens[k];
    if (t === '0') continue;
    const sign = t.startsWith('-') ? -1 : 1;
    const sym = t.replace('-', '');
    if (!bySym.has(sym)) bySym.set(sym, []);
    bySym.get(sym)!.push({ index: k, val: sign });
  }
  return [...bySym.values()].map(canon);
}

const ME_SPEC: TensorSpec = { rank: 2, parity: 'axial', timeParity: 'c', intrinsic: 'none' };
function settingsToTry(group: string): number[] {
  return ALTERNATE_SETTINGS[group] ? [1, 2] : [1];
}
function matchesITC(group: string, block: string): number[] {
  const itc = itcFamilies(blockTokens[block]);
  const hits: number[] = [];
  for (const s of settingsToTry(group)) {
    const form = computeTensorForm(group, s, ME_SPEC);
    if (!form || form.isZero) continue;
    if (familySetsMatch(itc, engineFamilies(form.basisResults))) hits.push(s);
  }
  return hits;
}

describe('B.2 rank-2 axial c-tensor == ITC Table 1.5.8.1 (linear magnetoelectric)', () => {
  it('maps exactly 58 ME groups to app keys, all present in GENERATORS', () => {
    expect(Object.keys(groupBlock).length).toBe(58);
    for (const k of Object.keys(groupBlock)) expect(GENERATORS[k], k).toBeDefined();
  });

  it('parses all 11 form blocks F1..F11', () => {
    for (let i = 1; i <= 11; i++) expect(blockTokens[`F${i}`], `F${i}`).toHaveLength(9);
  });

  it('vanishes for exactly the 64 non-ME groups (engine <=> isMagnetoelectric)', () => {
    for (const g of ALL) {
      expect(isZeroForm(g, 1, ME_SPEC), g).toBe(!isMagnetoelectric(g));
    }
  }, 30000);

  for (const [group, block] of Object.entries(groupBlock)) {
    it(`${group} (block ${block}): rank-2 axial-c form matches ITC in at least one setting`, () => {
      expect(
        matchesITC(group, block).length,
        `${group} (block ${block}) matched NEITHER setting -- genuine discrepancy, do not relax`,
      ).toBeGreaterThan(0);
    });
  }
});
