export interface GlossaryTerm {
  id: string;
  term: string;
  brief: string;
  helpTab?: 'overview' | 'conventions' | 'physics' | 'simulation' | 'tables' | 'deeper';
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: 'ed',
    term: 'Electric Dipole (ED)',
    brief:
      'Polar 3rd-rank tensor -- the dominant SHG source. Strictly forbidden in centrosymmetric groups for i-type symmetry.',
    helpTab: 'physics',
  },
  {
    id: 'md',
    term: 'Magnetic Dipole (MD)',
    brief:
      'Axial 3rd-rank tensor. Unlike ED, MD contributions can survive in centrosymmetric groups -- a parity effect independent of time-reversal.',
    helpTab: 'physics',
  },
  {
    id: 'eq',
    term: 'Electric Quadrupole (EQ)',
    brief:
      'Polar 4th-rank tensor. Even-rank, so it survives spatial inversion; generates bulk SHG even in centrosymmetric crystals.',
    helpTab: 'physics',
  },
  {
    id: 'i-type',
    term: 'i-type (Time-Even)',
    brief:
      'Symmetric under time reversal T. Characteristic of non-magnetic properties (electric, structural). Allowed in all group types -- Type I, II (gray), and III.',
    helpTab: 'physics',
  },
  {
    id: 'c-type',
    term: 'c-type (Time-Odd)',
    brief:
      'Antisymmetric under time reversal T. Relevant for magnetic and magnetoelectric properties. Non-zero only in Type I or Type III groups.',
    helpTab: 'physics',
  },
  {
    id: 'crystal-setting',
    term: 'Crystal Setting',
    brief:
      'An alternative axis convention for the same group. Two mechanisms exist: axis reorientation (non-monoclinic) and c/b-unique choice (monoclinic).',
    helpTab: 'conventions',
  },
  {
    id: 'convention',
    term: 'Symbol Convention (Birss vs ITC)',
    brief:
      'Which source’s Hermann-Mauguin naming rule labels the current frame. Never changes the physics or the selected setting -- only which symbol is shown.',
    helpTab: 'conventions',
  },
  {
    id: 'axis-triclinic',
    term: 'Axis Orientation (Triclinic)',
    brief:
      'Crystal-physics standard frame (Haussuehl / IRE 1949): z∥c, y∥b*, x completes the right-handed set. Birss and ITC agree.',
    helpTab: 'conventions',
  },
  {
    id: 'axis-monoclinic',
    term: 'Axis Orientation (Monoclinic)',
    brief:
      'Two settings of the same group: c-unique (Birss standard) and b-unique (ITC standard). The unique axis (2-fold / mirror-normal) lies along c or b respectively; the displayed frame follows the selected setting.',
    helpTab: 'conventions',
  },
  {
    id: 'axis-orthorhombic',
    term: 'Axis Orientation',
    brief: 'x∥a, y∥b, z∥c ([100]/[010]/[001]). Birss and ITC agree.',
    helpTab: 'conventions',
  },
  {
    id: 'axis-trigonal',
    term: 'Axis Orientation (Trigonal/Hexagonal)',
    brief:
      'z∥c, x∥a-axis [100], y∥[120] -- the same in both conventions. Only the HM position-2 reading differs: ITC reads it from the a-axis (x), Birss from y (30° apart). That is why one symbol can name two 30°-rotated frames (the xxx- vs yyy-family); the axes themselves do not move.',
    helpTab: 'conventions',
  },
  {
    id: 'type-i',
    term: 'Type I -- Ordinary',
    brief: 'Standard crystallographic point group with no time-reversal operation among its elements.',
    helpTab: 'physics',
  },
  {
    id: 'type-ii',
    term: 'Type II -- Gray',
    brief:
      "G·1' -- the group G augmented by time reversal 1'. All c-type tensors vanish; i-type tensors behave as in parent G.",
    helpTab: 'physics',
  },
  {
    id: 'type-iii',
    term: 'Type III -- Magnetic (Black & White)',
    brief:
      'A halving subgroup H of G, with the remaining cosets combined with time reversal. Both i-type and c-type tensors can be non-zero.',
    helpTab: 'physics',
  },
  {
    id: 'crystal-cut',
    term: 'Crystal Cut',
    brief:
      'The crystal surface normal, aligned with the incident beam direction k. [hkl] labels use Miller-index notation -- e.g. [001] means the c-axis faces the beam.',
    helpTab: 'simulation',
  },
  {
    id: 'crystal-rotation',
    term: 'Crystal Rotation',
    brief:
      'Additional tilt applied after aligning the crystal cut: φ_X and φ_Y tilt the crystal about the lab X/Y axes; ψ rotates it about its own surface normal (crystal-tied azimuth), coinciding with the beam only at zero tilt.',
    helpTab: 'simulation',
  },
  {
    id: 'chi-components',
    term: 'Independent χ Components',
    brief:
      'Non-zero tensor components after applying group symmetry. Subscripts (e.g. xxz) give the crystal-frame polarization directions; relative amplitudes and phases are tunable.',
    helpTab: 'simulation',
  },
  {
    id: 'shg-polarimetry',
    term: 'SHG Intensity Polarimetry',
    brief:
      'SHG intensity measured as a function of light polarization angles. The resulting polar pattern encodes the tensor symmetry and is the primary experimental observable.',
    helpTab: 'simulation',
  },
  {
    id: 'anisotropy-config',
    term: 'Anisotropy',
    brief:
      'Parallel (I∥) and crossed (I⊥) SHG intensity vs. polarizer angle -- both plotted together. Probes the full orientational dependence of the tensor.',
    helpTab: 'simulation',
  },
  {
    id: 'polarizer-config',
    term: 'Polarizer Scan',
    brief:
      'SHG intensity vs. incoming polarizer angle at a fixed analyzer (0° or 90°). Shows how input polarization direction selects among tensor components.',
    helpTab: 'simulation',
  },
  {
    id: 'analyzer-config',
    term: 'Analyzer Scan',
    brief:
      'SHG intensity vs. outgoing analyzer angle at a fixed polarizer (0° or 90°). Shows which output polarization directions the tensor generates.',
    helpTab: 'simulation',
  },
  {
    id: 'laue-class',
    term: 'Laue Class',
    brief:
      'The point group with inversion added — the symmetry of the diffraction pattern. The 122 magnetic groups fall into 11 Laue classes.',
  },
  {
    id: 'chiral',
    term: 'Chiral (Enantiomorphic)',
    brief:
      'The crystal class contains only proper rotations (no mirror, inversion, or rotoinversion), so the structure is distinguishable from its mirror image. Time reversal does not affect handedness.',
  },
  {
    id: 'polar-property',
    term: 'Polar (Pyro-/Ferroelectric)',
    brief:
      'Admits a spontaneous electric polarization (a time-even polar vector). Pyroelectric and ferroelectric share this symmetry requirement; ferroelectricity additionally requires the polarization be switchable, which symmetry alone cannot decide.',
  },
  {
    id: 'piezoelectric',
    term: 'Piezoelectric',
    brief:
      'Admits a third-rank polar strain–polarization tensor (the ED i-type form). Allowed in the 20 non-centrosymmetric classes except 432, where the tensor vanishes by symmetry.',
  },
  {
    id: 'ferromagnetic-property',
    term: 'Ferromagnetic',
    brief:
      'Admits a spontaneous magnetization (a time-odd axial vector). Covers ferro-, ferri-, and weak (canted) magnetism — 31 magnetic point groups (ITC Table 1.5.2.4).',
  },
  {
    id: 'piezomagnetic',
    term: 'Piezomagnetic',
    brief:
      'Admits a third-rank axial, time-odd tensor coupling stress to magnetization (the MD c-type form) — vanishes for all grey (Type II) groups.',
  },
  {
    id: 'magnetoelectric',
    term: 'Magnetoelectric (linear)',
    brief:
      'Admits a second-rank axial, time-odd tensor αᵢⱼ coupling an electric field to magnetization (and vice versa) — 58 magnetic point groups (ITC Table 1.5.8.1).',
  },
  {
    id: 'polar-directions',
    term: 'Polar / nonpolar directions',
    brief:
      'Directions whose two ends are not related by any symmetry operation of the group. From ITC Vol. D, Table 3.2.2.2.',
  },

  // ---- Tables-page tooltips (T1-T18; T15 is a link on the book-error footnote, not a tooltip) ----
  {
    id: 'tbl-spatial-parity',
    term: 'Spatial parity',
    brief:
      'Polar tensors transform like arrows (E, P); axial tensors like circulation (H, M). A tensor inherits the product of the parities of the quantities it connects.',
    helpTab: 'tables',
  },
  {
    id: 'tbl-time-parity',
    term: 'Time parity',
    brief:
      'i-type: invariant under time reversal. c-type: changes sign under time reversal -- nonzero only where magnetic order breaks it.',
    helpTab: 'tables',
  },
  {
    id: 'tbl-rank',
    term: 'Rank',
    brief:
      'The number of indices -- one per coupled direction. Even or odd rank also decides which Table 4a column supplies the class letter.',
    helpTab: 'tables',
  },
  {
    id: 'tbl-index-symmetry',
    term: 'Index symmetry',
    brief:
      'Index pairs that can be swapped for free -- imposed by the physics of the coupling (symmetric stress, energy arguments), not by the crystal.',
    helpTab: 'deeper',
  },
  {
    id: 'tbl-eff-pyroelectricity',
    term: 'Pyroelectricity / spont. pol.',
    brief:
      'A temperature change shifts a polarization that is already allowed to exist -- the same vector form as a spontaneous polarization.',
    helpTab: 'tables',
  },
  {
    id: 'tbl-eff-spontaneous-magnetization',
    term: 'Pyromagnetism / spont. magn.',
    brief:
      'The magnetic twin: a temperature change shifts a spontaneous magnetization. c-type -- needs magnetic order.',
    helpTab: 'tables',
  },
  {
    id: 'tbl-eff-permittivity',
    term: 'Electric permittivity',
    brief: 'The linear dielectric response D = eps_0 eps E; symmetric on energy grounds.',
    helpTab: 'tables',
  },
  {
    id: 'tbl-eff-magnetoelectric',
    term: 'Linear magnetoelectric effect',
    brief:
      'An electric polarization driven by a MAGNETIC field -- axial and c-type, the classic marker of magnetoelectric order.',
    helpTab: 'tables',
  },
  {
    id: 'tbl-eff-piezoelectricity',
    term: 'Piezoelectricity',
    brief: 'Polarization driven by stress; the symmetric stress tensor makes the last two indices interchangeable.',
    helpTab: 'tables',
  },
  {
    id: 'tbl-eff-piezomagnetism',
    term: 'Piezomagnetism',
    brief: 'Magnetization driven by stress -- the c-type counterpart of piezoelectricity.',
    helpTab: 'tables',
  },
  {
    id: 'tbl-eff-elasticity',
    term: 'Elasticity',
    brief: 'Stress from strain; carries the full Voigt symmetry (at most 21 independent constants).',
    helpTab: 'tables',
  },
  {
    id: 'tbl-indep-count',
    term: 'Independent components',
    brief:
      'The numbers symmetry leaves free. Symmetry fixes the pattern -- zeros, equalities, signs -- never the values.',
    helpTab: 'tables',
  },
  {
    id: 'tbl-nye',
    term: 'Nye scheme',
    brief:
      'Rows: the response direction i = x, y, z. Columns: the symmetric index pairs in Voigt order xx, yy, zz, yz, zx, xy.',
    helpTab: 'deeper',
  },
  {
    id: 'tbl-voigt-matrix',
    term: 'Voigt-compressed matrix',
    brief:
      'Each symmetric index pair is one Voigt index in the fixed order xx, yy, zz, yz, zx, xy; a single-index axis is x, y, z. Rows then columns give the component indices.',
    helpTab: 'deeper',
  },
  {
    id: 'tbl-relations',
    term: 'Independent components & relations',
    brief: 'The independent components, and the equalities and sign flips symmetry enforces among all the others.',
    helpTab: 'tables',
  },
  {
    id: 'tbl-vanishes',
    term: 'Vanishes identically',
    brief:
      'Exactly zero by symmetry -- not merely small. A clearly nonzero measurement would mean the assumed symmetry is wrong or broken.',
    helpTab: 'tables',
  },
  {
    id: 'tbl-sharing',
    term: 'Groups sharing this form',
    brief:
      'Point groups this measurement alone cannot distinguish -- their forms are identical when compared in a common reference frame.',
    helpTab: 'tables',
  },
  {
    id: 'tbl-rotated',
    term: 'Rotated setting',
    brief:
      "Birss tabulates this source group in a rotated axis setting. The app shows the form transformed into the group's own frame.",
    helpTab: 'deeper',
  },
  {
    id: 'tbl-grey-tail',
    term: 'Grey group',
    brief:
      'Grey groups contain time reversal itself, so every c-tensor component equals its own negative: identically zero.',
  },
  {
    id: 'tbl-ref-axes',
    term: 'Reference axes',
    brief:
      "The axis orientation the tabulated form is written in -- fixed per family class, independent of the group's conventional setting.",
    helpTab: 'conventions',
  },
  {
    id: 'tbl-no-form',
    term: 'No allowed form',
    brief:
      'Table 4a has no class letter here: this tensor species is forbidden for that class at every rank of this parity.',
  },
  {
    id: 'tbl-crossover',
    term: 'Parity crossover',
    brief:
      "The Table 4a column being read has the OPPOSITE spatial parity to your tensor. Not a bug -- Table 7's cross-rule.",
    helpTab: 'tables',
  },
];
