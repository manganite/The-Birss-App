/**
 * yarivT161.reference.fixtures.ts -- positional transcription of Yariv, Table 16.1.
 *
 * SOURCE. A. Yariv, *Quantum Electronics*, 2nd ed., Table 16.1, pp. 410-411: "The Form of the
 * Nonlinear Optical Tensor d_ijk as Defined by (16.1-4), after Reference 2". Maintainer scan
 * 2026-07-31 (four page-level screenshots plus six per-panel photographs).
 *
 * PROVENANCE CHAIN. Yariv's "Reference 2" is J. F. Nye, *Physical Properties of Crystals: Their
 * Representation by Tensors and Matrices* (1st ed. 1957, Clarendon; rev. ed. 1985, OUP). ITC Vol. D
 * Ch. 1.1 introduces the same scheme notation as "(Nye, 1957, 1985)" (Sec. 1.1.4.7.1). The two print
 * sources therefore share an ancestor: both are independent of Birss and of this engine -- which is
 * what anti-circularity requires -- but they are NOT independent of each other, and this project
 * does not claim that either corroborates the other.
 *
 * WHY YARIV AND NOT ITC-D, for this grid. ITC-D's 3x6 counterpart (Sec. 1.1.4.10.4) tabulates the
 * piezoelectric matrix d_i-mu, whose convention carries a factor 2 on mu = 4,5,6 -- the section
 * defines its own factor glyph for exactly that (1.1.4.10.4.4(i): "twice minus ... for d_ijk and
 * minus ... for e_ijk"). This app's rank-3 `jk` grid renders the RAW tensor components chi_i(jk)
 * with no Voigt factor: the engine gives the class-3 d26 ratio as exactly -1, not -2. Yariv's
 * d_ijk is defined through a field product at his Eq. (16.1-4), so no factor arises and his key
 * needs no factor glyph -- only four symbols. Yariv's convention is therefore the app's, and
 * ITC-D 1.1.4.10.4's is not. See `docs/findings/FINDING-2026-07-31-itc-d-rank3-scheme-defects.md`,
 * which also records four printed-count defects across ITC-D's two rank-3 sections; ITC-D Ch. 1.1
 * rank-3 material is a vocabulary source here, never a cell-set or count anchor.
 *
 * NO KLEINMAN SYMMETRY. Table 16.1 is the general (non-Kleinman) form: it never identifies
 * d_ijk with its index permutations beyond the jk pair, so d15 and d24 are independent moduli
 * except where a printed link says otherwise. This matches the app's `jk` spec exactly.
 *
 * TRANSCRIPTION PROTOCOL (binding, from the finding). Per panel, the printed marks and lines are
 * recorded POSITIONALLY, before anything is asserted. The class count is DERIVED from the
 * transcription (`links.length`), never copied from Yariv's printed parenthetical; that
 * parenthetical is stored as `printedCount` metadata and compared. Both are then gated against the
 * engine, and the sign structure with them. A gate failure stops the fixture and produces a
 * finding -- it is never weakened into agreement.
 *
 * EVIDENCE LEVEL, per panel (`evidence`). Contamination control, agreed with the maintainer
 * 2026-07-31: a reader who already knows the engine's answer resolves an ambiguous mark toward it,
 * which would normalise away precisely the -42m / 4mm class of print defect the gate exists to
 * catch. So each panel records whether its transcription predates any engine query for that panel:
 *   - `blind`                        -- transcribed before this engine's grid for it was ever read.
 *   - `engine-known-unambiguous`     -- the grid was known first, but every mark is unambiguous
 *                                       (glyph size and line endpoints not in question).
 *   - `engine-known-print-confirmed` -- the grid was known first AND a mark was ambiguous, so the
 *                                       maintainer confirmed that mark against print before freeze.
 *
 * SETTINGS ARE RESOLVED, NOT ASSERTED. Yariv's "standard orientation" is not the app's setting 1:
 * for monoclinic he prints 2||x2 as standard where the app's setting 1 is Birss z-unique (2||x3),
 * and for trigonal 3m his standard m-perp-x1 is the app's setting 2 (31m). Rather than encode that
 * mapping as an input, the test SEARCHES the app's settings for the one reproducing each
 * transcribed cell set and asserts exactly one matches. The mapping is thus an output of the gate,
 * and doubles as independent print evidence about the setting conventions.
 */

