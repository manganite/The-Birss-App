/**
 * groupSearch.ts — the pure group filter/search behind the Explorer's category chips and header
 * search box. Extracted from App.tsx (audit H8 / E22) so the one logic-heavy interaction is unit-
 * testable without a DOM. No React dependency.
 */
import { POINT_GROUPS, type PointGroupData, type GroupKey } from '../data/pointGroups';
import { getGroupDisplayName } from './conventionMapping';
import type { Convention } from './conventionMapping';

export type GroupCategory = 'All' | 'Ordinary' | 'Gray' | 'Black & White';

/** Lowercase, fold typographic quotes/commas to a plain `'`, and strip whitespace — so a query and a
 *  group symbol compare regardless of case, quote style, or spacing. */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[‘’''`´,]/g, "'")
    .replace(/\s+/g, '');
}

/** Magnetic-class chip a group belongs to: grey (ends in `1'`), black-and-white (any prime), else
 *  ordinary. (A plain key or arbitrary string is accepted.) */
export function getGroupCategory(name: GroupKey | string): GroupCategory {
  if (name.endsWith("1'")) return 'Gray';
  if (name.includes("'")) return 'Black & White';
  return 'Ordinary';
}

/**
 * The registry filtered by the active category chip, then by the search query (matched against the
 * convention-dependent display name OR the crystal-system name, normalized on both sides). Category
 * filter first, then search — exactly the Explorer's chain.
 */
export function filterGroups(searchQuery: string, category: GroupCategory, convention: Convention): PointGroupData[] {
  let groups = POINT_GROUPS;
  if (category !== 'All') {
    groups = groups.filter((pg) => getGroupCategory(pg.name) === category);
  }
  if (searchQuery) {
    const normalizedQuery = normalizeString(searchQuery);
    groups = groups.filter(
      (pg) =>
        normalizeString(getGroupDisplayName(pg.name, convention)).includes(normalizedQuery) ||
        normalizeString(pg.crystalSystem).includes(normalizedQuery),
    );
  }
  return groups;
}
