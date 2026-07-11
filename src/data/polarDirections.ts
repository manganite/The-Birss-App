/**
 * polarDirections.ts -- polar (symmetry) axes and nonpolar directions for the 21 noncentrosymmetric
 * classical crystal classes, from ITC Vol. D Table 3.2.2.2, expressed in the APP conventions:
 *   - monoclinic: the unique-axis-c rows (the app's first setting, z || c);
 *   - trigonal/hexagonal: the hexagonal-axes rows, in the app's Birss frame (position 2 -> y = the
 *     tertiary direction [120]). Three classes are therefore read from the ITC row that carries the
 *     app's physical orientation under a different positional symbol (documented 30 deg divergence,
 *     BIRSS-ITC-CONVENTION-DIVERGENCES.md Sec. 4-6):
 *         app `32`   -> ITC 3.2.2.2 row `312`   (2-folds along the tertiary [120]-family)
 *         app `3m`   -> ITC 3.2.2.2 row `31m`
 *         app `-6m2` -> ITC 3.2.2.2 row `-62m`  (2-folds along the secondary [100]-family)
 *     These are flagged `frameDivergent: true`; the Explorer shows a note, and the ops-consistency
 *     test in `itcData.reference.test.ts` proves the row choice against the app's own operators.
 *
 * Centrosymmetric classes are intentionally absent -- the UI derives "no polar directions
 * (centrosymmetric)". Magnetic groups reuse their unprimed spatial skeleton's entry (primes act
 * spatially exactly like their unprimed operations, so a direction's polarity is unchanged).
 *
 * Direction strings are crystallographic indices, as printed (a leading `-` is an overbar; a family
 * like `[u0w]` is all directions with that pattern). The `class` tag is the ITC 2.1.3.1 symmetry
 * -direction class (primary/secondary/tertiary) of the axis whose perpendicular plane the nonpolar
 * set spans. Anti-circular: the vendored ITC files remain the print anchor; the drift + ops tests
 * pin this module to them.
 */

export type SymDirClass = 'primary' | 'secondary' | 'tertiary';

export interface NonpolarSet {
  cls: SymDirClass;
  /** direction strings as printed, e.g. `['[0vw]', '[u0w]']` */
  directions: string[];
}

export interface PolarDirectionRow {
  /** polar symmetry-axis direction strings, `[]` for None. The cubic 23/-43m cells are the printed
   * descriptive phrase; `polarAxisDirs` gives the explicit directions for those. */
  polarAxes: string[];
  /** explicit polar-axis directions when `polarAxes` is a descriptive phrase (cubic 23/-43m). */
  polarAxisDirs?: string[];
  /** footnote (a): in class 1 every direction is polar; in class m all directions except the mirror
   * normal are polar. */
  allDirectionsNote?: boolean;
  nonpolar: NonpolarSet[];
  /** true for `32`, `3m`, `-6m2`: read from the 30 deg-divergent ITC row (see module header). */
  frameDivergent?: boolean;
  /** ITC Table 3.2.2.2 print-omission footnote (the 622 row); the sets below are the CORRECTED
   * form with the leading `[uv0]` primary set restored. */
  printOmission?: string;
}

const OMISSION_622 =
  'Corrected: ITC Table 3.2.2.2 prints the 622 nonpolar cell without the leading [uv0] primary set ' +
  "and without its set separators; by the table's own header rule all [uv0] are also nonpolar for " +
  '622 (the sixfold axis is evenfold). Restored here; see docs/references/ITC-table-3.2.2.2-polar-axes.md.';

