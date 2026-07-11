# ITC Table 2.1.1.1 -- Crystal families, crystal systems, conventional coordinate systems and Bravais lattices

Source: International Tables for Crystallography, Vol. A, Chapter 2.1
(Guide to the use of the space-group tables), Table 2.1.1.1.
Transcribed: 2026-07-11 from a user-provided screenshot (single read).
STATUS: transcribed from the user's own screenshot 2026-07-11; no
separate print read performed. The one- and two-dimensional rows
of the printed table are omitted here (not relevant to the app); only
the three-dimensional block is transcribed.

Transcription conventions: a leading minus sign denotes an overbar
(-3 = 3-bar). Point-group symbols carry the printed box markers as
suffixes: (L) = dashed box = Laue group; (H) = full box = Laue group
that is also a lattice point symmetry (holohedry). "deg" = degrees.

| Crystal family | Symbol | Crystal system | Crystallographic point groups | No. of space groups | Restrictions on cell parameters | Parameters to be determined | Bravais lattices |
|----------------|--------|----------------|-------------------------------|---------------------|---------------------------------|-----------------------------|------------------|
| Triclinic (anorthic) | a | Triclinic  | 1, -1 (H)                              | 2  | None                                              | a, b, c, alpha, beta, gamma | aP |
| Monoclinic     | m      | Monoclinic     | 2, m, 2/m (H)                          | 13 | b-unique setting: alpha = gamma = 90 deg          | a, b, c, beta (c)  | mP, mS (d) (mC, mA, mI) |
|                |        |                |                                        |    | c-unique setting: alpha = beta = 90 deg           | a, b, c, gamma (c) | mP, mS (d) (mA, mB, mI) |
| Orthorhombic   | o      | Orthorhombic   | 222, mm2, mmm (H)                      | 59 | alpha = beta = gamma = 90 deg                     | a, b, c            | oP, oS (d) (oC, oA, oB), oI, oF |
| Tetragonal     | t      | Tetragonal     | 4, -4, 4/m (L), 422, 4mm, -42m, 4/mmm (H) | 68 | a = b; alpha = beta = gamma = 90 deg           | a, c               | tP, tI |
| Hexagonal      | h      | Trigonal       | 3, -3 (L), 32, 3m, -3m (H)             | 18 | a = b; alpha = beta = 90 deg, gamma = 120 deg     | a, c               | hP |
|                |        |                |                                        | 7  | a = b = c; alpha = beta = gamma (rhombohedral axes, primitive cell) -- OR -- a = b; alpha = beta = 90 deg, gamma = 120 deg (hexagonal axes, triple obverse cell) | a, alpha | hR |
|                |        | Hexagonal      | 6, -6, 6/m (L), 622, 6mm, -62m, 6/mmm (H) | 27 | a = b; alpha = beta = 90 deg, gamma = 120 deg  | a, c               | hP |
| Cubic          | c      | Cubic          | 23, m-3 (L), 432, -43m, m-3m (H)       | 36 | a = b = c; alpha = beta = gamma = 90 deg          | a                  | cP, cI, cF |

Printed footnotes:
(a) = dagger: the symbols for crystal families (column 2) and Bravais
lattices (column 8) were adopted by the IUCr in 1985; cf. de Wolff et
al. (1985).
(b) = double dagger: symbols surrounded by dashed or full lines indicate
Laue groups; full lines indicate Laue groups which are also lattice
point symmetries (holohedries).
(c) = section mark: these angles are conventionally taken to be
non-acute, i.e. >= 90 deg.
(d) = pilcrow: for the use of the letter S as a new general,
setting-independent 'centring symbol' for monoclinic and orthorhombic
Bravais lattices, see de Wolff et al. (1985).

## App-use notes (Claude's analysis, 2026-07-11)

- Explorer lattice infobox: the pair (restrictions, parameters to be
  determined) is the per-system content the infobox should show. Free
  metric parameters fall 6 (triclinic) -> 4 (monoclinic) -> 3
  (orthorhombic) -> 2 (tetragonal / trigonal-hex / hexagonal /
  rhombohedral) -> 1 (cubic).
- The app's monoclinic convention is the first setting (z || c): show
  the c-unique row (free angle gamma) as primary; mention b-unique.
- The app's trigonal frame follows hexagonal axes: show the hP hexagonal
  -axes description for trigonal groups; the hR rhombohedral row is the
  alternative cell description for rhombohedral-lattice trigonal space
  groups, not a different point-group convention.
- Crystal FAMILY vs crystal SYSTEM: the hexagonal family (symbol h)
  contains both the trigonal and the hexagonal crystal systems -- a
  distinction the infobox can teach in one sentence.
- The (L)/(H) markers give two print-anchored per-group flags (Laue
  class member; holohedry) that can cross-anchor propertyFlags.ts if
  matching flags exist.
- Space-group counts (column 5) are lattice-level information; optional
  trivia for the infobox, not needed for tensor logic.