/** One printed mark: [row i (1..3), Voigt column mu (1..6), glyph].
 *  `f` = heavy dot ("Nonzero modulus"); `o` = open circle ("Moduli numerically equal, but opposite
 *  in sign" to the heavy dot it links to). A cell absent from every group is printed as the small
 *  dot, "Zero modulus". */
export type YarivMark = [i: number, mu: number, glyph: 'f' | 'o'];

/** One connected component of the printed link lines, in reading order. A single-element group is
 *  an unlinked heavy dot -- an independent modulus in its own right. */
export type YarivLinkGroup = YarivMark[];

export interface YarivScheme {
  /** Stable fixture id. */
  id: string;
  /** Yariv's panel heading, verbatim, including any orientation line. */
  panel: string;
  /** App group key(s) the panel is transcribed for. Yariv prints -43m and 23 as one panel. */
  groups: string[];
  /** Yariv's printed parenthetical. METADATA ONLY -- compared against the derived count, never the
   *  source of an expected value. */
  printedCount: number;
  /** The transcription. `links.length` IS the derived class count. */
  links: YarivLinkGroup[];
  evidence: 'blind' | 'engine-known-unambiguous' | 'engine-known-print-confirmed';
  /** Transcription notes: ambiguities logged, and how they were resolved. */
  note?: string;
}

/** Every cell filled, each an independent modulus: 18 unlinked heavy dots. */
const ALL_18: YarivLinkGroup[] = [1, 2, 3].flatMap((i) =>
  [1, 2, 3, 4, 5, 6].map((mu): YarivLinkGroup => [[i, mu, 'f']]),
);

/** Unlinked heavy dots at the given cells, one class each. */
const singles = (...cells: Array<[number, number]>): YarivLinkGroup[] =>
  cells.map(([i, mu]): YarivLinkGroup => [[i, mu, 'f']]);

