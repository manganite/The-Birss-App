# ITC Table 3.2.2.2 -- Polar axes and nonpolar directions in the 21 noncentrosymmetric crystal classes

> **Content:** Transcription of ITC Table 3.2.2.2, with the app-side notes needed to read it.
> **Status:** living (transcription)
> **Authority:** source-side material: a transcription of the printed ITC table, vendored so the reference tests can re-parse it. Change it only to correct the transcription against print.

Source: International Tables for Crystallography, Vol. D, Chapter 3.2,
Table 3.2.2.2 (page scan 20 of ch3o2.pdf).
Transcribed: 2026-07-11 from (i) user-provided screenshot, (ii) the page
scan at full resolution with per-row zooms on the trigonal/hexagonal
blocks, (iii) the OCR sidecar as a third read.
STATUS: triple-read by Claude; HUMAN PRINT SIGN-OFF RECEIVED 2026-07-11
(user compared against the printed original; the 622 anomaly -- no [uv0],
no semicolons in print -- explicitly confirmed). Golden-anchor eligible.

Transcription conventions: a leading minus sign inside a direction
triple denotes an overbar on that index ([-1-10] = [1bar 1bar 0]);
indices of a triple are written without separators exactly as printed
([u2uw] = the direction family [u, 2u, w]). Semicolons separate
symmetry-equivalent sets as in the print; the sequence of sets follows
the symmetry directions of ITC Table 2.1.3.1.

Printed header notes: all directions normal to an evenfold rotation axis
and along rotoinversion axes are nonpolar. All directions other than
those in the "Nonpolar directions" column are polar. A symbol like [u0w]
refers to the set of directions for all values of u and w.

| System                  | Class | Polar (symmetry) axes            | Nonpolar directions                                   |
|-------------------------|-------|----------------------------------|-------------------------------------------------------|
| Triclinic               | 1     | None (a)                         | None                                                  |
| Monoclinic, unique b    | 2     | [010]                            | [u0w]                                                 |
|                         | m     | None (a)                         | [010]                                                 |
| Monoclinic, unique c    | 2     | [001]                            | [uv0]                                                 |
|                         | m     | None (a)                         | [001]                                                 |
| Orthorhombic            | 222   | None                             | [0vw]; [u0w]; [uv0]                                   |
|                         | mm2   | [001]                            | [uv0]                                                 |
| Tetragonal              | 4     | [001]                            | [uv0]                                                 |
|                         | -4    | None                             | [001]; [uv0]                                          |
|                         | 422   | None                             | [uv0]; [0vw] [u0w]; [uuw] [u-uw]                      |
|                         | 4mm   | [001]                            | [uv0]                                                 |
|                         | -42m  | None                             | [uv0]; [0vw] [u0w]                                    |
|                         | -4m2  | None                             | [uv0]; [uuw] [u-uw]                                   |
| Trigonal (hexagonal axes) | 3   | [001]                            | None                                                  |
|                         | 321   | [100], [010], [-1-10]            | [u2uw] [-2u-uw] [u-uw]                                |
|                         | 312   | [1-10], [120], [-2-10]           | [uuw] [-u0w] [0-vw]                                   |
|                         | 3m1   | [001]                            | [100] [010] [-1-10]                                   |
|                         | 31m   | [001]                            | [1-10] [120] [-2-10]                                  |
| Trigonal (rhombohedral axes) | 3 | [111]                          | None                                                  |
|                         | 32    | [1-10], [01-1], [-101]           | [uuw] [uvv] [uvu]                                     |
|                         | 3m    | [111]                            | [1-10] [01-1] [-101]                                  |
| Hexagonal               | 6     | [001]                            | [uv0]                                                 |
|                         | -6    | None                             | [001]                                                 |
|                         | 622   | None                             | [u2uw] [-2u-uw] [u-uw] [uuw] [-u0w] [0-vw]  (b)       |
|                         | 6mm   | [001]                            | [uv0]                                                 |
|                         | -6m2  | [1-10], [120], [-2-10]           | [uuw] [-u0w] [0-vw]                                   |
|                         | -62m  | [100], [010], [-1-10]            | [u2uw] [-2u-uw] [u-uw]                                |
| Cubic                   | 23    | Four threefold axes along <111>  | [0vw] [u0w] [uv0]                                     |
|                         | -43m  | Four threefold axes along <111>  | [0vw] [u0w] [uv0]                                     |
|                         | 432   | None                             | [0vw] [u0w] [uv0]; [uuw] [uvv] [uvu]; [u-uw] [uv-v] [-uvu] |

Printed footnote (a) = dagger: in class 1 any direction is polar; in
class m all directions except [010] (or [001]) are polar.

## Documented print anomaly (b): the 622 row

As printed, the 622 nonpolar cell lists only the six planes normal to
the in-plane twofold axes and -- unlike every comparable row -- carries
no semicolons between the two axis classes. By the table's own header
rule, all [uv0] are also nonpolar for 622 (the sixfold axis is evenfold;
C6^3 = C2z maps every in-plane direction to its negative), exactly as
the 422 row lists its leading "[uv0];". Verified at 3x zoom and against
the OCR sidecar: the omission is in the print, not in the transcription.

Strengthened diagnosis via ITC Vol. A Table 2.1.3.1 (see
ITC-table-2.1.3.1-symmetry-directions.md): the header of THIS table
states that set sequence follows the symmetry directions of 2.1.3.1
(primary; secondary; tertiary). Every other multi-set row obeys that
sequence exactly; per it, the 622 cell should read
"[uv0]; [u2uw] [-2u-uw] [u-uw]; [uuw] [-u0w] [0-vw]". The print is
missing precisely the contiguous typeset fragment "[uv0]; ... ;" -- the
leading primary set AND both separators -- consistent with a single
typesetting omission rather than intent.

Treated as a print omission analogous to the documented Birss Table-7
misprints: transcribed AS PRINTED above; any guard or feature must
nevertheless treat [uv0] as nonpolar for 622. REQUIRES explicit human
print sign-off.

## Resolved reading question: the -6 row

A first reading suggested "[001]; [uv0]" for -6 (by analogy with -4).
Settled to "[001]" only by (i) the OCR sidecar, (ii) the header rule
(-6 contains no evenfold proper rotation), and (iii) internal
consistency: the SUPERGROUP -62m lists [100], [010], [-1-10] -- all
[uv0]-type -- as POLAR axes; added symmetry can only make directions
nonpolar, so [uv0] cannot be blanket-nonpolar in the subgroup -6.

## Convention notes for app use

- The app's monoclinic convention is the first setting (z || c): use the
  "Monoclinic, unique c" rows; the unique-b rows are transcribed for
  completeness.
- The app's trigonal frame follows hexagonal axes: use the
  "Trigonal (hexagonal axes)" rows; rhombohedral rows for completeness.
- Direction triples are crystallographic (hexagonal) indices, not
  Cartesian; any Explorer display should show them as printed with a
  convention note rather than converting.
- Polar-axis directions for the pyroelectric groups are consistent with
  the [uvw] column of Table 3.2.2.1 (cross-check: mm2/4/4mm/3/3m/6/6mm
  -> [001]; 2 -> unique axis; m -> plane).
