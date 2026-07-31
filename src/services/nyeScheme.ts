/**
 * nyeScheme.ts -- the dot-diagram (Nye scheme) VIEW MODEL for a computed tensor form.
 *
 * `deriveNyeScheme(form, spec)` turns an already-computed `TensorForm` into the grid a Nye-style
 * dot diagram draws: the geometry (which compressed matrix layout the spec calls for), and per grid
 * cell one of {zero, class representative, class member with a signed ratio, composite-bound}.
 *
 * This is a VIEW over the Q0 constraint-view partition (`tensorProjection.reducedPartition`), which
 * is the same partition the relation list renders. **No new group theory and no new derivation
 * happens here** -- the invariant subspace arrives already computed in `form.basisResults`, and the
 * partition of it arrives from the shared helper. A disagreement between the dot diagram and the
 * relation list is therefore not expressible.
 *
 * **i/c-agnosticism.** The renderer never sees the tensor's parity or time parity. Magnetic c-type
 * tensors reach the same class rows through Birss's Table 7; i/c and the magnetic lookup select
 * WHICH form applies, never how a form is notated. So a magnetic c-tensor renders through this
 * exact code path, with no magnetic extension of the notation and none claimed.
 *
 * Notation anchors (vocabulary only -- neither is a cell-set anchor for this app):
 *  - Nye's scheme as reproduced in International Tables for Crystallography Vol. D, Sec. 1.1.4.
 *    Its Sec. 1.1.4.8 rank-3 schemes carry two documented defects and are NOT sole anchors for any
 *    cell set; see `docs/findings/` (ITC-D rank-3 scheme defects).
 *  - Yariv, *Quantum Electronics* 2nd ed., Table 16.1 (rank-3 SHG `d_ijk`, all 32 classes).
 *
 * @see docs/references/BIRSS-APP-CONVENTIONS-REFERENCE.md § (f) (canonical presentation)
 */

import type { TensorForm, TensorSpec } from './tensorForms';
import { getIndices, getLabel, reducedPartition, formatCompositeConstraint } from './tensorProjection';

/** The compressed-matrix layouts a scheme can take. Anything else has no scheme. */
export type NyeGrid = '3x3' | '3x6' | '6x3' | '6x6';

/** A row/column header: the crystallographic indices it stands for -- one index (x/y/z) or a
 * Voigt-compressed pair in the standard 1..6 order (xx yy zz yz zx xy). */
export interface NyeSlot {
  label: string;
  idx: number[];
}

export const SINGLE_SLOTS: readonly NyeSlot[] = [
  { label: 'x', idx: [0] },
  { label: 'y', idx: [1] },
  { label: 'z', idx: [2] },
];

export const PAIR_SLOTS: readonly NyeSlot[] = [
  { label: 'xx', idx: [0, 0] },
  { label: 'yy', idx: [1, 1] },
  { label: 'zz', idx: [2, 2] },
  { label: 'yz', idx: [1, 2] },
  { label: 'zx', idx: [2, 0] },
  { label: 'xy', idx: [0, 1] },
];

/**
 * What one grid cell is, in the constraint view. Mutually exclusive, in the priority the diagram
 * draws them:
 *  - `zero`           -- the component vanishes identically for this group/spec;
 *  - `representative` -- the first cell of its proportionality class in reading order (the heavy dot
 *                        that names the free parameter);
 *  - `member`         -- equal to its class representative up to `ratio` (sign ring when negative,
 *                        annotated coefficient when |ratio| != 1);
 *  - `composite`      -- the cell's class is the one a composite relation DETERMINES, so it is not a
 *                        free parameter at all. Cells that merely appear on the other side of that
 *                        relation keep their representative/member kind and record it in
 *                        `compositeRefs`, so the equalities among them are not lost.
 */
export type NyeCellKind = 'zero' | 'representative' | 'member' | 'composite';

export interface NyeCell {
  row: number;
  col: number;
  /** Flat tensor index (base 3, most-significant index first) this cell stands for. */
  flat: number;
  /** LaTeX component label with the sentinel `\chi` base, e.g. `\chi_{xzx}` -- the caller
   * substitutes the effect's own symbol exactly as it does for the relation list. */
  label: string;
  kind: NyeCellKind;
  /** Index into `classes`; null iff `kind === 'zero'`. */
  classId: number | null;
  /** Signed ratio to the class's grid representative (1 on the representative, 0 on a zero cell). */
  ratio: number;
  /** Indices into `composites` of every composite relation this cell participates in. */
  compositeRefs: number[];
}

export interface NyeClass {
  id: number;
  /** Cell indices into `cells`, in reading order. The first is the class's grid representative. */
  cells: number[];
  /** Flat index of the underlying partition representative (which need not be a grid cell: for a
   * jk-symmetric tensor the lowest-index class member is often the non-Voigt permutation, e.g.
   * `\chi_xxz` rather than the grid's `\chi_xzx`). Ratios are normalised to the GRID representative,
   * not to this one, so the diagram's ratios read against what the diagram actually shows. */
  partitionRep: number;
  /** True iff a composite relation determines this class. */
  determined: boolean;
}

export interface NyeComposite {
  /** The relation as a display string, from the shared formatter. */
  text: string;
  /** Every grid cell the relation involves, in reading order. */
  cells: number[];
  /** The class the relation determines; null if that class has no grid cell. */
  determinedClassId: number | null;
}

export interface NyeScheme {
  grid: NyeGrid;
  rows: readonly NyeSlot[];
  cols: readonly NyeSlot[];
  /** Row-major, `rows.length * cols.length` entries. */
  cells: NyeCell[];
  classes: NyeClass[];
  composites: NyeComposite[];
  /** True iff the tensor vanishes identically: every cell is `zero` and there are no classes. */
  isZero: boolean;
}