export const YARIV_T161_SCHEMES: YarivScheme[] = [
  // ---------------------------------------------------------------- Triclinic
  {
    id: 'class-1',
    panel: 'Class 1',
    groups: ['1'],
    printedCount: 18,
    links: ALL_18,
    evidence: 'blind',
  },

  // --------------------------------------------------------------- Monoclinic
  {
    id: 'class-2-2parx2',
    panel: 'Class 2, 2||x2 (standard orientation)',
    groups: ['2'],
    printedCount: 8,
    links: singles([1, 4], [1, 6], [2, 1], [2, 2], [2, 3], [2, 5], [3, 4], [3, 6]),
    evidence: 'blind',
  },
  {
    id: 'class-2-2parx3',
    panel: 'Class 2, 2||x3',
    groups: ['2'],
    printedCount: 8,
    links: singles([1, 4], [1, 5], [2, 4], [2, 5], [3, 1], [3, 2], [3, 3], [3, 6]),
    evidence: 'blind',
  },
  {
    id: 'class-m-perpx2',
    panel: 'Class m, m-perp-x2 (standard orientation)',
    groups: ['m'],
    printedCount: 10,
    links: singles([1, 1], [1, 2], [1, 3], [1, 5], [2, 4], [2, 6], [3, 1], [3, 2], [3, 3], [3, 5]),
    evidence: 'blind',
  },
  {
    id: 'class-m-perpx3',
    panel: 'Class m, m-perp-x3',
    groups: ['m'],
    printedCount: 10,
    links: singles([1, 1], [1, 2], [1, 3], [1, 6], [2, 1], [2, 2], [2, 3], [2, 6], [3, 4], [3, 5]),
    evidence: 'blind',
  },

  // ------------------------------------------------------------- Orthorhombic
  {
    id: 'class-222',
    panel: 'Class 222',
    groups: ['222'],
    printedCount: 3,
    links: singles([1, 4], [2, 5], [3, 6]),
    evidence: 'blind',
  },
  {
    id: 'class-mm2',
    panel: 'Class mm2',
    groups: ['mm2'],
    printedCount: 5,
    links: singles([1, 5], [2, 4], [3, 1], [3, 2], [3, 3]),
    evidence: 'blind',
  },

  // ---------------------------------------------------------------- Tetragonal
  {
    id: 'class-4',
    panel: 'Class 4',
    groups: ['4'],
    printedCount: 4,
    links: [
      [
        [1, 4, 'f'],
        [2, 5, 'o'],
      ],
      [
        [1, 5, 'f'],
        [2, 4, 'f'],
      ],
      [
        [3, 1, 'f'],
        [3, 2, 'f'],
      ],
      [[3, 3, 'f']],
    ],
    evidence: 'blind',
    note: 'The two links at columns 4/5 cross as a printed X; endpoints unambiguous.',
  },
  {
    id: 'class-bar4',
    panel: 'Class -4',
    groups: ['-4'],
    printedCount: 4,
    links: [
      [
        [1, 4, 'f'],
        [2, 5, 'f'],
      ],
      [
        [1, 5, 'f'],
        [2, 4, 'o'],
      ],
      [
        [3, 1, 'f'],
        [3, 2, 'o'],
      ],
      [[3, 6, 'f']],
    ],
    evidence: 'engine-known-unambiguous',
    note: 'Crossed X at columns 4/5, opposite polarity to class 4; row 3 carries d31--d32 open and a separate d36.',
  },
  {
    id: 'class-422',
    panel: 'Class 422',
    groups: ['422'],
    printedCount: 1,
    links: [
      [
        [1, 4, 'f'],
        [2, 5, 'o'],
      ],
    ],
    evidence: 'blind',
    note: 'Per-panel photograph. Single link; all other cells are small zero dots.',
  },
  {
    id: 'class-4mm',
    panel: 'Class 4mm',
    groups: ['4mm'],
    printedCount: 3,
    links: [
      [
        [1, 5, 'f'],
        [2, 4, 'f'],
      ],
      [
        [3, 1, 'f'],
        [3, 2, 'f'],
      ],
      [[3, 3, 'f']],
    ],
    evidence: 'engine-known-unambiguous',
  },
  {
    id: 'class-bar42m-2parx1',
    panel: 'Class -42m, 2||x1',
    groups: ['-42m'],
    printedCount: 2,
    links: [
      [
        [1, 4, 'f'],
        [2, 5, 'f'],
      ],
      [[3, 6, 'f']],
    ],
    evidence: 'engine-known-unambiguous',
  },

  // --------------------------------------------------------------------- Cubic
  {
    id: 'class-432',
    panel: 'Class 432 (all moduli vanish)',
    groups: ['432'],
    printedCount: 0,
    links: [],
    evidence: 'engine-known-unambiguous',
  },
  {
    id: 'classes-bar43m-and-23',
    panel: 'Classes -43m and 23',
    groups: ['-43m', '23'],
    printedCount: 1,
    links: [
      [
        [1, 4, 'f'],
        [2, 5, 'f'],
        [3, 6, 'f'],
      ],
    ],
    evidence: 'engine-known-unambiguous',
    note: 'One printed chain of two segments across all three heavy dots.',
  },

  // ------------------------------------------------------------------ Trigonal
  {
    id: 'class-3',
    panel: 'Class 3',
    groups: ['3'],
    printedCount: 6,
    links: [
      [
        [1, 1, 'f'],
        [1, 2, 'o'],
        [2, 6, 'o'],
      ],
      [
        [1, 4, 'f'],
        [2, 5, 'o'],
      ],
      [
        [1, 5, 'f'],
        [2, 4, 'f'],
      ],
      [
        [1, 6, 'o'],
        [2, 1, 'o'],
        [2, 2, 'f'],
      ],
      [
        [3, 1, 'f'],
        [3, 2, 'f'],
      ],
      [[3, 3, 'f']],
    ],
    evidence: 'engine-known-unambiguous',
    note: 'Per-panel photograph. The hardest panel: two three-mark sign chains (d11--d12--d26 and d22--d21--d16) whose long diagonals cross, plus the d14/d15 X. All six glyphs and both diagonal endpoints resolve at photograph resolution.',
  },
  {
    id: 'class-32',
    panel: 'Class 32',
    groups: ['32'],
    printedCount: 2,
    links: [
      [
        [1, 1, 'f'],
        [1, 2, 'o'],
        [2, 6, 'o'],
      ],
      [
        [1, 4, 'f'],
        [2, 5, 'o'],
      ],
    ],
    evidence: 'blind',
    note: 'Ambiguity logged: the long diagonal reaching d26 leaves the d11/d12 pair without a resolvable start dot. Immaterial -- both candidates lie in the same connected component, so neither the cell set nor the partition depends on it.',
  },
  {
    id: 'class-3m-perpx1',
    panel: 'Class 3m, m-perp-x1 (standard orientation)',
    groups: ['3m'],
    printedCount: 4,
    links: [
      [
        [1, 5, 'f'],
        [2, 4, 'f'],
      ],
      [
        [1, 6, 'o'],
        [2, 1, 'o'],
        [2, 2, 'f'],
      ],
      [
        [3, 1, 'f'],
        [3, 2, 'f'],
      ],
      [[3, 3, 'f']],
    ],
    evidence: 'blind',
    note: 'Per-panel photograph.',
  },
  {
    id: 'class-3m-perpx2',
    panel: 'Class 3m, m-perp-x2',
    groups: ['3m'],
    printedCount: 4,
    links: [
      [
        [1, 1, 'f'],
        [1, 2, 'o'],
        [2, 6, 'o'],
      ],
      [
        [1, 5, 'f'],
        [2, 4, 'f'],
      ],
      [
        [3, 1, 'f'],
        [3, 2, 'f'],
      ],
      [[3, 3, 'f']],
    ],
    evidence: 'engine-known-unambiguous',
    note: 'Per-panel photograph.',
  },

  // ----------------------------------------------------------------- Hexagonal
  {
    id: 'class-6',
    panel: 'Class 6 (same as class 4)',
    groups: ['6'],
    printedCount: 4,
    links: [
      [
        [1, 4, 'f'],
        [2, 5, 'o'],
      ],
      [
        [1, 5, 'f'],
        [2, 4, 'f'],
      ],
      [
        [3, 1, 'f'],
        [3, 2, 'f'],
      ],
      [[3, 3, 'f']],
    ],
    evidence: 'blind',
    note: "Per-panel photograph. Yariv's own 'same as class 4' note is an in-source cross-check, and the two transcriptions agree.",
  },
  {
    id: 'class-6mm',
    panel: 'Class 6mm (same as class 4mm)',
    groups: ['6mm'],
    printedCount: 3,
    links: [
      [
        [1, 5, 'f'],
        [2, 4, 'f'],
      ],
      [
        [3, 1, 'f'],
        [3, 2, 'f'],
      ],
      [[3, 3, 'f']],
    ],
    evidence: 'blind',
    note: "Yariv's 'same as class 4mm' note is an in-source cross-check, and the two transcriptions agree.",
  },
  {
    id: 'class-622',
    panel: 'Class 622 (same as class 422)',
    groups: ['622'],
    printedCount: 1,
    links: [
      [
        [1, 4, 'f'],
        [2, 5, 'o'],
      ],
    ],
    evidence: 'blind',
    note: "Yariv's 'same as class 422' note is an in-source cross-check, and the two transcriptions agree.",
  },
  {
    id: 'class-bar6',
    panel: 'Class -6',
    groups: ['-6'],
    printedCount: 2,
    links: [
      [
        [1, 1, 'f'],
        [1, 2, 'o'],
        [2, 6, 'o'],
      ],
      [
        [1, 6, 'o'],
        [2, 1, 'o'],
        [2, 2, 'f'],
      ],
    ],
    evidence: 'engine-known-unambiguous',
    note: 'Per-panel photograph, printed rotated 90deg. The rotation was fixed WITHOUT the engine: under the sigma-h of -6 every component with an odd z count vanishes, so the all-small line must be row 3, which determines the orientation uniquely. Both three-mark chains and the crossing diagonals then resolve.',
  },
  {
    id: 'class-bar6m2-perpx1',
    panel: 'Class -6m2, m-perp-x1 (standard orientation)',
    groups: ['-6m2'],
    printedCount: 1,
    links: [
      [
        [1, 6, 'o'],
        [2, 1, 'o'],
        [2, 2, 'f'],
      ],
    ],
    evidence: 'blind',
    note: 'Per-panel photograph. One three-mark chain: d21--d22 horizontal, then the long diagonal d22--d16. Same shape as the in-plane group of 3m m-perp-x1, which is what -6m2 = 3m + sigma-h leaves standing.',
  },
  {
    id: 'class-bar6m2-perpx2',
    panel: 'Class -6m2, m-perp-x2',
    groups: ['-6m2'],
    printedCount: 1,
    links: [
      [
        [1, 1, 'f'],
        [1, 2, 'o'],
        [2, 6, 'o'],
      ],
    ],
    evidence: 'blind',
    note: "Per-panel photograph. One three-mark chain: d11--d12 horizontal, then the long diagonal d12--d26. An earlier page-level read of this panel put a mark near column 5; the photograph shows that was the diagonal's descent, not a mark. No stray dot -- both -6m2 panels occupy only rows 1-2 x columns 1, 2, 6, the only cells sigma-h and the threefold axis leave alive.",
  },
];
