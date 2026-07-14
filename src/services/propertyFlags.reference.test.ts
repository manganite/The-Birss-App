import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { POINT_GROUPS } from '../data/pointGroups';
import { getFamilyClass } from '../data/groupNotation';
import { GENERATORS, isCentrosymmetric } from './symmetryGroups';
import { tableRows } from './testUtils/birssTableParsers';
import {
  isPolar,
  isFerromagnetic,
  isMagnetoelectric,
  isPiezoelectric,
  isPiezomagnetic,
  isChiral,
  getLaueClass,
  getSHGConsequenceShort,
} from './propertyFlags';

/**
 * Anti-circular anchors for the property flags. Every expected set comes from a printed reference
 * (ITC Tables 1.5.2.4 / 1.5.7.1 / 1.5.8.1, parsed at test time) or from a classical property-class
 * list in the crystallography literature -- never from the flag functions themselves.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ref = (name: string) => readFileSync(path.resolve(__dirname, '../../docs/references', name), 'utf-8');
const NOMENCLATURE = readFileSync(path.resolve(__dirname, '../../birss-tables/table-nomenclature.md'), 'utf-8');

const ALL = POINT_GROUPS.map((g) => g.name);
const computedSet = (pred: (g: string) => boolean) => new Set(ALL.filter(pred));

// ---- shared markdown helpers ----
const stripBackticks = (s: string) => s.replace(/^`|`$/g, '');
function sliceBetween(content: string, start: string, end: string): string {
  const s = content.indexOf(start);
  if (s === -1) throw new Error(`sliceBetween: start heading not found: "${start}"`);
  const rest = content.slice(s + start.length);
  const e = rest.indexOf(end);
  return e === -1 ? rest : rest.slice(0, e);
}

describe('Ferromagnetic == ITC Table 1.5.2.4 (31 groups)', () => {
  // App key is the LAST column (the Ms-direction column contains escaped `\|\|` pipes that inflate
  // the naive split, so index from the end); strip the "[frame]" annotation.
  const expected = new Set(
    tableRows(ref('ITC-table-1.5.2.4-ferromagnetic.md'))
      .filter((cells) => cells[0] !== 'Schoenflies')
      .map((cells) => cells[cells.length - 1].replace(/\s*\[frame\]\s*/, '').trim()),
  );

  it('lists exactly 31 groups', () => {
    expect(expected.size).toBe(31);
    for (const k of expected) expect(GENERATORS[k], `unknown app key ${k}`).toBeDefined();
  });
  it('matches the computed ferromagnetic set entry-for-entry', () => {
    expect(computedSet(isFerromagnetic)).toEqual(expected);
  });
});

describe('Magnetoelectric == ITC Table 1.5.8.1 (58 groups)', () => {
  // The ME table gives Schoenflies + printed HM only; map Schoenflies -> app key via
  // table-nomenclature (Tables A + C), normalizing ITC's S6 to the app/Birss C3i.
  const schToKey: Record<string, string> = {};
  const nomRows = [
    ...tableRows(sliceBetween(NOMENCLATURE, '## Table A', '## Table B')),
    ...tableRows(sliceBetween(NOMENCLATURE, '## Table C', '## Changelog')),
  ];
  for (const cells of nomRows) {
    if (cells[1] === 'Schoenflies') continue;
    const sch = cells[1].replace(/<\/?sub>/g, '').replace(/<\/?sup>/g, '');
    schToKey[sch] = stripBackticks(cells[2]);
  }

  const expected = new Set<string>();
  for (const cells of tableRows(
    sliceBetween(ref('ITC-table-1.5.8.1-magnetoelectric-groups.md'), '## Group list', '## Matrix forms'),
  )) {
    if (!/^F\d+$/.test(cells[0])) continue; // skip header
    const sch = cells[1].replace(/S6/g, 'C3i');
    const key = schToKey[sch];
    expect(key, `no app key mapped for Schoenflies "${cells[1]}"`).toBeDefined();
    expected.add(key);
  }

  it('lists exactly 58 groups', () => {
    expect(expected.size).toBe(58);
  });
  it('matches the computed magnetoelectric set entry-for-entry', () => {
    expect(computedSet(isMagnetoelectric)).toEqual(expected);
  });
});