/** Flat index for a multi-index, most-significant first. Matches `tensorProjection.getIndices`. */
const flatOf = (indices: number[]) => indices.reduce((a, x) => a * 3 + x, 0);

/**
 * The grid geometry `spec` calls for, or null when the spec has no scheme. Only the compressed
 * layouts that a dot diagram can express are covered:
 *   rank 2 (either intrinsic) -> 3x3;  rank 3 with `jk` -> 3x6;  rank 3 with `ij` -> 6x3;
 *   rank 4 with `ij_kl`/`voigt` -> 6x6.
 * Every other rank/intrinsic combination returns null and keeps its existing display unchanged.
 *
 * The 6x3 case is the transpose of the classical scheme -- Nye's own converse-piezoelectric
 * presentation, where the compressed pair indexes the ROW and the free index the column. It is a
 * genuine transpose, not merely a rotated drawing: relabelling `chi_abc -> chi_cba` is a bijection
 * between the `ij`-symmetric and `jk`-symmetric invariant subspaces (every index transforms with
 * the same matrix, so the projection commutes with index permutation), and it carries grid cell
 * `(pair, single)` to `(single, pair)`. `nyeScheme.test.ts` asserts exactly that against the
 * engine for every classical class.
 */
function geometryFor(spec: TensorSpec): { grid: NyeGrid; rows: readonly NyeSlot[]; cols: readonly NyeSlot[] } | null {
  const { rank, intrinsic } = spec;
  if (rank === 2) return { grid: '3x3', rows: SINGLE_SLOTS, cols: SINGLE_SLOTS };
  if (rank === 3 && intrinsic === 'jk') return { grid: '3x6', rows: SINGLE_SLOTS, cols: PAIR_SLOTS };
  if (rank === 3 && intrinsic === 'ij') return { grid: '6x3', rows: PAIR_SLOTS, cols: SINGLE_SLOTS };
  if (rank === 4 && (intrinsic === 'ij_kl' || intrinsic === 'voigt'))
    return { grid: '6x6', rows: PAIR_SLOTS, cols: PAIR_SLOTS };
  return null;
}

/**
 * The dot-diagram model for a computed form, or null when the spec has no scheme geometry.
 *
 * `form` must have been computed for the same `spec` (`computeTensorForm(group, setting, spec)`).
 * A vanishing form yields an all-zero scheme -- the grid with every cell a zero dot -- rather than
 * null, which is reserved for "this spec has no diagram".
 */
export function deriveNyeScheme(form: TensorForm, spec: TensorSpec): NyeScheme | null {
  const geometry = geometryFor(spec);
  if (geometry === null) return null;
  const { grid, rows, cols } = geometry;
  const rank = spec.rank;

  const partition = reducedPartition(form.basisResults, rank);

  const cells: NyeCell[] = [];
  const classes: NyeClass[] = [];
  const classIdByRep = new Map<number, number>();
  /** Raw partition ratio per cell, before renormalising onto the grid representative. */
  const rawRatio: number[] = [];

  for (let row = 0; row < rows.length; row++) {
    for (let col = 0; col < cols.length; col++) {
      const flat = flatOf([...rows[row].idx, ...cols[col].idx]);
      const label = getLabel(getIndices(flat, rank));
      const membership = partition.memberOf.get(flat);
      const cellIndex = cells.length;

      if (membership === undefined) {
        cells.push({ row, col, flat, label, kind: 'zero', classId: null, ratio: 0, compositeRefs: [] });
        rawRatio.push(0);
        continue;
      }

      let classId = classIdByRep.get(membership.rep);
      let isGridRep = false;
      if (classId === undefined) {
        classId = classes.length;
        classIdByRep.set(membership.rep, classId);
        classes.push({ id: classId, cells: [], partitionRep: membership.rep, determined: false });
        isGridRep = true;
      }
      classes[classId].cells.push(cellIndex);
      cells.push({
        row,
        col,
        flat,
        label,
        kind: isGridRep ? 'representative' : 'member',
        classId,
        ratio: 1,
        compositeRefs: [],
      });
      rawRatio.push(membership.ratio);
    }
  }

  // Ratios are relative to the class's GRID representative: the diagram's rings and coefficients
  // must read against the dot the diagram actually draws, not against a partition representative
  // that may be an index the grid never shows.
  for (const cls of classes) {
    const refRatio = rawRatio[cls.cells[0]];
    for (const cellIndex of cls.cells) cells[cellIndex].ratio = rawRatio[cellIndex] / refRatio;
  }

  const composites: NyeComposite[] = partition.composites.map((comp) => {
    const involved = new Set(comp.involved);
    const determinedClassId = classIdByRep.get(comp.determined) ?? null;
    const participating: number[] = [];
    cells.forEach((cell, cellIndex) => {
      if (cell.classId !== null && involved.has(classes[cell.classId].partitionRep)) participating.push(cellIndex);
    });
    return { text: formatCompositeConstraint(comp, rank), cells: participating, determinedClassId };
  });

  composites.forEach((composite, compositeIndex) => {
    for (const cellIndex of composite.cells) cells[cellIndex].compositeRefs.push(compositeIndex);
    if (composite.determinedClassId === null) return;
    const determinedClass = classes[composite.determinedClassId];
    determinedClass.determined = true;
    for (const cellIndex of determinedClass.cells) cells[cellIndex].kind = 'composite';
  });

  return { grid, rows, cols, cells, classes, composites, isZero: form.isZero };
}
