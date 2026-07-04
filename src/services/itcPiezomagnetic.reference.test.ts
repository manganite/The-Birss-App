import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { GENERATORS, ALTERNATE_SETTINGS } from './symmetryGroups';
import { calculateTensorBasisResults, getIndices } from './tensorProjection';

/**
 * Independent second-source anchor for the app's MD-c tensor class (axial rank-3,
 * jk-symmetric, time-odd -- the piezomagnetic tensor Lambda_ijk), cross-validated
 * against International Tables for Crystallography Vol. D, Table 1.5.7.1 (p. 135).
 * This is ITC data, not Birss -- see docs/references/ITC-table-1.5.7.1-piezomagnetic.md
 * for the transcription, its verification status, and per-block provenance notes.
 *
 * Voigt-shape conversion. ITC prints Lambda in 3x6 Voigt form (row = free index i,
 * col = stress pair alpha = 1..6 -> xx,yy,zz,yz,zx,xy). The app's calculateTensorBasisResults
 * returns raw (unsymmetrized-count) rank-3 coefficients. Converting the app's raw
 * coefficient into the *same* Voigt shape ITC uses requires the standard rank-3
 * "vector <- symmetric matrix" contraction identity: M_i = sum_jk Lambda_ijk T_jk must equal
 * sum_alpha Lambda_i,alpha T_alpha, and since off-diagonal T_jk (j!=k) is counted twice in the
 * jk sum but once in the Voigt sum, Lambda_i,alpha = 2*Lambda_ijk for alpha in {4,5,6}. This
 * doubling is applied here to the app's raw value before comparison -- it is not a fudge
 * against ITC, it is the definitional Voigt contraction the work order's own "convert to Voigt
 * form" step requires. Two facts support this being a real convention and not a cherry-picked
 * fit: (1) it is a single global rule applied uniformly to all 16 ITC blocks, and (2) the
 * zero/nonzero cell pattern -- the strongest structural signal -- matches with NO correction
 * at all; the factor of 2 only rescales magnitudes on the shear columns (4,5,6), it never moves
 * a zero. Cross-validated independently: the ITC-derived, raw-converted family for group `32`
 * setting 2 is byte-identical to the pre-existing, book-verified `32` ED-i golden fixture
 * (`goldenTensors.fixtures.ts`, Birss Table 4a) -- ITC/app/Birss triple agreement.
 *
 * Frame correspondence is computed, not assumed: ITC's position-2 = x-axis; Birss/app default
 * setting's position-2 = y-axis. For groups with only a single 3-fold (not 6-fold) this is a
 * genuine 30-degree frame rotation, so those groups are expected to match the app's *alternate*
 * setting, not its default -- this is exactly what the per-entry results below show.
 *
 * Hard rule: a group/setting-pair matching NEITHER setting is a genuine discrepancy. This test
 * must fail loudly on such a case, never relax the comparison to force a pass.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REFERENCE_PATH = path.resolve(__dirname, '../../docs/references/ITC-table-1.5.7.1-piezomagnetic.md');
const content = readFileSync(REFERENCE_PATH, 'utf-8');

// ---------- parsing ----------

interface GroupKey {
  key: string;
  uncertain: boolean;
}

interface Entry {
  group: string;
  matrix: string[][];
  block: string;
  uncertain: boolean;
  /** Fixed setting for monoclinic main/z-unique split entries; null = try 1 (+2 if alternate exists). */
  expectedSetting: 1 | 2 | null;
}

function extractBlocks(): { num: string; body: string }[] {
  const blockRe = /^## Block (\d+) -- (.+)$/gm;
  const starts = [...content.matchAll(blockRe)];
  const blocks: { num: string; body: string }[] = [];
  for (let i = 0; i < starts.length; i++) {
    const start = starts[i].index!;
    const end = i + 1 < starts.length ? starts[i + 1].index! : content.indexOf('\n---\n', start);
    blocks.push({ num: starts[i][1], body: content.slice(start, end === -1 ? undefined : end) });
  }
  return blocks;
}

function extractGroupsText(body: string): string | null {
  const gIdx = body.indexOf('Groups:');
  if (gIdx === -1) return null;
  const fenceIdx = body.indexOf('```', gIdx);
  return body
    .slice(gIdx, fenceIdx === -1 ? undefined : fenceIdx)
    .replace(/^Groups:\s*/, '')
    .replace(/\n/g, ' ')
    .trim();
}

