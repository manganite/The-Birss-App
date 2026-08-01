import { describe, it, expect } from 'vitest';
import { POINT_GROUPS } from '../data/pointGroups';
import { enumerateUiSpecs } from '../data/uiTensorSpecs';
import { getAlternateSettings } from './symmetryGroups';
import { computeTensorForm, type TensorSpec } from './tensorForms';
import { deriveNyeScheme, type NyeScheme } from './nyeScheme';
import { reducedPartition } from './tensorProjection';
import { spanRank } from './linalg';

/**
 * Exhaustive coverage contract for the Nye view model (NYE-F, audit finding 3).
 *
 * The unit anchors in `nyeScheme.test.ts` pin named cases and the print gate in
 * `yarivT161.reference.test.ts` pins rank-3 `jk` against Yariv. Neither says anything about the
 * rest of the shipped surface: every group, both parities, i and c, and all four diagram
 * geometries. This file sweeps that surface and asserts four STRUCTURAL properties -- statements
 * about the model's internal consistency and its relation to the engine, not about any particular
 * tensor. A failure here is a view-model defect, not a physics one.
 *
 * Property 1 is the load-bearing one: the number of free diagram classes must equal the basis rank
 * of the same form. That is the Q0 span rank -- the same invariant the constraint-view relation
 * list and the Table-4f minimality guard rest on -- so it ties the diagram back to the engine's
 * own notion of how many independent components there are, rather than to a restatement of it.
 *
 * Runtime note: the engine memoises per group/setting/spec, and the sweep visits each combination
 * once, so the cost is one projection per combination and no more.
 */

const TIMEOUT_MS = 60000;

/** Every setting the app tabulates for a group (1-based; 1 when there is no alternate). */
function settingsOf(group: string): number[] {
  const alts = getAlternateSettings(group);
  return Array.from({ length: (alts?.length ?? 0) + 1 }, (_, k) => k + 1);
}

interface Combination {
  group: string;
  setting: number;
  spec: TensorSpec;
  scheme: NyeScheme;
}

/**
 * Every diagram-capable (group, setting, spec) combination: all 122 groups x every setting the app
 * offers x every UI-reachable spec for which `deriveNyeScheme` returns a geometry. Built once and
 * shared by the properties below, so the projection cost is paid a single time.
 */
const COMBINATIONS: Combination[] = [];
for (const group of POINT_GROUPS) {
  for (const setting of settingsOf(group.name)) {
    for (const spec of enumerateUiSpecs()) {
      const form = computeTensorForm(group.name, setting, spec);
      if (form === null) continue;
      const scheme = deriveNyeScheme(form, spec);
      if (scheme === null) continue;
      COMBINATIONS.push({ group: group.name, setting, spec, scheme });
    }
  }
}

const label = (c: Combination) =>
  `${c.group} setting ${c.setting} rank ${c.spec.rank} ${c.spec.parity}/${c.spec.timeParity}/${c.spec.intrinsic}`;

