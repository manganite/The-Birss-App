import { describe, it, expect } from 'vitest';
import { YARIV_T161_SCHEMES, type YarivScheme, type YarivMark } from './yarivT161.reference.fixtures';
import { computeTensorForm, type TensorSpec } from './tensorForms';
import { deriveNyeScheme, type NyeScheme } from './nyeScheme';
import { getAlternateSettings } from './symmetryGroups';

/**
 * Yariv, Quantum Electronics 2nd ed., Table 16.1 -- the print gate for the app's rank-3 `jk` grid.
 *
 * Every expected value here comes from the positional transcription in the fixtures file, never
 * from the engine: the class count is DERIVED from the transcribed link groups, and Yariv's printed
 * parenthetical is metadata that is compared, not consumed. See that file's header for the
 * transcription protocol, the evidence levels, and why Yariv rather than ITC-D anchors this grid.
 *
 * The app's rank-3 `jk` form is exactly Yariv's d_ijk: same 3x6 geometry, same Voigt column order
 * (xx yy zz yz zx xy), same field-product convention (no Voigt factor 2 -- see the fixture header).
 */

const SPEC: TensorSpec = { rank: 3, parity: 'polar', timeParity: 'i', intrinsic: 'jk' };

/** `d_i-mu` name for a transcribed mark or a scheme cell. */
const dName = (i: number, mu: number) => `d${i}${mu}`;
const cellName = (s: NyeScheme, index: number) => dName(s.cells[index].row + 1, s.cells[index].col + 1);

/** Every setting the app tabulates for a group (1-based; 1 when there is no alternate). */
function settingsOf(group: string): number[] {
  const alts = getAlternateSettings(group);
  return Array.from({ length: (alts?.length ?? 0) + 1 }, (_, k) => k + 1);
}

function schemeFor(group: string, setting: number): NyeScheme {
  const form = computeTensorForm(group, setting, SPEC);
  expect(form, `no form for ${group} setting ${setting}`).not.toBeNull();
  const scheme = deriveNyeScheme(form!, SPEC);
  expect(scheme, `no scheme for ${group} setting ${setting}`).not.toBeNull();
  return scheme!;
}

/** The transcribed cell set, sorted, as d_i-mu names. */
function transcribedCells(fx: YarivScheme): string[] {
  return fx.links
    .flat()
    .map(([i, mu]) => dName(i, mu))
    .sort();
}

/** The engine's nonzero cell set, sorted, as d_i-mu names. */
function engineCells(scheme: NyeScheme): string[] {
  return scheme.cells
    .map((c, index) => [c, index] as const)
    .filter(([c]) => c.kind !== 'zero')
    .map(([, index]) => cellName(scheme, index))
    .sort();
}

/**
 * The transcribed sign structure: per link group, each mark's sign relative to the FIRST mark of
 * that group in reading order. A heavy dot is +1 and an open circle -1 as printed; normalising on
 * the group's first mark makes the comparison independent of which member Yariv chose to draw
 * filled (his reference need not be the engine's class representative).
 */
function transcribedSigns(fx: YarivScheme): Map<string, number> {
  const out = new Map<string, number>();
  for (const group of fx.links) {
    const ordered = [...group].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const raw = (m: YarivMark) => (m[2] === 'f' ? 1 : -1);
    const ref = raw(ordered[0]);
    for (const m of ordered) out.set(dName(m[0], m[1]), raw(m) / ref);
  }
  return out;
}

/** The engine's ratios, likewise relative to each class's first grid cell in reading order. */
function engineSigns(scheme: NyeScheme): Map<string, number> {
  const out = new Map<string, number>();
  for (const cls of scheme.classes) {
    for (const index of cls.cells) out.set(cellName(scheme, index), scheme.cells[index].ratio);
  }
  return out;
}

/** The transcribed partition as sorted cell-name groups, itself sorted -- order-independent. */
function partitionOf(groups: string[][]): string {
  return groups
    .map((g) => [...g].sort().join(','))
    .sort()
    .join(' | ');
}

describe('Yariv Table 16.1 -- transcription is internally consistent', () => {
  it.each(YARIV_T161_SCHEMES.map((fx) => [fx.id, fx] as const))(
    '%s: derived class count equals the printed parenthetical',
    (_id, fx) => {
      // The DERIVED count is links.length. Yariv's parenthetical is metadata; this is the one place
      // the two meet, and a mismatch is a finding about the transcription or about Yariv.
      expect(fx.links.length).toBe(fx.printedCount);
    },
  );

  it('records no cell twice, and every mark is on the 3x6 grid', () => {
    for (const fx of YARIV_T161_SCHEMES) {
      const cells = transcribedCells(fx);
      expect(new Set(cells).size, `${fx.id} repeats a cell`).toBe(cells.length);
      for (const [i, mu] of fx.links.flat()) {
        expect(i, `${fx.id}`).toBeGreaterThanOrEqual(1);
        expect(i, `${fx.id}`).toBeLessThanOrEqual(3);
        expect(mu, `${fx.id}`).toBeGreaterThanOrEqual(1);
        expect(mu, `${fx.id}`).toBeLessThanOrEqual(6);
      }
    }
  });

  it('draws every link group from a heavy dot -- an all-open group would have no reference', () => {
    for (const fx of YARIV_T161_SCHEMES) {
      for (const group of fx.links) {
        expect(
          group.some((m) => m[2] === 'f'),
          `${fx.id}: a link group is drawn entirely from open circles`,
        ).toBe(true);
      }
    }
  });
});

