import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { POINT_GROUPS } from './pointGroups';
import { SHUBNIKOV, REFERENCE_AXES, getFamilyClass } from './groupNotation';

/**
 * Anti-drift guard tests for the supplementary Birss notation maps. Each test re-parses the
 * vendored, print-verified source markdown at test time and asserts the TypeScript maps equal the
 * parsed tables entry-for-entry (no missing, no extra, no differing entries), so the data can never
 * silently drift from the tables. Anti-circular: expected values come from the tables, never from
 * the maps themselves.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NOMENCLATURE_PATH = path.resolve(__dirname, '../../birss-tables/table-nomenclature.md');
const TABLE_4A_PATH = path.resolve(__dirname, '../../birss-tables/table-4a.md');

function stripBackticks(s: string): string {
  return s.replace(/^`|`$/g, '');
}

/** Split a markdown table into rows of trimmed cells, dropping the `|---|` separator rows. */
function parseRows(section: string): string[][] {
  return section
    .split('\n')
    .filter(line => line.trim().startsWith('|'))
    .map(line => line.split('|').slice(1, -1).map(c => c.trim()))
    .filter(cells => !cells.every(c => /^:?-+:?$/.test(c)));
}

function sliceBetween(content: string, startHeading: string, endHeading: string): string {
  const startIdx = content.indexOf(startHeading);
  if (startIdx === -1) throw new Error(`Heading not found: ${startHeading}`);
  const rest = content.slice(startIdx + startHeading.length);
  const endIdx = rest.indexOf(endHeading);
  if (endIdx === -1) throw new Error(`End heading not found after ${startHeading}: ${endHeading}`);
  return rest.slice(0, endIdx);
}

describe('SHUBNIKOV vs table-nomenclature.md Table A', () => {
  // Table A columns: System | Schoenflies | App key | HM full | Shubnikov | Type | Note
  const content = readFileSync(NOMENCLATURE_PATH, 'utf-8');
  const rows = parseRows(sliceBetween(content, '## Table A', '## Table B'));
  const header = rows[0];
  const parsed: Record<string, string> = {};
  for (const cells of rows.slice(1)) {
    parsed[stripBackticks(cells[2])] = stripBackticks(cells[4]);
  }

  it('reads the expected Table A columns', () => {
    expect(header).toEqual(['System', 'Schoenflies', 'App key', 'HM full', 'Shubnikov', 'Type', 'Note']);
  });

  it('parses the 90 non-grey rows (32 Type I + 58 Type III)', () => {
    expect(Object.keys(parsed)).toHaveLength(90);
    const typeI = POINT_GROUPS.filter(g => g.type === 'I').map(g => g.name);
    const typeIII = POINT_GROUPS.filter(g => g.type === 'III').map(g => g.name);
    expect(typeI).toHaveLength(32);
    expect(typeIII).toHaveLength(58);
    for (const name of [...typeI, ...typeIII]) expect(parsed).toHaveProperty(name);
  });

  it('equals SHUBNIKOV entry-for-entry (no missing, no extra, no differing)', () => {
    expect(SHUBNIKOV).toEqual(parsed);
  });

  it('has no grey (Type II) entries', () => {
    for (const g of POINT_GROUPS.filter(g => g.type === 'II')) {
      expect(SHUBNIKOV).not.toHaveProperty(g.name);
    }
  });
});

describe('REFERENCE_AXES vs table-4a.md', () => {
  // table-4a columns: System | International symbol | Orientation of reference axes | ...4 tensor cols
  // The two cubic centrosymmetric rows print `m3`/`m3m`; keyed here under the app `m-3`/`m-3m`.
  const CUBIC_RENAME: Record<string, string> = { m3: 'm-3', m3m: 'm-3m' };
  const content = readFileSync(TABLE_4A_PATH, 'utf-8');
  const rows = parseRows(content);
  const header = rows[0];
  const parsed: Record<string, string> = {};
  for (const cells of rows.slice(1)) {
    const symbol = cells[1];
    parsed[CUBIC_RENAME[symbol] ?? symbol] = cells[2];
  }

  it('reads the expected table-4a columns', () => {
    expect(header[1]).toBe('International symbol of symmetry class');
    expect(header[2]).toBe('Orientation of reference axes');
  });

  it('parses all 32 classical symmetry classes', () => {
    expect(Object.keys(parsed)).toHaveLength(32);
  });

  it('equals REFERENCE_AXES entry-for-entry (no missing, no extra, no differing)', () => {
    expect(REFERENCE_AXES).toEqual(parsed);
  });
});

describe('getFamilyClass', () => {
  it('handles the documented cases', () => {
    expect(getFamilyClass("6'mm'")).toBe('6mm');
    expect(getFamilyClass("-3'm'")).toBe('-3m');
    expect(getFamilyClass("m'm'm")).toBe('mmm');
    expect(getFamilyClass("321'")).toBe('32');
    expect(getFamilyClass("4/m'm'm")).toBe('4/mmm');
  });

  it('maps the bracketed (rotated-setting) groups to their classical family', () => {
    expect(getFamilyClass("2'm'm")).toBe('mm2');
    expect(getFamilyClass("-4'm2'")).toBe('-42m');
    expect(getFamilyClass("-6'2m'")).toBe('-6m2');
  });

  it('returns a Type I group unchanged', () => {
    expect(getFamilyClass('m-3m')).toBe('m-3m');
    expect(getFamilyClass('222')).toBe('222');
  });

  it('maps every one of the 122 point groups to a REFERENCE_AXES key', () => {
    for (const g of POINT_GROUPS) {
      const family = getFamilyClass(g.name);
      expect(REFERENCE_AXES, `family "${family}" for group "${g.name}"`).toHaveProperty(family);
    }
  });
});
