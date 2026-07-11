/**
 * crystalSystems.ts -- per-crystal-system cell-parameter data from ITC Vol. A Table 2.1.1.1, in the
 * app conventions: monoclinic as the c-unique (first) setting with a b-unique note; trigonal as the
 * hexagonal-axes description with the rhombohedral alternative as a note. Free-parameter counts fall
 * 6 -> 4 -> 3 -> 2 -> 2 -> 2 -> 1 across the systems.
 *
 * `freeParams` and `bravais` are pinned to the vendored reference by the drift test in
 * `itcData.reference.test.ts`; `restrictions` is the same data rendered for display.
 */

export interface CrystalSystemInfo {
  /** crystal-family symbol (IUCr 1985): a, m, o, t, h, c */
  family: string;
  /** cell-parameter restrictions, display text */
  restrictions: string;
  /** the free ("to be determined") cell parameters */
  freeParams: string[];
  /** Bravais lattice symbols (the leading, setting-independent symbols) */
  bravais: string[];
  /** one-line convention note (monoclinic c-unique; trigonal hex-axes + family-vs-system) */
  note?: string;
}

/** Keyed by the app's crystal-system name (`group.crystalSystem`). */
export const CRYSTAL_SYSTEMS: Record<string, CrystalSystemInfo> = {
  Triclinic: {
    family: 'a',
    restrictions: 'None',
    freeParams: ['a', 'b', 'c', 'α', 'β', 'γ'],
    bravais: ['aP'],
  },
  Monoclinic: {
    family: 'm',
    restrictions: 'α = β = 90° (c-unique setting)',
    freeParams: ['a', 'b', 'c', 'γ'],
    bravais: ['mP', 'mS'],
    note: "App first setting: unique axis c (z ∥ c), free angle γ. ITC's b-unique setting instead fixes α = γ = 90° with free β.",
  },
  Orthorhombic: {
    family: 'o',
    restrictions: 'α = β = γ = 90°',
    freeParams: ['a', 'b', 'c'],
    bravais: ['oP', 'oS', 'oI', 'oF'],
  },
  Tetragonal: {
    family: 't',
    restrictions: 'a = b; α = β = γ = 90°',
    freeParams: ['a', 'c'],
    bravais: ['tP', 'tI'],
  },
  Trigonal: {
    family: 'h',
    restrictions: 'a = b; α = β = 90°, γ = 120°',
    freeParams: ['a', 'c'],
    bravais: ['hP'],
    note: 'Hexagonal-axes description (the app frame). A rhombohedral lattice (hR) may alternatively use rhombohedral axes (a = b = c; α = β = γ). The hexagonal crystal family (symbol h) contains both the trigonal and hexagonal systems.',
  },
  Hexagonal: {
    family: 'h',
    restrictions: 'a = b; α = β = 90°, γ = 120°',
    freeParams: ['a', 'c'],
    bravais: ['hP'],
    note: 'The hexagonal crystal family (symbol h) contains both the trigonal and hexagonal crystal systems.',
  },
  Cubic: {
    family: 'c',
    restrictions: 'a = b = c; α = β = γ = 90°',
    freeParams: ['a'],
    bravais: ['cP', 'cI', 'cF'],
  },
};
