/**
 * Structural tests for the Explorer group filter/search (E22). Expected values are anchored to the
 * registry (POINT_GROUPS) or derived via getGroupDisplayName / getGroupCategory — never taken from
 * filterGroups' own output. One representative case per branch, not input combinatorics.
 */
import { describe, it, expect } from 'vitest';
import { filterGroups, getGroupCategory, normalizeString, type GroupCategory } from './groupSearch';
import { POINT_GROUPS } from '../data/pointGroups';
import { getGroupDisplayName } from './conventionMapping';

describe('getGroupCategory', () => {
  it('classifies grey / black-and-white / ordinary by the prime pattern', () => {
    expect(getGroupCategory("11'")).toBe('Gray'); // grey = ends in 1'
    expect(getGroupCategory("-11'")).toBe('Gray');
    expect(getGroupCategory("m'm'2")).toBe('Black & White'); // has a prime, not ending 1'
    expect(getGroupCategory("4'mm'")).toBe('Black & White');
    expect(getGroupCategory('mm2')).toBe('Ordinary'); // no prime
    expect(getGroupCategory('1')).toBe('Ordinary');
  });
});

describe('filterGroups', () => {
  it('empty query + All returns the whole registry', () => {
    expect(filterGroups('', 'All', 'birss')).toEqual(POINT_GROUPS);
  });

  it('empty query + each category returns exactly that category of the registry', () => {
    for (const cat of ['Ordinary', 'Gray', 'Black & White'] as GroupCategory[]) {
      const expected = POINT_GROUPS.filter((pg) => getGroupCategory(pg.name) === cat);
      expect(filterGroups('', cat, 'birss')).toEqual(expected);
    }
  });

  it('a crystal-system query returns exactly that system', () => {
    const cubic = POINT_GROUPS.filter((pg) => pg.crystalSystem === 'Cubic');
    const got = filterGroups('cubic', 'All', 'birss');
    expect(got).toHaveLength(cubic.length);
    expect(got.every((pg) => pg.crystalSystem === 'Cubic')).toBe(true);
  });

  it('a display-name query matches that group', () => {
    // 'mm2' is its own display name under Birss; searching it must surface the mm2 group.
    const got = filterGroups('mm2', 'All', 'birss');
    expect(got.some((pg) => pg.name === 'mm2')).toBe(true);
  });

  it('normalizes case/quotes/whitespace (upper- and lower-case queries agree)', () => {
    expect(filterGroups('CUBIC', 'All', 'birss')).toEqual(filterGroups('cubic', 'All', 'birss'));
  });

  it('search is convention-dependent (a divergent symbol matches under its own convention)', () => {
    // Pick a group whose display name differs between the two conventions (e.g. Birss m'm'm ↔ ITC mm'm').
    const divergent = POINT_GROUPS.find(
      (pg) => getGroupDisplayName(pg.name, 'birss') !== getGroupDisplayName(pg.name, 'itc'),
    );
    expect(divergent, 'expected at least one convention-divergent group').toBeDefined();
    const itcSymbol = getGroupDisplayName(divergent!.name, 'itc');
    // Under ITC the group is found by its ITC symbol...
    expect(filterGroups(itcSymbol, 'All', 'itc').some((pg) => pg.name === divergent!.name)).toBe(true);
    // ...but under Birss that same symbol does not name this group (its Birss symbol differs).
    expect(filterGroups(itcSymbol, 'All', 'birss').some((pg) => pg.name === divergent!.name)).toBe(false);
  });

  it('a no-match query returns empty', () => {
    expect(filterGroups('zzznotagroup', 'All', 'birss')).toEqual([]);
  });
});

describe('normalizeString', () => {
  it("lowercases, folds typographic quotes/commas to ', and strips whitespace", () => {
    expect(normalizeString("  M M' 2 ")).toBe("mm'2");
    expect(normalizeString('6’/mmm')).toBe("6'/mmm"); // curly quote → straight
  });
});
