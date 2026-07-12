import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { POINT_GROUPS } from './pointGroups';
import { tableRows } from '../services/testUtils/birssTableParsers';

/**
 * Step 1 of BIRSS-APP-CONVENTIONS-REFERENCE.md: the app's key set, per-group `type`,
 * and `schoenflies` must equal birss-tables/table-nomenclature.md (Table A = 90
 * non-grey, Table C = 32 grey), parsed here at test time rather than hand-copied, so
 * the reference doc stays the single source of truth. Anti-circular: expected values
 * come from the doc, never from POINT_GROUPS itself.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REFERENCE_PATH = path.resolve(__dirname, '../../birss-tables/table-nomenclature.md');
const content = readFileSync(REFERENCE_PATH, 'utf-8');

function stripSub(s: string): string {
  return s.replace(/<\/?sub>/g, '');
}

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

function typeFromText(text: string): 'I' | 'II' | 'III' {
  if (text.includes('colourless')) return 'I';
  if (text.includes('black-white')) return 'III';
  if (text.includes('grey')) return 'II';
  throw new Error(`Unrecognized Type column text in table-nomenclature.md: "${text}"`);
}

interface ReferenceGroup {
  key: string;
  schoenflies: string;
  type: 'I' | 'II' | 'III';
}

function parseTableWithType(
  startHeading: string,
  endHeading: string | undefined,
  expectedHeader: string[],
): ReferenceGroup[] {
  const rows = tableRows(extractSection(startHeading, endHeading));
  const header = rows[0];
  if (JSON.stringify(header) !== JSON.stringify(expectedHeader)) {
    throw new Error(
      `${startHeading} header changed shape, parser needs updating.\nExpected: ${JSON.stringify(expectedHeader)}\nActual:   ${JSON.stringify(header)}`,
    );
  }
  return rows.slice(1).map((cells) => ({
    key: stripBackticks(cells[2]),
    schoenflies: stripSub(cells[1]),
    type: typeFromText(cells[5]),
  }));
}

function parseGreyTable(startHeading: string, expectedHeader: string[]): ReferenceGroup[] {
  const rows = tableRows(extractSection(startHeading));
  const header = rows[0];
  if (JSON.stringify(header) !== JSON.stringify(expectedHeader)) {
    throw new Error(
      `${startHeading} header changed shape, parser needs updating.\nExpected: ${JSON.stringify(expectedHeader)}\nActual:   ${JSON.stringify(header)}`,
    );
  }
  return rows.slice(1).map((cells) => ({
    key: stripBackticks(cells[2]),
    schoenflies: stripSub(cells[1]),
    type: 'II' as const,
  }));
}

const tableA = parseTableWithType('## Table A', '## Table B', [
  'System',
  'Schoenflies',
  'App key',
  'HM full',
  'Shubnikov',
  'Type',
  'Note',
]);
const tableC = parseGreyTable('## Table C', ['System', 'Schoenflies', 'App key', 'HM full', 'Shubnikov', 'Parent']);
const REFERENCE_GROUPS = [...tableA, ...tableC];

describe('nomenclature.reference — POINT_GROUPS matches birss-tables/table-nomenclature.md', () => {
  it('parses exactly 90 Table A rows and 32 Table C rows (122 total)', () => {
    expect(tableA.length).toBe(90);
    expect(tableC.length).toBe(32);
  });

  it('key set matches the 122 reference keys exactly', () => {
    const appKeys = new Set(POINT_GROUPS.map((g) => g.name));
    const refKeys = new Set(REFERENCE_GROUPS.map((g) => g.key));
    const missingFromApp = [...refKeys].filter((k) => !appKeys.has(k)).sort();
    const extraInApp = [...appKeys].filter((k) => !refKeys.has(k)).sort();
    expect({ missingFromApp, extraInApp }).toEqual({ missingFromApp: [], extraInApp: [] });
  });

  it("includes Birss's m'm'm and excludes ITC's mm'm' (Step 1 HM divergence)", () => {
    const appKeys = new Set(POINT_GROUPS.map((g) => g.name));
    expect(appKeys.has("m'm'm")).toBe(true);
    expect(appKeys.has("mm'm'")).toBe(false);
  });

  for (const ref of REFERENCE_GROUPS) {
    const appGroup = POINT_GROUPS.find((g) => g.name === ref.key);

    it(`${ref.key}: type matches reference (${ref.type})`, () => {
      expect(appGroup?.type).toBe(ref.type);
    });

    it(`${ref.key}: schoenflies matches reference (${ref.schoenflies})`, () => {
      expect(appGroup?.schoenflies).toBe(ref.schoenflies);
    });
  }
});