function extractGroupKeysFromEntry(entry: string): GroupKey[] {
  const uncertain = entry.includes('(?)');
  const spans = [...entry.matchAll(/`([^`]+)`/g)].map(m => m[1]);
  // "A = B" cross-reference entries (e.g. "`32` = `321`") list the same group twice; keep only the first span.
  const hasEquals = entry.includes(' = ');
  const chosenSpans = hasEquals ? [spans[0]] : spans;
  const keys: GroupKey[] = [];
  for (const span of chosenSpans) {
    const bracketMatch = span.match(/^(.*?)\s*\[([^\]]+)\]\s*$/);
    if (bracketMatch) {
      const primary = bracketMatch[1].trim();
      const altCandidates = bracketMatch[2].split(/[;,]/).map(s => s.trim());
      const candidates = [primary, ...altCandidates];
      // Resolve by GENERATORS membership, not bracket position: ITC's own primary-listed form
      // is not always an app key (see Block 5's `m'2m [2'm'm]`, documented in the reference file).
      const resolved = candidates.filter(c => GENERATORS[c]);
      const pick = resolved.includes(primary) ? primary : resolved[0];
      keys.push({ key: pick ?? primary, uncertain: uncertain || resolved.length === 0 });
    } else {
      keys.push({ key: span.trim(), uncertain });
    }
  }
  return keys;
}

function extractGroupKeysFromText(text: string): GroupKey[] {
  return text
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)
    .flatMap(extractGroupKeysFromEntry);
}

function extractMatrices(body: string): string[][][] {
  return [...body.matchAll(/```\n([\s\S]*?)\n```/g)].map(m =>
    m[1]
      .trim()
      .split('\n')
      .map(row => row.trim().split(/\s+/)),
  );
}

function buildEntries(): Entry[] {
  const entries: Entry[] = [];
  for (const b of extractBlocks()) {
    const matrices = extractMatrices(b.body);
    if (b.num === '2' || b.num === '3') {
      // Monoclinic blocks carry two matrices: ITC's main (b-unique = app setting 2) table,
      // and a z-unique (c-unique = app setting 1/default) matrix transcribed from running text.
      const forLineMatch = b.body.match(/for ((?:`[^`]+`,?\s*)+):/);
      const forKeys: GroupKey[] = forLineMatch
        ? [...forLineMatch[1].matchAll(/`([^`]+)`/g)].map(m => ({ key: m[1].replace(/^11\s*/, ''), uncertain: false }))
        : [];
      const mainText = extractGroupsText(b.body);
      const mainKeys = mainText ? extractGroupKeysFromText(mainText) : [];
      for (const k of mainKeys) entries.push({ group: k.key, matrix: matrices[0], block: `${b.num}-main`, uncertain: k.uncertain, expectedSetting: 2 });
      for (const k of forKeys) entries.push({ group: k.key, matrix: matrices[1], block: `${b.num}-zunique`, uncertain: k.uncertain, expectedSetting: 1 });
    } else {
      const text = extractGroupsText(b.body);
      const keys = text ? extractGroupKeysFromText(text) : [];
      for (const k of keys) entries.push({ group: k.key, matrix: matrices[0], block: b.num, uncertain: k.uncertain, expectedSetting: null });
    }
  }
  return entries;
}

// ---------- Voigt / family machinery ----------

interface Cell {
  row: number;
  col: number;
  val: number;
}

interface RatioCell {
  row: number;
  col: number;
  ratio: number;
}

const EPS = 1e-6;

/** Maps a jk index pair (0-based) to a 1-based Voigt stress column (1=xx,2=yy,3=zz,4=yz,5=zx,6=xy). */
function voigtIndex(b: number, c: number): number {
  if (b === c) return b + 1;
  const pair = [b, c].sort().join('');
  if (pair === '12') return 4; // yz
  if (pair === '02') return 5; // zx
  return 6; // '01' -> xy
}

function canonicalize(list: Cell[]): RatioCell[] {
  const sorted = [...list].sort((x, y) => x.row - y.row || x.col - y.col);
  const ref = sorted[0].val;
  return sorted.map(e => ({ row: e.row, col: e.col, ratio: e.val / ref }));
}

/** Converts one app basis vector (27 raw rank-3 coefficients) into a canonicalized Voigt family. */
function appFamilyFromBasis(vec: number[]): RatioCell[] {
  const cells = new Map<string, number>();
  for (let idx = 0; idx < vec.length; idx++) {
    if (Math.abs(vec[idx]) < EPS) continue;
    const [a, b, c] = getIndices(idx, 3);
    const row = a + 1;
    const col = voigtIndex(b, c);
    // Voigt-shape conversion (see file header comment): shear columns carry an implicit x2.
    const val = col >= 4 ? vec[idx] * 2 : vec[idx];
    cells.set(`${row},${col}`, val);
  }
  return canonicalize([...cells.entries()].map(([k, v]) => {
    const [row, col] = k.split(',').map(Number);
    return { row, col, val: v };
  }));
}

/** Parses one ITC matrix into its canonicalized L<ij>-symbol families (already in Voigt shape, no correction needed). */
function itcFamiliesFromMatrix(matrix: string[][]): RatioCell[][] {
  const bySymbol = new Map<string, Cell[]>();
  for (let row = 1; row <= 3; row++) {
    for (let col = 1; col <= 6; col++) {
      const cellStr = matrix[row - 1][col - 1];
      if (cellStr === '0') continue;
      const m = cellStr.match(/^(-?\d*)L(\d)(\d)$/);
      if (!m) throw new Error(`Unparsable ITC matrix cell: "${cellStr}"`);
      const coeff = m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1]);
      const symbol = `L${m[2]}${m[3]}`;
      if (!bySymbol.has(symbol)) bySymbol.set(symbol, []);
      bySymbol.get(symbol)!.push({ row, col, val: coeff });
    }
  }
  return [...bySymbol.values()].map(canonicalize);
}

