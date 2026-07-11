import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { POINT_GROUPS } from './pointGroups';
import {
  SHUBNIKOV,
  FULL_HM,
  REFERENCE_AXES,
  TABLE_4A_CLASS_LETTERS,
  getFamilyClass,
  classicalChainApplies,
  getTable7Chain,
} from './groupNotation';

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
    .filter((line) => line.trim().startsWith('|'))
    .map((line) =>
      line
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim()),
    )
    .filter((cells) => !cells.every((c) => /^:?-+:?$/.test(c)));
}

function sliceBetween(content: string, startHeading: string, endHeading: string): string {
  const startIdx = content.indexOf(startHeading);
  if (startIdx === -1) throw new Error(`Heading not found: ${startHeading}`);
  const rest = content.slice(startIdx + startHeading.length);
  const endIdx = rest.indexOf(endHeading);
  if (endIdx === -1) throw new Error(`End heading not found after ${startHeading}: ${endHeading}`);
  return rest.slice(0, endIdx);
}

// Table A (90 non-grey) and Table C (32 grey) share the same leading columns:
// index 2 = App key (backticked), 3 = HM full (plain), 4 = Shubnikov (backticked).
const NOMENCLATURE = readFileSync(NOMENCLATURE_PATH, 'utf-8');
const TABLE_A_ROWS = parseRows(sliceBetween(NOMENCLATURE, '## Table A', '## Table B')).slice(1);
const TABLE_C_ROWS = parseRows(sliceBetween(NOMENCLATURE, '## Table C', '## Changelog')).slice(1);
const ALL_NOMENCLATURE_ROWS = [...TABLE_A_ROWS, ...TABLE_C_ROWS];

function parseColumn(col: number): Record<string, string> {
  const map: Record<string, string> = {};
  for (const cells of ALL_NOMENCLATURE_ROWS) {
    map[stripBackticks(cells[2])] = stripBackticks(cells[col]);
  }
  return map;
}

describe('SHUBNIKOV vs table-nomenclature.md (Table A + Table C)', () => {
  const parsed = parseColumn(4);

  it('parses all 122 groups (32 Type I + 58 Type III + 32 Type II)', () => {
    expect(TABLE_A_ROWS).toHaveLength(90);
    expect(TABLE_C_ROWS).toHaveLength(32);
    expect(Object.keys(parsed)).toHaveLength(122);
    for (const g of POINT_GROUPS) expect(parsed).toHaveProperty(g.name);
  });

  it('equals SHUBNIKOV entry-for-entry (no missing, no extra, no differing)', () => {
    expect(SHUBNIKOV).toEqual(parsed);
  });
});

