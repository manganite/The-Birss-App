import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { GENERATORS, getCachedFullGroup } from '../services/symmetryGroups';
import { sigma, sigmaPrime, refClose, refSetsEqual, type RefMatrix3x3 } from '../services/birssGenerators.reference.fixtures';

/**
 * Steps 2-4 of BIRSS-APP-CONVENTIONS-REFERENCE.md: for every Default-setting group,
 * the app's closed operator set (GENERATORS -> getCachedFullGroup) must equal Birss
 * Table 6's, read from table-nomenclature.md Table B's sigma(N)/sigma'(N) generator
 * column (not the "Symmetry operators" text column, which uses compressed
 * multiplicity notation like `9(2)` for cubic groups). Comparison is at the matrix
 * level (birssGenerators.reference.fixtures.ts's independent pool + closure), not
 * formatted-string level, so a bug in the app's own display labeling
 * (formatMatrixSymbol) can't hide or fake a mismatch here. Grey groups (Table C)
 * have no sigma(N) column of their own; their reference generators are the parent's
 * sigma(N) list plus a pure time-reversal generator, per Step 4's rule
 * grey = parent ⊗ {1, 1'}.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REFERENCE_PATH = path.resolve(__dirname, '../../docs/references/table-nomenclature.md');
const content = readFileSync(REFERENCE_PATH, 'utf-8');

function stripBackticks(s: string): string {
  return s.replace(/^`|`$/g, '');
}

function extractSection(startHeading: string, endHeading?: string): string {
  const startIdx = content.indexOf(startHeading);
  if (startIdx === -1) throw new Error(`Heading not found in table-nomenclature.md: ${startHeading}`);
  const afterStart = content.slice(startIdx);
  if (!endHeading) return afterStart;
  const endIdx = afterStart.indexOf(endHeading);
  if (endIdx === -1) throw new Error(`End heading not found after ${startHeading}: ${endHeading}`);
  return afterStart.slice(0, endIdx);
}

function parseRows(section: string): string[][] {
  return section
    .split('\n')
    .filter(line => line.trim().startsWith('|'))
    .map(line => line.split('|').slice(1, -1).map(c => c.trim()))
    .filter(cells => !cells.every(c => /^:?-+:?$/.test(c)));
}

function extractSigmaIndices(s: string): number[] {
  return [...s.matchAll(/\((\d)\)/g)].map(m => Number(m[1]));
}

interface GeneratorSpec {
  unitaryIdx: number[];
  antiunitaryIdx: number[];
}

function parseGeneratorCell(cell: string): GeneratorSpec {
  const parts = cell.split('/');
  return {
    unitaryIdx: extractSigmaIndices(parts[0] ?? ''),
    antiunitaryIdx: parts[1] ? extractSigmaIndices(parts[1]) : [],
  };
}

function toReferenceGenerators(spec: GeneratorSpec): RefMatrix3x3[] {
  return [...spec.unitaryIdx.map(sigma), ...spec.antiunitaryIdx.map(sigmaPrime)];
}

// --- Table B: 90 non-grey groups, key -> generator spec ---
const tableBRows = parseRows(extractSection('## Table B', '## Table C'));
const tableBHeader = tableBRows[0];
const EXPECTED_TABLE_B_HEADER = ['Schoenflies', 'App key', 'Symmetry operators', "σ(N) / σ'(N)"];
if (JSON.stringify(tableBHeader) !== JSON.stringify(EXPECTED_TABLE_B_HEADER)) {
  throw new Error(`Table B header changed shape, parser needs updating.\nExpected: ${JSON.stringify(EXPECTED_TABLE_B_HEADER)}\nActual:   ${JSON.stringify(tableBHeader)}`);
}
const TABLE_B = new Map<string, GeneratorSpec>();
for (const cells of tableBRows.slice(1)) {
  TABLE_B.set(stripBackticks(cells[1]), parseGeneratorCell(cells[3]));
}

// --- Table C: 32 grey groups, key -> parent key ---
const tableCRows = parseRows(extractSection('## Table C'));
const tableCHeader = tableCRows[0];
const EXPECTED_TABLE_C_HEADER = ['System', 'Schoenflies', 'App key', 'HM full', 'Shubnikov', 'Parent'];
if (JSON.stringify(tableCHeader) !== JSON.stringify(EXPECTED_TABLE_C_HEADER)) {
  throw new Error(`Table C header changed shape, parser needs updating.\nExpected: ${JSON.stringify(EXPECTED_TABLE_C_HEADER)}\nActual:   ${JSON.stringify(tableCHeader)}`);
}
const TABLE_C = new Map<string, string>();
for (const cells of tableCRows.slice(1)) {
  TABLE_C.set(stripBackticks(cells[2]), stripBackticks(cells[5]));
}

function referenceGeneratorsFor(key: string): RefMatrix3x3[] {
  const direct = TABLE_B.get(key);
  if (direct) return toReferenceGenerators(direct);

  const parentKey = TABLE_C.get(key);
  if (parentKey === undefined) throw new Error(`Key not found in Table B or Table C: ${key}`);
  const parentSpec = TABLE_B.get(parentKey);
  if (!parentSpec) throw new Error(`Grey group ${key}'s parent ${parentKey} not found in Table B`);
  if (parentSpec.antiunitaryIdx.length > 0) throw new Error(`Grey group ${key}'s parent ${parentKey} unexpectedly has antiunitary generators`);
  return [...parentSpec.unitaryIdx.map(sigma), sigmaPrime(0)];
}

function appClosedGroup(key: string) {
  const generators = GENERATORS[key];
  if (!generators) throw new Error(`No GENERATORS entry for ${key}`);
  return getCachedFullGroup(key, generators);
}

const ALL_KEYS = [...TABLE_B.keys(), ...TABLE_C.keys()];

describe('operatorSet.reference — app operator set matches Birss Table 6 (via table-nomenclature.md Table B/C)', () => {
  it('covers all 122 Default-setting groups (90 Table B + 32 Table C)', () => {
    expect(TABLE_B.size).toBe(90);
    expect(TABLE_C.size).toBe(32);
  });

  for (const key of ALL_KEYS) {
    it(`${key}: closed operator set matches Table 6`, () => {
      const refGroup = refClose(referenceGeneratorsFor(key));
      const appGroup = appClosedGroup(key);
      expect(refSetsEqual(refGroup, appGroup)).toBe(true);
    });
  }

  describe('watch list — orientation-sensitive groups called out in BIRSS-APP-CONVENTIONS-REFERENCE.md', () => {
    it("m'm'm: operator set matches Birss (2_z unprimed), not ITC's mm'm' (2_x)", () => {
      const refGroup = refClose(referenceGeneratorsFor("m'm'm"));
      const appGroup = appClosedGroup("m'm'm");
      expect(refSetsEqual(refGroup, appGroup)).toBe(true);
    });

    it("2'm'm: operator set matches Birss Table 6's rotated orientation (2-fold ∥ a)", () => {
      const refGroup = refClose(referenceGeneratorsFor("2'm'm"));
      const appGroup = appClosedGroup("2'm'm");
      expect(refSetsEqual(refGroup, appGroup)).toBe(true);
    });

    it("-4'm2': operator set matches Birss Table 6's rotated orientation", () => {
      const refGroup = refClose(referenceGeneratorsFor("-4'm2'"));
      const appGroup = appClosedGroup("-4'm2'");
      expect(refSetsEqual(refGroup, appGroup)).toBe(true);
    });

    it("-6'2m': operator set matches Birss Table 6's rotated orientation", () => {
      const refGroup = refClose(referenceGeneratorsFor("-6'2m'"));
      const appGroup = appClosedGroup("-6'2m'");
      expect(refSetsEqual(refGroup, appGroup)).toBe(true);
    });

    it.each(['m-3', "m'-3'", 'm-3m', "m-3m'", "m'-3'm'", "m'-3'm"])('%s: cubic bar family operator set matches Table 6 (name-only symbol divergence)', (key) => {
      const refGroup = refClose(referenceGeneratorsFor(key));
      const appGroup = appClosedGroup(key);
      expect(refSetsEqual(refGroup, appGroup)).toBe(true);
    });
  });
});