describe('Yariv Table 16.1 -- the print gate against the engine', () => {
  /**
   * Each panel resolves to exactly one app setting: the one whose computed cell set equals the
   * transcribed one. The mapping is an OUTPUT of the gate, not an input -- Yariv's "standard
   * orientation" is not the app's setting 1 (see the fixture header).
   */
  const resolved = new Map<string, { group: string; setting: number }>();

  it.each(YARIV_T161_SCHEMES.map((fx) => [fx.id, fx] as const))(
    '%s: exactly one app setting reproduces the transcribed cell set',
    (_id, fx) => {
      const want = transcribedCells(fx);
      const matches: Array<{ group: string; setting: number }> = [];
      for (const group of fx.groups) {
        for (const setting of settingsOf(group)) {
          if (engineCells(schemeFor(group, setting)).join(',') === want.join(',')) {
            matches.push({ group, setting });
          }
        }
      }
      // One match per group the panel covers (Yariv prints -43m and 23 together).
      expect(
        matches.map((m) => m.group),
        `${fx.id}: matched settings ${JSON.stringify(matches)}`,
      ).toEqual(fx.groups);
      resolved.set(fx.id, matches[0]);
    },
  );

  it.each(YARIV_T161_SCHEMES.map((fx) => [fx.id, fx] as const))(
    '%s: derived classes, partition and signs equal the engine',
    (_id, fx) => {
      const at = resolved.get(fx.id);
      expect(at, `${fx.id}: setting not resolved`).toBeDefined();
      const scheme = schemeFor(at!.group, at!.setting);

      // Derived class count -- from the transcription, not from the parenthetical.
      expect(fx.links.length, `${fx.id}: class count`).toBe(scheme.classes.length);

      // The partition itself, not merely its size.
      const transcribedPartition = partitionOf(fx.links.map((g) => g.map(([i, mu]) => dName(i, mu))));
      const enginePartition = partitionOf(scheme.classes.map((c) => c.cells.map((index) => cellName(scheme, index))));
      expect(transcribedPartition, `${fx.id}: partition`).toBe(enginePartition);

      // Sign structure, normalised on each group's first cell in reading order.
      const wantSigns = transcribedSigns(fx);
      const gotSigns = engineSigns(scheme);
      expect(wantSigns.size, `${fx.id}: signed cell count`).toBe(gotSigns.size);
      for (const [cell, sign] of wantSigns) {
        expect(gotSigns.get(cell), `${fx.id}: sign of ${cell}`).toBeCloseTo(sign, 9);
      }
    },
  );

  it('pins the resolved panel-to-setting mapping', () => {
    // Independent print evidence on the setting conventions: Yariv's "standard orientation" is the
    // app's ALTERNATE setting for both monoclinic and trigonal 3m.
    const mapping = Object.fromEntries(
      YARIV_T161_SCHEMES.map((fx) => {
        const at = resolved.get(fx.id)!;
        return [fx.id, `${at.group}#${at.setting}`];
      }),
    );
    expect(mapping['class-2-2parx2']).toBe('2#2');
    expect(mapping['class-2-2parx3']).toBe('2#1');
    expect(mapping['class-m-perpx2']).toBe('m#2');
    expect(mapping['class-m-perpx3']).toBe('m#1');
    expect(mapping['class-3m-perpx1']).toBe('3m#2');
    expect(mapping['class-3m-perpx2']).toBe('3m#1');
    expect(mapping['class-bar6m2-perpx1']).toBe('-6m2#2');
    expect(mapping['class-bar6m2-perpx2']).toBe('-6m2#1');
  });
});

describe('Yariv Table 16.1 -- coverage and provenance', () => {
  it('covers all 21 noncentrosymmetric classes and every printed settings variant', () => {
    const ids = YARIV_T161_SCHEMES.map((fx) => fx.id);
    expect(new Set(ids).size).toBe(ids.length);
    const covered = new Set(YARIV_T161_SCHEMES.flatMap((fx) => fx.groups));

    // Every panel Yariv prints is transcribed: 24 panels over 21 classes. The surplus is the four
    // groups he prints twice, in two settings each; -43m and 23 share one panel, which nets it back.
    expect(YARIV_T161_SCHEMES).toHaveLength(24);
    const twicePrinted = [...covered]
      .filter((g) => YARIV_T161_SCHEMES.filter((fx) => fx.groups.includes(g)).length === 2)
      .sort();
    expect(twicePrinted).toEqual(['-6m2', '2', '3m', 'm']);

    // -42m also carries an orientation label (2||x1), but Yariv prints only the one panel for it,
    // so a label is not by itself a variant pair.
    expect(YARIV_T161_SCHEMES.filter((fx) => /perp-x|\|\|x/.test(fx.panel))).toHaveLength(9);

    // 432 is present, with an all-vanishing form.
    expect([...covered].sort()).toEqual(
      [
        '-4',
        '-42m',
        '-43m',
        '-6',
        '1',
        '2',
        '222',
        '23',
        '3',
        '32',
        '3m',
        '4',
        '422',
        '432',
        '4mm',
        '6',
        '622',
        '6mm',
        'm',
        'mm2',
        '-6m2',
      ].sort(),
    );
  });

  it('labels every panel with its evidence level', () => {
    for (const fx of YARIV_T161_SCHEMES) {
      expect(['blind', 'engine-known-unambiguous', 'engine-known-print-confirmed']).toContain(fx.evidence);
    }
  });
});
