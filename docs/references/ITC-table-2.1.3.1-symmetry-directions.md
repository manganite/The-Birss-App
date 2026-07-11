# ITC Table 2.1.3.1 -- Lattice symmetry directions (three dimensions)

Source: International Tables for Crystallography, Vol. A, Chapter 2.1
(Guide to the use of the space-group tables), Table 2.1.3.1.
Transcribed: 2026-07-11 from a user-provided screenshot (single read;
the table is small and internally checkable). STATUS: transcribed from
the user's own screenshot 2026-07-11; cross-validation against 3.2.2.2
passed (see below). No separate print read performed.

Purpose in this project: Table 3.2.2.2 (polar axes) states that the
sequence of its symmetry-equivalent nonpolar sets follows the sequence
of symmetry directions in THIS table (primary; secondary; tertiary).
This file is the ordering key for parsing/labelling those sets, and the
basis of the strengthened 622 print-anomaly diagnosis in
ITC-table-3.2.2.2-polar-axes.md.

Transcription conventions: a leading minus sign denotes an overbar.
Directions in one brace set are symmetry-equivalent; the first entry is
the set representative. Two-dimensional rows omitted (not needed here).

| Lattice                          | Primary                    | Secondary                     | Tertiary                          |
|----------------------------------|----------------------------|-------------------------------|-----------------------------------|
| Triclinic                        | None                       |                               |                                   |
| Monoclinic (a)                   | [010] (unique axis b) / [001] (unique axis c) |            |                                   |
| Orthorhombic                     | [100]                      | [010]                         | [001]                             |
| Tetragonal                       | [001]                      | {[100], [010]}                | {[1-10], [110]}                   |
| Hexagonal                        | [001]                      | {[100], [010], [-1-10]}       | {[1-10], [120], [-2-10]}          |
| Rhombohedral (hexagonal axes)    | [001]                      | {[100], [010], [-1-10]}       |                                   |
| Rhombohedral (rhombohedral axes) | [111]                      | {[1-10], [01-1], [-101]}      |                                   |
| Cubic                            | {[100], [010], [001]}      | {[111], [1-1-1], [-11-1], [-1-11]} | {[1-10] [110], [01-1] [011], [-101] [101]} |

Printed footnote (a) = dagger: for the full Hermann-Mauguin symbols see
Sections 2.1.3.4 and 1.4.1.

## Cross-validation performed (Claude, 2026-07-11)

Every multi-set nonpolar cell of Table 3.2.2.2 was checked against this
ordering; the plane families are the normals of the listed symmetry
directions, in primary -> secondary -> tertiary sequence:
- 422: [uv0] (perp primary); [0vw] [u0w] (perp secondary); [uuw] [u-uw]
  (perp tertiary). Matches print.
- 321 / -62m: perp-secondary triple [u2uw] [-2u-uw] [u-uw]. Matches.
- 312 / -6m2: perp-tertiary triple [uuw] [-u0w] [0-vw]. Matches.
- 432: perp-primary [0vw] [u0w] [uv0]; perp-tertiary in two brace
  subsets [uuw] [uvv] [uvu] and [u-uw] [uv-v] [-uvu]. Matches.
- 622 is the single deviation: the perp-primary set [uv0] and both
  set-separating semicolons are absent in print -- see the anomaly note
  in ITC-table-3.2.2.2-polar-axes.md.