describe('FULL_HM vs table-nomenclature.md (Table A + Table C)', () => {
  const parsed = parseColumn(3);

  it('parses all 122 groups', () => {
    expect(Object.keys(parsed)).toHaveLength(122);
    for (const g of POINT_GROUPS) expect(parsed).toHaveProperty(g.name);
  });

  it('equals FULL_HM entry-for-entry (no missing, no extra, no differing)', () => {
    expect(FULL_HM).toEqual(parsed);
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

describe('TABLE_4A_CLASS_LETTERS vs table-4a.md (columns 3-6)', () => {
  // Columns: System | International symbol | Orientation | PolarEven | AxialEven | PolarOdd | AxialOdd
  const CUBIC_RENAME: Record<string, string> = { m3: 'm-3', m3m: 'm-3m' };
  const rows = parseRows(readFileSync(TABLE_4A_PATH, 'utf-8'));
  const header = rows[0];
  const letter = (cell: string): string | null => {
    const m = cell.match(/^([A-U])_[mn]$/);
    return m ? m[1] : null;
  };
  const parsed: Record<
    string,
    { polarEven: string | null; axialEven: string | null; polarOdd: string | null; axialOdd: string | null }
  > = {};
  for (const cells of rows.slice(1)) {
    const key = CUBIC_RENAME[cells[1]] ?? cells[1];
    parsed[key] = {
      polarEven: letter(cells[3]),
      axialEven: letter(cells[4]),
      polarOdd: letter(cells[5]),
      axialOdd: letter(cells[6]),
    };
  }

  it('reads the expected tensor-type columns', () => {
    expect(header[3]).toBe('Polar tensor of even rank m');
    expect(header[4]).toBe('Axial tensor of even rank m');
    expect(header[5]).toBe('Polar tensor of odd rank n');
    expect(header[6]).toBe('Axial tensor of odd rank n');
  });

  it('parses all 32 classical symmetry classes', () => {
    expect(Object.keys(parsed)).toHaveLength(32);
  });

  it('equals TABLE_4A_CLASS_LETTERS entry-for-entry (no missing, no extra, no differing)', () => {
    expect(TABLE_4A_CLASS_LETTERS).toEqual(parsed);
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

describe('classicalChainApplies', () => {
  const typeOf = (name: string) => POINT_GROUPS.find((p) => p.name === name)!.type;
  it('the classical Table-4a chain applies iff the tensor is i-type or the group is Type I', () => {
    expect(classicalChainApplies(typeOf("-3'm'"), 'c')).toBe(false); // Type III, c -> Table 7
    expect(classicalChainApplies(typeOf("-3'm'"), 'i')).toBe(true); // i-tensor reduces to family class
    expect(classicalChainApplies(typeOf("321'"), 'c')).toBe(false); // Type II grey, c
    expect(classicalChainApplies(typeOf('432'), 'c')).toBe(true); // Type I: c coincides with i
    expect(classicalChainApplies(typeOf("m'm'm"), 'i')).toBe(true); // any i-tensor
  });
});

describe('getTable7Chain', () => {
  // Expectations pinned to the print-verified Table-7 rows + Table-4a cross-formula (NOT derived
  // from the helper). See birss-tables/table-7.md and TABLE_4A_CLASS_LETTERS.

  it("m'm'm polar rank 2: c-Polar-even reads B=mm2 Axial-even (crossover) -> class E (Table 4d E2)", () => {
    const chain = getTable7Chain("m'm'm", 'polar', 2)!;
    expect(chain.column).toBe('c-Polar-even');
    expect(chain.source).toBe('B');
    expect(chain.sourceSymbol).toBe('mm2');
    expect(chain.sourceBracketed).toBe(false);
    expect(chain.fourAColumn).toBe('Axial-even');
    expect(chain.parityCrossover).toBe(true);
    expect(chain.letter).toBe('E');
    expect(chain.transformLabel).toBeNull();
    expect(chain.bookErrorNote).toBeNull();
  });

  it("4'mm' polar rank 3: c-Polar-odd reads A=-4m2 (bracketed) Polar-odd -> class J, Rz(45°)", () => {
    const chain = getTable7Chain("4'mm'", 'polar', 3)!;
    expect(chain.column).toBe('c-Polar-odd');
    expect(chain.source).toBe('A');
    expect(chain.sourceSymbol).toBe('-4m2');
    expect(chain.sourceBracketed).toBe(true);
    expect(chain.sourceClass).toBe('-42m');
    expect(chain.fourAColumn).toBe('Polar-odd');
    expect(chain.parityCrossover).toBe(false);
    expect(chain.letter).toBe('J');
    expect(chain.transformLabel).toBe('Rz(45°)');
    expect(chain.bookErrorNote).toBeNull();
  });

  it("m'm'm axial rank 2: c-Axial-even reads A=mmm Axial-even -> no allowed form (Table 4a '-')", () => {
    const chain = getTable7Chain("m'm'm", 'axial', 2)!;
    expect(chain.source).toBe('A');
    expect(chain.sourceSymbol).toBe('mmm');
    expect(chain.fourAColumn).toBe('Axial-even');
    expect(chain.letter).toBeNull();
    expect(chain.bookErrorNote).toBeNull();
  });

  it("-6m'2' axial rank 2: A misprinted -6m2 -> forced bracket + Rz(30°) + book-error note", () => {
    const chain = getTable7Chain("-6m'2'", 'axial', 2)!;
    expect(chain.source).toBe('A');
    expect(chain.sourceSymbol).toBe('-6m2');
    expect(chain.sourceBracketed).toBe(true); // forced despite the printed unbracketed A
    expect(chain.transformLabel).toBe('Rz(30°)');
    expect(chain.letter).toBe('R');
    expect(chain.bookErrorNote).not.toBeNull();
  });

  it('grey (Type II) and Type I groups have no Table-7 chain', () => {
    expect(getTable7Chain("321'", 'polar', 2)).toBeNull(); // Type II grey
    expect(getTable7Chain('432', 'polar', 2)).toBeNull(); // Type I
  });

  it('the source class is always a valid REFERENCE_AXES / Table-4a key for every BW c-tensor', () => {
    for (const g of POINT_GROUPS.filter((p) => p.type === 'III')) {
      for (const parity of ['polar', 'axial'] as const) {
        for (const rank of [1, 2, 3, 4]) {
          const chain = getTable7Chain(g.name, parity, rank);
          expect(chain, `${g.name} ${parity} rank ${rank}`).not.toBeNull();
          expect(REFERENCE_AXES, `${g.name}: source class ${chain!.sourceClass}`).toHaveProperty(chain!.sourceClass);
          expect(TABLE_4A_CLASS_LETTERS).toHaveProperty(chain!.sourceClass);
        }
      }
    }
  });
});