/** Keyed by app classical group key. The 11 centrosymmetric classes are deliberately omitted. */
export const POLAR_DIRECTIONS: Record<string, PolarDirectionRow> = {
  // --- Triclinic ---
  '1': { polarAxes: [], allDirectionsNote: true, nonpolar: [] },

  // --- Monoclinic (unique axis c = the app's first setting) ---
  '2': { polarAxes: ['[001]'], nonpolar: [{ cls: 'primary', directions: ['[uv0]'] }] },
  m: { polarAxes: [], allDirectionsNote: true, nonpolar: [{ cls: 'primary', directions: ['[001]'] }] },

  // --- Orthorhombic ---
  '222': {
    polarAxes: [],
    nonpolar: [
      { cls: 'primary', directions: ['[0vw]'] },
      { cls: 'secondary', directions: ['[u0w]'] },
      { cls: 'tertiary', directions: ['[uv0]'] },
    ],
  },
  mm2: { polarAxes: ['[001]'], nonpolar: [{ cls: 'tertiary', directions: ['[uv0]'] }] },

  // --- Tetragonal ---
  '4': { polarAxes: ['[001]'], nonpolar: [{ cls: 'primary', directions: ['[uv0]'] }] },
  '-4': {
    polarAxes: [],
    nonpolar: [
      { cls: 'primary', directions: ['[001]'] },
      { cls: 'primary', directions: ['[uv0]'] },
    ],
  },
  '422': {
    polarAxes: [],
    nonpolar: [
      { cls: 'primary', directions: ['[uv0]'] },
      { cls: 'secondary', directions: ['[0vw]', '[u0w]'] },
      { cls: 'tertiary', directions: ['[uuw]', '[u-uw]'] },
    ],
  },
  '4mm': { polarAxes: ['[001]'], nonpolar: [{ cls: 'primary', directions: ['[uv0]'] }] },
  '-42m': {
    polarAxes: [],
    nonpolar: [
      { cls: 'primary', directions: ['[uv0]'] },
      { cls: 'secondary', directions: ['[0vw]', '[u0w]'] },
    ],
  },

  // --- Trigonal (hexagonal axes; app Birss frame) ---
  '3': { polarAxes: ['[001]'], nonpolar: [] },
  '32': {
    polarAxes: ['[1-10]', '[120]', '[-2-10]'],
    frameDivergent: true,
    nonpolar: [{ cls: 'tertiary', directions: ['[uuw]', '[-u0w]', '[0-vw]'] }],
  },
  '3m': {
    polarAxes: ['[001]'],
    frameDivergent: true,
    nonpolar: [{ cls: 'tertiary', directions: ['[1-10]', '[120]', '[-2-10]'] }],
  },

  // --- Hexagonal ---
  '6': { polarAxes: ['[001]'], nonpolar: [{ cls: 'primary', directions: ['[uv0]'] }] },
  '-6': { polarAxes: [], nonpolar: [{ cls: 'primary', directions: ['[001]'] }] },
  '622': {
    polarAxes: [],
    printOmission: OMISSION_622,
    nonpolar: [
      { cls: 'primary', directions: ['[uv0]'] },
      { cls: 'secondary', directions: ['[u2uw]', '[-2u-uw]', '[u-uw]'] },
      { cls: 'tertiary', directions: ['[uuw]', '[-u0w]', '[0-vw]'] },
    ],
  },
  '6mm': { polarAxes: ['[001]'], nonpolar: [{ cls: 'primary', directions: ['[uv0]'] }] },
  '-6m2': {
    polarAxes: ['[100]', '[010]', '[-1-10]'],
    frameDivergent: true,
    nonpolar: [{ cls: 'secondary', directions: ['[u2uw]', '[-2u-uw]', '[u-uw]'] }],
  },

  // --- Cubic ---
  '23': {
    polarAxes: ['Four threefold axes along <111>'],
    polarAxisDirs: ['[111]', '[1-1-1]', '[-11-1]', '[-1-11]'],
    nonpolar: [{ cls: 'primary', directions: ['[0vw]', '[u0w]', '[uv0]'] }],
  },
  '432': {
    polarAxes: [],
    nonpolar: [
      { cls: 'primary', directions: ['[0vw]', '[u0w]', '[uv0]'] },
      { cls: 'tertiary', directions: ['[uuw]', '[uvv]', '[uvu]'] },
      { cls: 'tertiary', directions: ['[u-uw]', '[uv-v]', '[-uvu]'] },
    ],
  },
  '-43m': {
    polarAxes: ['Four threefold axes along <111>'],
    polarAxisDirs: ['[111]', '[1-1-1]', '[-11-1]', '[-1-11]'],
    nonpolar: [{ cls: 'primary', directions: ['[0vw]', '[u0w]', '[uv0]'] }],
  },
};

/** App classical keys whose ITC 3.2.2.2 row is read under the 30 deg trigonal orientation divergence. */
export const FRAME_DIVERGENT_CLASSES = new Set(
  Object.entries(POLAR_DIRECTIONS)
    .filter(([, r]) => r.frameDivergent)
    .map(([k]) => k),
);