function familiesEqual(f1: RatioCell[], f2: RatioCell[]): boolean {
  if (f1.length !== f2.length) return false;
  for (let i = 0; i < f1.length; i++) {
    if (f1[i].row !== f2[i].row || f1[i].col !== f2[i].col) return false;
    if (Math.abs(f1[i].ratio - f2[i].ratio) > 1e-4) return false;
  }
  return true;
}

function familySetsMatch(f1: RatioCell[][], f2: RatioCell[][]): boolean {
  return (
    f1.length === f2.length &&
    f1.every(a => f2.some(b => familiesEqual(a, b))) &&
    f2.every(b => f1.some(a => familiesEqual(a, b)))
  );
}

function settingsToTry(e: Entry): (1 | 2)[] {
  if (e.expectedSetting) return [e.expectedSetting];
  return ALTERNATE_SETTINGS[e.group] ? [1, 2] : [1];
}

/** Returns every setting (1 and/or 2) at which the app's MD-c projection matches this entry's ITC matrix. */
function matchedSettings(e: Entry): number[] {
  const itcFamilies = itcFamiliesFromMatrix(e.matrix);
  const matches: number[] = [];
  for (const s of settingsToTry(e)) {
    const result = calculateTensorBasisResults(e.group, 'MD', 'c', s);
    if (!result) continue;
    const appFamilies = result.basisResults.map(appFamilyFromBasis);
    if (familySetsMatch(itcFamilies, appFamilies)) matches.push(s);
  }
  return matches;
}

const ALL_ENTRIES = buildEntries();
const CERTAIN_ENTRIES = ALL_ENTRIES.filter(e => !e.uncertain);

describe('itcPiezomagnetic.reference — app MD-c projection matches ITC Table 1.5.7.1', () => {
  it('parses at least 70 certain group/setting entries across all 16 blocks', () => {
    expect(CERTAIN_ENTRIES.length).toBeGreaterThanOrEqual(70);
  });

  it('every parsed group key resolves against GENERATORS', () => {
    for (const e of ALL_ENTRIES) {
      expect(GENERATORS[e.group], `"${e.group}" (block ${e.block}) not found in GENERATORS`).toBeDefined();
    }
  });

  for (const e of CERTAIN_ENTRIES) {
    it(`${e.group} (block ${e.block}): app MD-c matches ITC in at least one setting`, () => {
      const matches = matchedSettings(e);
      expect(matches.length, `${e.group} (block ${e.block}) matched NEITHER setting 1 nor setting 2 -- genuine discrepancy, do not relax`).toBeGreaterThan(0);
    });
  }

  it("the five Block-15 (R_n) hexagonal groups match in the app's alternate setting (30° frame divergence)", () => {
    const rGroups = ["6'22'", "6'mm'", "-6'2m'", "-6'm2'", "6'/m'mm'"];
    for (const group of rGroups) {
      const entry = CERTAIN_ENTRIES.find(e => e.group === group && e.block === '15');
      expect(entry, `${group} not found in block 15`).toBeDefined();
      expect(matchedSettings(entry!)).toEqual([2]);
    }
  });

  it('monoclinic main (b-unique) entries match app setting 2, z-unique entries match app setting 1', () => {
    for (const e of CERTAIN_ENTRIES) {
      if (!e.expectedSetting) continue;
      expect(matchedSettings(e)).toEqual([e.expectedSetting]);
    }
  });
});
