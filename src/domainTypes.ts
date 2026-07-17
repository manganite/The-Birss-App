/**
 * Dependency-free primitive domain unions. This module must import NOTHING (its emptiness of
 * imports is the point: it can be consumed from anywhere -- data, services, components -- without
 * creating cycles). App-facing consumers keep importing from `src/types.ts`, which re-exports these.
 */

/**
 * The seven crystal systems, capitalized exactly as stored in `PointGroupData.crystalSystem`
 * and keyed in `CRYSTAL_SYSTEMS`. Canonical union — replaces the loose `string` typing at the
 * crystal-system data and prop sites.
 */
export type CrystalSystem =
  'Triclinic' | 'Monoclinic' | 'Orthorhombic' | 'Tetragonal' | 'Trigonal' | 'Hexagonal' | 'Cubic';

/** Magnetic point-group class: I = standard, II = grey, III = black-and-white. Canonical home
 *  for the union re-inlined at pointGroups, groupNotation, and LookupChainDiagram. */
export type GroupType = 'I' | 'II' | 'III';