describe('Piezomagnetic == ITC Table 1.5.7.1 (nonzero forms, non-grey groups)', () => {
  // Reuse the reference's group-key parsing (bracket-alternate resolved by GENERATORS membership;
  // "A = B" cross-references keep the first span) -- see itcPiezomagnetic.reference.test.ts.
  const content = ref('ITC-table-1.5.7.1-piezomagnetic.md');
  function keysFromEntry(entry: string): string[] {
    const spans = [...entry.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    const chosen = entry.includes(' = ') ? [spans[0]] : spans;
    return chosen.map((span) => {
      const bracket = span.match(/^(.*?)\s*\[([^\]]+)\]\s*$/);
      if (!bracket) return span.trim();
      const candidates = [bracket[1].trim(), ...bracket[2].split(/[;,]/).map((s) => s.trim())];
      const resolved = candidates.filter((c) => GENERATORS[c]);
      return resolved.includes(bracket[1].trim()) ? bracket[1].trim() : (resolved[0] ?? bracket[1].trim());
    });
  }
  const expected = new Set<string>();
  for (const block of content.split(/^## Block /m).slice(1)) {
    const gi = block.indexOf('Groups:');
    if (gi === -1) continue;
    const fence = block.indexOf('```', gi);
    const text = block
      .slice(gi, fence === -1 ? undefined : fence)
      .replace(/^Groups:\s*/, '')
      .replace(/\n/g, ' ');
    // Neutralize the ';' inside bracketed alternates (e.g. `mm2 [2mm; m2m]`) before entry-splitting.
    const safe = text.replace(/\[[^\]]*\]/g, (b) => b.replace(/;/g, ','));
    for (const entry of safe
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)) {
      for (const k of keysFromEntry(entry)) if (GENERATORS[k]) expected.add(k);
    }
  }

  const nonGrey = new Set(ALL.filter((g) => POINT_GROUPS.find((p) => p.name === g)!.type !== 'II'));
  it('matches the computed piezomagnetic set over the non-grey groups', () => {
    const computedNonGrey = new Set([...nonGrey].filter(isPiezomagnetic));
    expect(computedNonGrey).toEqual(expected);
  });
  it('vanishes for every grey (Type II) group', () => {
    for (const g of POINT_GROUPS.filter((p) => p.type === 'II')) {
      expect(isPiezomagnetic(g.name), g.name).toBe(false);
    }
  });
});

// ---- classical property-class anchors ----
// Non-centrosymmetric classical classes, derived (not hand-listed) from the registry.
const NONCENTRO_CLASSICAL = POINT_GROUPS.filter((g) => g.type === 'I' && !isCentrosymmetric(g.name)).map((g) => g.name);

describe('Polar == family in the 10 polar classes (Schmid, Ferroelectrics 162, 317 (1994))', () => {
  const POLAR_CLASSES = new Set(['1', '2', 'm', 'mm2', '4', '4mm', '3', '3m', '6', '6mm']);
  it('matches family membership in the polar classes', () => {
    expect(computedSet(isPolar)).toEqual(computedSet((g) => POLAR_CLASSES.has(getFamilyClass(g))));
  });
  it('has exactly 31 members (Schmid 1994)', () => {
    expect(computedSet(isPolar).size).toBe(31);
  });
});

describe('Piezoelectric == family in the 20 piezoelectric classes (21 non-centro minus 432)', () => {
  const PIEZO_CLASSES = new Set<string>(NONCENTRO_CLASSICAL.filter((k) => k !== '432'));
  it('excludes 432 among the non-centrosymmetric classes', () => {
    expect(NONCENTRO_CLASSICAL).toHaveLength(21);
    expect(PIEZO_CLASSES.size).toBe(20);
  });
  it('matches family membership in the piezoelectric classes', () => {
    expect(computedSet(isPiezoelectric)).toEqual(computedSet((g) => PIEZO_CLASSES.has(getFamilyClass(g))));
  });
});

describe('Chiral == family in the 11 enantiomorphic classes', () => {
  const ENANTIOMORPHIC = new Set(['1', '2', '222', '4', '422', '3', '32', '6', '622', '23', '432']);
  it('matches family membership in the enantiomorphic classes', () => {
    expect(computedSet(isChiral)).toEqual(computedSet((g) => ENANTIOMORPHIC.has(getFamilyClass(g))));
  });
});

describe('Laue class', () => {
  it('yields exactly 11 distinct centrosymmetric classical keys over the 122 groups', () => {
    const values = new Set(ALL.map(getLaueClass));
    expect(values.size).toBe(11);
    for (const v of values) {
      const rec = POINT_GROUPS.find((p) => p.name === v);
      expect(rec?.type, `${v} should be a classical key`).toBe('I');
      expect(isCentrosymmetric(v), `${v} should be centrosymmetric`).toBe(true);
    }
  });
});

describe('Multiferroic cross-check (Schmid, Ferroelectrics 162, 317 (1994))', () => {
  it('has exactly 13 polar-and-ferromagnetic groups', () => {
    const both = ALL.filter((g) => isPolar(g) && isFerromagnetic(g));
    expect(both).toHaveLength(13);
  });
});

describe('getSHGConsequenceShort (432-family correction)', () => {
  it('centrosymmetric groups forbid ED SHG', () => {
    expect(getSHGConsequenceShort('-1')).toBe('ED SHG forbidden (bulk); EQ/MD can contribute');
  });
  it('a generic non-centrosymmetric group allows ED SHG', () => {
    expect(getSHGConsequenceShort('1')).toBe('ED SHG allowed');
    expect(getSHGConsequenceShort('4mm')).toBe('ED SHG allowed');
  });
  it('the 432 family vanishes despite non-centrosymmetry', () => {
    for (const g of ['432', "4321'", "4'32'"]) {
      expect(isCentrosymmetric(g), `${g} is non-centrosymmetric`).toBe(false);
      expect(getSHGConsequenceShort(g)).toBe('ED SHG vanishes despite non-centrosymmetry (432 family)');
    }
  });
});
