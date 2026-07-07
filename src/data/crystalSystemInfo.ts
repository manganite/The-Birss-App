export interface CrystalSystemInfo {
  /** LaTeX source for the lattice-condition line (rendered as a single InlineMath expression). */
  lattice: string;
  definingSymmetry: string;
  hmPositions: string;
  /** null when the system has no distinguished axis / no setting choice (Triclinic, Cubic). */
  settings: string | null;
  /** Always populated: for Triclinic/Cubic this carries the "no settings, Birss and ITC agree"
   * combined line in place of a separate settings note. */
  birssVsItc: string;
  /** Hermann-Mauguin holohedry symbol (rendered via FormatPointGroup). */
  holohedry: string;
  example: string;
}

export const CRYSTAL_SYSTEM_INFO: Record<string, CrystalSystemInfo> = {
  Triclinic: {
    lattice: 'a \\neq b \\neq c;\\ \\alpha, \\beta, \\gamma\\ \\text{unrestricted -- no metric conditions.}',
    definingSymmetry: 'At most an inversion centre: only 1 and -1. No rotation axis, no mirror.',
    hmPositions: 'A single position; there are no symmetry directions.',
    settings: null,
    birssVsItc: 'No settings (no distinguished axis). Birss and ITC agree.',
    holohedry: '-1',
    example: 'copper sulfate pentahydrate (CuSO4.5H2O)',
  },
  Monoclinic: {
    lattice: '\\text{One oblique angle: }\\alpha = \\beta = 90^\\circ,\\ \\gamma\\ \\text{free (c-unique, Birss) -- or }\\alpha = \\gamma = 90^\\circ,\\ \\beta\\ \\text{free (b-unique, ITC).}',
    definingSymmetry: 'Exactly one order-2 direction (a 2-fold axis and/or mirror normal): the unique axis.',
    hmPositions: 'One essential position -- the unique axis. Full symbols make it explicit: 112 (c-unique) vs 121 (b-unique).',
    settings: 'Two: unique axis on c or on b. Same group, relabelled axes.',
    birssVsItc: 'Short symbols identical; only the standard setting differs (Birss: c-unique, ITC: b-unique).',
    holohedry: '2/m',
    example: 'gypsum (CaSO4.2H2O)',
  },
  Orthorhombic: {
    lattice: 'a \\neq b \\neq c,\\ \\alpha = \\beta = \\gamma = 90^\\circ.',
    definingSymmetry: 'Three mutually perpendicular order-2 directions (2 or m); no higher axis.',
    hmPositions: 'Positions 1, 2, 3 = x∥a, y∥b, z∥c -- the same rule in Birss and ITC.',
    settings: 'Which token sits on which axis is a choice: up to three frames (c-/a-/b-unique). Frame symbols are convention-independent.',
    birssVsItc: "Same reading rule; only the default frame differs for one group (m'm'm ↔ mm'm').",
    holohedry: 'mmm',
    example: 'topaz',
  },
  Tetragonal: {
    lattice: 'a = b \\neq c,\\ \\alpha = \\beta = \\gamma = 90^\\circ.',
    definingSymmetry: 'Exactly one 4 or -4 axis (along c).',
    hmPositions: '1 = c (z); 2 = the a-axes ⟨100⟩; 3 = the diagonals ⟨110⟩.',
    settings: 'Two for the -42m family: 45° about c puts the 2-folds on the axes or on the diagonals (-42m ↔ -4m2).',
    birssVsItc: 'Agree -- position 2 is an a-axis in both (y coincides with an a-axis here).',
    holohedry: '4/mmm',
    example: 'rutile (TiO2)',
  },
  Trigonal: {
    lattice: '\\text{Hexagonal axes: }a = b,\\ \\alpha = \\beta = 90^\\circ,\\ \\gamma = 120^\\circ.',
    definingSymmetry: 'Exactly one 3 or -3 axis (along c).',
    hmPositions: '1 = c; 2 = basal directions -- and here the conventions part (see Birss vs ITC).',
    settings: 'Two for two-position groups (32, 3m, -3m families): frames 30° apart (321 ↔ 312 in ITC).',
    birssVsItc: 'ITC reads position 2 from the a-axes (x); Birss from y -- 30° apart. The same symbol names two rotated frames; components appear as the xxx- vs yyy-family.',
    holohedry: '-3m',
    example: 'quartz (SiO2)',
  },
  Hexagonal: {
    lattice: '\\text{Hexagonal axes: }a = b,\\ \\alpha = \\beta = 90^\\circ,\\ \\gamma = 120^\\circ.',
    definingSymmetry: 'Exactly one 6 or -6 axis (along c).',
    hmPositions: '1 = c; 2 = basal directions -- and here the conventions part (see Birss vs ITC).',
    settings: "Two for two-position groups (-6m2, 6'mm' families): frames 30° apart.",
    birssVsItc: "ITC reads position 2 from the a-axes (x); Birss from y -- 30° apart. The same symbol names two rotated frames; components appear as the xxx- vs yyy-family. For one group even the string differs (6'/mm'm ↔ 6'/mmm').",
    holohedry: '6/mmm',
    example: 'graphite',
  },
  Cubic: {
    lattice: 'a = b = c,\\ \\alpha = \\beta = \\gamma = 90^\\circ.',
    definingSymmetry: 'Four 3-fold axes along the body diagonals ⟨111⟩ -- the cubic hallmark.',
    hmPositions: '1 = axes ⟨100⟩; 2 = diagonals ⟨111⟩; 3 = face diagonals ⟨110⟩.',
    settings: null,
    birssVsItc: 'No settings. Birss and ITC agree.',
    holohedry: 'm-3m',
    example: 'rock salt (NaCl)',
  },
};