describe('Nye view model — exhaustive sweep over the diagram-capable surface', () => {
  it('covers every group, setting and diagram-capable spec', () => {
    // Guards the sweep itself: if a geometry is added or the spec domain widens and this file is
    // not revisited, the count moves and says so, instead of the sweep quietly covering less.
    //
    // 176 (group, setting) pairs -- the 122 groups plus the 54 alternate settings -- times the 24
    // diagram-capable specs of `enumerateUiSpecs` (rank 2 x both intrinsics, rank 3 `ij` and `jk`,
    // rank 4 `ij_kl` and `voigt`, each x polar/axial x i/c) = 4224 combinations. 1486 of them are
    // vanishing forms, which the model must still render as the all-zero scheme rather than skip,
    // so they are part of the contract and not filtered out here.
    expect(COMBINATIONS).toHaveLength(4224);
    expect(new Set(COMBINATIONS.map((c) => `${c.group}#${c.setting}`)).size).toBe(176);
    expect(new Set(COMBINATIONS.map((c) => c.group)).size).toBe(POINT_GROUPS.length);

    const byGrid = COMBINATIONS.reduce<Record<string, number>>((acc, c) => {
      acc[c.scheme.grid] = (acc[c.scheme.grid] ?? 0) + 1;
      return acc;
    }, {});
    expect(byGrid).toEqual({ '3x3': 1408, '3x6': 704, '6x3': 704, '6x6': 1408 });
    expect(COMBINATIONS.filter((c) => c.scheme.isZero)).toHaveLength(1486);
  });

  it(
    'property 1: free diagram classes equal the basis rank of the same form',
    () => {
      const mismatches: string[] = [];
      for (const c of COMBINATIONS) {
        const form = computeTensorForm(c.group, c.setting, c.spec)!;
        const free = c.scheme.classes.filter((cls) => !cls.determined).length;
        const rank = spanRank(form.basisResults);
        if (free !== rank) mismatches.push(`${label(c)}: ${free} free classes vs span rank ${rank}`);
      }
      expect(mismatches).toEqual([]);
    },
    TIMEOUT_MS,
  );

  it(
    'property 2: every surviving cell belongs to exactly one class',
    () => {
      const mismatches: string[] = [];
      for (const c of COMBINATIONS) {
        const surviving = c.scheme.cells
          .map((cell, index) => [cell, index] as const)
          .filter(([cell]) => cell.kind !== 'zero');

        // No surviving cell is unclassified.
        for (const [cell, index] of surviving) {
          if (cell.classId === null) mismatches.push(`${label(c)}: cell ${index} survives with no class`);
        }
        // ...and no vanishing cell carries one.
        for (const [index, cell] of c.scheme.cells.entries()) {
          if (cell.kind === 'zero' && cell.classId !== null) {
            mismatches.push(`${label(c)}: vanishing cell ${index} carries class ${cell.classId}`);
          }
        }
        // The classes partition the surviving cells: every one appears in exactly one class list,
        // and the class lists contain nothing else.
        const fromClasses = c.scheme.classes.flatMap((cls) => cls.cells);
        if (new Set(fromClasses).size !== fromClasses.length) {
          mismatches.push(`${label(c)}: a cell appears in two classes`);
        }
        if (fromClasses.length !== surviving.length) {
          mismatches.push(`${label(c)}: ${fromClasses.length} classified vs ${surviving.length} surviving`);
        }
        for (const index of fromClasses) {
          if (c.scheme.cells[index].kind === 'zero') mismatches.push(`${label(c)}: class lists a vanishing cell`);
        }
      }
      expect(mismatches).toEqual([]);
    },
    TIMEOUT_MS,
  );

  it(
    'property 3: no composite constraint of the form is dropped by the model',
    () => {
      const mismatches: string[] = [];
      for (const c of COMBINATIONS) {
        const form = computeTensorForm(c.group, c.setting, c.spec)!;
        const partition = reducedPartition(form.basisResults, c.spec.rank);

        // Every composite the engine derives is present in the scheme...
        if (partition.composites.length !== c.scheme.composites.length) {
          mismatches.push(
            `${label(c)}: engine has ${partition.composites.length} composites, scheme has ${c.scheme.composites.length}`,
          );
          continue;
        }
        // ...and each one is anchored: it names a class the diagram can point at, and that class
        // is marked determined, so it is not silently counted as a free parameter.
        for (const composite of c.scheme.composites) {
          if (composite.determinedClassId === null) continue; // the determined class has no grid cell
          const cls = c.scheme.classes[composite.determinedClassId];
          if (cls === undefined) {
            mismatches.push(`${label(c)}: composite names class ${composite.determinedClassId}, which does not exist`);
            continue;
          }
          if (!cls.determined) mismatches.push(`${label(c)}: composite's class ${cls.id} is not marked determined`);
          if (composite.text.trim() === '') mismatches.push(`${label(c)}: composite has no rendered relation`);
        }
        // Conversely, a class marked determined must be named by some composite.
        for (const cls of c.scheme.classes) {
          if (!cls.determined) continue;
          if (!c.scheme.composites.some((comp) => comp.determinedClassId === cls.id)) {
            mismatches.push(`${label(c)}: class ${cls.id} is marked determined but no composite names it`);
          }
        }
      }
      expect(mismatches).toEqual([]);
    },
    TIMEOUT_MS,
  );

  it(
    'property 4: no combination produces an internally inconsistent model',
    () => {
      const mismatches: string[] = [];
      for (const c of COMBINATIONS) {
        const { scheme } = c;

        // Geometry and cell count agree.
        if (scheme.cells.length !== scheme.rows.length * scheme.cols.length) {
          mismatches.push(`${label(c)}: ${scheme.cells.length} cells for a ${scheme.grid} grid`);
        }
        // Class ids are dense, ordered and self-consistent.
        scheme.classes.forEach((cls, position) => {
          if (cls.id !== position) mismatches.push(`${label(c)}: class at ${position} carries id ${cls.id}`);
          if (cls.cells.length === 0) mismatches.push(`${label(c)}: class ${cls.id} has no cells`);
        });
        for (const cell of scheme.cells) {
          if (cell.classId !== null && scheme.classes[cell.classId] === undefined) {
            mismatches.push(`${label(c)}: cell claims class ${cell.classId}, which does not exist`);
          }
        }
        // Exactly one representative per class, and it is the class's own first cell. A composite
        // class is drawn as `composite` throughout, so it has none -- that is the one exception.
        for (const cls of scheme.classes) {
          const reps = cls.cells.filter((index) => scheme.cells[index].kind === 'representative');
          const expected = cls.determined ? 0 : 1;
          if (reps.length !== expected) {
            mismatches.push(`${label(c)}: class ${cls.id} has ${reps.length} representatives, expected ${expected}`);
          }
          if (expected === 1 && reps[0] !== cls.cells[0]) {
            mismatches.push(`${label(c)}: class ${cls.id}'s representative is not its first cell`);
          }
          // Ratios are finite and normalised on the class's first cell.
          for (const index of cls.cells) {
            const ratio = scheme.cells[index].ratio;
            if (!Number.isFinite(ratio) || ratio === 0) {
              mismatches.push(`${label(c)}: class ${cls.id} carries ratio ${ratio}`);
            }
          }
          if (Math.abs(scheme.cells[cls.cells[0]].ratio - 1) > 1e-9) {
            mismatches.push(`${label(c)}: class ${cls.id}'s first cell has ratio ${scheme.cells[cls.cells[0]].ratio}`);
          }
        }
        // A vanishing form is the all-zero scheme, not a missing one.
        if (scheme.isZero && scheme.classes.length !== 0) {
          mismatches.push(`${label(c)}: zero form with ${scheme.classes.length} classes`);
        }
        if (!scheme.isZero && scheme.classes.length === 0) {
          mismatches.push(`${label(c)}: non-zero form with no classes`);
        }
      }
      expect(mismatches).toEqual([]);
    },
    TIMEOUT_MS,
  );
});
